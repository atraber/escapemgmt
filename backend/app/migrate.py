#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import sys

logging.basicConfig(stream=sys.stderr)

from app import Migrate

Migrate("production")
