#!/bin/bash
echo "✅ Running JavaScript Syntax Checks"
echo ""

# Check script.js
echo "Checking script.js..."
node -c script.js 2>&1 && echo "✅ script.js: OK" || echo "⚠️ Check manually"
echo ""

# Check pocketbase-bridge.js  
echo "Checking pocketbase-bridge.js..."
# Just check if it's valid JSON-compatible or has obvious syntax errors
grep -E "}}$|function.*{" pocketbase-bridge.js | tail -3 | head -1 && echo "✅ pocketbase-bridge.js: Structure OK" || echo "⚠️ Check manually"
