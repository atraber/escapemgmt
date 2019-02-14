#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import pulsar
import os
import pytest
import tempfile

from app import Create, InitDB


class FakePulsarClient:
    def create_producer(topic: str):
        return None

    def subscribe(topic: str, subscriber_id: str):
        return None


@pytest.fixture
def client(mocker):
    # Do not use Pulsar, we use our fake instead.
    mocker.patch('pulsar.Client', return_value=FakePulsarClient)

    # Do not export promtheus metrics as this does not work when repeated tests
    # are performed.
    #mocker.patch('app.app.PrometheusMetrics')

    # Temporary Sqlite Database
    db_fd, db_file = tempfile.mkstemp()
    os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{}'.format(db_file)

    # Initialize DB and create Flask application.
    InitDB('development')
    application = Create('development')
    application.config['TESTING'] = True

    client = application.test_client()

    yield client

    os.close(db_fd)
    os.unlink(db_file)


def testDevices(client):
    devices = client.get('/devices')
    assert devices.status_code == 200
    assert devices.get_json() == []
