const express = require('express');
const axios = require('axios');
const Band = require('../models/Band');
const { validateUser } = require('../middleware/userAuth');

const router = express.Router();

router.get('/', validateUser, async (req, res) => {
  try {
    const bands = await Band.find().populate('addedBy', 'name username').sort({ createdAt: -1 });
    res.json(bands);
  } catch (error) {
    console.error('Error fetching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', validateUser, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const bands = await Band.find({
      name: { $regex: q, $options: 'i' }
    }).populate('addedBy', 'name username').limit(20);

    res.json(bands);
  } catch (error) {
    console.error('Error searching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search-external', validateUser, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchResults = [];

    try {
      const lastFmResponse = await axios.get('http://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'artist.search',
          artist: q,
          api_key: process.env.LASTFM_API_KEY || 'demo_key',
          format: 'json',
          limit: 10
        },
        timeout: 5000
      });

      if (lastFmResponse.data.results && lastFmResponse.data.results.artistmatches) {
        const artists = lastFmResponse.data.results.artistmatches.artist || [];
        const artistArray = Array.isArray(artists) ? artists : [artists];

        for (const artist of artistArray) {
          const existingBand = await Band.findOne({ name: artist.name });
          if (!existingBand) {
            searchResults.push({
              name: artist.name,
              image: artist.image?.[2]?.['#text'] || artist.image?.[1]?.['#text'] || '/default-band.png',
              source: 'LastFM',
              lastFmId: artist.mbid
            });
          }
        }
      }
    } catch (lastFmError) {
      console.warn('LastFM search failed:', lastFmError.message);
    }

    if (searchResults.length === 0) {
      searchResults.push({
        name: q,
        image: '/default-band.png',
        source: 'Manual',
        description: 'Add this band manually'
      });
    }

    res.json(searchResults.slice(0, 10));
  } catch (error) {
    console.error('Error searching external sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', validateUser, async (req, res) => {
  try {
    const { name, image, spotifyId, lastFmId, musicBrainzId } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Band name and image are required' });
    }

    const existingBand = await Band.findOne({ name });
    if (existingBand) {
      return res.status(400).json({ error: 'Band already exists in database' });
    }

    const band = new Band({
      name,
      image,
      spotifyId,
      lastFmId,
      musicBrainzId,
      addedBy: req.user._id
    });

    await band.save();
    await band.populate('addedBy', 'name username');

    res.status(201).json(band);
  } catch (error) {
    console.error('Error adding band:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', validateUser, async (req, res) => {
  try {
    const band = await Band.findById(req.params.id);
    if (!band) {
      return res.status(404).json({ error: 'Band not found' });
    }

    if (band.addedBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You can only delete bands you added' });
    }

    await Band.findByIdAndDelete(req.params.id);
    res.json({ message: 'Band deleted successfully' });
  } catch (error) {
    console.error('Error deleting band:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;