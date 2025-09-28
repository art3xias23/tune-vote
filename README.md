# Tune Vote

A React and Node.js application for group music voting with Facebook authentication.

## Features

- **Facebook OAuth Authentication**: Login with Facebook, first-time users select a group
- **Admin Panel**: Admin (konstantin.v.milchev@gmail.com) can manage groups and their members
- **Band Database**: Users can search and add bands from external sources
- **Voting System**:
  - Users vote for 3 bands per round
  - Automatic winner determination or runoff voting for ties
  - Vote history with winners displayed
- **Group-based Voting**: Each user belongs to one group, votes are group-specific

## Project Structure

```
tune-vote/
├── backend/          # Node.js Express API server
├── frontend/         # React TypeScript application
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB running on localhost:27017
- Facebook App ID and Secret (for OAuth)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tunevote
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
ADMIN_EMAIL=konstantin.v.milchev@gmail.com
CLIENT_URL=http://localhost:3000
LASTFM_API_KEY=your-lastfm-api-key  # Optional: for band search
```

### 3. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs to: `http://localhost:5000/auth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

### 4. Database Setup

Make sure MongoDB is running:

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (Linux)
sudo systemctl start mongod
```

## Running the Application

### Development Mode

**Option 1: Run both servers separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**Option 2: Use VS Code Tasks**
- Open project in VS Code
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Backend"
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Frontend"

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Debugging Instructions

### VS Code Debugging Setup

The project includes VS Code debug configurations for full-stack debugging.

#### Debug Backend Only
1. Set breakpoints in backend code
2. Press `F5` or go to Debug panel
3. Select "Debug Backend" configuration
4. Start debugging

#### Debug Frontend Only
1. Start frontend with `npm start` in frontend folder
2. Set breakpoints in React components
3. Select "Debug Frontend" configuration
4. Chrome will open with debugging enabled

#### Debug Full Stack
1. Select "Debug Full Stack" compound configuration
2. Both backend and frontend will start in debug mode
3. Set breakpoints in both backend and frontend code

### Backend Debugging

**API Testing with curl:**

```bash
# Test server health
curl http://localhost:5000

# Test Facebook login (redirects to Facebook)
curl -L http://localhost:5000/auth/facebook

# Test authenticated endpoints (requires Bearer token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/auth/me
```

**Common Backend Issues:**

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Facebook Auth Not Working**
   - Verify App ID/Secret in `.env`
   - Check redirect URI in Facebook app settings

3. **JWT Token Issues**
   - Check JWT_SECRET is set in `.env`
   - Verify token format in Authorization header

### Frontend Debugging

**Browser Developer Tools:**
1. Open Chrome DevTools (F12)
2. Network tab: Monitor API calls
3. Console tab: View React errors and logs
4. Application tab: Check localStorage for auth token

**React Component Issues:**
1. Use React Developer Tools extension
2. Check component state and props
3. Monitor context values (AuthContext)

**Common Frontend Issues:**

1. **CORS Errors**
   - Backend includes CORS middleware
   - Check backend is running on port 5000

2. **Authentication Loop**
   - Clear localStorage and cookies
   - Check token expiration
   - Verify API endpoints are working

3. **Routing Issues**
   - Check React Router setup
   - Verify PrivateRoute component logic

### Database Debugging

**MongoDB Inspection:**

```bash
# Connect to MongoDB shell
mongosh tunevote

# View collections
show collections

# Check users
db.users.find().pretty()

# Check groups
db.groups.find().pretty()

# Check votes
db.votes.find().pretty()
```

### API Endpoint Testing

**Authentication:**
- `GET /auth/facebook` - Start Facebook OAuth
- `GET /auth/facebook/callback` - OAuth callback
- `POST /auth/select-group` - User group selection
- `GET /auth/me` - Get current user info

**Groups (Admin only):**
- `GET /groups` - List all groups
- `POST /groups` - Create group
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group

**Bands:**
- `GET /bands` - List all bands
- `GET /bands/search?q=query` - Search database
- `GET /bands/search-external?q=query` - Search external APIs
- `POST /bands` - Add band

**Votes:**
- `GET /votes` - List votes for user's group
- `POST /votes` - Create new vote (Admin only)
- `POST /votes/:id/submit` - Submit vote selections

### Production Deployment Notes

1. **Environment Variables:**
   - Set production MongoDB URI
   - Use strong JWT secret
   - Configure production Facebook app settings

2. **Security:**
   - Enable HTTPS
   - Update CORS origins
   - Set secure cookie options

3. **Performance:**
   - Build React app: `npm run build`
   - Use PM2 for Node.js process management
   - Configure MongoDB indexes

## Troubleshooting

### First Time Setup Issues

1. **Admin not recognized:**
   - Ensure `.env` has correct ADMIN_EMAIL
   - Login with Facebook using admin email first

2. **No groups available:**
   - Admin needs to create groups before other users can join
   - Login as admin first and create at least one group

3. **Facebook login redirects to wrong URL:**
   - Check CLIENT_URL in backend `.env`
   - Verify Facebook app redirect URI settings

### Runtime Issues

1. **Vote creation fails:**
   - Needs at least 3 bands in database
   - Only admin can create votes
   - Check group has members

2. **Band search not working:**
   - External search uses LastFM API (optional)
   - Manual band addition always available
   - Check network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the debugging guide
5. Submit a pull request

## License

MIT License# tune-vote
