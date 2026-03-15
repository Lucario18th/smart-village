#!/bin/bash

# Smart Village E2E Test Wrapper
# Simple bash wrapper around the Node.js e2e test script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/e2e-test.js"

if [ ! -f "$NODE_SCRIPT" ]; then
  echo "❌ Error: e2e-test.js not found at $NODE_SCRIPT"
  exit 1
fi

echo "🚀 Starting Smart Village E2E Tests..."
node "$NODE_SCRIPT"
