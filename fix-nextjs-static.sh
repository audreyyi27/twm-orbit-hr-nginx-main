#!/bin/bash

echo "=========================================="
echo "Diagnosing Next.js Static File Issue"
echo "=========================================="
echo ""

echo "1. Checking Next.js server response:"
echo "   Direct connection to Next.js (port 3000):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://127.0.0.1:3000/_next/static/chunks/02dc3bcd4c3230e6.js 2>&1

echo ""
echo "2. Testing with different Host headers:"
echo "   With IP address as Host:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" -H "Host: 34.80.84.47" http://127.0.0.1:3000/_next/static/chunks/02dc3bcd4c3230e6.js 2>&1

echo "   With domain name as Host:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" -H "Host: hr-orbit.ai-liaise.com" http://127.0.0.1:3000/_next/static/chunks/02dc3bcd4c3230e6.js 2>&1

echo ""
echo "3. Checking if Next.js build exists:"
if [ -d "/home/kentd/projects/orbit-hr-system-frontend/.next" ]; then
    echo "   ✅ .next directory exists"
    if [ -d "/home/kentd/projects/orbit-hr-system-frontend/.next/static" ]; then
        echo "   ✅ .next/static directory exists"
        echo "   Checking for chunk files:"
        ls -la /home/kentd/projects/orbit-hr-system-frontend/.next/static/chunks/*.js 2>/dev/null | head -3 | awk '{print "     " $9}'
    else
        echo "   ❌ .next/static directory does NOT exist"
        echo "   → Next.js might not be built. Run: cd /home/kentd/projects/orbit-hr-system-frontend && npm run build"
    fi
else
    echo "   ❌ .next directory does NOT exist"
    echo "   → Next.js needs to be built. Run: cd /home/kentd/projects/orbit-hr-system-frontend && npm run build"
fi

echo ""
echo "4. Checking Next.js process:"
ps aux | grep -i "next\|node" | grep -v grep | head -2 | awk '{print "   PID:", $2, "CMD:", $11, $12, $13}'

echo ""
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""
echo "The 400 Bad Request error from Next.js typically means:"
echo "1. Host header mismatch - Next.js validates the Host header"
echo "2. Missing build files - Next.js static files don't exist"
echo "3. Production vs Development mode mismatch"
echo ""

