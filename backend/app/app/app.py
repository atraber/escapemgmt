# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate as FlaskMigrate
from flask_sqlalchemy import SQLAlchemy

from app.config import app_config, app_envs

db = SQLAlchemy()

def _CommonAppConfig(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    app.config.update(app_envs())
    db.init_app(app)

    from app.devices import devices as devices_blueprint
    app.register_blueprint(devices_blueprint)

    from app.presets import presets as presets_blueprint
    app.register_blueprint(presets_blueprint)

    from app.rooms import rooms as rooms_blueprint
    app.register_blueprint(rooms_blueprint)

    from app.streams import streams as streams_blueprint
    app.register_blueprint(streams_blueprint)

    return app


def Create(config_name):
    app = _CommonAppConfig(config_name)

    # enable cross-origin access
    CORS(app)

    from app import models

    return app


def Migrate(config_name):
    app = _CommonAppConfig(config_name)

    # perform DB migrations
    FlaskMigrate(app, db)

    return app
