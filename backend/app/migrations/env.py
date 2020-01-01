from __future__ import with_statement
from alembic import context
from sqlalchemy import engine_from_config, pool
from logging.config import fileConfig
import logging

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

### HACK ###
target_metadata = None
try:
    from app import db
except ModuleNotFoundError:
    import os
    import sys
    # To ensure that the app will be found, add its path to the Python path.
    app_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..'))
    sys.path.insert(0, app_path)
    from app import App, db
    app = App()
    db.app = app
### HACK END ###

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
if target_metadata is None:
    target_metadata = db.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    # this callback is used to prevent an auto-migration from being generated
    # when there are no changes to the schema
    # reference: http://alembic.zzzcomputing.com/en/latest/cookbook.html
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')

    engine = db.engine

    connection = engine.connect()
    context.configure(connection=connection,
                      target_metadata=target_metadata,
                      process_revision_directives=process_revision_directives)

    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()

if context.is_offline_mode():
    raise Exception('Offline mode is not supported')
else:
    run_migrations_online()
