const express = require('express');
const Vote = require('../models/Vote');
const Band = require('../models/Band');

const router = express.Router();

// Get all votes
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('selectedBands')
      .populate('winner')
      .sort({ createdAt: -1 });

    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active vote
router.get('/active', async (req, res) => {
  try {
    const activeVote = await Vote.findOne({ status: 'active' })
      .populate('selectedBands')
      .populate('votes.bandId');

    res.json(activeVote);
  } catch (error) {
    console.error('Error fetching active vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific vote
router.get('/:id', async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id)
      .populate('selectedBands')
      .populate('winner')
      .populate('votes.bandId');

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    res.json(vote);
  } catch (error) {
    console.error('Error fetching vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new vote (any user can create by selecting 3 bands)
router.post('/', async (req, res) => {
  try {
    const { selectedBands, username } = req.body;

    // Validate username
    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Check if there's already an active vote
    const activeVote = await Vote.findOne({ status: 'active' });
    if (activeVote) {
      return res.status(400).json({ error: 'There is already an active vote' });
    }

    // Validate that exactly 3 bands are selected
    if (!selectedBands || selectedBands.length !== 3) {
      return res.status(400).json({ error: 'Please select exactly 3 bands' });
    }

    // Verify all bands exist
    const bands = await Band.find({ _id: { $in: selectedBands } });
    if (bands.length !== 3) {
      return res.status(400).json({ error: 'Invalid band selection' });
    }

    // Create the vote
    const vote = new Vote({
      createdBy: username,
      selectedBands: selectedBands,
      status: 'active'
    });

    await vote.save();
    await vote.populate('selectedBands');

    res.status(201).json(vote);
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a vote (other users vote for 1 of the 3 bands)
router.post('/:id/submit', async (req, res) => {
  try {
    const { bandId, username } = req.body;
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (vote.status !== 'active') {
      return res.status(400).json({ error: 'Vote is not active' });
    }

    // Validate username
    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Check if user already voted
    const existingVote = vote.votes.find(v => v.userId === username);
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Validate band is one of the options
    const validBand = vote.selectedBands.some(b => b.toString() === bandId);
    if (!validBand) {
      return res.status(400).json({ error: 'Invalid band selection' });
    }

    // Add the vote
    vote.votes.push({
      userId: username,
      bandId: bandId
    });

    await vote.save();

    // Check if all 3 users have voted
    if (vote.votes.length === 3) {
      await processVoteResults(vote);
    }

    await vote.populate('selectedBands');
    await vote.populate('winner');

    res.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a vote
router.delete('/:id', async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    await Vote.deleteOne({ _id: req.params.id });
    res.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    console.error('Error deleting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add rating submission endpoint
router.post('/:id/rating', async (req, res) => {
  try {
    const { score, username } = req.body;
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (vote.status !== 'rating') {
      return res.status(400).json({ error: 'Vote is not in rating phase' });
    }

    if (!score || score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Check if user already rated
    const existingRating = vote.ratings.find(r => r.userId === username);
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated' });
    }

    // Add the rating
    vote.ratings.push({
      userId: username,
      score: parseInt(score)
    });

    // Calculate average rating
    const totalScore = vote.ratings.reduce((sum, r) => sum + r.score, 0);
    vote.averageRating = totalScore / vote.ratings.length;

    // Check if all users have rated
    if (vote.ratings.length === 3) {
      vote.status = 'completed';
      vote.completedAt = new Date();
    }

    await vote.save();
    await vote.populate('winner');
    await vote.populate('selectedBands');

    res.json(vote);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process vote results when all users have voted
async function processVoteResults(vote) {
  // Count votes for each band
  const voteCount = {};

  vote.votes.forEach(v => {
    const bandId = v.bandId.toString();
    voteCount[bandId] = (voteCount[bandId] || 0) + 1;
  });

  // Store results
  vote.results = Object.entries(voteCount).map(([bandId, count]) => ({
    bandId,
    voteCount: count
  }));

  // Find winner(s)
  const maxVotes = Math.max(...Object.values(voteCount));
  const winners = Object.entries(voteCount)
    .filter(([_, count]) => count === maxVotes)
    .map(([bandId]) => bandId);

  if (winners.length === 1) {
    // Clear winner - move to rating phase
    vote.winner = winners[0];
    vote.status = 'rating';  // Move to rating phase instead of completed
  } else {
    // Tie - create a new vote with the same bands
    vote.status = 'tied';
    vote.completedAt = new Date();

    // Create a new vote with the same bands
    const newVote = new Vote({
      createdBy: vote.createdBy,
      selectedBands: vote.selectedBands,
      status: 'active'
    });

    await newVote.save();
  }

  await vote.save();
}

module.exports = router;