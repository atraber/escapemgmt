# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from datetime import datetime
from quart import abort, Blueprint, request, jsonify
from typing import List

from app import db
from logger import logger
from models import Device, DeviceStream, Preset, Stream

devices = Blueprint('devices', __name__)


@devices.route('/devices', methods=['GET'])
async def apiDevices():
    devices = db.session.query(Device).order_by(Device.name).all()
    return jsonify([d.serialize() for d in devices])


@devices.route('/device', methods=['POST'])
async def apiDeviceAdd():
    if request.headers['Content-Type'] == 'application/json':
        device = Device(name=(await request.json)['name'])
        db.session.add(device)
        db.session.commit()
    else:
        abort(400)
    return jsonify(device.serialize())


def _StreamsCompare(new: List[int], old: List[int]):
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


def _PresetStreamsCompare(new: List[Preset], old: List[Preset]):
    """Finds streams added and removed.

    Both parameters must be list of Presets.

    Returns a tuple of two lists: added, removed.
    """
    added = []
    removed = []

    new_dict = {}
    for n in new:
        new_dict[n.id] = n

    old_dict = {}
    for o in old:
        old_dict[o.id] = o

    for n in new_dict.keys():
        np = new_dict[n]

        if n in old_dict.keys():
            op = old_dict[n]

            a, r = _StreamsCompare([stream.id for stream in np.streams],
                                   [stream.id for stream in op.streams_bar])

            for stream_added in a:
                added.append((n, stream_added))

            for stream_removed in r:
                removed.append((n, stream_removed))
        else:
            # No preset currently present, add all streams.
            for stream in np.streams:
                added.append((n, stream.id))

    for o in old_dict.keys():
        if o not in new_dict.keys():
            op = old_dict[o]
            # Preset is no longer there, but used to be, remove all of them.
            for stream in op.streams_bar:
                removed.append((n, stream.id))

    return (added, removed)


def _JsonToPresets(data) -> List[Preset]:
    presets = []
    for d in data:
        p = Preset(id=d['id'], name=d['name'], active=d['active'])

        for s in d['streams']:
            p.streams.append(Stream(id=s['id'], name=s['name']))

        presets.append(p)
    return presets


@devices.route('/devices/<int:deviceid>', methods=['POST', 'DELETE'])
async def apiDeviceUpdate(deviceid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            data_json = await request.json

            db_device = db.session.query(Device).filter_by(id=deviceid).first()
            db_device.name = data_json['name']
            db_device.mac = data_json['mac']
            db_device.screen_enable = data_json['screen_enable']

            (streams_added, streams_removed) = _PresetStreamsCompare(
                _JsonToPresets(data_json['presets_used']),
                db_device.presets_used())

            for preset_id, stream_id in streams_removed:
                logger.info(
                    'Removing DeviceStream for device_id {}, preset_id {}, stream_id {}'
                    .format(db_device.id, preset_id, stream_id))
                db.session.query(DeviceStream).filter_by(
                    device_id=db_device.id,
                    preset_id=preset_id,
                    stream_id=stream_id).delete()

            for preset_id, stream_id in streams_added:
                logger.info(
                    'Adding DeviceStream for device_id {}, preset_id {}, stream_id {}'
                    .format(db_device.id, preset_id, stream_id))
                device_stream = DeviceStream(device=db_device,
                                             preset_id=preset_id,
                                             stream_id=stream_id)
                db.session.add(device_stream)

            db.session.commit()
            return jsonify('ok')
        abort(400)
    elif request.method == 'DELETE':
        db.session.query(Device).filter_by(id=deviceid).delete()
        db.session.commit()
        return jsonify('ok')


@devices.route('/devices/screen_on', methods=['GET'])
def apiDevicesScreenOn():
    devices = db.session.query(Device).all()

    for device in devices:
        device.screen_enable = True

    db.session.commit()
    return jsonify("ok")


@devices.route('/devices/screen_off', methods=['GET'])
def apiDevicesScreenOff():
    devices = db.session.query(Device).all()

    for device in devices:
        device.screen_enable = False

    db.session.commit()
    return jsonify("ok")


def number_to_mac(n: int) -> str:
    arr = []
    for i in range(5, -1, -1):
        k = (n >> (8 * i)) & 0xFF
        arr.append("{:02X}".format(k))
    return '-'.join(arr)


@devices.route('/raspi/<int:mac>', methods=['GET'])
def apiRaspi(mac: int):
    mac_str = number_to_mac(mac)
    device = db.session.query(Device).filter_by(mac=mac_str).first()

    if device is None:
        device = Device(name="Unknown", mac=mac_str)
        db.session.add(device)

    device.last_seen = int(datetime.now().timestamp())
    db.session.commit()
    return jsonify(device.serialize())
