const express = require('express');
const Vote = require('../models/Vote');
const Band = require('../models/Band');
const User = require('../models/User');
const { validateUser, requireAdmin } = require('../middleware/userAuth');

const router = express.Router();

router.get('/', validateUser, async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('availableBands')
      .populate('winner')
      .populate('userVotes.userId', 'name username')
      .populate('ratings.userId', 'name username')
      .sort({ createdAt: -1 });

    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', validateUser, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id)
      .populate('availableBands')
      .populate('winner')
      .populate('userVotes.userId', 'name username')
      .populate('userVotes.selectedBands.bandId')
      .populate('ratings.userId', 'name username');

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    res.json(vote);
  } catch (error) {
    console.error('Error fetching vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', validateUser, requireAdmin, async (req, res) => {
  try {
    const previousVotes = await Vote.find().populate('winner');
    const excludedBandIds = previousVotes
      .filter(v => v.winner)
      .map(v => v.winner._id.toString());

    const availableBands = await Band.find({
      _id: { $nin: excludedBandIds }
    });

    if (availableBands.length < 3) {
      return res.status(400).json({ error: 'Not enough bands available for voting (minimum 3 required)' });
    }

    const vote = new Vote({
      availableBands: availableBands.map(b => b._id),
      status: 'active'
    });

    await vote.save();
    await vote.populate('availableBands');

    res.status(201).json(vote);
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/submit', validateUser, async (req, res) => {
  try {
    const { selectedBands } = req.body;
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (vote.status !== 'active' && vote.status !== 'runoff') {
      return res.status(400).json({ error: 'Vote is not active' });
    }

    const expectedSelections = vote.status === 'runoff' ? 1 : 3;
    if (!selectedBands || selectedBands.length !== expectedSelections) {
      return res.status(400).json({
        error: `Please select exactly ${expectedSelections} band${expectedSelections > 1 ? 's' : ''}`
      });
    }

    const existingVoteIndex = vote.userVotes.findIndex(
      uv => uv.userId.toString() === req.user._id.toString()
    );

    const userVote = {
      userId: req.user._id,
      selectedBands: selectedBands.map((bandId, index) => ({
        bandId,
        rank: index + 1
      })),
      submittedAt: new Date()
    };

    if (existingVoteIndex >= 0) {
      vote.userVotes[existingVoteIndex] = userVote;
    } else {
      vote.userVotes.push(userVote);
    }

    await vote.save();

    // Check if all 3 users have voted
    if (vote.userVotes.length === 3) {
      await processVoteResults(vote);
    }

    await vote.populate('availableBands');
    await vote.populate('winner');
    await vote.populate('userVotes.userId', 'name username');

    res.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/rating', validateUser, async (req, res) => {
  try {
    const { score } = req.body;
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

    const existingRatingIndex = vote.ratings.findIndex(
      r => r.userId.toString() === req.user._id.toString()
    );

    const rating = {
      userId: req.user._id,
      score: parseInt(score),
      submittedAt: new Date()
    };

    if (existingRatingIndex >= 0) {
      vote.ratings[existingRatingIndex] = rating;
    } else {
      vote.ratings.push(rating);
    }

    // Calculate average rating
    const totalScore = vote.ratings.reduce((sum, r) => sum + r.score, 0);
    vote.averageRating = totalScore / vote.ratings.length;

    // Check if all users have rated
    if (vote.ratings.length === 3) {
      vote.status = 'completed';
      vote.completedAt = new Date();
    }

    await vote.save();
    await vote.populate('ratings.userId', 'name username');
    await vote.populate('winner');

    res.json(vote);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processVoteResults(vote) {
  const voteCount = {};

  vote.userVotes.forEach(userVote => {
    userVote.selectedBands.forEach(selection => {
      const bandId = selection.bandId.toString();
      voteCount[bandId] = (voteCount[bandId] || 0) + 1;
    });
  });

  vote.results = Object.entries(voteCount).map(([bandId, count]) => ({
    bandId,
    voteCount: count
  }));

  const sortedResults = vote.results.sort((a, b) => b.voteCount - a.voteCount);
  const maxVotes = sortedResults[0]?.voteCount || 0;
  const winners = sortedResults.filter(r => r.voteCount === maxVotes);

  if (winners.length === 1) {
    vote.winner = winners[0].bandId;
    vote.status = 'rating';  // Move to rating phase
  } else if (winners.length === 2 && vote.status === 'active') {
    vote.status = 'runoff';
    vote.availableBands = winners.map(w => w.bandId);
    vote.userVotes = [];
  } else if (winners.length > 2 || (winners.length > 1 && vote.status === 'runoff')) {
    vote.status = 'pending';
    vote.userVotes = [];
  }

  await vote.save();
}

module.exports = router;