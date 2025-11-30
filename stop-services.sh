#!/bin/bash

# Orbit HR System - Stop Services Script
# This script stops both backend and frontend services

echo ""
echo "======================================"
echo "  Stopping Orbit HR System Services"
echo "======================================"
echo ""

echo "1. Killing backend (uvicorn on port 8000)..."
pkill -f "uvicorn.*8000"
pkill -f "uvicorn app.main:app"
sleep 2

echo "2. Killing frontend (next on port 3000)..."
pkill -f "next.*start"
pkill -f "next-server"
sleep 2

echo "3. Force killing any remaining processes..."
pkill -9 -f "uvicorn" 2>/dev/null
pkill -9 -f "next" 2>/dev/null
sleep 2

echo ""
echo "Verifying all services are stopped..."
echo ""

# Check for remaining processes
REMAINING=$(ps aux | grep -E "(uvicorn|next)" | grep -v grep)
if [ -z "$REMAINING" ]; then
    echo "✅ All processes successfully terminated"
else
    echo "⚠️  Some processes may still be running:"
    echo "$REMAINING"
fi

# Check ports
echo ""
PORTS=$(netstat -tlnp 2>/dev/null | grep -E ":(3000|8000)")
if [ -z "$PORTS" ]; then
    echo "✅ Ports 3000 and 8000 are free"
else
    echo "⚠️  Ports still in use:"
    echo "$PORTS"
fi

echo ""
echo "======================================"
echo "  All Services Stopped"
echo "======================================"
echo ""
echo "To start services: ./start-services.sh"
echo ""




