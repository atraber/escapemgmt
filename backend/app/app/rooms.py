# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from datetime import datetime
from quart import abort, Blueprint, request, jsonify

from app import db
from app.models import Room, Score


rooms = Blueprint('rooms', __name__)


@rooms.route('/rooms', methods = ['GET'])
def apiRooms():
    rooms = db.session.query(Room).all()
    return jsonify([s.serialize() for s in rooms])


@rooms.route('/room', methods = ['POST'])
def apiRoomAdd():
    if request.headers['Content-Type'] == 'application/json':
        room = Room(
            name = request.json['name'],
        )
        db.session.add(room)
        db.session.commit()
    else:
        abort(400)
    return jsonify(room.serialize())


@rooms.route('/rooms/<int:roomid>', methods = ['POST', 'DELETE'])
def apiRoomUpdate(roomid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            db_room.name = request.json['name']
            db_room.description = request.json['description']
            db_room.profile_image = request.json['profile_image']
            db_room.bg_image = request.json['bg_image']
            db.session.commit()
            return jsonify(db_room.serialize())
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db.session.query(Room).filter_by(id=roomid).delete()
            db.session.commit()
            return jsonify('ok')
        abort(400)


@rooms.route('/rooms/<int:roomid>/score', methods = ['POST'])
def apiRoomAddScore(roomid: int):
    if request.headers['Content-Type'] == 'application/json':
        db_room = db.session.query(Room).filter_by(id=roomid).first()
        score = Score(
            name = request.json['name'],
            time = request.json['time'],
            room = db_room,
        )
        db.session.add(score)
        db.session.commit()
    else:
        abort(400)
    return jsonify(score.serialize())


@rooms.route('/rooms/<int:roomid>/scores/<int:scoreid>', methods = ['DELETE'])
def apiRoomDeleteScore(roomid: int, scoreid: int):
    if request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            db.session.query(Score).filter_by(id=scoreid, room_id=db_room.id).delete()
            db.session.commit()
            return jsonify('ok')
    abort(400)
