#!/usr/bin/env python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import datetime
import sys
import urllib.request
from absl import app
from absl import flags


FLAGS = flags.FLAGS

flags.DEFINE_string(
        'address', default='http://localhost:8081/metrics',
        help='Address of server for health check.')
flags.DEFINE_integer(
        'timeout', default=1,
        help='Timeout for health check.')
flags.DEFINE_integer(
        'max_staleness', default=60,
        help='Timeout for health check.')


def main(argv):
    with urllib.request.urlopen(
            url=FLAGS.address,
            timeout=FLAGS.timeout) as response:
        for line in response:
            decoded = line.decode('utf-8')
            splits = decoded.split()
            if len(splits) == 2 and splits[0] == 'backend_last_check':
                d = datetime.datetime.fromtimestamp(float(splits[1]))
                diff = datetime.datetime.now() -d
                seconds = diff.total_seconds()
                if seconds > FLAGS.max_staleness:
                    sys.exit(-1)
                else:
                    sys.exit(0)


if __name__ == '__main__':
    app.run(main)
