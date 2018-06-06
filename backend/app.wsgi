#!/usr/bin/python3
import logging
import os
import sys

from app import create_app

logging.basicConfig(stream=sys.stderr)
sys.path.insert(0, "/home/houdini/raspimgmt-backend/")

application = create_app("production")