#!/bin/sh
# Container entrypoint: env setup, optional frontend rebuild, migrate, start app.
set -e

cd /app
chmod +x bin/ensure-runtime-env.sh 2>/dev/null || true
. ./bin/ensure-runtime-env.sh

# Backend dependencies (image may already include node_modules)
if [ ! -d node_modules ] || [ ! -f node_modules/.install-stamp ]; then
  echo "[docker-start] Installing backend dependencies..."
  npm install
  touch node_modules/.install-stamp
fi

# Frontend build when source is mounted (dev/deploy with volumes)
if [ -f /frontend/package.json ]; then
  cd /frontend
  if [ ! -d node_modules ] || [ ! -f node_modules/.install-stamp ]; then
    echo "[docker-start] Installing frontend dependencies..."
    npm install
    touch node_modules/.install-stamp
  fi

  NEED_BUILD=0
  if [ ! -f /app/public/index.html ]; then
    NEED_BUILD=1
  elif [ "$FORCE_FRONTEND_BUILD" = "1" ]; then
    NEED_BUILD=1
  elif find /frontend/src -newer /app/public/index.html -print -quit 2>/dev/null | grep -q .; then
    NEED_BUILD=1
  fi

  if [ "$NEED_BUILD" = "1" ]; then
    echo "[docker-start] Building frontend..."
    VITE_BUILD_OUT_DIR=/app/public npm run build
  else
    echo "[docker-start] Frontend build up to date, skipping."
  fi
  cd /app
fi

echo "[docker-start] Running database migrations..."
npx prisma migrate deploy

echo "[docker-start] Starting application..."
exec npm run prod
