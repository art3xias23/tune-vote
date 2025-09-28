const express = require('express');
const Vote = require('../models/Vote');
const Band = require('../models/Band');
const User = require('../models/User');
const Group = require('../models/Group');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const query = user.isAdmin ? {} : { groupId: user.groupId };

    const votes = await Vote.find(query)
      .populate('availableBands')
      .populate('winner')
      .populate('groupId', 'name')
      .populate('userVotes.userId', 'name')
      .sort({ createdAt: -1 });

    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const vote = await Vote.findById(req.params.id)
      .populate('availableBands')
      .populate('winner')
      .populate('groupId', 'name members')
      .populate('userVotes.userId', 'name')
      .populate('userVotes.selectedBands.bandId');

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (!user.isAdmin && vote.groupId._id.toString() !== user.groupId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(vote);
  } catch (error) {
    console.error('Error fetching vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const previousVotes = await Vote.find({ groupId }).populate('winner');
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
      groupId,
      availableBands: availableBands.map(b => b._id),
      status: 'active'
    });

    await vote.save();
    await vote.populate('availableBands');
    await vote.populate('groupId', 'name');

    res.status(201).json(vote);
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { selectedBands } = req.body;
    const vote = await Vote.findById(req.params.id).populate('groupId', 'members');

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    if (vote.status !== 'active' && vote.status !== 'runoff') {
      return res.status(400).json({ error: 'Vote is not active' });
    }

    const user = await User.findById(req.user.userId);
    if (!vote.groupId.members.includes(user._id)) {
      return res.status(403).json({ error: 'You are not a member of this voting group' });
    }

    const existingVoteIndex = vote.userVotes.findIndex(
      uv => uv.userId.toString() === req.user.userId
    );

    const expectedSelections = vote.status === 'runoff' ? 1 : 3;
    if (!selectedBands || selectedBands.length !== expectedSelections) {
      return res.status(400).json({
        error: `Please select exactly ${expectedSelections} band${expectedSelections > 1 ? 's' : ''}`
      });
    }

    const userVote = {
      userId: req.user.userId,
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

    if (vote.userVotes.length === vote.groupId.members.length) {
      await processVoteResults(vote);
    }

    await vote.populate('availableBands');
    await vote.populate('winner');
    await vote.populate('userVotes.userId', 'name');

    res.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
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
    vote.status = 'completed';
    vote.completedAt = new Date();
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