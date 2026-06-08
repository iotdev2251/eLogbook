#!/bin/bash
# Docker often creates nodeapp/public as root — blocks git pull and causes deploy issues.
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_NAME="$(whoami)"

echo "Fixing permissions in $APP_DIR ..."

fix_owner() {
  path="$1"
  [ -e "$path" ] || return 0
  if sudo chown -R "$USER_NAME:$USER_NAME" "$path" 2>/dev/null; then
    echo "  chown $path"
  elif chown -R "$USER_NAME:$USER_NAME" "$path" 2>/dev/null; then
    echo "  chown $path"
  else
    echo "  warn: could not chown $path (may need sudo)"
  fi
}

fix_owner "$APP_DIR/nodeapp/public"
fix_owner "$APP_DIR/nodeapp/node_modules"
fix_owner "$APP_DIR/frontend/node_modules"

if [ -d "$APP_DIR/nodeapp/public" ]; then
  echo "  removing nodeapp/public (rebuilt inside Docker image)"
  rm -rf "$APP_DIR/nodeapp/public" 2>/dev/null || sudo rm -rf "$APP_DIR/nodeapp/public"
fi

echo "Done."
