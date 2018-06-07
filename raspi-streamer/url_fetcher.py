# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import argparse
import requests
import yaml
import os
import time
from uuid import getnode
from streamer import UrlBox

class UrlFetcher:
    def __init__(self, apiEndpoint):
        self.apiEndpoint = apiEndpoint
        self.mac = getnode()
        print("Device MAC-Address: {:X}".format(self.mac))

    def request(self):
        response = requests.get(self.apiEndpoint + '/raspi/{}'.format(self.mac))
        response.raise_for_status()
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
        except FileNotFoundError:
            return []
