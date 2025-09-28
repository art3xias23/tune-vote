const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voteNumber: {
    type: Number,
    unique: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'runoff', 'completed'],
    default: 'pending'
  },
  availableBands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Band'
  }],
  userVotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    selectedBands: [{
      bandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Band'
      },
      rank: Number
    }],
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
  next();
});

module.exports = mongoose.model('Vote', voteSchema);