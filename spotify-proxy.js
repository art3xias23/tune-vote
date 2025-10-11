const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

console.log('Spotify credentials loaded from .env file');

let accessToken = null;
let tokenExpiresAt = null;

async function getSpotifyToken() {
  if (accessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    console.log('Using cached token');
    return accessToken;
  }

  console.log('Getting new Spotify token...');
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      data: 'grant_type=client_credentials',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: SPOTIFY_CLIENT_ID,
        password: SPOTIFY_CLIENT_SECRET
      }
    });

    accessToken = response.data.access_token;
    tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
    console.log('Token obtained successfully!');
    return accessToken;
  } catch (error) {
    console.error('Token error:', error.response?.status, error.response?.data);
    throw error;
  }
}

app.get('/spotify/search', async (req, res) => {
  try {
    console.log('Search request for:', req.query.q);
    const { q, type = 'artist', limit = 5 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q required' });
    }

    const token = await getSpotifyToken();

    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q, type, limit },
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('Search successful!');
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/spotify/artist/:id/top-tracks', async (req, res) => {
  try {
    const { id } = req.params;
    const { market = 'US' } = req.query;

    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
      params: { market },
      headers: { 'Authorization': 'Bearer ' + token }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Top tracks error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.SPOTIFY_PROXY_PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Spotify proxy running on 0.0.0.0:' + PORT);
});