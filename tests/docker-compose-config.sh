#!/bin/bash
set -o pipefail

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
cd $SCRIPT_DIR/..
docker-compose config
