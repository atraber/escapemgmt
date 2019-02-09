#!/bin/bash
set -o pipefail

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
source $SCRIPT_DIR/../venv/bin/activate
cd $SCRIPT_DIR/../app && mypy ./app --ignore-missing-imports
