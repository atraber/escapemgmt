#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

# To ensure that the app will be found, add its path to the Python path.
app_path = os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, app_path)

from app import InitDB


logging.basicConfig(stream=sys.stderr)

initdb = InitDB()

if __name__ == '__main__':
    initdb.run()
