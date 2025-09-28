@echo off
echo.
echo 🎵 Tune Vote - Simple Production Start
echo =====================================

REM Check if MongoDB is installed locally
where mongod >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB not found locally
    echo 💡 Installing via Docker alternative...
    goto DOCKER_FALLBACK
) else (
    echo ✅ MongoDB found locally
    goto LOCAL_MONGO
)

:LOCAL_MONGO
echo 🍃 Starting MongoDB locally...
start "MongoDB" cmd /k "mongod --dbpath ./data"
timeout /t 3 /nobreak >nul
goto START_BACKEND

:DOCKER_FALLBACK
echo 🐳 Using Docker for database only...
docker run -d --name tune-vote-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=TuneVote2024! mongo:5.0 2>nul
if errorlevel 1 (
    echo ⚠️  Docker also failed. Let's use SQLite instead.
    goto SQLITE_FALLBACK
)
timeout /t 10 /nobreak >nul

:START_BACKEND
echo 🚀 Starting Backend Server...
cd backend
start "Backend API" cmd /k "npm start"
cd ..
timeout /t 5 /nobreak >nul

echo 🎨 Building and starting Frontend...
cd frontend
call npm run build
if not exist build (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

REM Simple HTTP server for production
echo ✅ Starting Frontend Server...
start "Frontend" cmd /k "npx serve -s build -l 3000"
cd ..

echo.
echo 🚀 Tune Vote is Running!
echo =======================
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo Database:  MongoDB on localhost:27017
echo.
echo Press any key to view status...
pause

REM Show running processes
echo 📊 Running Services:
netstat -an | findstr ":3000\|:5000\|:27017"

echo.
echo Happy voting! 🎵🗳️
pause

:SQLITE_FALLBACK
echo 💡 Setting up SQLite fallback...
REM This would require backend code changes for SQLite
echo ⚠️  This requires backend modification for SQLite support
pause
exit /b 1