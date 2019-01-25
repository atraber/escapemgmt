# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from datetime import datetime
from flask import Blueprint, request, Response, jsonify

from app import db
from app.models import Device, DeviceStream, Preset, Stream

devices = Blueprint('devices', __name__)

@devices.route('/devices', methods = ['GET'])
def apiDevices():
    #devices = db.session.query(Device).order_by(Device.name).filter(Device.streams.preset.any(active=True)).all()
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


def _StreamsCompare(new, old):
    """Finds streams added and removed.

    Both parameters must be list of ids.

    Returns a tuple of two lists: added, removed.
    """
    added = []
    removed = []

    new_set = set()
    for n in new:
        new_set.add(n)

    old_set = set()
    for o in old:
        old_set.add(o)

    for n in new:
        if n in old_set:
            continue
        added.append(n)

    for o in old:
        if o in new_set:
            continue
        removed.append(o)

    return (added, removed)


@devices.route('/devices/<int:deviceid>', methods = ['POST', 'DELETE'])
def apiDeviceUpdate(deviceid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_preset = db.session.query(Preset).filter_by(active=True).first()

            if not db_preset:
                # TODO: Logging
                pass

            db_device = db.session.query(Device).filter_by(id=deviceid).first()
            db_device.name = request.json['name']
            db_device.mac = request.json['mac']
            db_device.screen_enable = request.json['screen_enable']

            (streams_added, streams_removed) = _StreamsCompare(
                    [stream['id'] for stream in request.json['streams']],
                    [stream.id for stream in db_device.streams])

            for stream_id in streams_removed:
                db.session.query(DeviceStream).filter_by(
                        stream_id=stream_id,
                        device_id=db_device.id,
                        preset_id=db_preset.id).first().delete()

            for stream_id in streams_added:
                device_stream = DeviceStream(device=db_device, preset=db_preset,
                                             stream_id=stream_id)
                db.session.add(device_stream)

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
