# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import datetime
import http
import json
import os
import prometheus_client
import socket
import threading
import time
import traceback
import urllib.request
import yaml
from absl import flags
from logger import logger
from streamer import StreamView, UrlBox
from uuid import getnode


FLAGS = flags.FLAGS

flags.DEFINE_integer(
        'backend_request_timeout', default=5,
        help='Timeout for requests to escape backend. Defaults to 5 seconds.')


screenEnabledMetric = prometheus_client.Enum(
        'screen_enabled', 'Screen enabled on device',
        states=['True', 'False'])

backendLastCheckMetric = prometheus_client.Gauge(
        'backend_last_check',
        'Time of last check to backend')
requestsTotalMetric = prometheus_client.Counter(
        'backend_requests_total',
        'Requests to the backend supplying streaming info')
requestsErrorMetric = prometheus_client.Counter(
        'backend_requests_errors',
        'Requests to the backend supplying streaming info that failed')


class UrlFetcher:
    def __init__(self, api_endpoint, suffix=None, background=None, streamer=None):
        self.api_endpoint = api_endpoint
        self._mac = getnode()
        logger.info("Device MAC-Address: {:X}".format(self._mac))
        self._name = self._mac
        if suffix:
            self._name = "{}{}".format(self._name, suffix)
        self._background = background
        self._streamer = streamer
        self._urls = []

    def request(self):
        urls = []
        logger.info('Sending request to backend')
        requestsTotalMetric.inc()
        backendLastCheckMetric.set(datetime.datetime.now().timestamp())

        try:
            url = self.api_endpoint + '/raspi/{}'.format(self._name)
            with urllib.request.urlopen(
                    url=url,
                    timeout=FLAGS.backend_request_timeout) as response:
               data = response.read()
               device = json.loads(data)
        except (urllib.error.URLError, urllib.error.HTTPError, http.client.RemoteDisconnected):
            logger.info('Server did not respond with OK')
            requestsErrorMetric.inc()
            return None
        except socket.timeout as e:
            logger.info('Connection timed out')
            requestsErrorMetric.inc()
            return None

            return None
        logger.info('Received config from backend')

        # if the screen should be off, just return an empty list of urls
        urls = []
        if not device['screen_enable']:
            logger.info('Screen is disabled')
            screenEnabledMetric.state('False')
            return urls
        screenEnabledMetric.state('True')

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

    def _configFilePath(self):
        script = os.path.realpath(__file__)
        dirname = os.path.dirname(script)
        return os.path.join(dirname, 'config-{}.yml'.format(self._name))

    def save(self, urls):
        self._urls = urls
        with open(self._configFilePath(), 'w') as outfile:
            yaml.dump(urls, outfile, default_flow_style=False)

    def restore(self):
        try:
            with open(self._configFilePath(), "r") as infile:
                self._urls = yaml.load(infile.read())
        except FileNotFoundError:
            self._urls = []

    def watch(self, polling_interval=30):
        time.sleep(polling_interval)
        logger.info("Polling now...")

        new_urls = self.request()
        if new_urls is None:
            logger.error("Failed to get new URLs. Is web server down?")
            self._background.setConnected(False)
            return

        self._background.setConnected(True)

        if not _urlsEqual(new_urls, self._urls):
            logger.info("URLs are not equal!")
            self.save(new_urls)
            self._streamer.setUrls(new_urls)


def _urlsEqual(lhs, rhs):
    if len(lhs) != len(rhs):
        return False

    for i in range(len(lhs)):
        if not lhs[i].isEqual(rhs[i]):
            return False

    return True
