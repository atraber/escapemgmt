#!/bin/bash
# WARNING: This will only run on a Raspberry Pi! Don't try this on your normal
# (x86) laptop or workstation as it will not work!
docker run \
    -d \
    -p 8081:8081 \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    escape_streamer
