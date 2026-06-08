#!/bin/sh
set -e

# eclipse-mosquitto runs as UID 1883
MOSQUITTO_UID=1883
MOSQUITTO_GID=1883

mkdir -p /mosquitto/data /mosquitto/log

chown -R "$MOSQUITTO_UID:$MOSQUITTO_GID" /mosquitto/data /mosquitto/log 2>/dev/null \
  || chmod -R 777 /mosquitto/data /mosquitto/log

# Remove stale passwd if present (password_file removed from mosquitto.conf)
rm -f /mosquitto/config/passwd

exec /docker-entrypoint.sh /usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf
