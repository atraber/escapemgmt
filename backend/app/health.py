# Copyright 2021 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, jsonify

from app import db
from logger import logger

health_blueprint = Blueprint('health', __name__)


@health_blueprint.route('/health', methods=['GET'])
async def health():
    engine = db.engine
    engine.execute('SELECT 1;')
    print('dialect name: {}'.format(db.session.bind.dialect.name))
    if db.session.bind.dialect.name in ('postgresql', 'postgres'):
        result = engine.execute('SELECT pg_is_in_recovery();').first()[0]
        if result:
            logger.info('pg_is_in_recovery: {}'.format(result))
            engine.dispose()
            abort(503)
    return jsonify('ok')
