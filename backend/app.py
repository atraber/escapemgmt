#!/usr/bin/env python3
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from datetime import datetime
from db.database import db_session
from db.models import Device, Stream, Room, Score
import sys

app = Flask(__name__)
CORS(app)

@app.teardown_appcontext
def shutdown_dbsession(exception=None):
    db_session.remove()

@app.route('/streams', methods = ['GET'])
def apiStreams():
    streams = db_session.query(Stream).all()
    return jsonify([s.serialize() for s in streams])

@app.route('/stream', methods = ['POST'])
def apiStreamAdd():
    if request.headers['Content-Type'] == 'application/json':
        stream = Stream(
            name = request.json['name']
        )
        db_session.add(stream)
        db_session.commit()
    else:
        abort(400)
    return jsonify(stream.serialize())

@app.route('/streams/<int:streamid>', methods = ['POST', 'DELETE'])
def apiStreamUpdate(streamid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_stream = db_session.query(Stream).filter_by(id=streamid).first()
            db_stream.name = request.json['name']
            db_stream.url = request.json['url']
            db_stream.width = request.json['width']
            db_stream.height = request.json['height']
            db_stream.orientation = request.json['orientation']
            db_session.commit()
            return jsonify(db_stream.serialize())
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db_session.query(Stream).filter_by(id=streamid).delete()
            db_session.commit()
            return jsonify('ok')
        abort(400)

@app.route('/devices', methods = ['GET'])
def apiDevices():
    devices = db_session.query(Device).all()
    return jsonify([d.serialize() for d in devices])

@app.route('/device', methods = ['POST'])
def apiDeviceAdd():
    if request.headers['Content-Type'] == 'application/json':
        device = Device(
            name = request.json['name']
        )
        db_session.add(device)
        db_session.commit()
    else:
        abort(400)
    return jsonify(device.serialize())

@app.route('/devices/<int:deviceid>', methods = ['POST', 'DELETE'])
def apiDeviceUpdate(deviceid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_device = db_session.query(Device).filter_by(id=deviceid).first()
            db_device.name = request.json['name']
            db_device.mac = request.json['mac']
            db_device.screen_enable = request.json['screen_enable']

            db_device.streams = []
            for stream in request.json['streams']:
                db_stream = db_session.query(Stream).filter_by(id=stream['id']).first()
                db_device.streams.append(db_stream)

            db_session.commit()
            return jsonify('ok')
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db_session.query(Device).filter_by(id=deviceid).delete()
            db_session.commit()
            return jsonify('ok')
        abort(400)

@app.route('/devices/screen_on', methods = ['GET'])
def apiDevicesScreenOn():
    devices = db_session.query(Device).all()

    for device in devices:
        device.screen_enable = True

    db_session.commit()
    return jsonify("ok")

@app.route('/devices/screen_off', methods = ['GET'])
def apiDevicesScreenOff():
    devices = db_session.query(Device).all()

    for device in devices:
        device.screen_enable = False

    db_session.commit()
    return jsonify("ok")

def number_to_mac(n):
    arr = []
    for i in range(5, -1, -1):
        k = (n >> (8 * i)) & 0xFF
        arr.append("{:02X}".format(k))
    return '-'.join(arr)

@app.route('/raspi/<int:mac>', methods = ['GET'])
def apiRaspi(mac):
    mac = number_to_mac(mac)
    device = db_session.query(Device).filter_by(mac=mac).first()

    if device is None:
        device = Device(name="Unknown", mac=mac)
        db_session.add(device)

    device.last_seen = int(datetime.now().timestamp())
    db_session.commit()
    return jsonify(device.serialize())

@app.route('/rooms', methods = ['GET'])
def apiRooms():
    rooms = db_session.query(Room).all()
    return jsonify([s.serialize() for s in rooms])

@app.route('/room', methods = ['POST'])
def apiRoomAdd():
    if request.headers['Content-Type'] == 'application/json':
        room = Room(
            name = request.json['name'],
        )
        db_session.add(room)
        db_session.commit()
    else:
        abort(400)
    return jsonify(room.serialize())

@app.route('/rooms/<int:roomid>', methods = ['POST', 'DELETE'])
def apiRoomUpdate(roomid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_room = db_session.query(Room).filter_by(id=roomid).first()
            db_room.name = request.json['name']
            db_room.description = request.json['description']
            db_room.profile_image = request.json['profile_image']
            db_room.bg_image = request.json['bg_image']
            db_session.commit()
            return jsonify(db_room.serialize())
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db_session.query(Room).filter_by(id=roomid).delete()
            db_session.commit()
            return jsonify('ok')
        abort(400)

@app.route('/rooms/<int:roomid>/score', methods = ['POST'])
def apiRoomAddScore(roomid):
    if request.headers['Content-Type'] == 'application/json':
        db_room = db_session.query(Room).filter_by(id=roomid).first()
        score = Score(
            name = request.json['name'],
            time = request.json['time'],
            room = db_room,
        )
        db_session.add(score)
        db_session.commit()
    else:
        abort(400)
    return jsonify(score.serialize())

@app.route('/rooms/<int:roomid>/scores/<int:scoreid>', methods = ['DELETE'])
def apiRoomDeleteScore(roomid, scoreid):
    if request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db_room = db_session.query(Room).filter_by(id=roomid).first()
            db_session.query(Score).filter_by(id=scoreid, room_id=db_room.id).delete()
            db_session.commit()
            return jsonify('ok')
    abort(400)
