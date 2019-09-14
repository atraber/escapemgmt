#!/bin/bash
source ./venv/bin/activate
export SQLALCHEMY_DATABASE_URI='mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
export MINIO_URL='localhost:9000'
export MINIO_ACCESS_KEY='L8Adf/ADnAglARAvA015'
export MINIO_SECRET_KEY='fA9hJAKFmnwsd/SDMASFA/Ljlkdfg239563ADSGA'
cd app && hypercorn \
    -b :5000  \
    -w 1 \
    --reload \
    app.main:application \

