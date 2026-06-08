#!/bin/sh
set -e

PASSWD_FILE="/mosquitto/config/passwd"
MQTT_USER="${MQTT_USER:-temptrack}"
MQTT_PASSWORD="${MQTT_PASSWORD:-changeme_mqtt_please_rotate}"

mosquitto_passwd -b -c "$PASSWD_FILE" "$MQTT_USER" "$MQTT_PASSWORD"

exec /docker-entrypoint.sh mosquitto -c /mosquitto/config/mosquitto.conf
