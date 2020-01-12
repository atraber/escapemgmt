# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import logging

logger = logging.getLogger('escape-backend')
logging.basicConfig(
    level=logging.DEBUG,
    format=
    '%(asctime)s %(levelname)s [%(process)d %(filename)s:%(lineno)s %(funcName)20s()] %(message)s'
)
