#!/bin/bash
source ./venv/bin/activate
#export FLASK_ENV=development
#export FLASK_CONFIG=development
export SQLALCHEMY_DATABASE_URI='mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
# Since we want to automatically reload on code changes, we use gunicorn
# instead of the default flask run "python3 -m flask run".
cd app && gunicorn -b :5000  -w 4 --threads 4 -k flask_sockets.worker app.main:application --reload

# ALTERNATIVE
#export FLASK_APP=app.main:application
#cd app && python3 -m flask run
