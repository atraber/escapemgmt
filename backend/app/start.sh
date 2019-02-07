#!/usr/bin/env bash
set -euo pipefail

/app/prestart.sh

exec /usr/bin/supervisord
