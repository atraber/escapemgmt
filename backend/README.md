# Escape Room Management Backend
This backend is written in python3 using flask.

## Setup

Setup a new virtual environment, so that the site packages are completely excluded from our local packages

    python3 -m venv ./venv

and then activate it

    source ./venv/bin/activate

Finally install all dependencies

    pip install -r ./requirements.txt


### MariaDB - Setup

    docker pull mariadb

If you are using selinux, you may need to execute the following command as
well:

    chcon -Rt svirt_sandbox_file_t ./data/mysql

### MariaDB - Run

    docker run \
      -d \
      --name escapemgmt-mariadb \
      -p 3306:3306 \
      -e MYSQL_ROOT_PASSWORD=escape \
      -e MYSQL_DATABASE=raspimgmt \
      -e MYSQL_USER=raspimgmt \
      -e MYSQL_PASSWORD=raspberrypi \
      -v $PWD/data/mysql:/var/lib/mysql \
      mariadb

### Pulsar - Setup

    docker pull apachepulsar/pulsar

If you are using selinux, you may need to execute the following command as
well:

    chcon -Rt svirt_sandbox_file_t ./data/pulsar

### Pulsar - Run

    docker run \
      -d \
      --name escapemgmt-pulsar \
      -p 6650:6650 \
      -p 8080:8080 \
      -v $PWD/data/pulsar:/pulsar/data \
      apachepulsar/pulsar \
      bin/pulsar standalone

## First time setup: Creating tables in DB

    export FLASK_CONFIG=development
    export FLASK_APP=app.initdb:initdb
    cd app && python3 -m flask run

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
