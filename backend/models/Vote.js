const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voteNumber: {
    type: Number,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'rating', 'completed', 'tied'],
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
      max: 10
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
  next();
});

module.exports = mongoose.model('Vote', voteSchema);