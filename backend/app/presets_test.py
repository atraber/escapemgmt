#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import pytest
from quart.testing import QuartClient

from main_test import client, createPreset, postJson


@pytest.mark.asyncio
async def testPresets(client: QuartClient) -> None:
    response = await client.get('/presets')
    assert response.status_code == 200
    assert await response.get_json() == []


@pytest.mark.asyncio
async def testPresetAdd(client: QuartClient) -> None:
    await createPreset(client, 'testpreset')

    response = await client.get('/presets')
    assert response.status_code == 200
    data_json = await response.get_json()
    assert len(data_json) == 1
    assert data_json[0]['name'] == 'testpreset'


@pytest.mark.asyncio
async def testPresetUpdate(client: QuartClient) -> None:
    await createPreset(client, 'testpreset')

    # Check that there is exactly one preset.
    response = await client.get('/presets')

    assert response.status_code == 200
    d = (await response.get_json())[0]
    d['name'] = 'anotherpreset'

    response = await postJson(client, '/presets/{}'.format(d['id']), d)
    assert response.status_code == 200

    # Check that there are no presets left.
    response = await client.get('/presets')

    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert d['name'] == 'anotherpreset'


@pytest.mark.asyncio
async def testPresetDelete(client: QuartClient) -> None:
    await createPreset(client, 'testpreset')

    # Check that there is exactly one preset.
    response = await client.get('/presets')

    assert response.status_code == 200
    data_json = (await response.get_json())
    assert len(data_json) == 1

    response = await client.delete('/presets/{}'.format(data_json[0]['id']))
    assert response.status_code == 200

    # Check that there are no presets left.
    response = await client.get('/presets')

    assert response.status_code == 200
    data_json = (await response.get_json())
    assert len(data_json) == 0


@pytest.mark.asyncio
async def testPresetActivate(client: QuartClient) -> None:
    await createPreset(client, 'testpreset')
    await createPreset(client, 'preset2')

    # Check that there is exactly one preset.
    response = await client.get('/presets')

    assert response.status_code == 200
    data_json = (await response.get_json())
    assert len(data_json) == 2

    response = await postJson(client,
                              '/preset/activate/{}'.format(data_json[0]['id']),
                              {})
    assert response.status_code == 200

    # Check that there is only one active preset.
    response = await client.get('/presets')

    assert response.status_code == 200
    data_json = (await response.get_json())
    active = 0
    for d in data_json:
        if d['active']:
            active += 1

    assert active == 1

    assert data_json[0]['active']
