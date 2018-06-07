#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import create_app

logging.basicConfig(stream=sys.stderr)
sys.path.insert(0, "/home/houdini/raspimgmt-backend/")

application = create_app("production")
