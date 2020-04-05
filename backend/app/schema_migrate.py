#!/usr/bin/python3
# Copyright 2020 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import SchemaMigrate

logging.basicConfig(stream=sys.stderr)

if __name__ == '__main__':
    SchemaMigrate('d2b871758c58')
