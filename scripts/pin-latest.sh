#!/usr/bin/env bash
# Script to update all package.json "latest" pins to resolved versions using npm-check-updates
# Usage: run from repo root. This will update package.json files and modify package-lock.json.

set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node.js/npm to proceed."
  exit 1
fi

# Install npm-check-updates if not present
if ! command -v npx npm-check-updates >/dev/null 2>&1; then
  echo "Using npx to run npm-check-updates"
fi

# Update all deps that are set to "latest" to their latest semver versions
# This uses npm-check-updates to update package.json files in the monorepo
npx npm-check-updates '/.*/' -u --packageFile package.json

# For workspaces, update subpackage package.json files
for pkg in $(git ls-files -- "packages/*/package.json" "apps/*/package.json" "*/package.json" 2>/dev/null | tr '\n' ' '); do
  npx npm-check-updates -u --packageFile "$pkg" || true
done

# Install to regenerate lockfile
npm install

echo "Updated package files and lockfile. Review changes and run tests before merging."
