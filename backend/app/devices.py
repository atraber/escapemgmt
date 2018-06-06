from datetime import datetime
from flask import Blueprint, request, Response, jsonify

from app import db
from .models import Device, Stream

devices = Blueprint('devices', __name__)

@devices.route('/devices', methods = ['GET'])
def apiDevices():
    devices = db.session.query(Device).order_by(Device.name).all()
    return jsonify([d.serialize() for d in devices])

@devices.route('/device', methods = ['POST'])
def apiDeviceAdd():
    if request.headers['Content-Type'] == 'application/json':
        device = Device(
            name = request.json['name']
        )
        db.session.add(device)
        db.session.commit()
    else:
        abort(400)
    return jsonify(device.serialize())

@devices.route('/devices/<int:deviceid>', methods = ['POST', 'DELETE'])
def apiDeviceUpdate(deviceid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_device = db.session.query(Device).filter_by(id=deviceid).first()
            db_device.name = request.json['name']
            db_device.mac = request.json['mac']
            db_device.screen_enable = request.json['screen_enable']

            db_device.streams = []
            for stream in request.json['streams']:
                db_stream = db.session.query(Stream).filter_by(id=stream['id']).first()
                db_device.streams.append(db_stream)

            db.session.commit()
            return jsonify('ok')
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db.session.query(Device).filter_by(id=deviceid).delete()
            db.session.commit()
            return jsonify('ok')
        abort(400)

@devices.route('/devices/screen_on', methods = ['GET'])
def apiDevicesScreenOn():
    devices = db.session.query(Device).all()

    for device in devices:
        device.screen_enable = True

    db.session.commit()
    return jsonify("ok")

@devices.route('/devices/screen_off', methods = ['GET'])
def apiDevicesScreenOff():
    devices = db.session.query(Device).all()

    for device in devices:
        device.screen_enable = False

    db.session.commit()
    return jsonify("ok")

def number_to_mac(n):
    arr = []
    for i in range(5, -1, -1):
        k = (n >> (8 * i)) & 0xFF
        arr.append("{:02X}".format(k))
    return '-'.join(arr)

@devices.route('/raspi/<int:mac>', methods = ['GET'])
def apiRaspi(mac):
    mac = number_to_mac(mac)
    device = db.session.query(Device).filter_by(mac=mac).first()

    if device is None:
        device = Device(name="Unknown", mac=mac)
        db.session.add(device)

    device.last_seen = int(datetime.now().timestamp())
    db.session.commit()
    return jsonify(device.serialize())