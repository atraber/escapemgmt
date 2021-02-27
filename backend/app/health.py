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
    if db.session.bind.dialect.name == 'postgresql':
        result = engine.execute('SELECT pg_is_in_recovery();').first()[0]
        if result:
            logger.info('pg_is_in_recovery: {}'.format(result))
            engine.dispose()
            abort(503)
    return jsonify('ok')
