const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make MongoDB connection optional for development
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tunevote';

// Only connect to MongoDB if the URI is valid and MongoDB is available
if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).catch(err => {
    console.warn('MongoDB connection failed, running without database:', err.message);
  });

  mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.warn('MongoDB connection error, app will continue without database:', err.message);
  });
} else {
  console.log('Running without MongoDB - using in-memory data for development');
}

const bandsRouter = require('./routes/bands');
const votesRouter = require('./routes/votes');

app.use('/bands', bandsRouter);
app.use('/votes', votesRouter);

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