# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import os
import prometheus_client
import requests
import threading
import time
import traceback
import yaml
from logger import logger
from sseclient import SSEClient
from streamer import StreamView, UrlBox
from uuid import getnode


screenEnabledMetric = prometheus_client.Enum(
        'screen_enabled', 'Screen enabled on device',
        states=['True', 'false'])

requestsTotalMetric = prometheus_client.Counter(
        'backend_requests_total',
        'Requests to the backend supplying streaming info')
requestsErrorMetric = prometheus_client.Counter(
        'backend_requests_errors',
        'Requests to the backend supplying streaming info that failed')


class UrlFetcher:
    def __init__(self, api_endpoint):
        self.api_endpoint = api_endpoint
        self.mac = getnode()
        self.push_semaphore = None
        self.watch_push_thread = None
        logger.info("Device MAC-Address: {:X}".format(self.mac))

    def request(self):
        logger.info('Sending request to backend')
        requestsTotalMetric.inc()

        try:
            response = requests.get(
                    self.api_endpoint + '/raspi/{}'.format(self.mac),
                    timeout=5)
            response.raise_for_status()
            device = response.json()
        except Exception as e:
            logger.info('Received exception while waiting for config from backend')
            requestsErrorMetric.inc()
            return None
        logger.info('Received config from backend')

        # if the screen should be off, just return an empty list of urls
        if not device['screen_enable']:
            screenEnabledMetric.state('False')
            return []
        screenEnabledMetric.state('True')

        urls = []
        if device['streams'] and len(device['streams']) > 0:
            for stream in device['streams']:
                streamviews = []
                for view in stream['streamviews']:
                    streamviews.append(
                            StreamView(
                                url=view['url'],
                                crop_x1=view['crop_x1'],
                                crop_y1=view['crop_y1'],
                                crop_x2=view['crop_x2'],
                                crop_y2=view['crop_y2']))

                if len(streamviews) == 0:
                    logger.error('No stream views available for device,'
                                 ' but stream found')
                    return []

                urlbox = UrlBox(
                        streamviews=streamviews,
                        orientation=stream['orientation'])
                urls.append(urlbox)

        return urls

    def watch_push(self):
        self.push_semaphore = threading.BoundedSemaphore()

        self.watch_push_thread = threading.Thread(target=self._watch_push_thread)
        self.watch_push_thread.start()

        return self.push_semaphore

    def _watch_push_thread(self):
        """This starts a separate thread that waits for server side events.

        When a relevant event is detected, the semaphore self.push_semaphore is set.
        """
        while True:
            try:
                messages = SSEClient(self.api_endpoint + '/subscribe')

                for msg in messages:
                    logger.info('Received message')
                    try:
                        self.push_semaphore.release()
                    except ValueError:
                        # We ignore ValueError as this might happen when our request
                        # thread is not as fast as events come in.
                        pass
            except:
                logger.error('SSE client experienced a problem')
                traceback.print_exc()
                time.sleep(10)

    def _config_file_path(self):
        script = os.path.realpath(__file__)
        dirname = os.path.dirname(script)
        return os.path.join(dirname, 'config.yml')

    def save(self, urls):
        with open(self._config_file_path(), 'w') as outfile:
            yaml.dump(urls, outfile, default_flow_style=False)

    def restore(self):
        try:
            with open(self._config_file_path(), "r") as infile:
                return yaml.load(infile.read())
        except FileNotFoundError:
            return []


def urlsEqual(lhs, rhs):
    if len(lhs) != len(rhs):
        return False

    for i in range(len(lhs)):
        if not lhs[i].isEqual(rhs[i]):
            return False

    return True


def watch(fetcher, bg, urls, polling_interval=30):
    semaphore = fetcher.watch_push()
    while True:
        # After this function returns, we either received an event or the
        # timeout has expired. Either way, let's check for new streams.
        semaphore.acquire(timeout=polling_interval)

        new_urls = fetcher.request()
        if new_urls is None:
            logger.error("Failed to get new URLs. Is web server down?")
            bg.setConnected(False)
            continue

        bg.setConnected(True)

        if not urlsEqual(new_urls, urls):
            return new_urls
