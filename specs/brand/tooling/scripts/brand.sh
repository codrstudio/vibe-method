#!/usr/bin/env bash
# Brand Management Script - Wrapper
# Delega para brand.mjs (Node.js)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/brand.mjs" "$@"
