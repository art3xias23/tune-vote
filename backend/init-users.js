const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function initUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = [
      { username: 'Tino', name: 'Tino', email: 'tino@example.com' },
      { username: 'Misho', name: 'Misho', email: 'misho@example.com' },
      { username: 'Tedak', name: 'Tedak', email: 'tedak@example.com', isAdmin: true }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ username: userData.username });
      if (!existing) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User already exists: ${userData.username}`);
      }
    }

    console.log('Users initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing users:', error);
    process.exit(1);
  }
}

initUsers();