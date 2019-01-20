# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from flask import Blueprint, request, Response, jsonify

from app import db
from app.models import Preset

presets = Blueprint('presets', __name__)

@presets.route('/presets', methods = ['GET'])
def apiPresets():
    presets = db.session.query(Preset).order_by(Preset.name).all()
    return jsonify([s.serialize() for s in presets])

@presets.route('/preset', methods = ['POST'])
def apiPresetAdd():
    if request.headers['Content-Type'] == 'application/json':
        preset = Preset(
            name = request.json['name']
        )
        db.session.add(preset)
        db.session.commit()
    else:
        abort(400)
    return jsonify(preset.serialize())

@presets.route('/presets/<int:presetid>', methods = ['POST', 'DELETE'])
def apiPresetUpdate(presetid):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            db_preset = db.session.query(Preset).filter_by(id=presetid).first()
            db_preset.name = request.json['name']
            db.session.commit()
            return jsonify(db_preset.serialize())
        abort(400)
    elif request.method == 'DELETE':
        if request.headers['Content-Type'] == 'application/json':
            db.session.query(Preset).filter_by(id=presetid).delete()
            db.session.commit()
            return jsonify('ok')
        abort(400)

@presets.route('/preset/activate/<int:presetid>', methods = ['POST'])
def apiPresetActivate(presetid):
    if request.headers['Content-Type'] == 'application/json':
        preset_new = db.session.query(Preset).filter_by(id=presetid).first()
        preset_new.active = True

        preset_old = db.session.query(Preset).filter_by(active=True).first()
        preset_old.active = False
        db.session.commit()
        return jsonify('ok')
    abort(400)
