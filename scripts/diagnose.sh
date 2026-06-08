#!/bin/bash
# Quick health check for TempTrack Docker deployment.
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "=============================================="
echo " TempTrack diagnose — $APP_DIR"
echo "=============================================="
echo ""

echo "=== git HEAD ==="
git log -1 --oneline 2>/dev/null || echo "(not a git repo)"
echo ""

echo "=== docker compose ps ==="
docker compose ps
echo ""

echo "=== app logs (last 50) ==="
docker compose logs app --tail 50 2>/dev/null || echo "(no app logs)"
echo ""

echo "=== mqtt-broker logs (last 15) ==="
docker compose logs mqtt-broker --tail 15 2>/dev/null || true
echo ""

echo "=== postgresql-db logs (last 10) ==="
docker compose logs postgresql-db --tail 10 2>/dev/null || true
echo ""

echo "=== connectivity from host ==="
if command -v curl >/dev/null 2>&1; then
  curl -sS -o /dev/null -w "  http://127.0.0.1:3011/  → HTTP %{http_code}\n" http://127.0.0.1:3011/ 2>/dev/null \
    || echo "  http://127.0.0.1:3011/  → failed"
  curl -sk -o /dev/null -w "  https://127.0.0.1:3011/ → HTTPS %{http_code}\n" https://127.0.0.1:3011/ 2>/dev/null \
    || echo "  https://127.0.0.1:3011/ → failed (expected if USE_HTTP=1)"
else
  echo "  curl not installed — skip HTTP checks"
fi
echo ""

echo "=== listening ports (3011) ==="
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || true) | grep 3011 || echo "  nothing listening on 3011"
echo ""

echo "=== .env keys (values hidden) ==="
for key in NODE_PORT USE_HTTP JWT_SECRET MQTT_HOST POSTGRES_HOST; do
  if grep -q "^${key}=" .env 2>/dev/null; then
    echo "  ${key}=<set>"
  else
    echo "  ${key}=<missing>"
  fi
done
echo ""

echo "Access URLs:"
echo "  http://<server-ip>:3011   (default USE_HTTP=1)"
echo "  https://<server-ip>:3011  (set USE_HTTP=0 in .env)"
echo "=============================================="
