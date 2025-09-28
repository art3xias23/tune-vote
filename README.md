# Tune Vote 🎵

A modern music voting application for small groups, built with React and Node.js.

## Quick Start with Docker 🐳

**Easiest way to run the application:**

```bash
# Clone the repository
git clone https://github.com/art3xias23/tune-vote.git
cd tune-vote

# Start with Docker Compose
docker-compose up

# Or for production mode
docker-compose -f docker-compose.prod.yml up
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Manual Setup (Development)

### Prerequisites
- Node.js 18+
- MongoDB (optional for development)

### Quick Start
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (port 5000)
cd backend && npm start

# Start frontend (port 3001)
cd frontend && npm start
```

The app works without MongoDB for development - it uses in-memory storage.

## Features
- **Simple User Selection**: Choose from 3 pre-defined users (Tino, Misho, Tedak)
- **Band Database**: Search and add bands
- **Group Voting**: Vote for bands, runoff system, winner ratings
- **Modern UI**: Built with Tailwind CSS and glassmorphism design
- **Docker Ready**: Full containerization support

## Docker Configurations

### Development Mode
```bash
docker-compose up
```
- Hot reloading enabled
- MongoDB optional
- Ports: Frontend 3000, Backend 5000

### Production Mode
```bash
docker-compose -f docker-compose.prod.yml up
```
- Optimized builds
- MongoDB required
- Nginx reverse proxy
- Port: 80

### Local Development (without MongoDB)
```bash
docker-compose -f docker-compose.local.yml up
```
- No MongoDB dependency
- In-memory storage
- Perfect for testing

## Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tunevote
CLIENT_URL=http://localhost:3000
```

## Project Structure
```
tune-vote/
├── backend/              # Node.js API
├── frontend/            # React app
├── docker-compose.yml   # Development
├── docker-compose.prod.yml # Production
└── docker-compose.local.yml # Local dev
```

## Troubleshooting

**Docker issues:**
- `docker system prune` to clean up
- Check ports aren't already in use
- Ensure Docker daemon is running

**Local development:**
- Backend runs on port 5000, frontend on 3001
- No database required for basic functionality
- Check console for any JavaScript errors

## License
MIT