#!/bin/bash
# Fix root .env when MQTT_HOST and JWT_SECRET were glued on one line.

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
NODE_ENV="$APP_DIR/nodeapp/.env"

repair_file() {
  local file="$1"
  [ -f "$file" ] || return 0

  if grep -qE '^MQTT_HOST=mqtt-broker.*[Jj][Ww][Tt][_]?[Ss][Ee][Cc][Rr][Ee][Tt]=' "$file" 2>/dev/null; then
    secret=$(grep '^MQTT_HOST=' "$file" | head -1 | sed 's/^MQTT_HOST=mqtt-broker[Jj][Ww][Tt][_]*[Ss][Ee][Cc][Rr][Ee][Tt]=//')
    sed -i 's/^MQTT_HOST=mqtt-broker.*$/MQTT_HOST=mqtt-broker/' "$file"
    if ! grep -q '^JWT_SECRET=' "$file" 2>/dev/null; then
      printf '\nJWT_SECRET=%s\n' "$secret" >> "$file"
    fi
    echo "✅ Repaired: $file"
  else
    echo "✓ OK: $file"
  fi

  tail -c1 "$file" 2>/dev/null | read -r _ || echo >> "$file"
}

echo "Checking environment files in $APP_DIR..."
repair_file "$ENV_FILE"
repair_file "$NODE_ENV"
echo "Done. Restart with: docker compose up -d"
