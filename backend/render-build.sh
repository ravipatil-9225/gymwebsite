#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Download Chromium into the cache
npx puppeteer browsers install chrome

echo "Build complete."
