# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, request, Response, jsonify

from app import db
from models import Stream

streams = Blueprint('streams', __name__)


@streams.route('/streams', methods=['GET'])
async def apiStreams():
    streams = db.session.query(Stream).order_by(Stream.name).all()
    return jsonify([s.serialize() for s in streams])


@streams.route('/stream', methods=['POST'])
async def apiStreamAdd():
    if request.headers['Content-Type'] == 'application/json':
        try:
            stream = Stream(name=(await request.json)['name'])
            db.session.add(stream)
            db.session.commit()
            return jsonify(stream.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    else:
        abort(400)


@streams.route('/streams/<int:streamid>', methods=['POST', 'DELETE'])
async def apiStreamUpdate(streamid: int):
    if request.method == 'POST' and request.headers[
            'Content-Type'] == 'application/json':
        try:
            data_json = await request.json
            db_stream = db.session.query(Stream).filter_by(id=streamid).first()
            db_stream.name = data_json['name']
            db_stream.orientation = data_json['orientation']
            db.session.commit()
            return jsonify(db_stream.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    elif request.method == 'DELETE':
        try:
            db.session.query(Stream).filter_by(id=streamid).delete()
            db.session.commit()
            return jsonify('ok')
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)
