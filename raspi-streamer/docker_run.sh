#!/bin/bash
# WARNING: This will only run on a Raspberry Pi! Don't try this on your normal
# (x86) laptop or workstation as it will not work!
PWD=$(pwd)
docker run \
    --privileged \
    --network host \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -v /home/pi/.Xauthority:/root/.Xauthority \
    -v ${PWD}/app/:/app \
    --device=/dev/vchiq:/dev/vchiq \
    --device=/dev/snd:/dev/snd \
    --device=/dev/fb0:/dev/fb0 \
    --device=/dev/dri:/dev/dri \
    escape_streamer \
    --escape_backend_address=http://escapemgmt.houdini.traber-web.ch/api \

