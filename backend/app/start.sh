#!/usr/bin/env bash
set -euo pipefail

# TODO: This needs to be re-enabled.
#/app/prestart.sh

exec /usr/bin/supervisord
