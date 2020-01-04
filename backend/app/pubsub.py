# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import asyncio
import uuid
from quart import Blueprint, make_response, Response
from threading import Lock

from app import pulsar_client
from logger import logger

pubsub = Blueprint('pubsub', __name__)
producer_lock = Lock()
producer = None


def _createProducer():
    global producer
    producer_lock.acquire()
    if producer == None:
        try:
            producer = pulsar_client.create_producer('pubsub')
        except:
            logger.info('Could not create producer')
            pass
    producer_lock.release()


def _getProducer():
    if producer == None:
        _createProducer()
    return producer


@pubsub.route('/subscribe')
async def apiStreamUpdate():
    async def eventStream():
        loop = asyncio.get_event_loop()

        consumer = pulsar_client.subscribe('pubsub', '{}'.format(uuid.uuid4()))
        logger.info('Created new consumer for pulsar')

        while True:
            # Wait for source data to be available, then push it.
            msg = await loop.run_in_executor(None, consumer.receive)

            event = bytes(msg.data()).decode('utf-8')

            logger.info('Received event from pubsub: {}'.format(event))

            yield 'event: {}\ndata: {}\r\n\r\n'.format(event,
                                                       'hallo').encode('utf-8')
            consumer.acknowledge(msg)

    response = await make_response(
        eventStream(),
        {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
        },
    )
    response.timeout = None
    return response


def publish(event: str, msg=''):
    # TODO: msg is currently ignored. The message sent here needs to be encoded
    # somehow.
    logger.info('Sent event to pubsub: {}'.format(event))
    local_producer = _getProducer()
    if local_producer is not None:
        local_producer.send(event.encode('utf-8'))


_createProducer()
