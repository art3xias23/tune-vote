const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  voteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vote',
    required: true
  },
  bandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Band',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ratingSchema.index({ voteId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);