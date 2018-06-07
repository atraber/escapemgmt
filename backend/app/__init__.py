# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from config import app_config

db = SQLAlchemy()

def create_app(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    # use instance/config.py to specify more configuration values, e.g. a
    # secret mysql key
    #app.config.from_pyfile('config.py')
    db.init_app(app)

    from .streams import streams as streams_blueprint
    app.register_blueprint(streams_blueprint)

    from .devices import devices as devices_blueprint
    app.register_blueprint(devices_blueprint)

    from .rooms import rooms as rooms_blueprint
    app.register_blueprint(rooms_blueprint)

    # enable cross-origin access
    CORS(app)

    # perform DB migrations
    migrate = Migrate(app, db)

    from app import models

    return app
