#!/bin/bash

DOMAIN="hr-orbit.ai-liaise.com"
EXPECTED_IP="34.54.101.102"
LOAD_BALANCER_IP="34.54.101.102"
SERVER_IP="34.80.84.47"

echo "=========================================="
echo "DNS Resolution Check for: $DOMAIN"
echo "Expected Load Balancer IP: $EXPECTED_IP"
echo "=========================================="
echo ""

# Method 1: Using host command with Google DNS
echo "1. Checking DNS with Google DNS (8.8.8.8):"
RESULT=$(host $DOMAIN 8.8.8.8 2>&1)
if echo "$RESULT" | grep -q "$EXPECTED_IP"; then
    echo "   ✅ DNS is correctly pointing to Load Balancer: $EXPECTED_IP"
    echo "$RESULT" | grep "has address"
elif echo "$RESULT" | grep -q "not found\|NXDOMAIN"; then
    echo "   ❌ DNS record does not exist yet (NXDOMAIN)"
    echo "   → Action needed: Create DNS A record for $DOMAIN → $EXPECTED_IP"
else
    FOUND_IP=$(echo "$RESULT" | grep "has address" | awk '{print $4}' | head -1)
    if [ ! -z "$FOUND_IP" ]; then
        echo "   ⚠️  DNS is pointing to: $FOUND_IP"
        if [ "$FOUND_IP" = "$EXPECTED_IP" ]; then
            echo "   ✅ This matches the expected Load Balancer IP!"
        else
            echo "   ⚠️  Warning: This doesn't match expected Load Balancer IP ($EXPECTED_IP)"
        fi
    else
        echo "   ❌ Could not resolve domain"
        echo "$RESULT"
    fi
fi

echo ""

# Method 2: Using getent (system resolver)
echo "2. Checking with system DNS resolver:"
if RESOLVED=$(getent hosts $DOMAIN 2>/dev/null); then
    RESOLVED_IP=$(echo $RESOLVED | awk '{print $1}')
    echo "   ✅ Resolved to: $RESOLVED_IP"
    if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
        echo "   ✅ Matches Load Balancer IP!"
    else
        echo "   ⚠️  Does not match expected Load Balancer IP ($EXPECTED_IP)"
    fi
else
    echo "   ❌ Could not resolve domain (DNS record may not exist)"
fi

echo ""

# Method 3: Test HTTP/HTTPS connectivity
echo "3. Testing HTTP connectivity:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$DOMAIN/health 2>&1)
if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ HTTP connection successful (Status: $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Cannot connect (DNS resolution failed or timeout)"
else
    echo "   ⚠️  HTTP Status: $HTTP_CODE"
fi

echo ""

echo "4. Testing HTTPS connectivity:"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -k https://$DOMAIN/health 2>&1)
if [ "$HTTPS_CODE" = "200" ]; then
    echo "   ✅ HTTPS connection successful (Status: $HTTPS_CODE)"
    RESPONSE=$(curl -s -k https://$DOMAIN/health --connect-timeout 5 2>&1)
    echo "   Response: $RESPONSE"
elif [ "$HTTPS_CODE" = "000" ]; then
    echo "   ❌ Cannot connect (DNS resolution failed or timeout)"
else
    echo "   ⚠️  HTTPS Status: $HTTPS_CODE"
fi

echo ""

# Method 4: Check what IP curl is connecting to
echo "5. Testing with verbose connection info:"
VERBOSE=$(timeout 5 curl -v -k https://$DOMAIN/health 2>&1 | grep -i "trying\|connected\|resolve" | head -3)
if [ ! -z "$VERBOSE" ]; then
    echo "$VERBOSE"
    if echo "$VERBOSE" | grep -q "$EXPECTED_IP"; then
        echo "   ✅ Connection going to Load Balancer IP: $EXPECTED_IP"
    fi
else
    echo "   ❌ Could not establish connection (DNS not resolved)"
fi

echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="

# Final check
FINAL_CHECK=$(host $DOMAIN 8.8.8.8 2>&1 | grep "has address" | awk '{print $4}' | head -1)
if [ ! -z "$FINAL_CHECK" ] && [ "$FINAL_CHECK" = "$EXPECTED_IP" ]; then
    echo "✅ DNS is correctly configured!"
    echo "   Domain: $DOMAIN → $EXPECTED_IP (Load Balancer)"
    echo "   Your setup should be working correctly."
elif [ ! -z "$FINAL_CHECK" ]; then
    echo "⚠️  DNS is configured but pointing to different IP:"
    echo "   Current: $DOMAIN → $FINAL_CHECK"
    echo "   Expected: $DOMAIN → $EXPECTED_IP"
else
    echo "❌ DNS is NOT configured yet."
    echo "   Action needed: Create A record: $DOMAIN → $EXPECTED_IP"
    echo "   Where to configure: Your DNS provider (Google Cloud DNS, Route53, etc.)"
fi

echo ""
echo "Expected DNS Setup:"
echo "   Type: A"
echo "   Name: hr-orbit (or @ or root)"
echo "   Value: 34.54.101.102"
echo "   TTL: 300 or auto"

