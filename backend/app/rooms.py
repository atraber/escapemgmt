# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from datetime import datetime
from quart import abort, Blueprint, request, jsonify

from app import db
from models import Room, Score

rooms = Blueprint('rooms', __name__)


@rooms.route('/rooms', methods=['GET'])
async def apiRooms():
    rooms = db.session.query(Room).all()
    return jsonify([s.serialize() for s in rooms])


@rooms.route('/room', methods=['POST'])
async def apiRoomAdd():
    if request.headers['Content-Type'] == 'application/json':
        try:
            room = Room(name=(await request.json)['name'], )
            db.session.add(room)
            db.session.commit()
            return jsonify(room.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)


@rooms.route('/rooms/<int:roomid>', methods=['POST', 'DELETE'])
async def apiRoomUpdate(roomid: int):
    if request.method == 'POST' and request.headers[
            'Content-Type'] == 'application/json':
        try:
            data_json = await request.json
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            db_room.name = data_json['name']
            db_room.description = data_json['description']
            db_room.bg_image = data_json['bg_image']
            db_room.profile_image = data_json['profile_image']

            # Using ; in tags is not allowed.
            for tag in data_json['tags']:
                if ';' in tag:
                    abort(400)
            # tags get joined together with ; as their delimiter.
            db_room.tags = ';'.join(data_json['tags'])
            db.session.commit()
            return jsonify(db_room.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    elif request.method == 'DELETE':
        try:
            db.session.query(Room).filter_by(id=roomid).delete()
            db.session.commit()
            return jsonify('ok')
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)


@rooms.route('/rooms/<int:roomid>/score', methods=['POST'])
async def apiRoomAddScore(roomid: int):
    if request.headers['Content-Type'] == 'application/json':
        try:
            data_json = await request.json
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            score = Score(
                name=data_json['name'],
                time=data_json['time'],
                room=db_room,
            )
            db.session.add(score)
            db.session.commit()
            return jsonify(score.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)


@rooms.route('/rooms/<int:roomid>/scores/<int:scoreid>',
             methods=['POST', 'DELETE'])
async def apiRoomUpdateScore(roomid: int, scoreid: int):
    if request.method == 'POST' and request.headers[
            'Content-Type'] == 'application/json':
        try:
            data_json = await request.json
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            db_score = db.session.query(Score).filter_by(
                id=scoreid, room_id=db_room.id).first()
            db_score.name = data_json['name']
            db_score.time = data_json['time']
            db.session.commit()
            return jsonify(db_room.serialize())
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    elif request.method == 'DELETE':
        try:
            db_room = db.session.query(Room).filter_by(id=roomid).first()
            db.session.query(Score).filter_by(id=scoreid,
                                              room_id=db_room.id).delete()
            db.session.commit()
            return jsonify('ok')
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)
