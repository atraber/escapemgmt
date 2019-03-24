# docker run -p 8081:8081 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix -v ~/.Xauthority:/root/.Xauthority --net=host --device /dev/vchiq:/dev/vchiq --device /dev/snd --device /dev/fb0:/dev/ escape_streamer
FROM python:3.7.2-stretch

EXPOSE 8081

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libfreetype6 dbus libsmbclient libssh-4 \
    libpcre3 fonts-freefont-ttf fbset \
    python3 python3-pip gcc \
    libasound2 libavutil55 libavcodec57 libavformat57 x11-xserver-utils alsa-utils freeglut3 libgl1-mesa-dri \
  && apt-get clean

# Add raspbian repo
RUN echo "\ndeb http://archive.raspbian.org/raspbian stretch main firmware contrib non-free rpi\n" \
    "deb-src http://archive.raspbian.org/raspbian stretch main firmware contrib non-free rpi\n" \
    >> /etc/apt/sources.list && \
    wget https://archive.raspbian.org/raspbian.public.key -O - | apt-key add -

# Add raspberry repo
RUN echo "\ndeb http://archive.raspberrypi.org/debian stretch main\n" \
    >> /etc/apt/sources.list && \
    wget http://archive.raspberrypi.org/debian/raspberrypi.gpg.key -O - | apt-key add -

RUN apt-get update && apt-get install -y --no-install-recommends \
    libraspberrypi0 libraspberrypi-bin omxplayer && \
    apt-get clean

# Python requirements
COPY requirements.txt /tmp/
RUN pip3 install --pre --no-cache-dir -r /tmp/requirements.txt

COPY ./app /app

ENTRYPOINT [ "python3", "-u", "/app/main.py" ]
