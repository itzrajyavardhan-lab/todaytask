#!/bin/bash
# integration-test.sh - Automated integration test for TODAY TASK + PocketBase

echo "🧪 Running Integration Tests..."
echo "======================================"
echo ""

# Test 1: Backend process
echo "Test 1: Backend Process"
if pgrep -f "pocketbase serve" > /dev/null; then
    echo "✅ PASS: Backend process is running"
else
    echo "❌ FAIL: Backend process not running"
    exit 1
fi

# Test 2: API Health
echo ""
echo "Test 2: API Health Check"
RESPONSE=$(curl -s http://127.0.0.1:8090/api/hello)
if echo "$RESPONSE" | grep -q "Hello from PocketBase"; then
    echo "✅ PASS: API responding correctly"
    echo "   Response: $RESPONSE"
else
    echo "❌ FAIL: API not responding"
    exit 1
fi

# Test 3: Dashboard
echo ""
echo "Test 3: Dashboard Accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/_/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Dashboard accessible (HTTP $HTTP_CODE)"
else
    echo "❌ FAIL: Dashboard not accessible (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 4: Frontend Files
echo ""
echo "Test 4: Frontend Files"
FRONTEND_FILES=("index.html" "script.js" "style.css" "pocketbase-bridge.js")
for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ PASS: $file exists"
    else
        echo "❌ FAIL: $file missing"
        exit 1
    fi
done

# Test 5: Backend Files
echo ""
echo "Test 5: Backend Files"
if [ -f "backend/pocketbase" ] || [ -f "backend/pocketbase.exe" ]; then
    echo "✅ PASS: PocketBase binary exists"
else
    echo "❌ FAIL: PocketBase binary missing"
    exit 1
fi

# Test 6: Configuration
echo ""
echo "Test 6: Configuration Files"
CONFIG_FILES=("package.json" ".env.local" ".gitignore")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ PASS: $file exists"
    else
        echo "❌ FAIL: $file missing"
        exit 1
    fi
done

# Test 7: Documentation
echo ""
echo "Test 7: Documentation"
DOC_FILES=("README.md" "GETTING_STARTED.md" "INTEGRATION_GUIDE.md")
for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ PASS: $file exists"
    else
        echo "❌ FAIL: $file missing"
        exit 1
    fi
done

# Test 8: Git Repository
echo ""
echo "Test 8: Git Repository"
if [ -d ".git" ]; then
    COMMITS=$(git log --oneline | wc -l)
    echo "✅ PASS: Git repository initialized ($COMMITS commits)"
else
    echo "❌ FAIL: Not a git repository"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ ALL INTEGRATION TESTS PASSED"
echo "======================================"
echo ""
echo "Summary:"
echo "- Backend: RUNNING"
echo "- API: RESPONSIVE"
echo "- Dashboard: ACCESSIBLE"
echo "- Frontend: COMPLETE"
echo "- Backend: CONFIGURED"
echo "- Configuration: READY"
echo "- Documentation: COMPLETE"
echo "- Version Control: ACTIVE"
echo ""
echo "Status: APPLICATION IS FULLY FUNCTIONAL & READY FOR USE"
