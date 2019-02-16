#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import pytest
from quart.testing import QuartClient

from app.main_test import client, createRoom, createRoomScore, postJson


@pytest.mark.asyncio
async def testRooms(client: QuartClient) -> None:
    rooms = await client.get('/rooms')
    assert rooms.status_code == 200
    assert await rooms.get_json() == []


@pytest.mark.asyncio
async def testRoomCreate(client: QuartClient) -> None:
    await createRoom(client, 'testroom')

    # Check if the created room is listed.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    d = (await rooms.get_json())[0]
    assert d['name'] == 'testroom'


@pytest.mark.asyncio
async def testRoomUpdate(client: QuartClient) -> None:
    await createRoom(client, 'testroom')

    # Get the id of the first room.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    d = (await rooms.get_json())[0]
    d['description'] = 'This is a string.'
    # Get the id of the first room and update its description.
    await postJson(client, '/rooms/{}'.format(d['id']), d)

    # Check if mac is set to correct value.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    d = (await rooms.get_json())[0]
    assert d['description'] == 'This is a string.'


@pytest.mark.asyncio
async def testRoomDelete(client: QuartClient) -> None:
    await createRoom(client, 'testroom')

    # Check that there is exactly one room.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    rooms_json = (await rooms.get_json())
    assert len(rooms_json) == 1

    response = await client.delete('/rooms/{}'.format(rooms_json[0]['id']))
    assert response.status_code == 200

    # Check that there are no room left.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    rooms_json = (await rooms.get_json())
    assert len(rooms_json) == 0


@pytest.mark.asyncio
async def testRoomScoreCreate(client: QuartClient) -> None:
    await createRoom(client, 'testroom')

    # Check if the created room is listed.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    d = (await rooms.get_json())[0]

    await createRoomScore(client, d['id'], 'my team', 23)

    # Check if the created score is listed.
    response = await client.get('/rooms')
    assert response.status_code == 200
    room = (await response.get_json())[0]

    assert len(room['scores']) == 1
    assert room['scores'][0]['name'] == 'my team'
    assert room['scores'][0]['time'] == 23


@pytest.mark.asyncio
async def testRoomScoreDelete(client: QuartClient) -> None:
    await createRoom(client, 'testroom')

    # Check if the created room is listed.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    d = (await rooms.get_json())[0]

    await createRoomScore(client, d['id'], 'my team', 23)

    # Check if the created score is listed.
    response = await client.get('/rooms')
    assert response.status_code == 200
    room = (await response.get_json())[0]

    await client.delete('/rooms/{}/scores/{}'.format(d['id'], room['scores'][0]['id']))

    # Check that there are no scores left.
    rooms = await client.get('/rooms')

    assert rooms.status_code == 200
    rooms_json = (await rooms.get_json())
    assert len(rooms_json[0]['scores']) == 0
