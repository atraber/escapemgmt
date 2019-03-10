# docker run -p 8081:8081 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix -v ~/.Xauthority:/root/.Xauthority --net=host -v /opt/vc:/opt/vc --device /dev/vchiq:/dev/vchiq --device /dev/snd --device /dev/fb0:/dev/ escape_streamer
FROM python:3.7.2-stretch

EXPOSE 8081

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libfreetype6 dbus libsmbclient libssh-4 \
    libpcre3 fonts-freefont-ttf fbset \
    python3 python3-pip supervisor gcc \
  && apt-get clean

RUN pip3 install PyYAML==3.13

# Custom Supervisord config
COPY supervisord.conf /etc/supervisord.conf

COPY requirements.txt /tmp/
RUN pip3 install --pre --no-cache-dir -r /tmp/requirements.txt

COPY ./app /app
COPY ./omxplayer /usr/bin/omxplayer
COPY ./omxplayer.bin /usr/bin/omxplayer.bin

RUN apt-get update && apt-get install -y --no-install-recommends \
    libasound2 libavutil55 libavcodec57 libavformat57 x11-xserver-utils alsa-utils freeglut3 libgl1-mesa-dri \
  && apt-get clean

ENV LD_LIBRARY_PATH /opt/vc/lib/

CMD [ "/usr/bin/supervisord" ]
