#!/usr/bin/env bash

# Let the DB start
echo "Sleeping for 5s to wait for db to come up"
sleep 5;
# Run migrations
echo "Perform migrations"
cd /app
alembic -c ./app/migrations/alembic.ini upgrade head
