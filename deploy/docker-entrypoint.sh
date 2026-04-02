#!/bin/sh
set -e
cd /app
python -m alembic upgrade head
# Dá tempo ao FastAPI antes do Next aceitar /health (rewrite).
sleep 2
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
