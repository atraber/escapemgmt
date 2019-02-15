#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import App, Init


logging.basicConfig(stream=sys.stderr)

application = App()
Init(application)

if __name__ == '__main__':
    application.run(threaded=True)
