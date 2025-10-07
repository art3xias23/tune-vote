# 🎵 Tune Vote

A collaborative music discovery and voting platform built for the TuneSquad community.

## Overview

Tune Vote is a React-based web application that allows a small group of music enthusiasts (Tino, Misho, and Tedak) to democratically discover and rate new bands. The app integrates with Spotify for music discovery and provides a structured voting system with rating capabilities.

## Features

### 🗳️ **Democratic Voting System**
- **3-band selection**: Any user can create a vote by selecting exactly 3 bands
- **Multi-vote capability**: Each user can vote for up to 3 bands per vote
- **Anonymous voting**: Vote results hidden until all members have voted
- **Winner determination**: Band with most votes wins automatically

### ⭐ **5-Star Rating System**
- Rate winning bands from 1-5 stars with interactive star selection
- Track personal rating history in "My Ratings" section
- Calculate average ratings across all users
- Prevent duplicate voting and rating per user

### 🎤 **Spotify Integration**
- Search and discover bands using Spotify Web API
- High-quality album artwork and artist images
- Automatic genre detection and metadata

### 🎨 **Modern UI/UX**
- **Dark/Light theme toggle** with system preference detection
- Responsive design optimized for desktop and mobile
- Interactive animations and hover effects
- Clean, intuitive navigation

### 📊 **Smart Features**
- **Previous winner exclusion**: Bands that have won cannot be selected again
- **Action-required dashboard**: Shows pending votes and ratings
- **Vote lifecycle management**: Active → Rating → Completed flow
- **Prevention of premature vote creation**: Must complete current vote cycle

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Context API** for state management

### Backend Integration
- **Node.js/Express** backend (separate repository)
- **MongoDB** for data persistence
- **Spotify Web API** for music data

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Spotify Developer Account (for API keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tune-vote/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

- **`npm start`** - Runs development server
- **`npm run build`** - Creates production build
- **`npm run build && serve -s build`** - Test production build locally

## Application Flow

1. **User Selection**: Choose your identity (Tino, Misho, or Tedak)
2. **Dashboard**: View action items (pending votes/ratings)
3. **Create Vote**: Select 3 bands for community voting
4. **Voting Phase**: Each user votes for up to 3 bands
5. **Rating Phase**: Rate the winning band (1-5 stars)
6. **Completion**: View results and start next vote cycle

## Database Schema

### Votes Collection
```javascript
{
  voteNumber: 1,                     // Auto-incremented
  status: "completed",               // active | rating | completed
  createdBy: "Tino",                // Vote creator
  selectedBands: [ObjectId, ...],    // 3 bands for voting
  votes: [{                         // Individual votes
    userId: "Misho",
    bandId: ObjectId,
    submittedAt: Date
  }],
  winner: ObjectId,                 // Winning band
  ratings: [{                       // 5-star ratings
    userId: "Tedak",
    score: 4,
    submittedAt: Date
  }],
  averageRating: 4.2
}
```

### Bands Collection
```javascript
{
  name: "Ace of Base",
  image: "https://spotify-image-url...",
  spotifyId: "4f46Dm3K...",
  genres: ["pop", "dance"],
  addedBy: "Tino"
}
```

## Deployment

### Docker Support
The application includes Docker configuration for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Deploy the `build` folder to your web server
4. Configure reverse proxy for API routing

## Contributing

This is a private project for the TuneSquad community. The codebase follows:
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Component-based architecture**
- **Clean, semantic naming conventions**

## License

Private project © 2024 PragmatinoSoft

---

**Powered by PragmatinoSoft** • Music Discovery & Voting Platform