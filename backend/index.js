const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const User = require('./models/User');
const { logUserAction } = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log startup information
console.log('[Server] Starting Tune Vote API Server...');
console.log('[Server] Environment:', process.env.NODE_ENV);
console.log('[Server] Port:', PORT);
console.log('[Server] Spotify Client ID exists:', !!process.env.SPOTIFY_CLIENT_ID);
console.log('[Server] Spotify Client Secret exists:', !!process.env.SPOTIFY_CLIENT_SECRET);

// Log system startup
logUserAction.system.startup();

app.use(helmet());

// Configure CORS properly
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tune-vote.pragmatino.xyz'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make MongoDB connection optional for development
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tunevote';

// Only connect to MongoDB if the URI is valid and MongoDB is available
if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
  mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');
  });


  mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.warn('MongoDB connection error, app will continue without database:', err.message);
    logUserAction.system.error(err, { action: 'database.connection' });
  });
} else {
  console.log('Running without MongoDB - using in-memory data for development');
}

const bandsRouter = require('./routes/bands');
const votesRouter = require('./routes/votes');

app.use('/api/bands', bandsRouter);
app.use('/api/votes', votesRouter);

// User authentication endpoint with logging
app.post('/api/auth/select-user', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !['Tino', 'Misho', 'Tedak'].includes(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Log user selection
    logUserAction.auth.select(username);

    // Return user data (simplified without actual DB lookup for now)
    const userData = {
      username,
      name: username,
      avatar: `/avatars/${username.toLowerCase()}.jpg`,
      description: `${username} user`,
      isAdmin: false
    };

    res.json(userData);
  } catch (error) {
    logUserAction.system.error(error, { action: 'auth.select' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Tune Vote API Server' });
});

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };

  try {
    res.status(200).send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  logUserAction.system.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logUserAction.system.shutdown();
  process.exit(0);
});