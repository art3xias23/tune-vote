const express = require('express');
const axios = require('axios');
const https = require('https');
const Band = require('../models/Band');
const { format } = require('path');
const { logUserAction } = require('../utils/logger');

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

// Using host-based Spotify proxy - try multiple connection methods
const SPOTIFY_PROXY_URLS = [
  'http://host.docker.internal:5001',
  'http://172.17.0.1:5001', // Docker bridge gateway
  'http://91.98.84.35:5001'  // Direct server IP
];

// Function to try multiple proxy URLs
async function makeProxyRequest(endpoint, params = {}, timeout = 10000) {
  for (const baseUrl of SPOTIFY_PROXY_URLS) {
    try {
      console.log(`[Spotify Proxy] Trying ${baseUrl}${endpoint}`);
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        params,
        timeout: timeout
      });
      console.log(`[Spotify Proxy] Success with ${baseUrl}`);
      return response;
    } catch (error) {
      console.log(`[Spotify Proxy] Failed ${baseUrl}: ${error.message}`);
      continue;
    }
  }
  throw new Error('All proxy URLs failed');
}

const SPOTIFY_PROXY_URL = SPOTIFY_PROXY_URLS[0]; // Keep for legacy test endpoint

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
    const { q, username } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const bands = await Band.find({
      name: { $regex: q, $options: 'i' }
    }).limit(10);

    // Log local search if username provided
    if (username) {
      logUserAction.band.search(username, q, bands.length);
    }

    res.json(bands);
  } catch (error) {
    console.error('Error searching bands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search-external', async (req, res) => {
  try {
    const { q, username } = req.query;

    console.log('[Spotify Search] Starting search for:', q);
    console.log('[Spotify Search] Request from IP:', req.ip);

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchResults = [];

    try {
      // Search artists using host proxy
      console.log('[Spotify Search] Using proxy to search for:', q);

      const spotifySearchResponse = await makeProxyRequest('/spotify/search', {
        q: q,
        type: 'artist',
        limit: 5
      });

      console.log('[Spotify Search] Proxy response received');

      if (spotifySearchResponse.data.artists && spotifySearchResponse.data.artists.items) {
        const artists = spotifySearchResponse.data.artists.items;
        console.log('[Spotify Search] Found', artists.length, 'artists');

        // Log Spotify API search
        const artistNames = artists.slice(0, 3).map(a => a.name);
        logUserAction.band.searchSpotify(username || 'Unknown', q, artists.length, artistNames);

        for (const artist of artists.slice(0, 3)) { // Get top 3 results
          const existingBand = await Band.findOne({ name: artist.name });

          // Get top tracks using proxy
          let topTracks = [];
          try {
            const topTracksResponse = await makeProxyRequest(
              `/spotify/artist/${artist.id}/top-tracks`,
              { market: 'US' },
              5000
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

    // Log the search action
    if (username) {
      logUserAction.band.search(username, q, searchResults.length);
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

    // Log the band creation with appropriate action based on source
    if (spotifyId) {
      logUserAction.band.createFromSpotify(username || 'Unknown', band._id, band.name, spotifyId, genres || []);
    } else {
      logUserAction.band.create(username || 'Unknown', band._id, band.name, 'manual');
    }

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
    const username = req.query.username || 'Unknown';

    // Log the deletion before actually deleting
    logUserAction.band.delete(username, band._id, band.name);

    await Band.findByIdAndDelete(req.params.id);
    res.json({ message: 'Band deleted successfully' });
  } catch (error) {
    console.error('Error deleting band:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;