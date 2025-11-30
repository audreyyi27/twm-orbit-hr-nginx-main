#!/bin/bash

# Orbit HR System - Start Services Script
# This script starts both backend and frontend services

echo ""
echo "======================================"
echo "  Starting Orbit HR System Services"
echo "======================================"
echo ""

# Check if services are already running
echo "Checking for existing services..."
BACKEND_PID=$(pgrep -f "uvicorn.*8000")
FRONTEND_PID=$(pgrep -f "next.*3000")

if [ ! -z "$BACKEND_PID" ]; then
    echo "⚠️  Backend is already running (PID: $BACKEND_PID)"
    echo "   Run './stop-services.sh' first if you want to restart"
else
    echo "Starting backend on port 8000..."
    cd /home/kentd/projects/orbit-hr-system-backend
    source .venv/bin/activate
    # Enable concurrent sessions per user if desired
    export ALLOW_MULTI_SESSIONS=${ALLOW_MULTI_SESSIONS:-true}
    nohup env ALLOW_MULTI_SESSIONS="$ALLOW_MULTI_SESSIONS" app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/orbit-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    sleep 3
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "⚠️  Frontend is already running (PID: $FRONTEND_PID)"
    echo "   Run './stop-services.sh' first if you want to restart"
else
    echo "Starting frontend on port 3000..."
    cd /home/kentd/projects/orbit-hr-system-frontend
    nohup sh -c 'PORT=3000 npm run start' > /tmp/orbit-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    sleep 5
fi

echo ""
echo "Verifying services..."
sleep 2

# Check backend
if curl -s http://127.0.0.1:8000/ > /dev/null 2>&1; then
    echo "✅ Backend is running and responding"
else
    echo "❌ Backend is not responding"
fi

# Check frontend
if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend is running and responding"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "======================================"
echo "  Services Status"
echo "======================================"
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://127.0.0.1:3000"
echo "Public:   http://34.80.84.47/"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/orbit-backend.log"
echo "  Frontend: tail -f /tmp/orbit-frontend.log"
echo ""
echo "To stop services: ./stop-services.sh"
echo "======================================"
echo ""




