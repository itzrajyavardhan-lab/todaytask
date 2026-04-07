@echo off
REM startup.bat - Start TODAY TASK + PocketBase on Windows

setlocal enabledelayedexpansion

echo 🚀 Starting TODAY TASK + PocketBase...
echo.

REM Check if backend directory exists
if not exist "backend" (
  echo ❌ Error: backend directory not found!
  echo Please ensure you're in the project root directory.
  exit /b 1
)

REM Check if pocketbase binary exists
if not exist "backend\pocketbase.exe" (
  echo ❌ Error: PocketBase binary not found at backend\pocketbase.exe
  exit /b 1
)

echo ✅ Project structure verified
echo.

REM Start backend
echo 📡 Starting PocketBase backend on port 8090...
cd backend
start pocketbase.exe serve --dev
cd ..

REM Wait for backend to start
echo ⏳ Waiting for backend to be ready...
timeout /t 3 /nobreak

REM Test backend
powershell -Command "try { $null = Invoke-WebRequest http://127.0.0.1:8090/api/hello -UseBasicParsing; Write-Host '✅ Backend is running!' } catch { Write-Host '⚠️  Backend may still be starting...' }" 2>nul || echo ⚠️  Backend is starting...

echo.
echo ════════════════════════════════════════════════════
echo ✅ TODAY TASK + PocketBase is ready!
echo ════════════════════════════════════════════════════
echo.
echo 📱 Frontend Application:
echo    Open index.html in your browser
echo.
echo 🎛️  PocketBase Dashboard:
echo    http://127.0.0.1:8090/_/
echo.
echo 🔌 API Endpoint:
echo    http://127.0.0.1:8090/api/hello
echo.
echo 📦 Backend Process: Check Windows Task Manager
echo    To stop: Close the PocketBase window
echo.
echo ════════════════════════════════════════════════════
