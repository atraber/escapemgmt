#!/bin/bash
source ./venv/bin/activate
export QUART_CONFIG=development
export QUART_APP=app.initdb:initdb
cd app && python3 ./app/initdb.py
