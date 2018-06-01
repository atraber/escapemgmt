# Raspi Streamer

This is a python3 application written to display CCTV feeds on a Raspberry Pi.

It uses `omxplayer` internally and thus it only runs on Raspberries.


## Setup

Setup a new virtual environment, so that the site packages are completely excluded from our local packages

    virtualenv-3 --no-site-packages .

and then activate it

    source ./bin/activate

Finally install all dependencies

    pip install -r ./requirements.txt
