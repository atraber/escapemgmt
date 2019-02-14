#!/bin/bash
source ./venv/bin/activate
export SQLALCHEMY_DATABASE_URI='mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
cd app && hypercorn \
    -b :5000  \
    -w 1 \
    --reload \
    app.main:application \

