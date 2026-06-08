#!/bin/sh
# Ensure required env vars exist before Node starts (Docker / manual compose up).

NODE_ENV_FILE="/app/.env"

set_env_var() {
  key="$1"
  value="$2"
  if [ ! -f "$NODE_ENV_FILE" ]; then
    touch "$NODE_ENV_FILE"
  fi
  if grep -q "^${key}=" "$NODE_ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$NODE_ENV_FILE"
  else
    echo "${key}=${value}" >> "$NODE_ENV_FILE"
  fi
  export "$key=$value"
}

# JWT — required since phase 2
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
  :
elif [ -f "$NODE_ENV_FILE" ]; then
  SAVED_JWT=$(grep '^JWT_SECRET=' "$NODE_ENV_FILE" 2>/dev/null | cut -d= -f2-)
  if [ -n "$SAVED_JWT" ] && [ ${#SAVED_JWT} -ge 32 ]; then
    export JWT_SECRET="$SAVED_JWT"
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
