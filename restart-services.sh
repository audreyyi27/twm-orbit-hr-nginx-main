#!/bin/bash

# Orbit HR System - Restart Services Script
# This script stops and starts both backend and frontend services

echo ""
echo "======================================"
echo "  Restarting Orbit HR System Services"
echo "======================================"
echo ""

# Stop services first
echo "Step 1: Stopping existing services..."
/home/kentd/projects/stop-services.sh

echo ""
echo "Waiting for services to fully terminate..."
sleep 3

# Start services
echo ""
echo "Step 2: Starting services..."
/home/kentd/projects/start-services.sh

echo ""
echo "✅ Restart complete!"
echo ""




