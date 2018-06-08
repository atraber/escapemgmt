#!/usr/bin/env python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import argparse
import requests
import os
import time
from background import Background
from url_fetcher import UrlFetcher
from streamer import UrlBox, Streamer

def urlsEqual(lhs, rhs):
    if len(lhs) != len(rhs):
        return False

    for i in range(len(lhs)):
        if not lhs[i].isEqual(rhs[i]):
            return False

    return True

def watch(parameter_client, bg, urls):
    while True:
        try:
            new_urls = parameter_client.request()
            bg.setConnected(True)

            if not urlsEqual(new_urls, urls):
                return new_urls
        except:
            print("Failed to get new URLs. Is web server down?")
            bg.setConnected(False)

        time.sleep(1)

parser = argparse.ArgumentParser(description='Display video streams')
parser.add_argument('--debug', action='store_true')
args = parser.parse_args()
debug = args.debug

if debug:
    apiEndpoint = 'http://localhost:5000'
else:
    apiEndpoint = 'http://192.168.0.150/raspi-api'

print("Starting OpenGL Fullscreen Application")
bg = Background(debug)

pc = UrlFetcher(apiEndpoint)
try:
    urls = pc.request()
    pc.save(urls)
    bg.setConnected(True)
except Exception as e:
    print(e)
    print("Failed to request new urls. Falling back to stored urls")
    urls = pc.restore()
    bg.setConnected(False)

streamer = Streamer(bg.getScreenSize(), urls)

while True:
    # update loop
    urls = watch(pc, bg, urls)
    print("Got new set of URLs")
    pc.save(urls)
    streamer.setUrls(urls)
