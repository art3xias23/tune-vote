const winston = require('winston');

// Create a structured logger for user actions
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport outputs pure JSON for Docker/Loki
    new winston.transports.Console({
      format: winston.format.json()
    })
  ]
});

// Also keep console.log working for backward compatibility
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Call original console.log for regular logging
  originalConsoleLog.apply(console, args);

  // Also send structured log for important messages
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('[Server]') || args[0].includes('[Spotify')) {
      logger.info(args.join(' '), { source: 'console' });
    }
  }
};

// Structured logging functions for different action types
const logUserAction = {
  // Authentication actions
  auth: {
    login: (username, ip) => {
      logger.info('User logged in', {
        action: 'auth.login',
        username,
        ip,
        category: 'authentication'
      });
    },
    logout: (username) => {
      logger.info('User logged out', {
        action: 'auth.logout',
        username,
        category: 'authentication'
      });
    },
    select: (username) => {
      logger.info('User selected', {
        action: 'auth.select',
        username,
        category: 'authentication'
      });
    }
  },


  // Vote actions
  vote: {
    create: (username, voteId, selectedBands) => {
      logger.info('Vote created', {
        action: 'vote.create',
        username,
        voteId,
        selectedBands: selectedBands.map(b => ({ id: b._id, name: b.name })),
        bandCount: selectedBands.length,
        category: 'vote'
      });
    },
    submit: (username, voteId, votedBands, voteNumber) => {
      logger.info('User voted', {
        action: 'vote.submit',
        username,
        voteId,
        voteNumber,
        votedBands: votedBands.map(b => ({ id: b.id, name: b.name })),
        voteCount: votedBands.length,
        category: 'vote'
      });
    },
    rate: (username, voteId, rating, winnerBand, voteNumber) => {
      logger.info('User rated winner', {
        action: 'vote.rate',
        username,
        voteId,
        voteNumber,
        rating,
        winnerBand: { id: winnerBand._id, name: winnerBand.name },
        category: 'vote'
      });
    },
    delete: (username, voteId, voteNumber) => {
      logger.info('Vote deleted', {
        action: 'vote.delete',
        username,
        voteId,
        voteNumber,
        category: 'vote'
      });
    },
    completed: (voteId, voteNumber, winner, isTie) => {
      logger.info('Vote completed', {
        action: 'vote.completed',
        voteId,
        voteNumber,
        winner: winner ? { id: winner._id, name: winner.name } : null,
        isTie,
        category: 'vote'
      });
    },
    tieBreaker: (voteId, originalVoteId, tiedBands) => {
      logger.info('Tie-breaker vote created', {
        action: 'vote.tieBreaker',
        voteId,
        originalVoteId,
        tiedBands: tiedBands.map(b => ({ id: b._id, name: b.name })),
        category: 'vote'
      });
    }
  },

  // Band actions
  band: {
    create: (username, bandId, bandName, source) => {
      logger.info('Band added', {
        action: 'band.create',
        username,
        bandId,
        bandName,
        source, // 'manual', 'spotify', 'search'
        category: 'band'
      });
    },
    createFromSpotify: (username, bandId, bandName, spotifyId, genres) => {
      logger.info('Band added from Spotify', {
        action: 'band.createFromSpotify',
        username,
        bandId,
        bandName,
        spotifyId,
        genres,
        source: 'spotify',
        category: 'band'
      });
    },
    update: (username, bandId, bandName, changes) => {
      logger.info('Band updated', {
        action: 'band.update',
        username,
        bandId,
        bandName,
        changes,
        category: 'band'
      });
    },
    delete: (username, bandId, bandName) => {
      logger.info('Band deleted', {
        action: 'band.delete',
        username,
        bandId,
        bandName,
        category: 'band'
      });
    },
    search: (username, query, resultCount) => {
      logger.info('Band search performed', {
        action: 'band.search',
        username,
        query,
        resultCount,
        category: 'band'
      });
    },
    searchSpotify: (username, query, resultCount, foundArtists) => {
      logger.info('Spotify API search performed', {
        action: 'band.searchSpotify',
        username,
        query,
        resultCount,
        foundArtists,
        category: 'spotify',
        source: 'spotify_api'
      });
    }
  },

  // System actions
  system: {
    error: (error, context) => {
      logger.error('System error', {
        action: 'system.error',
        error: error.message,
        stack: error.stack,
        context,
        category: 'system'
      });
    },
    startup: () => {
      logger.info('System started', {
        action: 'system.startup',
        category: 'system',
        environment: process.env.NODE_ENV
      });
    },
    shutdown: () => {
      logger.info('System shutting down', {
        action: 'system.shutdown',
        category: 'system'
      });
    }
  }
};

module.exports = { logger, logUserAction };