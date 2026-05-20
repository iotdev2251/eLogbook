#!/bin/bash

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Starting deployment for eLogbook in $APP_DIR..."

# 1. Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo '❌ Error: docker is not installed.' >&2
  echo 'Please run: sudo apt-get update && sudo apt-get install docker.io -y'
  exit 1
fi

# 2. Setup Environment Files
echo "📝 Checking environment files..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  Root .env missing, copying from .env.default..."
    cp "$APP_DIR/.env.default" "$APP_DIR/.env"
fi

if [ ! -f "$APP_DIR/nodeapp/.env" ]; then
    echo "⚠️  Nodeapp .env missing, copying from default..."
    # Note: We use the production setting here (PostgreSQL)
    cat > "$APP_DIR/nodeapp/.env" <<EOF
DATABASE_URL="postgresql://docker:docker@postgresql-db:5432/elogbook?schema=public"
NODE_PORT=3011
PORT=3011
MQTT_HOST=mqtt-broker
MQTT_PORT=1883
EOF
fi

# 3. Stop existing containers
echo "🛑 Stopping existing services..."
docker compose -f "$APP_DIR/docker-compose.yml" down

# 4. Build and Start
echo "🏗️  Building and starting containers..."
docker compose -f "$APP_DIR/docker-compose.yml" up --build -d

# 5. Status check
echo "📊 Deployment complete! Current status:"
docker compose -f "$APP_DIR/docker-compose.yml" ps

echo "------------------------------------------------"
echo "✅ eLogbook is now running!"
echo "📍 Access GUI at: https://<your-server-ip>:3011"
echo "------------------------------------------------"
