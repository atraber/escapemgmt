#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import pytest
from quart.testing import QuartClient

from app.main_test import client, createDevice, postJson


@pytest.mark.asyncio
async def testDevices(client: QuartClient) -> None:
    devices = await client.get('/devices')
    assert devices.status_code == 200
    assert await devices.get_json() == []


@pytest.mark.asyncio
async def testDeviceCreate(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')

    # Check if the created device is listed.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    d = (await devices.get_json())[0]
    assert d['name'] == 'testdevice'


@pytest.mark.asyncio
async def testDeviceRaspiCreate(client: QuartClient) -> None:
    device = await client.get('/raspi/1')
    assert device.status_code == 200
    assert (await device.get_json())['mac'] == '00-00-00-00-00-01'


@pytest.mark.asyncio
async def testDeviceUpdate(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')

    # Get the id of the first device.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    d = (await devices.get_json())[0]
    d['mac'] = '11-22-33-44-55-66'
    # Get the id of the first device and update its MAC address.
    await postJson(client, '/devices/{}'.format(d['id']), d)

    # Check if mac is set to correct value.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    d = (await devices.get_json())[0]
    assert d['mac'] == '11-22-33-44-55-66'


@pytest.mark.asyncio
async def testDeviceDelete(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')

    # Check that there is exactly one device.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    devices_json = (await devices.get_json())
    assert len(devices_json) == 1

    response = await client.delete('/devices/{}'.format(devices_json[0]['id']))
    assert response.status_code == 200

    # Check that there are no devices left.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    devices_json = (await devices.get_json())
    assert len(devices_json) == 0


async def deviceScreen(client: QuartClient, path: str, on: bool) -> None:
    await createDevice(client, 'testdevice')

    device = await client.get(path)
    assert device.status_code == 200

    # Get the first device.
    devices = await client.get('/devices')

    assert devices.status_code == 200
    d = (await devices.get_json())[0]

    # Check if its screen is on.
    assert d['screen_enable'] == on


@pytest.mark.asyncio
async def testDeviceScreenOn(client: QuartClient) -> None:
    await deviceScreen(client, '/devices/screen_on', True)


@pytest.mark.asyncio
async def testDeviceScreenOff(client: QuartClient) -> None:
    await deviceScreen(client, '/devices/screen_off', False)


@pytest.mark.asyncio
async def testStreamViewsList(client: QuartClient) -> None:
    await createDevice(client, 'testdevice')
