#!/usr/bin/env python3
import argparse
import requests
import yaml
import os
import time
from background import background
from uuid import getnode as get_mac
from stream import UrlBox, ProcessWatcher

class ParameterClient:
    def __init__(self, apiEndpoint):
        self.apiEndpoint = apiEndpoint
        self.mac = get_mac()
        print("Device MAC-Address: {:X}".format(self.mac))

    def request(self):
        response = requests.get(self.apiEndpoint + '/raspi/{}'.format(self.mac))
        device = response.json()

        # if the screen should be off, just return an empty list of urls
        if not device['screen_enable']:
            return []

        urls = []
        if device['streams'] and len(device['streams']) > 0:
            for stream in device['streams']:
                urls.append(UrlBox(stream['url'], size_x=stream['width'], size_y=stream['height'], orientation=stream['orientation']))

        return urls

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
        except FileNotFoundError as e:
            return []

def watch(parameter_client, urls):
    while True:
        try:
            new_urls = parameter_client.request()
            if len(new_urls) != len(urls):
                return new_urls

            for i in range(len(urls)):
                if not urls[i].isEqual(new_urls[i]):
                    return new_urls
        except:
            print("Failed to get new URLs. Is web server down?")
            pass

        time.sleep(5)

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
