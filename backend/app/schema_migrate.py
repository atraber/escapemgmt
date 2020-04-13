#!/usr/bin/python3
# Copyright 2020 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging
import os
import sys

from app import SchemaMigrate

logging.basicConfig(stream=sys.stderr)

if __name__ == '__main__':
    SchemaMigrate('648cb9b987c8')
