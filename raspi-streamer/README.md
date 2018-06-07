# Raspi Streamer

This is a python3 application written to display CCTV feeds on a Raspberry Pi.

It uses `omxplayer` internally and thus it only runs on Raspberries.


## Setup

Setup a new virtual environment, so that the site packages are completely excluded from our local packages

    python3 -m venv ./venv

and then activate it

    source ./venv/bin/activate

Finally install all dependencies

    pip install -r ./requirements.txt
