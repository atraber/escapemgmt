#!/usr/bin/env python3
import argparse
import requests
import os
import time
from background import background
from parameter_client import ParameterClient
from stream import UrlBox, ProcessWatcher

def urlsEqual(lhs, rhs):
    if len(lhs) != len(rhs):
        return False

    for i in range(len(lhs)):
        if not lhs[i].isEqual(rhs[i]):
            return False

    return True

def watch(parameter_client, urls):
    while True:
        try:
            new_urls = parameter_client.request()

            if not urlsEqual(new_urls, urls):
                return new_urls
        except:
            print("Failed to get new URLs. Is web server down?")
            pass

        time.sleep(1)

parser = argparse.ArgumentParser(description='Display video streams')
parser.add_argument('--debug', action='store_true')
args = parser.parse_args()
debug = args.debug

if debug:
    apiEndpoint = 'http://localhost:5000'
else:
    apiEndpoint = 'http://192.168.0.150/raspi-api'

pc = ParameterClient(apiEndpoint)
try:
    urls = pc.request()
    pc.save(urls)
except Exception as e:
    print(e)
    print("Failed to request new urls. Falling back to stored urls")
    urls = pc.restore()

if debug:
    print(urls)
else:
    print("Starting OpenGL Fullscreen Application")
    background()

    pw = ProcessWatcher()

    while True:
        # update loop
        pw.watch(urls)
        urls = watch(pc, urls)
        print("Got new set of URLs")
        pc.save(urls)
        pw.stop()
