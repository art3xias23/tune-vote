const express = require('express');
const axios = require('axios');
const Band = require('../models/Band');
const { validateUser } = require('../middleware/userAuth');
const { format } = require('path');

const router = express.Router();

const getArtistImage = (artist) => {
  if (!artist || !artist.image || artist.image.length === 0) return '/default-band.png';

  console.log('Available images for', artist.name, artist.image);

  const imageObj =
    artist.image.find(img => img.size === 'extralarge') ||
    artist.image.find(img => img.size === 'large') ||
    artist.image.find(img => img.size === 'medium') ||
    artist.image.find(img => img.size === 'small');

  const url = imageObj ? imageObj['#text'] : '/default-band.png';
  console.log('Selected image URL:', url);
  return url;
};

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
    }).populate('addedBy', 'name username').limit(10);

    res.json(bands);
  } catch (error) {
    console.error('Error searching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search-external', validateUser, async (req, res) => {
  try {
    const { q } = req.query;

    console.log('Searching LastFM for:', q);
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchResults = [];

    console.log('Using LastFM API key:', process.env.LASTFM_API_KEY);
    searchResults.forEach(artist => {
  console.log('Artist:', artist.name);
  console.log('Image URL:', artist.image);
  console.log('Listeners:', artist.listeners);
  console.log('Bio:', artist.bio);
});



    try {
      const lastFmResponse = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'artist.search',
          artist: q,
          api_key: process.env.LASTFM_API_KEY ,
          format  : 'json',
          headers: { 'User-Agent': 'TuneVoteApp/1.0 (konstantin.v.milchev@gmail.com)' },
          limit: 10
        },
         
        timeout: 5000
      });

      //console.log('LastFM search response:', lastFmResponse.data);


      if (lastFmResponse.data.results && lastFmResponse.data.results.artistmatches) {
        let artists = lastFmResponse.data.results.artistmatches.artist || [];
        if (!Array.isArray(artists)) artists = [artists];
        artists = artists.slice(0, 2); // just the top match

        for (const artist of artists) {
          const existingBand = await Band.findOne({ name: artist.name });

          // Always push artist info, even if in DB (optional: skip if you want)
          let artistInfo = null;
          try {
            const artistInfoResponse = await axios.get('http://ws.audioscrobbler.com/2.0/', {
              params: {
                method: 'artist.getinfo',
                artist: artist.name,
                api_key: process.env.LASTFM_API_KEY,
                format: 'json'
              },
              timeout: 3000
            });
            if (artistInfoResponse.data.artist) artistInfo = artistInfoResponse.data.artist;
          } catch (detailError) {
            console.warn(`Error getting info for ${artist.name}:`, detailError.message);
          }

          searchResults.push({
            name: artist.name,
            image: getArtistImage(artistInfo || artist),
            source: 'LastFM',
            lastFmId: artist.mbid,
            bio: artistInfo?.bio?.summary ? artistInfo.bio.summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : null,
            listeners: artistInfo?.stats?.listeners ? parseInt(artistInfo.stats.listeners) : parseInt(artist.listeners),
            playcount: artistInfo?.stats?.playcount ? parseInt(artistInfo.stats.playcount) : null,
            topAlbums: [],
            tags: artistInfo?.tags?.tag ? artistInfo.tags.tag.slice(0, 3).map(tag => tag.name) : []
          });
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