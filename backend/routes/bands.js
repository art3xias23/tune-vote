const express = require('express');
const axios = require('axios');
const Band = require('../models/Band');
const { format } = require('path');

const router = express.Router();

// Spotify API token management
let spotifyAccessToken = null;
let tokenExpiresAt = null;

const getSpotifyToken = async () => {
  // Check if we have a valid token
  if (spotifyAccessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    console.log('[Spotify] Using cached access token, expires at:', tokenExpiresAt);
    return spotifyAccessToken;
  }

  console.log('[Spotify] Requesting new access token...');
  console.log('[Spotify] Client ID exists:', !!process.env.SPOTIFY_CLIENT_ID);
  console.log('[Spotify] Client Secret exists:', !!process.env.SPOTIFY_CLIENT_SECRET);

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('[Spotify API Error] Missing credentials!');
    console.error('[Spotify API Error] SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID || 'NOT SET');
    console.error('[Spotify API Error] SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'SET' : 'NOT SET');
    throw new Error('Spotify credentials not configured');
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        }
      }
    );

    spotifyAccessToken = response.data.access_token;
    // Set expiration time (subtract 60 seconds for buffer)
    tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
    console.log('[Spotify] Access token obtained successfully, expires at:', tokenExpiresAt);
    return spotifyAccessToken;
  } catch (error) {
    console.error('[Spotify API Error] Failed to get access token:');
    console.error('[Spotify API Error] Status:', error.response?.status);
    console.error('[Spotify API Error] Data:', JSON.stringify(error.response?.data));
    console.error('[Spotify API Error] Message:', error.message);
    throw error;
  }
};

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

// Test endpoint for Spotify connectivity
router.get('/test-spotify', async (req, res) => {
  try {
    console.log('[Spotify Test] Testing Spotify connection...');
    const token = await getSpotifyToken();
    console.log('[Spotify Test] Token obtained successfully');

    // Try a simple search
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: 'test',
        type: 'artist',
        limit: 1
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[Spotify Test] Search successful, found:', response.data.artists.items.length, 'artists');
    res.json({
      success: true,
      tokenObtained: !!token,
      searchWorked: true,
      artistsFound: response.data.artists.items.length
    });
  } catch (error) {
    console.error('[Spotify Test] Failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
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
      // Get Spotify access token
      console.log('[Spotify Search] Getting access token...');
      const accessToken = await getSpotifyToken();
      console.log('[Spotify Search] Token obtained, making search request...');

      // Search for artists on Spotify
      const spotifySearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: q,
          type: 'artist',
          limit: 5
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 5000
      });

      console.log('[Spotify Search] Response received, status:', spotifySearchResponse.status);

      if (spotifySearchResponse.data.artists && spotifySearchResponse.data.artists.items) {
        const artists = spotifySearchResponse.data.artists.items;
        console.log('[Spotify Search] Found', artists.length, 'artists');

        for (const artist of artists.slice(0, 3)) { // Get top 3 results
          const existingBand = await Band.findOne({ name: artist.name });

          // Get more artist details
          let topTracks = [];

          try {
            // Get top tracks for the artist
            const topTracksResponse = await axios.get(
              `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`,
              {
                params: { market: 'US' },
                headers: { 'Authorization': `Bearer ${accessToken}` },
                timeout: 3000
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
      console.error('[Spotify API Error] Search failed:');
      console.error('[Spotify API Error] Status:', spotifyError.response?.status);
      console.error('[Spotify API Error] Data:', JSON.stringify(spotifyError.response?.data));
      console.error('[Spotify API Error] Message:', spotifyError.message);
      console.error('[Spotify API Error] Full error:', spotifyError);

      // If Spotify fails, provide manual option
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