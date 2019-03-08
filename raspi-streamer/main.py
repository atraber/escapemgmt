#!/usr/bin/env python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import argparse
import prometheus_client
import traceback
from background import Background
from streamer import Streamer
from url_fetcher import UrlFetcher, watch


parser = argparse.ArgumentParser(description='Display video streams')
parser.add_argument('--escape_backend_address', default='http://192.168.0.150/raspi-api')
parser.add_argument('--monitoring_port', default=8081)
parser.add_argument('--polling_interval', default=1)
parser.add_argument('--debug', action='store_true', help='Start in debug mode. No video streams will be displayed and the debug endpoint will be used.')
args = parser.parse_args()

debug = args.debug
api_endpoint = args.escape_backend_address
polling_interval = args.polling_interval
monitoring_port = args.monitoring_port

if debug:
    api_endpoint = 'http://localhost:5000'

print("Starting Prometheus HTTP server")
prometheus_client.start_http_server(monitoring_port)

print("Starting OpenGL Fullscreen Application")
bg = Background(debug)

fetcher = UrlFetcher(api_endpoint)
try:
    urls = fetcher.request()
    fetcher.save(urls)
    bg.setConnected(True)
except:
    traceback.print_exc()
    print("Failed to request new urls. Falling back to stored urls")
    urls = fetcher.restore()
    bg.setConnected(False)

streamer = Streamer(bg.getScreenSize(), urls)

while True:
    # update loop
    urls = watch(fetcher, bg, urls, polling_interval=polling_interval)
    print("Got new set of URLs")
    fetcher.save(urls)
    streamer.setUrls(urls)
