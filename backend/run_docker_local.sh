#!/bin/bash
docker run \
    -d \
    -p 4001:80 \
    -e SQLALCHEMY_DATABASE_URI='mysql+pymysql://raspimgmt:raspberrypi@172.17.0.1/raspimgmt?charset=utf8' \
    escape_backend
