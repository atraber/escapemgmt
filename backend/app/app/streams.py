# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, request, Response, jsonify

from app import db
from app.models import Stream


streams = Blueprint('streams', __name__)


@streams.route('/streams', methods = ['GET'])
def apiStreams():
    streams = db.session.query(Stream).order_by(Stream.name).all()
    return jsonify([s.serialize() for s in streams])


@streams.route('/stream', methods = ['POST'])
def apiStreamAdd():
    if request.headers['Content-Type'] == 'application/json':
        stream = Stream(
            name = request.json['name']
        )
        db.session.add(stream)
        db.session.commit()
        return jsonify(stream.serialize())
    else:
        abort(400)


@streams.route('/streams/<int:streamid>', methods = ['POST', 'DELETE'])
def apiStreamUpdate(streamid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_stream = db.session.query(Stream).filter_by(id=streamid).first()
            db_stream.name = request.json['name']
            db_stream.url = request.json['url']
            db_stream.crop_x1 = request.json['crop_x1']
            db_stream.crop_x2 = request.json['crop_x2']
            db_stream.crop_y1 = request.json['crop_y1']
            db_stream.crop_y2 = request.json['crop_y2']
            db_stream.orientation = request.json['orientation']
            db.session.commit()
            return jsonify(db_stream.serialize())
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db.session.query(Stream).filter_by(id=streamid).delete()
            db.session.commit()
            return jsonify('ok')
        abort(400)
