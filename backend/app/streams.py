from flask import Blueprint, request, Response, jsonify

from app import db
from .models import Stream

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
    else:
        abort(400)
    return jsonify(stream.serialize())

@streams.route('/streams/<int:streamid>', methods = ['POST', 'DELETE'])
def apiStreamUpdate(streamid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_stream = db.session.query(Stream).filter_by(id=streamid).first()
            db_stream.name = request.json['name']
            db_stream.url = request.json['url']
            db_stream.width = request.json['width']
            db_stream.height = request.json['height']
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