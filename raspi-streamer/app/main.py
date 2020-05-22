#!/usr/bin/env python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import os
import prometheus_client
import screens
import sys
import traceback
import time
from absl import app
from absl import flags
import background
from logger import logger
from streamer import Streamer
from url_fetcher import UrlFetcher


FLAGS = flags.FLAGS

flags.DEFINE_string(
        'escape_backend_address', default='http://192.168.0.81/api',
        help='Address of escape backend server.')
flags.DEFINE_integer(
        'monitoring_port', default=8081,
        help='Monitoring port for prometheus metrics.')
flags.DEFINE_integer(
        'polling_interval', default=1,
        help='Polling interval for streams from escape backend server.')
flags.DEFINE_boolean(
        'debug', default=False,
        help='Start in debug mode. No video streams will be displayed and the debug endpoint will be used.')


def main(argv):
    logger.info("Starting Prometheus HTTP server")
    prometheus_client.start_http_server(FLAGS.monitoring_port)

    bgs = []
    allScreens = screens.getScreens()
    for screen in allScreens.values():
        logger.info("Starting OpenGL Fullscreen Application for {}".format(screen.name))
        bg = background.Background(screen)
        bgs.append(bg)

    background.start()

    fetchers = []
    for bg in bgs:
        streamer = Streamer(bg.getScreen())
        fetcher = UrlFetcher(FLAGS.escape_backend_address, bg.getScreen().raspi_display_no, background=bg, streamer=streamer)
        urls = fetcher.request()
        if urls is None:
            logger.critical("Failed to request new urls. Falling back to stored urls")
            urls = fetcher.restore()
            bg.setConnected(False)
        else:
            logger.info("Get a set of URLs. Saving those to file now.")
            fetcher.save(urls)
            bg.setConnected(True)

        logger.info("Starting streamer.")
        streamer.setUrls(urls)
        fetchers.append(fetcher)

    logger.info("Entering update loop.")
    while True:
        for fetcher in fetchers:
            fetcher.watch(polling_interval=FLAGS.polling_interval)


if __name__ == '__main__':
    try:
        app.run(main)
    except Exception as e:
        logger.critical("Received an exception: {}.".format(e))
        exc_type, exc_value, exc_traceback = sys.exc_info()
        traceback.print_tb(exc_traceback, file=sys.stdout)
        # Give up entirely if this happens!
        os._exit(-1)
