const mongoose = require('mongoose');
const { arch } = require('os');

const voteSchema = new mongoose.Schema({
  voteNumber: {
    type: Number,
    requred: true
  },
  status: {
    type: String,
    enum: ['active', 'rating', 'completed', 'tied', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: String,
    enum: ['Tino', 'Misho', 'Tedak'],
    required: true
  },
  selectedBands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Band'
  }],
  votes: [{
    userId: {
      type: String,
      enum: ['Tino', 'Misho', 'Tedak']
    },
    bandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Band'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Band'
  },
  results: [{
    bandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Band'
    },
    voteCount: {
      type: Number,
      default: 0
    }
  }],
  ratings: [{
    userId: {
      type: String,
      enum: ['Tino', 'Misho', 'Tedak']
    },
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

voteSchema.pre('save', async function(next) {
  if (this.isNew && !this.voteNumber) {
    const lastVote = await mongoose.model('Vote').findOne().sort({ voteNumber: -1 });
    this.voteNumber = lastVote ? lastVote.voteNumber + 1 : 1;
  }

  // Validate max 3 votes per user
  const userVoteCounts = {};
  this.votes.forEach(vote => {
    userVoteCounts[vote.userId] = (userVoteCounts[vote.userId] || 0) + 1;
    if (userVoteCounts[vote.userId] > 3) {
      throw new Error(`User ${vote.userId} cannot vote for more than 3 bands`);
    }
  });

  next();
});

module.exports = mongoose.model('Vote', voteSchema);