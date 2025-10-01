const mongoose = require('mongoose');

const bandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  spotifyId: {
    type: String
  },
  spotifyUri: {
    type: String
  },
  genres: [{
    type: String
  }],
  lastFmId: {
    type: String
  },
  musicBrainzId: {
    type: String
  },
  addedBy: {
    type: String,
    enum: ['Tino', 'Misho', 'Tedak', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Band', bandSchema);