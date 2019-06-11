# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from alembic.config import Config as alembic_Config
from alembic import command as alembic_command
import asyncio
from quart import Quart
from quart_cors import cors
from quart_sqlalchemy import SQLAlchemy
#from prometheus_flask_exporter import PrometheusMetrics
import pulsar

from app.config import app_config, app_envs
from app.logger import logger


app = None
pulsar_client = None # type: pulsar.Client
db = SQLAlchemy()
metrics = None


def App() -> Quart:
    global pulsar_client
    app = Quart(__name__)
    logger.info('Applying config')
    app.config.from_object(app_config)
    app.config.update(app_envs())

    #logger.info('Adding PrometheusMetrics')
    #metrics = PrometheusMetrics(app)

    logger.info('Initializing database')
    db.init_app(app)
    db.app = app

    logger.info('Initializing pulsar_client')
    pulsar_client = pulsar.Client(app.config['PULSAR_URL'])

    logger.info('Registering blueprints')
    from app.bookings import bp as bookings_blueprint
    app.register_blueprint(bookings_blueprint)

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

    from app.streamviews import streamviews as streamviews_blueprint
    app.register_blueprint(streamviews_blueprint)

    return app


def Init(app: Quart):
    # enable cross-origin access
    app = cors(app)

    from app import models

    return app


async def PerformInitDB(app: Quart):
    """Create all tables."""
    async with app.app_context():
        logger.info('Creating tables')
        db.create_all(app=app)

        logger.info('Stamp most recent alembic version')
        alembic_cfg = alembic_Config('./app/migrations/alembic.ini')
        alembic_command.stamp(alembic_cfg, "head")


def InitDB():
    app = App()

    asyncio.run(PerformInitDB(app))

    return app


def Migrate():
    app = App()

    # perform DB migrations
    logger.info('Performing schema migrations')
    FlaskMigrate(app, db)

    return app
