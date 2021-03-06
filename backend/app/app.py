# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from alembic.config import Config as alembic_Config
from alembic import command as alembic_command
import asyncio
import os
from minio import Minio
from quart import Quart
from quart_cors import cors
#from prometheus_flask_exporter import PrometheusMetrics

import app

from quart_sqlalchemy import SQLAlchemy
from config import app_config, app_envs
from logger import logger

app = None
minio_client = None  # type: Minio
db = SQLAlchemy()
metrics = None


def App() -> Quart:
    global minio_client
    app = Quart(__name__)
    logger.info('Applying config')
    app.config.from_object(app_config)
    app.config.update(app_envs())

    #logger.info('Adding PrometheusMetrics')
    #metrics = PrometheusMetrics(app)

    logger.info('Initializing database')
    db.init_app(app)
    db.app = app

    logger.info('Initializing minio_client')
    minio_client = Minio(app.config['MINIO_URL'],
                         access_key=app.config['MINIO_ACCESS_KEY'],
                         secret_key=app.config['MINIO_SECRET_KEY'],
                         secure=False)

    logger.info('Registering blueprints')
    from health import health_blueprint
    app.register_blueprint(health_blueprint)

    from bookings import bp as bookings_blueprint
    app.register_blueprint(bookings_blueprint)

    from devices import devices as devices_blueprint
    app.register_blueprint(devices_blueprint)

    from files import files as files_bp
    app.register_blueprint(files_bp)

    from presets import presets as presets_blueprint
    app.register_blueprint(presets_blueprint)

    from rooms import rooms as rooms_blueprint
    app.register_blueprint(rooms_blueprint)

    from streams import streams as streams_blueprint
    app.register_blueprint(streams_blueprint)

    from streamviews import streamviews as streamviews_blueprint
    app.register_blueprint(streamviews_blueprint)

    return app


def Init(app: Quart):
    # enable cross-origin access
    app = cors(app)

    import models

    return app


async def PerformInitDB(app: Quart):
    """Create all tables."""
    async with app.app_context():
        logger.info('Creating tables')
        db.create_all(app=app)

        logger.info('Stamp most recent alembic version')
        alembic_command.stamp(alembic_Config('./app/migrations/alembic.ini'),
                              'head')
        logger.info('Creating tables: Done')


def InitDB() -> None:
    app = App()

    asyncio.run(PerformInitDB(app))


async def PerformSchemaMigrate(app: Quart, revision: str):
    """Create all tables."""
    async with app.app_context():
        logger.info('Performing schema migration')
        this_dir = os.path.dirname(os.path.realpath(__file__))
        cfg_file = os.path.join(this_dir, 'migrations/alembic.ini')
        alembic_command.upgrade(alembic_Config(cfg_file), revision)
        logger.info('Performing schema migration: Done')


def SchemaMigrate(revision: str) -> None:
    app = App()

    asyncio.run(PerformSchemaMigrate(app, revision))
