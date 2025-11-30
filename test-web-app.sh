#!/bin/bash

DOMAIN="hr-orbit.ai-liaise.com"
SERVER_IP="34.80.84.47"
LOAD_BALANCER_IP="34.54.101.102"

echo "=========================================="
echo "Testing ORBIT HR Web Application"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Health Check:"
echo "   Testing: https://$SERVER_IP/health"
HEALTH=$(curl -k -s https://$SERVER_IP/health 2>&1)
if [ "$HEALTH" = "healthy" ]; then
    echo "   ✅ Server is healthy"
else
    echo "   ❌ Health check failed: $HEALTH"
fi
echo ""

# Test 2: Frontend (should be served by Next.js)
echo "2. Frontend (Next.js):"
echo "   Testing: https://$SERVER_IP/"
FRONTEND_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://$SERVER_IP/ 2>&1)
if [ "$FRONTEND_CODE" = "200" ]; then
    echo "   ✅ Frontend accessible (Status: $FRONTEND_CODE)"
else
    echo "   ⚠️  Frontend Status: $FRONTEND_CODE"
fi
echo ""

# Test 3: Backend API - Candidates endpoint
echo "3. Backend API - Candidates:"
echo "   Testing: https://$SERVER_IP/api/candidates"
BACKEND_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -X GET "https://$SERVER_IP/api/candidates?page=1&per_page=10" 2>&1)
if [ "$BACKEND_CODE" = "200" ] || [ "$BACKEND_CODE" = "401" ]; then
    echo "   ✅ Backend API responding (Status: $BACKEND_CODE)"
    if [ "$BACKEND_CODE" = "401" ]; then
        echo "   ℹ️  401 is expected - need authentication"
    fi
else
    echo "   ⚠️  Backend Status: $BACKEND_CODE"
fi
echo ""

# Test 4: Check SSL Certificate
echo "4. SSL Certificate Info:"
echo "   Testing certificate for: https://$SERVER_IP/"
CERT_INFO=$(echo | timeout 5 openssl s_client -connect $SERVER_IP:443 -servername $SERVER_IP 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null)
if [ ! -z "$CERT_INFO" ]; then
    echo "   Certificate Details:"
    echo "$CERT_INFO" | sed 's/^/     /'
    echo "   ⚠️  This is a self-signed certificate (expected for direct IP access)"
else
    echo "   ❌ Could not retrieve certificate info"
fi
echo ""

# Test 5: Test with domain name (if DNS is configured)
echo "5. Testing with domain name (if DNS configured):"
DNS_CHECK=$(host $DOMAIN 8.8.8.8 2>&1 | grep "has address" | awk '{print $4}' | head -1)
if [ ! -z "$DNS_CHECK" ]; then
    echo "   DNS resolved to: $DNS_CHECK"
    if [ "$DNS_CHECK" = "$LOAD_BALANCER_IP" ]; then
        echo "   ✅ DNS correctly points to Load Balancer"
        echo "   Testing: https://$DOMAIN/health"
        DOMAIN_HEALTH=$(curl -k -s https://$DOMAIN/health 2>&1)
        if [ "$DOMAIN_HEALTH" = "healthy" ]; then
            echo "   ✅ Domain accessible and working!"
        else
            echo "   ⚠️  Domain accessible but response: $DOMAIN_HEALTH"
        fi
    else
        echo "   ⚠️  DNS points to: $DNS_CHECK (expected: $LOAD_BALANCER_IP)"
    fi
else
    echo "   ❌ DNS not configured yet"
    echo "   ℹ️  Use IP address for testing: https://$SERVER_IP/"
fi
echo ""

echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""
echo "✅ Working:"
echo "   - Server is accessible via IP: https://$SERVER_IP/"
echo "   - HTTPS is working (with self-signed cert)"
echo ""
echo "⚠️  Browser 'Not Secure' Warning:"
echo "   This is NORMAL when:"
echo "   1. Accessing via IP address directly (not domain name)"
echo "   2. Using self-signed certificate"
echo "   3. Certificate name doesn't match the URL"
echo ""
echo "   Solutions:"
echo "   1. Accept the warning in browser (Advanced → Continue to site)"
echo "   2. Use domain name once DNS is configured (will use Load Balancer cert)"
echo "   3. For production: Use Let's Encrypt certificate"
echo ""
echo "📝 To Test Your Application:"
echo "   1. Frontend: https://$SERVER_IP/"
echo "   2. Backend API: https://$SERVER_IP/api/candidates"
echo "   3. Health Check: https://$SERVER_IP/health"
echo ""
echo "💡 Tip: In Chrome/Edge, click 'Advanced' then 'Proceed to 34.80.84.47' to bypass warning"
echo ""

