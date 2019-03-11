# docker run -p 8081:8081 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix -v ~/.Xauthority:/root/.Xauthority --net=host --device /dev/vchiq:/dev/vchiq --device /dev/snd --device /dev/fb0:/dev/ escape_streamer
FROM python:3.7.2-stretch

EXPOSE 8081

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libfreetype6 dbus libsmbclient libssh-4 \
    libpcre3 fonts-freefont-ttf fbset \
    python3 python3-pip supervisor gcc \
    libasound2 libavutil55 libavcodec57 libavformat57 x11-xserver-utils alsa-utils freeglut3 libgl1-mesa-dri \
  && apt-get clean

# Install raspberry libraries
RUN curl http://archive.raspbian.org/raspbian/pool/firmware/r/raspberrypi-firmware-nokernel/libraspberrypi0_1.20180328-1~nokernel1_armhf.deb \
    -o /tmp/libraspberrypi0.deb && \
    dpkg -i /tmp/libraspberrypi0.deb && \
    rm /tmp/libraspberrypi0.deb

# Install tvservice binary
RUN curl http://archive.raspbian.org/raspbian/pool/firmware/r/raspberrypi-firmware-nokernel/libraspberrypi-bin_1.20180328-1~nokernel1_armhf.deb \
    -o /tmp/libraspberrypi-bin.deb && \
    dpkg -i /tmp/libraspberrypi-bin.deb && \
    rm /tmp/libraspberrypi-bin.deb

# Install omxplayer binary
RUN curl http://archive.raspberrypi.org/debian/pool/main/o/omxplayer/omxplayer_20180905+git061425a-1_armhf.deb \
    -o /tmp/omxplayer.deb && \
    dpkg -i /tmp/omxplayer.deb && \
    rm /tmp/omxplayer.deb

# Python requirements
COPY requirements.txt /tmp/
RUN pip3 install --pre --no-cache-dir -r /tmp/requirements.txt

COPY supervisord.conf /etc/supervisord.conf
COPY ./app /app

CMD [ "/usr/bin/supervisord" ]
