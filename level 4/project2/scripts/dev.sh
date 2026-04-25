#!/bin/bash
# Stellar DEX Mini – convenience dev script
set -e

cd "$(dirname "$0")/frontend"
echo "🚀 Starting Stellar DEX Mini dev server..."
npm run dev
