#!/usr/bin/python3
# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import Migrate


logging.basicConfig(stream=sys.stderr)

migrate = Migrate()

if __name__ == '__main__':
    migrate.run()
