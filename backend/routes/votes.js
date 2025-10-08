const express = require('express');
const Vote = require('../models/Vote');
const Band = require('../models/Band');

const router = express.Router();

// Get all votes
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find({status: { $ne: 'archived' }})
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
      status: 'active',
    });

    await vote.save();
    await vote.populate('selectedBands');
    
    res.status(201).json(vote);

    console.log("Vote created:", vote);
    console.log("Voter:", username);

  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a vote (other users vote for 1 of the 3 bands)
router.post('/:id/submit', async (req, res) => {
  try {
    const { bandIds, username } = req.body;
    const vote = await Vote.findById(req.params.id).populate('selectedBands');

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (vote.status !== 'active') {
      return res.status(400).json({ error: 'Vote is not active' });
    }

    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Check if user already voted
    const userVotes = vote.votes.filter(v => v.userId === username);
    if (userVotes.length > 0) {
      return res.status(400).json({ error: 'You have already voted in this session' });
    }

    // Validate that user is voting for 1-3 bands
    if (!bandIds || bandIds.length === 0 || bandIds.length > 2) {
      return res.status(400).json({ error: 'You must select 1-2 bands' });
    }

    // Add votes for each selected band
    for (const bandId of bandIds) {
      const validBand = vote.selectedBands.some(b => b._id.toString() === bandId);
      if (!validBand) {
        return res.status(400).json({ error: 'Invalid band selection' });
      }

      vote.votes.push({
        userId: username,
        bandId: bandId
      });
    }

    await vote.save();

    // Check if all users have voted (3 users total)
    const uniqueVoters = [...new Set(vote.votes.map(v => v.userId))];
    if (uniqueVoters.length === 3) {
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

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5 stars' });
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
  console.log('Starting vote processing...'); // Log start
  console.log('Current votes:', vote.votes); // Log all votes

  const voteCount = {};

  // Log selected bands
  console.log('Selected bands:', vote.selectedBands.map(b => ({
    id: b._id.toString(),
    name: b.name
  })));

  // Initialize vote count for all selected bands to 0
  vote.selectedBands.forEach(band => {
    voteCount[band._id.toString()] = 0;
  });

  console.log('Initial vote counts:', voteCount); // Log initial counts

  // Count each vote
  vote.votes.forEach(v => {
    const bandId = v.bandId.toString();
    voteCount[bandId] = (voteCount[bandId] || 0) + 1;
    console.log(`Adding vote for band ${bandId} by user ${v.userId}`); // Log each vote count
  });

  console.log('Final vote counts:', voteCount); // Log final counts

  // Store results
  vote.results = Object.entries(voteCount).map(([bandId, count]) => ({
    bandId: bandId,
    voteCount: count
  }));

  console.log('Vote results:', vote.results); // Log results array

  // Find winner(s)
  const maxVotes = Math.max(...Object.values(voteCount));
  const winners = Object.entries(voteCount)
    .filter(([_, count]) => count === maxVotes)
    .map(([bandId]) => bandId);

  console.log('Max votes:', maxVotes); // Log max votes
  console.log('Winners:', winners); // Log winners

  if (winners.length === 1) {
    console.log(`Single winner found: ${winners[0]}`); // Log single winner
    vote.winner = winners[0];
    vote.status = 'rating'; // Move to rating phase
  } else {
    // For ties, pick first winner and move to rating phase
    vote.status = 'archived'; // Mark current vote as completed
    //vote.winner = null; // No winner for this round
    //vote.completedAt = new Date();

    // Create a new vote with tied bands
    const tiedBands = winners;
    //voteCount = {};

    const newVote = new Vote({
      createdBy: vote.createdBy,
      selectedBands: tiedBands,
      status: 'active',
    });
    console.log('Tied bands:', tiedBands); // Log tied band details
    await newVote.save();
    await newVote.populate('selectedBands');
  }

  await vote.save();
  //return vote;
}

module.exports = router;