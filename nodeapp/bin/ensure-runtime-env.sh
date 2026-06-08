#!/bin/sh
# Ensure required env vars exist before Node starts (Docker / manual compose up).

NODE_ENV_FILE="/app/.env"

# Repair .env lines where JWT_SECRET was appended to MQTT_HOST without a newline
# e.g. MQTT_HOST=mqtt-brokerJWT_SECRET=abc...  →  two separate lines
repair_env_file() {
  file="$1"
  [ -f "$file" ] || return 0

  if grep -qE '^MQTT_HOST=mqtt-broker.*[Jj][Ww][Tt][_]?[Ss][Ee][Cc][Rr][Ee][Tt]=' "$file" 2>/dev/null; then
    secret=$(grep '^MQTT_HOST=' "$file" | head -1 | sed 's/^MQTT_HOST=mqtt-broker[Jj][Ww][Tt][_]*[Ss][Ee][Cc][Rr][Ee][Tt]=//')
    sed -i 's/^MQTT_HOST=mqtt-broker.*$/MQTT_HOST=mqtt-broker/' "$file"
    if ! grep -q '^JWT_SECRET=' "$file" 2>/dev/null; then
      printf '\nJWT_SECRET=%s\n' "$secret" >> "$file"
    fi
    echo "[ensure-runtime-env] Repaired glued MQTT_HOST/JWT_SECRET in ${file}"
  fi

  # Ensure file ends with a newline
  tail -c1 "$file" | read -r _ || echo >> "$file"
}

set_env_var() {
  key="$1"
  value="$2"
  if [ ! -f "$NODE_ENV_FILE" ]; then
    touch "$NODE_ENV_FILE"
  fi
  if grep -q "^${key}=" "$NODE_ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$NODE_ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$NODE_ENV_FILE"
  fi
  export "$key=$value"
}

repair_env_file "$NODE_ENV_FILE"

# Root .env (via Docker env_file) may inject a corrupted MQTT_HOST — force correct value
export MQTT_HOST=mqtt-broker

# JWT — required since phase 2
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
  case "$JWT_SECRET" in
    *mqtt-broker*|*MQTT_HOST*) JWT_SECRET="" ;;
  esac
fi

if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
  if [ -f "$NODE_ENV_FILE" ]; then
    SAVED_JWT=$(grep '^JWT_SECRET=' "$NODE_ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2-)
    if [ -n "$SAVED_JWT" ] && [ ${#SAVED_JWT} -ge 32 ]; then
      export JWT_SECRET="$SAVED_JWT"
    fi
  fi
fi

if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  export JWT_SECRET
  set_env_var JWT_SECRET "$JWT_SECRET"
  echo "[ensure-runtime-env] Generated JWT_SECRET in ${NODE_ENV_FILE}"
fi

export MQTT_USER="${MQTT_USER:-temptrack}"
export MQTT_PASSWORD="${MQTT_PASSWORD:-changeme_mqtt_please_rotate}"
set_env_var MQTT_USER "$MQTT_USER"
set_env_var MQTT_PASSWORD "$MQTT_PASSWORD"
set_env_var MQTT_HOST "mqtt-broker"
