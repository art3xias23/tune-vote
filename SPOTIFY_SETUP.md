# Spotify API Setup Guide

The Spotify API is returning 403 Forbidden. This means the credentials are invalid or the app needs to be set up properly.

## Steps to Fix:

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create a New App** (or check existing one)
   - Click "Create app"
   - App name: "Tune Vote"
   - App description: "Music voting application"
   - Redirect URI: `http://localhost:3000/callback` (not used but required)
   - Check "Web API" under APIs used
   - Check the agreement and click "Save"

3. **Get Your Credentials**
   - Click on your app
   - Go to "Settings"
   - You'll see:
     - Client ID (should be 32 characters)
     - Client Secret (click "View client secret")

4. **Update the .env file on the server**
   ```bash
   cd /opt/tune-vote
   sudo nano .env
   ```

   Update these lines with your NEW credentials:
   ```
   SPOTIFY_CLIENT_ID=your_new_client_id_here
   SPOTIFY_CLIENT_SECRET=your_new_client_secret_here
   ```

5. **Restart the backend**
   ```bash
   sudo docker compose restart backend
   ```

6. **Test the connection**
   ```bash
   curl "http://localhost:5000/api/bands/test-spotify"
   ```

## Important Notes:

- The Client ID in your .env (52d6202d9f254a83bde2c45025ad8cfb) might be invalid or from a deleted app
- Spotify credentials are free - you just need a regular Spotify account
- Make sure there are no extra spaces or quotes around the credentials in .env
- The credentials should be exactly 32 characters for Client ID and 32 characters for Client Secret

## Alternative: Use Environment Variables without .env

If .env isn't working, you can set them directly in docker-compose.yml:

```yaml
environment:
  SPOTIFY_CLIENT_ID: "your_actual_client_id"
  SPOTIFY_CLIENT_SECRET: "your_actual_secret"
```

But using .env is more secure.