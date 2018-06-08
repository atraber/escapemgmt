#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

logging.basicConfig(stream=sys.stderr)
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from app import create_app

application = create_app("production")
