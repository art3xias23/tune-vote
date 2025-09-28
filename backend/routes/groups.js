const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find().populate('members', 'name email').populate('createdBy', 'name email');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    const group = new Group({
      name,
      description,
      createdBy: req.user.userId,
      members: []
    });

    await group.save();
    await group.populate('createdBy', 'name email');

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (name && name !== group.name) {
      const existingGroup = await Group.findOne({ name, _id: { $ne: req.params.id } });
      if (existingGroup) {
        return res.status(400).json({ error: 'Group name already exists' });
      }
      group.name = name;
    }

    if (description !== undefined) {
      group.description = description;
    }

    await group.save();
    await group.populate('members', 'name email');
    await group.populate('createdBy', 'name email');

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    const targetUser = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    targetUser.groupId = group._id;
    await targetUser.save();

    await group.populate('members', 'name email');
    res.json(group);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id: groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    const targetUser = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    group.members = group.members.filter(memberId => memberId.toString() !== userId);
    await group.save();

    await group.populate('members', 'name email');
    res.json(group);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;