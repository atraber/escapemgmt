#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import InitDB


logging.basicConfig(stream=sys.stderr)

initdb = InitDB()

if __name__ == '__main__':
    initdb.run()
