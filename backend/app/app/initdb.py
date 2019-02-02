#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

logging.basicConfig(stream=sys.stderr)

from app import InitDB

config_name = os.getenv('FLASK_CONFIG', 'production')
initdb = InitDB(config_name)

if __name__ == '__main__':
    initdb.run()
