#!/usr/bin/env bash
# GitHub Pages site: the website (docs/) at the root, the web app under /cyberstream/app/.
# Output: build/pages (uploaded by .github/workflows/pages.yml).
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${PAGES_BASE:-/cyberstream/}"
rm -rf build/pages
mkdir -p build/pages
cp -R docs/. build/pages/
npx tsc --noEmit
npx vite build --base="${BASE}app/" --outDir build/pages/app --emptyOutDir
touch build/pages/.nojekyll
echo "build/pages ready (app at ${BASE}app/)"
