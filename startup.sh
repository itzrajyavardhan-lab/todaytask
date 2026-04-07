#!/bin/bash
# startup.sh - Start the complete TODAY TASK + PocketBase system

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting TODAY TASK + PocketBase..."
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
  echo "❌ Error: backend directory not found!"
  echo "Please ensure you're in the project root directory."
  exit 1
fi

# Check if pocketbase binary exists
if [ ! -f "backend/pocketbase" ]; then
  echo "❌ Error: PocketBase binary not found at backend/pocketbase"
  exit 1
fi

echo "✅ Project structure verified"
echo ""

# Make pocketbase executable
chmod +x backend/pocketbase

# Start backend
echo "📡 Starting PocketBase backend on port 8090..."
cd backend
./pocketbase serve --dev &
BACKEND_PID=$!

cd "$PROJECT_DIR"

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test backend
if curl -s http://127.0.0.1:8090/api/hello > /dev/null 2>&1; then
  echo "✅ Backend is running!"
else
  echo "⚠️  Backend may still be starting..."
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ TODAY TASK + PocketBase is ready!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📱 Frontend Application:"
echo "   Open index.html in your browser"
echo ""
echo "🎛️  PocketBase Dashboard:"
echo "   http://127.0.0.1:8090/_/"
echo ""
echo "🔌 API Endpoint:"
echo "   http://127.0.0.1:8090/api/hello"
echo ""
echo "📦 Backend PID: $BACKEND_PID"
echo "   To stop: kill $BACKEND_PID"
echo ""
echo "════════════════════════════════════════════════════"
