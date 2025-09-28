const User = require('../models/User');

const validateUser = async (req, res, next) => {
  try {
    const { username } = req.headers;

    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(401).json({ error: 'Valid username required in headers' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { validateUser, requireAdmin };