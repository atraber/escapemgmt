#!/usr/bin/env bash

# Let the DB start
echo "Sleeping for 5s to wait for db to come up"
sleep 5;
# Run migrations
echo "Perform migrations"
export FLASK_CONFIG=production
export FLASK_APP=app.migrate:migrate
cd /app
flask db upgrade -d ./app/migrations
