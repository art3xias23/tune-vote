@echo off
echo.
echo 🎵 Starting Tune Vote Production Environment
echo ============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Pull MongoDB image
echo 📦 Pulling MongoDB image...
docker pull mongo:5.0
if errorlevel 1 (
    echo ⚠️  Warning: Failed to pull MongoDB from registry
    echo 💡 Continuing with local image if available...
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.prod.yml down >nul 2>&1

REM Build and start
echo 🔧 Building and starting production containers...
docker-compose -f docker-compose.prod.yml up --build -d

REM Wait for services
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Show status
echo 🔍 Service Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo 🚀 Production Environment Ready!
echo =================================
echo Frontend:  http://localhost
echo Backend:   http://localhost:5000
echo MongoDB:   mongodb://admin:TuneVote2024!@localhost:27017/tunevote
echo.
echo 📊 View Logs: docker-compose -f docker-compose.prod.yml logs -f
echo 🛑 Stop: docker-compose -f docker-compose.prod.yml down
echo.
echo Happy voting! 🎵🗳️
echo.
pause