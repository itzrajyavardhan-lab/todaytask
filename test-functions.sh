#!/bin/bash

echo "🧪 TESTING TODAY TASK - All Functions"
echo "======================================"
echo ""

# Test 1: Auth API
echo "Test 1: Authentication"
echo "---"
curl -s http://127.0.0.1:8090/api/hello | jq . || echo "❌ API failed"
echo ""

# Test 2: Check if collections exist
echo "Test 2: PocketBase Collections"
echo "---"
curl -s http://127.0.0.1:8090/api/collections | jq '.items[] | .name' 2>/dev/null || echo "⚠️ Collections API access denied (needs auth)"
echo ""

# Test 3: Check localStorage simulation
echo "Test 3: Bridge Adapter"
echo "---"
if grep -q "localStorage.getItem" pocketbase-bridge.js; then
    echo "✅ Bridge adapter found"
else
    echo "❌ Bridge adapter missing"
fi
echo ""

# Test 4: Script functions check
echo "Test 4: Script Functions"
echo "---"
echo "Checking for functions:"
grep -E "^function " script.js | head -20
echo ""

echo "======================================"
echo "Analysis Complete"
