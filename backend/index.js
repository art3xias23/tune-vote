const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tunevote', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const { router: authRouter } = require('./routes/auth');
const groupsRouter = require('./routes/groups');
const bandsRouter = require('./routes/bands');
const votesRouter = require('./routes/votes');

app.use('/auth', authRouter);
app.use('/groups', groupsRouter);
app.use('/bands', bandsRouter);
app.use('/votes', votesRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Tune Vote API Server' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});