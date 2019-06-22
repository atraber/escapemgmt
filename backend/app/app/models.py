# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from app import db
from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as orm


class DeviceStream(db.Model):  # type: ignore
    __tablename__ = 'device_streams'

    device_id = sa.Column(sa.Integer, sa.ForeignKey('devices.id'), primary_key=True, nullable=True)
    stream_id = sa.Column(sa.Integer, sa.ForeignKey('streams.id'), primary_key=True, nullable=True)
    preset_id = sa.Column(sa.Integer, sa.ForeignKey('presets.id'), primary_key=True, nullable=True)
    preset = orm.relationship('Preset')

    def __init__(self, device=None, device_id=None, stream=None,
            stream_id=None, preset=None, preset_id=None):
        if device is not None:
            self.device_id = device.id
        elif device_id is not None:
            self.device_id = device_id
        else:
            raise Exception('Need to specify either device or device_id')

        if stream is not None:
            self.stream_id = stream.id
        elif stream_id is not None:
            self.stream_id = stream_id
        else:
            raise Exception('Need to specify either stream or stream_id')

        if preset is not None:
            self.preset_id = preset.id
        elif preset_id is not None:
            self.preset_id = preset_id
        else:
            raise Exception('Need to specify either preset or preset_id')


class Device(db.Model):  # type: ignore
    __tablename__ = 'devices'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(20))
    mac = sa.Column(sa.String(17), unique=True)
    screen_enable = sa.Column(sa.Boolean, default=True, nullable=False)
    last_seen = sa.Column(sa.Integer)
    streams = orm.relationship('Stream',
            primaryjoin='and_(Device.id == device_streams.c.device_id, Preset.active == 1)',
            secondary='join(device_streams, Stream, device_streams.c.stream_id == Stream.id)'
                      '.join(Preset, device_streams.c.preset_id == Preset.id)',
            backref='devices',
            viewonly=True)

    presets_used = orm.relationship('Preset',
            primaryjoin='Device.id == device_streams.c.device_id',
            secondary='join(device_streams, Preset, device_streams.c.preset_id == Preset.id)',
            viewonly=True)

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
            'presets_used': [s.serialize(load_streams=True)
                for s in self.presets_used],
        }


class Stream(db.Model):  # type: ignore
    __tablename__ = 'streams'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(20))
    orientation = sa.Column(sa.Integer)
    streamviews = orm.relationship('StreamView')

    def __init__(self, id=None, name=None, orientation=0):
        self.id = id
        self.name = name
        self.orientation = orientation

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'orientation': self.orientation,
            'streamviews': [s.serialize() for s in self.streamviews],
        }


class StreamView(db.Model):  # type: ignore
    __tablename__ = 'streamviews'

    id = sa.Column(sa.Integer, primary_key=True)
    stream_id = sa.Column(sa.Integer, sa.ForeignKey('streams.id'))
    url = sa.Column(sa.String(255))
    crop_x1 = sa.Column(sa.Integer, nullable=False)
    crop_x2 = sa.Column(sa.Integer, nullable=False)
    crop_y1 = sa.Column(sa.Integer, nullable=False)
    crop_y2 = sa.Column(sa.Integer, nullable=False)

    def __init__(self, stream, id=None, url=None, crop_x1=0, crop_y1=0, crop_x2=1080, crop_y2=720):
        self.id = id
        self.stream_id = stream.id
        self.url = url
        self.crop_x1 = crop_x1
        self.crop_x2 = crop_x2
        self.crop_y1 = crop_y1
        self.crop_y2 = crop_y2

    def serialize(self):
        return {
            'id': self.id,
            'stream_id': self.stream_id,
            'url': self.url,
            'crop_x1': self.crop_x1,
            'crop_y1': self.crop_y1,
            'crop_x2': self.crop_x2,
            'crop_y2': self.crop_y2,
        }


class Preset(db.Model):  # type: ignore
    __tablename__ = 'presets'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    active = sa.Column(sa.Boolean, default=False, nullable=False)

    streams = orm.relationship('Stream',
            primaryjoin='Preset.id == device_streams.c.preset_id',
            secondary='join(device_streams, Stream, device_streams.c.stream_id == Stream.id)',
            viewonly=True, lazy='select')

    def __init__(self, id=None, name=None, active=False):
        self.id = id
        self.name = name
        self.active = active

    def serialize(self, load_streams=False):
        out = {
            'id': self.id,
            'name': self.name,
            'active': self.active,
        }

        if load_streams:
            out['streams'] = [s.serialize() for s in self.streams]

        return out


class Room(db.Model):  # type: ignore
    __tablename__ = 'rooms'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    description = sa.Column(sa.Text)
    profile_image = sa.Column(sa.String(255))
    bg_image = sa.Column(sa.String(255))
    scores = orm.relationship("Score", order_by="Score.time")

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


class Booking(db.Model):  # type: ignore
    __tablename__ = 'bookings'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    first_name = sa.Column(sa.String(100))
    room_id = sa.Column(sa.Integer, sa.ForeignKey('rooms.id'))
    # TODO: I'm not exactly sure what gets loaded here. If it is only Room
    # without the scores, this is fine. However, it seems it doubles the
    # query time for Bookings.
    room = orm.relationship('Room')
    slot_from = sa.Column(sa.Integer)
    slot_to = sa.Column(sa.Integer)
    created_at = sa.Column(sa.Integer)

    def __init__(self, id=None, first_name=None, name=None, room=None,
            slot_from=None, slot_to=None, created_at=None):
        self.id = id
        self.name = name

        if room is None:
            raise Exception("room cannot be empty")
        self.room = room
        self.room_id = room.id

        self.slot_from = slot_from
        self.slot_to = slot_to

        if created_at is None:
            self.created_at = int(datetime.now().timestamp())
        else:
            self.created_at = created_at

    def serialize(self):
        out = {
            'id': self.id,
            'name': self.name,
            'first_name': self.first_name,
            'slot_from': self.slot_from,
            'slot_to': self.slot_to,
            'created_at': self.created_at,
        }

        if self.room:
            out['room'] = {
                'id': self.room.id,
                'name': self.room.name,
            }

        return out


class Score(db.Model):  # type: ignore
    __tablename__ = 'scores'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    room_id = sa.Column(sa.Integer, sa.ForeignKey('rooms.id'))
    time = sa.Column(sa.Integer)
    created_at = sa.Column(sa.Integer)

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
