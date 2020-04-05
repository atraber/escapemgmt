# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, request, jsonify

from app import db
from logger import logger
from models import Device, Preset, PresetGroup

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
        return jsonify('ok')
    abort(400)


@presets.route('/presetgroups', methods=['GET'])
async def apiPresetGroups():
    presetGroups = db.session.query(PresetGroup).order_by(
        PresetGroup.name).all()
    return jsonify([s.serialize() for s in presetGroups])


@presets.route('/presetgroup', methods=['POST'])
async def apiPresetGroupCreate():
    if request.headers['Content-Type'] == 'application/json':
        pg = PresetGroup(name=(await request.json)['name'])
        db.session.add(pg)
        db.session.commit()
        return jsonify(pg.serialize())
    abort(400)


@presets.route('/presetgroups/<int:pgid>', methods=['POST', 'DELETE'])
async def apiPresetGroupUpdate(pgid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_pg = db.session.query(PresetGroup).filter_by(id=pgid).first()
            db_pg.name = (await request.json)['name']
            db.session.commit()
            return jsonify(db_pg.serialize())
    elif request.method == 'DELETE':
        db.session.query(PresetGroup).filter_by(id=pgid).delete()
        db.session.commit()
        return jsonify('ok')
    abort(400)
