#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import pytest
from quart.testing import QuartClient

from main_test import client, createStream, createStreamView, postJson


@pytest.mark.asyncio
async def testStreamViews(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert len(d['streamviews']) == 0

    await createStreamView(client,
                           stream_id=d['id'],
                           url='rtsp://url',
                           crop_x1=0,
                           crop_x2=1,
                           crop_y1=2,
                           crop_y2=3)

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert len(d['streamviews']) == 1
    assert d['streamviews'][0]['url'] == 'rtsp://url'
    assert d['streamviews'][0]['crop_x1'] == 0
    assert d['streamviews'][0]['crop_x2'] == 1
    assert d['streamviews'][0]['crop_y1'] == 2
    assert d['streamviews'][0]['crop_y2'] == 3


@pytest.mark.asyncio
async def testStreamViewsUpdate(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]

    await createStreamView(client,
                           stream_id=d['id'],
                           url='rtsp://url',
                           crop_x1=0,
                           crop_x2=1,
                           crop_y1=2,
                           crop_y2=3)

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert len(d['streamviews']) == 1

    streamview = d['streamviews'][0]
    streamview['url'] = 'rtsp://my-happy-url.ch/sdf?sdf=sdf'

    await postJson(client, '/streamviews/{}'.format(streamview['id']),
                   streamview)

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    streamview = d['streamviews'][0]
    assert streamview['url'] == 'rtsp://my-happy-url.ch/sdf?sdf=sdf'


@pytest.mark.asyncio
async def testStreamViewsDelete(client: QuartClient) -> None:
    await createStream(client, 'teststream')

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]

    await createStreamView(client,
                           stream_id=d['id'],
                           url='rtsp://url',
                           crop_x1=0,
                           crop_x2=1,
                           crop_y1=2,
                           crop_y2=3)

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert len(d['streamviews']) == 1

    await client.delete('/streamviews/{}'.format(d['streamviews'][0]['id']))

    response = await client.get('/streams')
    assert response.status_code == 200
    d = (await response.get_json())[0]
    assert len(d['streamviews']) == 0
