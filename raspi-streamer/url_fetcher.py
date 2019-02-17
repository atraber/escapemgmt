# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import argparse
import requests
import yaml
import os
import time
from uuid import getnode
from streamer import StreamView, UrlBox

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
                    print('Not stream views available for device,'
                          ' but stream found')
                    return []

                urlbox = UrlBox(
                        streamviews=streamviews,
                        orientation=stream['orientation'])
                urls.append(urlbox)

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
