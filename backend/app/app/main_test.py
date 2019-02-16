#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import asyncio
import json
import os
import pytest
import tempfile
from quart.testing import QuartClient

from app import App, Init, PerformInitDB


class FakePulsarClient:
    def create_producer(self, topic: str):
        return None

    def subscribe(self, topic: str, subscriber_id: str):
        return None


@pytest.fixture
def client(mocker, event_loop) -> QuartClient:
    # Do not use Pulsar, we use our fake instead.
    mocker.patch('pulsar.Client', return_value=FakePulsarClient())

    # Do not export promtheus metrics as this does not work when repeated tests
    # are performed.
    #mocker.patch('app.app.PrometheusMetrics')

    # Temporary Sqlite Database
    db_fd, db_file = tempfile.mkstemp()
    os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{}'.format(db_file)

    # Initialize DB and create Flask application.
    app = App()
    app.config['TESTING'] = True
    asyncio.run(PerformInitDB(app))
    Init(app)

    client = app.test_client()

    yield client

    os.close(db_fd)
    os.unlink(db_file)


def postJson(client: QuartClient, path, data_dict):
    headers = {
        'Content-Type': 'application/json',
    }

    data = json.dumps(data_dict)

    return client.post(path, headers=headers, data=data)


async def createDevice(client: QuartClient, name: str) -> None:
    data = {'name': name}

    response = await postJson(client, '/device', data)
    assert response.status_code == 200
    assert (await response.get_json())['name'] == name


async def createStream(client: QuartClient, name: str) -> None:
    data = {'name': name}

    response = await postJson(client, '/stream', data)
    assert response.status_code == 200
    assert (await response.get_json())['name'] == name


async def createRoom(client: QuartClient, name: str) -> None:
    data = {'name': name}

    response = await postJson(client, '/room', data)
    assert response.status_code == 200
    assert (await response.get_json())['name'] == name


async def createRoomScore(client: QuartClient, room_id: int, name: str, time: int) -> None:
    data = {'name': name, 'time': time}

    response = await postJson(client, '/rooms/{}/score'.format(room_id), data)
    assert response.status_code == 200
    assert (await response.get_json())['name'] == name
    assert (await response.get_json())['time'] == time


@pytest.mark.asyncio
async def testStreamViewsList(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')
