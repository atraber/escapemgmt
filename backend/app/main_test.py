#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import asyncio
import json
import os
import pytest
import tempfile
from quart.testing import QuartClient
from typing import Generator

from app import App, Init, PerformInitDB


class FakePulsarProducer:
    def send(self, msg):
        pass


class FakePulsarClient:
    def create_producer(self, topic: str):
        return FakePulsarProducer()

    def subscribe(self, topic: str, subscriber_id: str):
        return None


@pytest.fixture
def client(mocker, event_loop) -> Generator:
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


async def createStreamView(client: QuartClient, stream_id: int, url: str,
                           crop_x1: int, crop_x2: int, crop_y1: int,
                           crop_y2: int) -> None:
    data = {
        'url': url,
        'crop_x1': crop_x1,
        'crop_x2': crop_x2,
        'crop_y1': crop_y1,
        'crop_y2': crop_y2,
    }

    response = await postJson(client, '/streamview/{}'.format(stream_id), data)
    assert response.status_code == 200
    data_json = await response.get_json()
    assert data_json['url'] == url
    assert data_json['crop_x1'] == crop_x1
    assert data_json['crop_x2'] == crop_x2
    assert data_json['crop_y1'] == crop_y1
    assert data_json['crop_y2'] == crop_y2


async def createRoom(client: QuartClient, name: str) -> None:
    data = {'name': name}

    response = await postJson(client, '/room', data)
    assert response.status_code == 200
    assert (await response.get_json())['name'] == name


async def createRoomScore(client: QuartClient, room_id: int, name: str,
                          time: int) -> None:
    data = {'name': name, 'time': time}

    response = await postJson(client, '/rooms/{}/score'.format(room_id), data)
    assert response.status_code == 200
    data_json = await response.get_json()
    assert data_json['name'] == name
    assert data_json['time'] == time


async def createPreset(client: QuartClient, name: str) -> None:
    data = {'name': name}

    response = await postJson(client, '/preset', data)
    assert response.status_code == 200
    data_json = await response.get_json()
    assert data_json['name'] == name


@pytest.mark.asyncio
async def testStreamViewsList(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')
