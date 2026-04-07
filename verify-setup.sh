#!/bin/bash
# verify-setup.sh - Verify that TODAY TASK + PocketBase is properly set up

echo "🔍 TODAY TASK + PocketBase Setup Verification"
echo "============================================="
echo ""

checks_passed=0
checks_failed=0

# Check 1: Backend binary exists
echo -n "✓ Checking backend binary... "
if [ -f "backend/pocketbase" ] || [ -f "backend/pocketbase.exe" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: PocketBase binary not found"
  ((checks_failed++))
fi

# Check 2: Frontend files exist
echo -n "✓ Checking frontend files... "
if [ -f "index.html" ] && [ -f "script.js" ] && [ -f "style.css" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Frontend files missing"
  ((checks_failed++))
fi

# Check 3: Bridge adapter exists
echo -n "✓ Checking PocketBase bridge... "
if [ -f "pocketbase-bridge.js" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: pocketbase-bridge.js missing"
  ((checks_failed++))
fi

# Check 4: Startup scripts exist
echo -n "✓ Checking startup scripts... "
if [ -f "startup.sh" ] && [ -f "startup.bat" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Startup scripts missing"
  ((checks_failed++))
fi

# Check 5: Documentation exists
echo -n "✓ Checking documentation... "
if [ -f "README.md" ] && [ -f "GETTING_STARTED.md" ] && [ -f "INTEGRATION_GUIDE.md" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Documentation missing"
  ((checks_failed++))
fi

# Check 6: Git repository initialized
echo -n "✓ Checking git repository... "
if [ -d ".git" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Not a git repository"
  ((checks_failed++))
fi

# Check 7: Backend database structure
echo -n "✓ Checking backend structure... "
if [ -d "backend/pb_hooks" ] && [ -d "backend/pb_migrations" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Backend directory structure incomplete"
  ((checks_failed++))
fi

# Check 8: Configuration files
echo -n "✓ Checking configuration files... "
if [ -f "package.json" ] && [ -f ".env.local" ] && [ -f ".gitignore" ]; then
  echo "✅"
  ((checks_passed++))
else
  echo "❌ ERROR: Configuration files missing"
  ((checks_failed++))
fi

echo ""
echo "============================================="
echo "Results: $checks_passed passed, $checks_failed failed"
echo ""

if [ $checks_failed -eq 0 ]; then
  echo "✅ Setup verified! Everything is configured correctly."
  echo ""
  echo "Next steps:"
  echo "1. Run: ./startup.sh (or startup.bat on Windows)"
  echo "2. Open: index.html in your browser"
  echo "3. Your app is ready to use!"
else
  echo "❌ Setup verification failed. Please check the errors above."
fi
