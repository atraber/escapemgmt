# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import asyncio
from quart import Blueprint, make_response, Response
import uuid

from app.app import pulsar_client
from app.logger import logger


pubsub = Blueprint('pubsub', __name__)
producer = pulsar_client.create_producer('pubsub')


@pubsub.route('/subscribe')
async def apiStreamUpdate():
    async def eventStream():
        loop = asyncio.get_event_loop()

        consumer = pulsar_client.subscribe('pubsub', '{}'.format(uuid.uuid4()))
        logger.info('Created new consumer for pulsar')

        while True:
            # Wait for source data to be available, then push it.
            msg = await loop.run_in_executor(
                None, consumer.receive)

            event = bytes(msg.data()).decode('utf-8')

            logger.info('Received event from pubsub: {}'.format(event))

            yield 'event: {}\ndata: {}\r\n\r\n'.format(event, 'hallo').encode('utf-8')
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
    producer.send(event.encode('utf-8'))
