#!/bin/sh
set -e

PASSWD_FILE="/mosquitto/config/passwd"
MQTT_USER="${MQTT_USER:-temptrack}"
MQTT_PASSWORD="${MQTT_PASSWORD:-changeme_mqtt_please_rotate}"

if [ -n "$MQTT_USER" ] && [ -n "$MQTT_PASSWORD" ]; then
  mosquitto_passwd -b -c "$PASSWD_FILE" "$MQTT_USER" "$MQTT_PASSWORD"
fi

exec /docker-entrypoint.sh "$@"
