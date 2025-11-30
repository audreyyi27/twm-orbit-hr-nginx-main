#!/bin/bash

# Orbit HR System - Status Check Script
# This script checks the status of all services

echo ""
echo "======================================"
echo "  Orbit HR System - Service Status"
echo "======================================"
echo ""

# Check backend process
echo "Backend Status:"
BACKEND_PID=$(pgrep -f "uvicorn.*8000")
if [ ! -z "$BACKEND_PID" ]; then
    echo "  ✅ Running (PID: $BACKEND_PID)"
    if curl -s http://127.0.0.1:8000/ > /dev/null 2>&1; then
        echo "  ✅ Responding to requests"
    else
        echo "  ⚠️  Process running but not responding"
    fi
else
    echo "  ❌ Not running"
fi

echo ""
echo "Frontend Status:"
FRONTEND_PID=$(pgrep -f "next.*3000")
if [ ! -z "$FRONTEND_PID" ]; then
    echo "  ✅ Running (PID: $FRONTEND_PID)"
    if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
        echo "  ✅ Responding to requests"
    else
        echo "  ⚠️  Process running but not responding"
    fi
else
    echo "  ❌ Not running"
fi

echo ""
echo "Port Status:"
PORT_8000=$(netstat -tlnp 2>/dev/null | grep ":8000")
PORT_3000=$(netstat -tlnp 2>/dev/null | grep ":3000")

if [ ! -z "$PORT_8000" ]; then
    echo "  ✅ Port 8000: In use (Backend)"
else
    echo "  ❌ Port 8000: Free"
fi

if [ ! -z "$PORT_3000" ]; then
    echo "  ✅ Port 3000: In use (Frontend)"
else
    echo "  ❌ Port 3000: Free"
fi

echo ""
echo "Nginx Status:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "  ✅ Nginx is running"
else
    echo "  ⚠️  Nginx status unknown (may need sudo)"
fi

echo ""
echo "Public Access:"
if curl -s http://34.80.84.47/ > /dev/null 2>&1; then
    echo "  ✅ http://34.80.84.47/ is accessible"
else
    echo "  ❌ http://34.80.84.47/ is not accessible"
fi

echo ""
echo "Database Connection:"
cd /home/kentd/projects/orbit-hr-system-backend
if source .venv/bin/activate && python -c "from app.db import get_db; import asyncio; asyncio.run(get_db().__anext__())" 2>/dev/null; then
    echo "  ✅ Database connection successful"
else
    echo "  ⚠️  Database connection could not be verified"
fi

echo ""
echo "======================================"
echo ""
echo "Quick Commands:"
echo "  Start:   ./start-services.sh"
echo "  Stop:    ./stop-services.sh"
echo "  Restart: ./restart-services.sh"
echo "  Status:  ./status-services.sh"
echo ""
echo "View Logs:"
echo "  Backend:  tail -f /tmp/orbit-backend.log"
echo "  Frontend: tail -f /tmp/orbit-frontend.log"
echo ""
echo "======================================"
echo ""




