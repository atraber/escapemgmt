# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from app import db
from datetime import datetime

class DeviceStreams(db.Model):
    __tablename__ = 'device_streams'

    device_id = db.Column(db.Integer, db.ForeignKey('devices.id'), primary_key=True, nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey('streams.id'), primary_key=True, nullable=False)
    preset_id = db.Column(db.Integer, db.ForeignKey('presets.id'), primary_key=True, nullable=False)
    preset = db.relationship('Preset')


class Device(db.Model):
    __tablename__ = 'devices'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20))
    mac = db.Column(db.String(17), unique=True)
    screen_enable = db.Column(db.Boolean, default=True, nullable=False)
    last_seen = db.Column(db.Integer)
    streams = db.relationship('Stream',
            primaryjoin='and_(Device.id == device_streams.c.device_id, Preset.active == 1)',
            secondary='join(device_streams, Stream, device_streams.c.stream_id == Stream.id)'
                      '.join(Preset, device_streams.c.preset_id == Preset.id)',
            backref='devices')

    def __init__(self, id=None, name=None, mac=None, screen_enable=True):
        self.id = id
        self.name = name
        self.mac = mac
        self.screen_enable = screen_enable

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'mac': self.mac,
            'screen_enable': self.screen_enable,
            'last_seen': self.last_seen,
            'streams': [s.serialize() for s in self.streams],
        }

class Stream(db.Model):
    __tablename__ = 'streams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20))
    url = db.Column(db.String(255))
    crop_x1 = db.Column(db.Integer, nullable=False)
    crop_x2 = db.Column(db.Integer, nullable=False)
    crop_y1 = db.Column(db.Integer, nullable=False)
    crop_y2 = db.Column(db.Integer, nullable=False)
    orientation = db.Column(db.Integer)

    def __init__(self, id=None, name=None, url=None, orientation=0, crop_x1=0, crop_y1=0, crop_x2=1080, crop_y2=720):
        self.id = id
        self.name = name
        self.url = url
        self.crop_x1 = crop_x1
        self.crop_x2 = crop_x2
        self.crop_y1 = crop_y1
        self.crop_y2 = crop_y2
        self.orientation = orientation

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'crop_x1': self.crop_x1,
            'crop_y1': self.crop_y1,
            'crop_x2': self.crop_x2,
            'crop_y2': self.crop_y2,
            'orientation': self.orientation,
        }

class Preset(db.Model):
    __tablename__ = 'presets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=False, nullable=False)

    def __init__(self, id=None, name=None, active=False):
        self.id = id
        self.name = name
        self.active = active

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'active': self.active,
        }


class Room(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    description = db.Column(db.Text)
    profile_image = db.Column(db.String(255))
    bg_image = db.Column(db.String(255))
    scores = db.relationship("Score", order_by="Score.time")

    def __init__(self, id=None, name=None):
        self.id = id
        self.name = name

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'profile_image': self.profile_image,
            'bg_image': self.bg_image,
            'scores': [s.serialize() for s in self.scores],
        }

class Score(db.Model):
    __tablename__ = 'scores'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))
    time = db.Column(db.Integer)
    created_at = db.Column(db.Integer)

    def __init__(self, id=None, name=None, time=None, room=None, created_at=None):
        self.id = id
        self.name = name

        if room is None:
            raise Exception("room cannot be empty")
        self.room_id = room.id

        self.time = time

        if created_at is None:
            self.created_at = int(datetime.now().timestamp())
        else:
            self.created_at = created_at

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'time': self.time,
            'created_at': self.created_at
        }
