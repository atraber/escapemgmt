# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, request, jsonify

from app import db
from logger import logger
from models import Device, Preset
from pubsub import publish

presets = Blueprint('presets', __name__)


@presets.route('/presets', methods=['GET'])
async def apiPresets():
    presets = db.session.query(Preset).order_by(Preset.name).all()
    return jsonify([s.serialize() for s in presets])


@presets.route('/preset', methods=['POST'])
async def apiPresetAdd():
    if request.headers['Content-Type'] == 'application/json':
        preset = Preset(name=(await request.json)['name'])
        db.session.add(preset)
        db.session.commit()
        return jsonify(preset.serialize())
    abort(400)


@presets.route('/presets/<int:presetid>', methods=['POST', 'DELETE'])
async def apiPresetUpdate(presetid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_preset = db.session.query(Preset).filter_by(id=presetid).first()
            db_preset.name = (await request.json)['name']
            db.session.commit()
            return jsonify(db_preset.serialize())
    elif request.method == 'DELETE':
        db.session.query(Preset).filter_by(id=presetid).delete()
        db.session.commit()
        return jsonify('ok')
    abort(400)


@presets.route('/preset/activate/<int:presetid>', methods=['POST'])
async def apiPresetActivate(presetid: int):
    if request.headers['Content-Type'] == 'application/json':
        preset_old = db.session.query(Preset).filter_by(active=True).first()
        if preset_old:
            preset_old.active = False
        else:
            logger.error('No active preset found')

        preset_new = db.session.query(Preset).filter_by(id=presetid).first()
        preset_new.active = True

        # Activate all screens
        devices = db.session.query(Device).all()

        for device in devices:
            device.screen_enable = True

        db.session.commit()
        publish('devicesChanged')
        return jsonify('ok')
    abort(400)
