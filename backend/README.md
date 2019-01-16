# Escape Room Management Backend
This backend is written in python3 using flask.

## Setup

Setup a new virtual environment, so that the site packages are completely excluded from our local packages

    python3 -m venv ./venv

and then activate it

    source ./venv/bin/activate

Finally install all dependencies

    pip install -r ./requirements.txt

## Creating DB migrations

The following commands will automatically create a new candidate revision.
Please ensure that it matches what you expected and only then apply the
revision.

    export FLASK_CONFIG=development
    export FLASK_APP=app.migrate:migrate
    cd app && flask db revision -d ./app/migrations --autogenerate

## Performing migrations
    export FLASK_CONFIG=development
    export FLASK_APP=app.migrate:migrate
    cd app && flask db upgrade -d ./app/migrations
