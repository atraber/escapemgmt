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
        data_json = (await request.json)
        device = Device(
            name=data_json['name'],
            mac=data_json['mac'],
        )
        db.session.add(device)
        db.session.commit()
    else:
        abort(400)
    return jsonify(device.serialize())


def _FilterDeviceStreamsByPG(ds: List[DeviceStream],
                             presets: List[Preset]) -> List[DeviceStream]:
    # TODO: Filter!
    presetIds = set()
    for p in presets:
        presetIds.add(p.id)
    return [d for d in ds if d.preset_id in presetIds]


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


def _DeviceStreamsCompare(new: List[DeviceStream], old: List[DeviceStream]):
    """Finds streams added and removed.

    Both parameters must be list of DeviceStream.

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
        if n not in old_set:
            added.append(n)

    for o in old:
        if o not in new_set:
            removed.append(o)

    return (added, removed)


def _JsonToDeviceStreams(data) -> List[DeviceStream]:
    arr = []
    for d in data:
        arr.append(
            DeviceStream(device_id=d['device_id'],
                         preset_id=d['preset_id'],
                         stream_id=d['stream_id']))
    return arr


@devices.route('/devices/<int:deviceid>', methods=['POST', 'DELETE'])
async def apiDeviceUpdate(deviceid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            data_json = await request.json

            db_device = db.session.query(Device).filter_by(id=deviceid).first()
            db_device.name = data_json['name']
            db_device.mac = data_json['mac']
            db_device.screen_enable = data_json['screen_enable']
            db_device.preset_group_id = data_json['preset_group_id']

            db_presets = db.session.query(Preset).filter_by(
                preset_group_id=db_device.preset_group_id).all()
            device_streams = _FilterDeviceStreamsByPG(
                _JsonToDeviceStreams(data_json['device_streams']), db_presets)

            (streams_added,
             streams_removed) = _DeviceStreamsCompare(device_streams,
                                                      db_device.device_streams)

            for ds in streams_removed:
                logger.info(
                    'Removing DeviceStream for device_id {}, preset_id {}, stream_id {}'
                    .format(ds.device_id, ds.preset_id, ds.stream_id))
                db.session.query(DeviceStream).filter_by(
                    device_id=ds.device_id,
                    preset_id=ds.preset_id,
                    stream_id=ds.stream_id).delete()

            for ds in streams_added:
                logger.info(
                    'Adding DeviceStream for device_id {}, preset_id {}, stream_id {}'
                    .format(ds.device_id, ds.preset_id, ds.stream_id))
                db.session.add(ds)

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
