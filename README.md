# Tune Vote

A modern music voting application where band members can discover and vote on their favorite artists. Built with React, Node.js, MongoDB, and deployed using Docker containers.

## Architecture

- **Frontend**: React.js SPA with Tailwind CSS, served via Nginx
- **Backend**: Node.js API with Express and MongoDB
- **Database**: MongoDB with authentication
- **Spotify Proxy**: Dedicated Node.js service for Spotify API integration
- **Monitoring**: Grafana + Loki + Alloy stack for logging and visualization

## Deployment

### GitHub Actions Workflow

Automated deployment triggers on:
- Push to `main` branch
- Merged pull requests

Deployment steps:
1. **Update Code**: Git pull from repository
2. **Install Dependencies**: npm install and restart services
3. **Build Containers**: Docker Compose build with version tags
4. **Start Services**: Deploy containers with health checks
5. **Health Verification**: Test backend and frontend connectivity

### Required GitHub Secrets
- `HOST`: Production server hostname
- `USERNAME`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key
- `PORT`: SSH port
- `GH_TOKEN`: GitHub token

## Docker Development

### Start Services
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Service Ports
- Frontend: `3001:80`
- Backend: `5000:5000`
- MongoDB: `27017:27017`
- Grafana: `3000:3000`
- Loki: `3100:3100`

## Local Development

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Individual services
npm run frontend  # :3000
npm run backend   # :5000
npm run proxy     # :5001
```

## Debugging with Docker Compose

```bash
# Check service status
docker compose ps

# View service logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb

# Follow real-time logs
docker compose logs -f --tail=100

# Restart service
docker compose restart backend

# Container shell access
docker exec -it tune-vote-backend sh
docker exec -it tune-vote-mongodb mongosh
```

## Monitoring

- **Grafana**: Dashboard visualization at configured endpoint
- **Loki**: Centralized log aggregation
- **Alloy**: Automatic Docker container log collection

Default Grafana credentials: `tune-vote` / `tune-vote123`