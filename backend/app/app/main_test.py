#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import asyncio
import os
import pytest
import pytest_asyncio.plugin
import tempfile

from app import App, Init, PerformInitDB


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
    app = App('development')
    app.config['TESTING'] = True
    asyncio.run(PerformInitDB(app))
    Init(app)

    client = app.test_client()

    yield client

    os.close(db_fd)
    os.unlink(db_file)


@pytest.mark.asyncio
async def testDevices(client):
    devices = await client.get('/devices')
    assert devices.status_code == 200
    assert await devices.get_json() == []
