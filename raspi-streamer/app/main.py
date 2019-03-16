#!/usr/bin/env python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import prometheus_client
import traceback
from absl import app
from absl import flags
from background import Background
from logger import logger
from streamer import Streamer
from url_fetcher import UrlFetcher, watch


FLAGS = flags.FLAGS

flags.DEFINE_string(
        'escape_backend_address', default='http://192.168.0.150/api',
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

    logger.info("Starting OpenGL Fullscreen Application")
    bg = Background()

    fetcher = UrlFetcher(FLAGS.escape_backend_address)
    urls = fetcher.request()
    if urls is None:
        logger.critical("Failed to request new urls. Falling back to stored urls")
        urls = fetcher.restore()
        bg.setConnected(False)
    else:
        logger.info("Get a set of URLs. Saving those to file now.")
        fetcher.save(urls)
        bg.setConnected(True)

    logger.info("Starting streamer")
    streamer = Streamer(bg.getScreenSize(), urls)

    logger.info("Entering update loop")
    while True:
        # update loop
        urls = watch(fetcher, bg, urls, polling_interval=FLAGS.polling_interval)
        logger.info("Got new set of URLs")
        fetcher.save(urls)
        streamer.setUrls(urls)

if __name__ == '__main__':
    app.run(main)
