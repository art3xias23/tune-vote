# 🐳 Tune Vote - Docker Setup Guide

Complete Docker setup for the Tune Vote application with MongoDB, Node.js backend, and React frontend.

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** (to clone the repository)
- At least **4GB RAM** available for containers

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
cd /path/to/tune-vote
```

### 2. Start the Application
```bash
# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 3. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

## 🛠️ Detailed Setup

### Environment Configuration

Create a `.env` file in the root directory for custom configuration:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_DB_NAME=tunevote

# Backend Configuration
NODE_ENV=production
PORT=5000

# Frontend Configuration (already in frontend/.env)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_LASTFM_API_KEY=431714311bc03d4fe95fed357895679f
REACT_APP_LASTFM_SHARED_SECRET=2ef1e6b4c307be121aceaac6bf7668a9
```

### Build and Start Services

```bash
# Build all images and start services
docker-compose up --build -d

# Start specific services
docker-compose up mongodb backend -d

# View logs
docker-compose logs -f
docker-compose logs -f backend  # Specific service logs
```

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (React)       │    │   (Node.js)     │    │   (Database)    │
│   Port: 80      │    │   Port: 5000    │    │   Port: 27017   │
│   Nginx         │────┤   Express       │────┤   Mongo 7.0     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Common Commands

### Container Management
```bash
# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Restart specific service
docker-compose restart backend

# Scale services (if needed)
docker-compose up --scale backend=2
```

### Development Commands
```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Run commands in containers
docker-compose exec backend npm install
docker-compose exec frontend npm install

# Access container shell
docker-compose exec backend sh
docker-compose exec mongodb mongosh
```

### Logs and Monitoring
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# View last 50 lines
docker-compose logs --tail=50 backend
```

## 🔍 Health Checks

Each service includes health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:5000/api/health  # Backend
curl http://localhost/                 # Frontend
```

## 📁 Directory Structure
```
tune-vote/
├── backend/
│   ├── Dockerfile          # Backend container config
│   ├── .dockerignore      # Files to exclude from build
│   └── package.json       # Node.js dependencies
├── frontend/
│   ├── Dockerfile          # Frontend container config
│   ├── .dockerignore      # Files to exclude from build
│   └── package.json       # React dependencies
├── docker-compose.yml      # Multi-service orchestration
└── DOCKER_SETUP.md        # This file
```

## 🐛 Troubleshooting

### Port Conflicts
```bash
# If port 80 is in use
docker-compose down
# Edit docker-compose.yml: change "80:80" to "3000:80"
docker-compose up -d
# Access at http://localhost:3000
```

### Database Connection Issues
```bash
# Check MongoDB status
docker-compose logs mongodb

# Recreate MongoDB with fresh data
docker-compose down
docker volume rm tune-vote_mongodb_data
docker-compose up -d
```

### Container Build Issues
```bash
# Clean build (removes cache)
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down
docker system prune -f
docker-compose up --build -d
```

### Memory Issues
```bash
# Check container resource usage
docker stats

# Limit container memory (add to docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## 🔄 Updates and Maintenance

### Update Application Code
```bash
# After code changes
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Backup
```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup ./backup

# Restore MongoDB data
docker cp ./backup $(docker-compose ps -q mongodb):/tmp/backup
docker-compose exec mongodb mongorestore /tmp/backup
```

### Clean Up
```bash
# Remove unused containers, networks, images
docker system prune -f

# Remove everything including volumes (⚠️ DESTRUCTIVE)
docker-compose down -v
docker system prune -af
```

## 🌐 Production Considerations

1. **Environment Variables**: Use proper secrets management
2. **Reverse Proxy**: Consider nginx proxy for SSL/domains
3. **Monitoring**: Add logging and monitoring services
4. **Backups**: Implement automated database backups
5. **Security**: Update base images regularly

## 🆘 Getting Help

- Check container logs: `docker-compose logs [service-name]`
- Verify service health: `docker-compose ps`
- Restart problematic service: `docker-compose restart [service-name]`
- Complete reset: `docker-compose down -v && docker-compose up --build -d`

---

**Happy Voting! 🎵🗳️**