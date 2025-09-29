#!/bin/bash

echo "🎵 Starting Tune Vote Production Environment"
echo "============================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Pull MongoDB image separately to handle registry issues
echo "📦 Pulling MongoDB image..."
docker pull mongo:5.0 || {
    echo "⚠️  Failed to pull MongoDB from registry. Trying alternative..."
    # Try to use local image if available
    if docker images mongo:5.0 --format "table {{.Repository}}\t{{.Tag}}" | grep -q "5.0"; then
        echo "✅ Using local MongoDB image"
    else
        echo "❌ MongoDB image not available. Please check your Docker registry configuration."
        echo "💡 You can try: docker pull mongo:5.0 manually"
        exit 1
    fi
}

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1

# Build and start production environment
echo "🔧 Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test connectivity
echo "🧪 Testing service connectivity..."

# Test MongoDB
if docker-compose -f docker-compose.prod.yml exec -T mongodb mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB health check failed"
fi

# Test Backend
sleep 5
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is running"
else
    echo "⚠️  Backend API health check failed"
fi

# Test Frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend health check failed"
fi

echo ""
echo "🚀 Production Environment Status:"
echo "================================="
echo "Frontend:  http://localhost"
echo "Backend:   http://localhost:5000"
echo "MongoDB:   mongodb://admin:TuneVote2024!@localhost:27017/tunevote"
echo ""
echo "📊 Container Logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop Services:"
echo "docker-compose -f docker-compose.prod.yml down"
echo ""
echo "Happy voting! 🎵🗳️"