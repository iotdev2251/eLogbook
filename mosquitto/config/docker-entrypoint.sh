#!/bin/sh
set -e

PASSWD_FILE="/mosquitto/config/passwd"
MQTT_USER="${MQTT_USER:-temptrack}"
MQTT_PASSWORD="${MQTT_PASSWORD:-changeme_mqtt_please_rotate}"

# mosquitto_passwd -c fails when passwd already exists (container restart)
if [ -f "$PASSWD_FILE" ] && [ -s "$PASSWD_FILE" ]; then
  mosquitto_passwd -b "$PASSWD_FILE" "$MQTT_USER" "$MQTT_PASSWORD"
else
  rm -f "$PASSWD_FILE"
  mosquitto_passwd -b -c "$PASSWD_FILE" "$MQTT_USER" "$MQTT_PASSWORD"
fi

chmod 600 "$PASSWD_FILE" 2>/dev/null || true

exec /docker-entrypoint.sh mosquitto -c /mosquitto/config/mosquitto.conf
