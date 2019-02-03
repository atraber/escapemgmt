#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import Create


logging.basicConfig(stream=sys.stderr)

config_name = os.getenv('FLASK_CONFIG', 'production')
application = Create(config_name)

if __name__ == '__main__':
    application.run(threaded=True)
