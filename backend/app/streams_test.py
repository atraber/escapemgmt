#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import pytest
from quart.testing import QuartClient

from main_test import client, createStream, postJson


@pytest.mark.asyncio
async def testStreams(client: QuartClient) -> None:
    response = await client.get('/streams')
    assert response.status_code == 200
    assert await response.get_json() == []


@pytest.mark.asyncio
async def testStreamCreate(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    # Check if the created stream is listed.
    response = await client.get('/streams')

    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert d['name'] == 'teststream'


@pytest.mark.asyncio
async def testStreamUpdate(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    # Get the id of the first stream.
    response = await client.get('/streams')

    assert response.status_code == 200
    d = (await response.get_json())[0]
    d['name'] = 'anotherstream'
    # Get the id of the first stream and update its description.
    await postJson(client, '/streams/{}'.format(d['id']), d)

    # Check if mac is set to correct value.
    response = await client.get('/streams')

    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert d['name'] == 'anotherstream'


@pytest.mark.asyncio
async def testStreamDelete(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    # Check that there is exactly one stream.
    response = await client.get('/streams')

    assert response.status_code == 200
    data_json = (await response.get_json())
    assert len(data_json) == 1

    response = await client.delete('/streams/{}'.format(data_json[0]['id']))
    assert response.status_code == 200

    # Check that there are no streams left.
    response = await client.get('/streams')

    assert response.status_code == 200
    data_json = (await response.get_json())
    assert len(data_json) == 0
