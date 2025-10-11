const express = require('express');
const axios = require('axios');
const https = require('https');
const Band = require('../models/Band');
const { format } = require('path');

// Create axios instance with IPv4 forced
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    family: 4 // Force IPv4
  })
});

const router = express.Router();

// Spotify API token management
let spotifyAccessToken = null;
let tokenExpiresAt = null;

// Using host-based Spotify proxy instead of direct API calls
const SPOTIFY_PROXY_URL = 'http://host.docker.internal:5001';

const getArtistImage = (images) => {
  if (!images || images.length === 0) return '/default-band.png';

  // Spotify provides images in descending size order
  // Return the first (largest) image or medium sized one
  const mediumImage = images.find(img => img.width >= 300 && img.width <= 640);
  return mediumImage?.url || images[0]?.url || '/default-band.png';
};

router.get('/', async (req, res) => {
  try {
    const bands = await Band.find().sort({ createdAt: -1 });
    res.json(bands);
  } catch (error) {
    console.error('Error fetching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint for Spotify connectivity via proxy
router.get('/test-spotify', async (req, res) => {
  try {
    console.log('[Spotify Test] Testing Spotify proxy connection...');

    const response = await axios.get(`${SPOTIFY_PROXY_URL}/spotify/search`, {
      params: {
        q: 'test',
        type: 'artist',
        limit: 1
      },
      timeout: 10000
    });

    console.log('[Spotify Test] Proxy search successful, found:', response.data.artists.items.length, 'artists');
    res.json({
      success: true,
      proxyWorked: true,
      artistsFound: response.data.artists.items.length,
      artistName: response.data.artists.items[0]?.name
    });
  } catch (error) {
    console.error('[Spotify Test] Proxy failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      proxyUrl: SPOTIFY_PROXY_URL
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const bands = await Band.find({
      name: { $regex: q, $options: 'i' }
    }).limit(10);

    res.json(bands);
  } catch (error) {
    console.error('Error searching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search-external', async (req, res) => {
  try {
    const { q } = req.query;

    console.log('[Spotify Search] Starting search for:', q);
    console.log('[Spotify Search] Request from IP:', req.ip);

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchResults = [];

    try {
      // Search artists using host proxy
      console.log('[Spotify Search] Using proxy to search for:', q);

      const spotifySearchResponse = await axios.get(`${SPOTIFY_PROXY_URL}/spotify/search`, {
        params: {
          q: q,
          type: 'artist',
          limit: 5
        },
        timeout: 10000
      });

      console.log('[Spotify Search] Proxy response received');

      if (spotifySearchResponse.data.artists && spotifySearchResponse.data.artists.items) {
        const artists = spotifySearchResponse.data.artists.items;
        console.log('[Spotify Search] Found', artists.length, 'artists');

        for (const artist of artists.slice(0, 3)) { // Get top 3 results
          const existingBand = await Band.findOne({ name: artist.name });

          // Get top tracks using proxy
          let topTracks = [];
          try {
            const topTracksResponse = await axios.get(
              `${SPOTIFY_PROXY_URL}/spotify/artist/${artist.id}/top-tracks`,
              {
                params: { market: 'US' },
                timeout: 5000
              }
            );

            if (topTracksResponse.data.tracks) {
              topTracks = topTracksResponse.data.tracks.slice(0, 3).map(track => ({
                name: track.name,
                preview_url: track.preview_url,
                album: track.album.name
              }));
            }
          } catch (tracksError) {
            console.warn(`Error getting top tracks for ${artist.name}:`, tracksError.message);
          }

          searchResults.push({
            name: artist.name,
            image: getArtistImage(artist.images),
            source: 'Spotify',
            spotifyId: artist.id,
            spotifyUri: artist.uri,
            externalUrls: artist.external_urls,
            popularity: artist.popularity,
            followers: artist.followers?.total || 0,
            genres: artist.genres?.slice(0, 3) || [],
            topTracks: topTracks,
            inDatabase: !!existingBand
          });
        }
      }
    } catch (spotifyError) {
      console.error('[Spotify Proxy Error] Search failed:', spotifyError.message);

      // If proxy fails, provide manual option
      searchResults.push({
        name: q,
        image: '/default-band.png',
        source: 'Manual',
        description: 'Spotify search failed. Add this band manually.'
      });
    }

    if (searchResults.length === 0) {
      searchResults.push({
        name: q,
        image: '/default-band.png',
        source: 'Manual',
        description: 'No results found. Add this band manually.'
      });
    }

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching external sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, image, spotifyId, spotifyUri, genres, username, lastFmId, musicBrainzId } = req.body;

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
      spotifyUri,
      genres,
      lastFmId,
      musicBrainzId,
      addedBy: username || null // Store the username directly
    });

    await band.save();

    res.status(201).json(band);
  } catch (error) {
    console.error('Error adding band:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const band = await Band.findById(req.params.id);
    if (!band) {
      return res.status(404).json({ error: 'Band not found' });
    }

    // No user auth anymore - anyone can delete

    await Band.findByIdAndDelete(req.params.id);
    res.json({ message: 'Band deleted successfully' });
  } catch (error) {
    console.error('Error deleting band:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;