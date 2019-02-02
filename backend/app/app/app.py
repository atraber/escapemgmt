# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate as FlaskMigrate
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
import pulsar

from app.config import app_config, app_envs

app = None
pulsar_client = None
db = SQLAlchemy()
metrics = None

def _CommonAppConfig(config_name):
    global pulsar_client
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    app.config.update(app_envs())

    metrics = PrometheusMetrics(app)

    db.init_app(app)

    pulsar_client = pulsar.Client(app.config['PULSAR_URL'])

    from app.devices import devices as devices_blueprint
    app.register_blueprint(devices_blueprint)

    from app.presets import presets as presets_blueprint
    app.register_blueprint(presets_blueprint)

    from app.pubsub import pubsub as pubsub_blueprint
    app.register_blueprint(pubsub_blueprint)

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

def InitDB(config_name):
    app = _CommonAppConfig(config_name)

    # Create all tables.
    with app.app_context():
        db.create_all()

    return app


def Migrate(config_name):
    app = _CommonAppConfig(config_name)

    # perform DB migrations
    FlaskMigrate(app, db)

    return app
