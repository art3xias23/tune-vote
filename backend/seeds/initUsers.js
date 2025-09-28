const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const initializeUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tunevote');

    // Clear existing users
    await User.deleteMany({});

    // Create the 3 fixed users
    const users = [
      {
        username: 'Tino',
        name: 'Tino',
        avatar: '🎸',
        isAdmin: true
      },
      {
        username: 'Misho',
        name: 'Misho',
        avatar: '🎹'
      },
      {
        username: 'Tedak',
        name: 'Tedak',
        avatar: '🥁'
      }
    ];

    await User.insertMany(users);
    console.log('✅ Successfully initialized users:', users.map(u => u.username).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing users:', error);
    process.exit(1);
  }
};

initializeUsers();