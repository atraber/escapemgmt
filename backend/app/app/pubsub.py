# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from flask import current_app, Blueprint, jsonify, request, Response, stream_with_context
from concurrent.futures import TimeoutError
import uuid

from app.app import pulsar_client
from app.logger import logger


pubsub = Blueprint('pubsub', __name__)
producer = pulsar_client.create_producer('pubsub')


@pubsub.route('/subscribe')
def apiStreamUpdate():
    @stream_with_context
    def eventStream():
        consumer = pulsar_client.subscribe('pubsub', '{}'.format(uuid.uuid4()))

        while True:
            # Wait for source data to be available, then push it.
            try:
                msg = consumer.receive(timeout_millis=5000)
            # Yeah, I know this sucks! One should not catch all exceptions.
            # However it seems that Pulsar only knows Exception exceptions,
            # thus there is really no other way...
            except:
                # This is normal during operation and excepted. We need to give
                # the schedular a chance to see that this thread is actually
                # alive.
                continue
            event = bytes(msg.data()).decode('utf-8')

            yield 'event: {}\ndata: {}\n\n'.format(event, 'hallo')
            consumer.acknowledge(msg)

    return Response(eventStream(), mimetype='text/event-stream')


def publish(event: str, msg=''):
    # TODO: msg is currently ignored. The message sent here needs to be encoded
    # somehow.
    producer.send(event.encode('utf-8'))
