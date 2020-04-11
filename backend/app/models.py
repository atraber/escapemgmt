# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from app import db
from datetime import datetime
import copy
import sqlalchemy as sa
import sqlalchemy.orm as orm


class DeviceStream(db.Model):  # type: ignore
    __tablename__ = 'device_streams'
    device_id = sa.Column(sa.Integer,
                          sa.ForeignKey('devices.id', ondelete='CASCADE'),
                          primary_key=True)
    preset_id = sa.Column(sa.Integer,
                          sa.ForeignKey('presets.id', ondelete='CASCADE'),
                          primary_key=True)
    stream_id = sa.Column(sa.Integer,
                          sa.ForeignKey('streams.id', ondelete='CASCADE'),
                          primary_key=True)

    device = orm.relationship('Device', backref='device_streams')
    preset = orm.relationship('Preset', backref='device_streams')
    stream = orm.relationship('Stream', backref='device_streams')

    def __init__(self,
                 device=None,
                 device_id=None,
                 stream=None,
                 stream_id=None,
                 preset=None,
                 preset_id=None):
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

    def __hash__(self):
        return hash('{}:{}:{}'.format(self.device_id, self.preset_id,
                                      self.stream_id))

    def __eq__(self, other):
        """checking equality"""
        if isinstance(other, self.__class__):
            return self.device_id == other.device_id and self.preset_id == other.preset_id and self.stream_id == other.stream_id
        return NotImplemented

    def serialize(self):
        return {
            'device_id': self.device_id,
            'preset_id': self.preset_id,
            'stream_id': self.stream_id,
        }

    def __repr__(self):
        return "<DeviceStream: device_id: {}, preset_id: {}, stream_id: {}>".format(
            self.device_id, self.preset_id, self.stream_id)


class Device(db.Model):  # type: ignore
    __tablename__ = 'devices'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(20))
    mac = sa.Column(sa.String(17), unique=True)
    screen_enable = sa.Column(sa.Boolean, default=True, nullable=False)
    last_seen = sa.Column(sa.Integer)
    preset_group_id = sa.Column(sa.Integer,
                                sa.ForeignKey('presetgroups.id',
                                              ondelete='SET NULL'),
                                nullable=True)

    # TODO: Should remove this at some point. It is only used on the Raspberry
    # Pis anyways.
    streams = orm.relationship(
        'Stream',
        primaryjoin=
        'and_(Device.id == device_streams.c.device_id, Preset.active == True)',
        secondary=
        'join(device_streams, Stream, device_streams.c.stream_id == Stream.id)'
        '.join(Preset, device_streams.c.preset_id == Preset.id)',
        backref='devices',
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
            'device_streams': [s.serialize() for s in self.device_streams],
            'preset_group_id': self.preset_group_id,
        }


class Stream(db.Model):  # type: ignore
    __tablename__ = 'streams'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(20))
    orientation = sa.Column(sa.Integer)
    streamviews = orm.relationship('StreamView', cascade='delete')

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
    stream_id = sa.Column(sa.Integer,
                          sa.ForeignKey('streams.id', ondelete='CASCADE'))
    url = sa.Column(sa.String(255))
    crop_x1 = sa.Column(sa.Integer, nullable=False)
    crop_x2 = sa.Column(sa.Integer, nullable=False)
    crop_y1 = sa.Column(sa.Integer, nullable=False)
    crop_y2 = sa.Column(sa.Integer, nullable=False)

    def __init__(self,
                 stream,
                 id=None,
                 url=None,
                 crop_x1=0,
                 crop_y1=0,
                 crop_x2=1080,
                 crop_y2=720):
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


class PresetGroup(db.Model):  # type: ignore
    __tablename__ = 'presetgroups'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100), nullable=False)
    presets = orm.relationship('Preset')

    def __init__(self, id=None, name=None):
        self.id = id
        self.name = name

    def serialize(self):
        out = {
            'id': self.id,
            'name': self.name,
        }

        return out


class Preset(db.Model):  # type: ignore
    __tablename__ = 'presets'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    active = sa.Column(sa.Boolean, default=False, nullable=False)
    preset_group_id = sa.Column(sa.Integer,
                                sa.ForeignKey('presetgroups.id',
                                              ondelete='CASCADE'),
                                nullable=False)

    # TODO: Figure out if this is still necessary. We renamed our own field to streams_bar for now.
    streams = orm.relationship(
        'Stream',
        primaryjoin='Preset.id == device_streams.c.preset_id',
        secondary=
        'join(device_streams, Stream, device_streams.c.stream_id == Stream.id)',
        viewonly=True,
        lazy='select')

    def __init__(self, id=None, name=None, active=False, preset_group_id=None):
        self.id = id
        self.name = name
        self.active = active
        self.preset_group_id = preset_group_id

    def serialize(self):
        out = {
            'id': self.id,
            'name': self.name,
            'active': self.active,
            'preset_group_id': self.preset_group_id,
        }

        return out


class Room(db.Model):  # type: ignore
    __tablename__ = 'rooms'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    # TODO: Make this not nullable
    description = sa.Column(sa.Text)
    profile_image = sa.Column(sa.String(255))
    bg_image = sa.Column(sa.String(255))
    scores = orm.relationship("Score", order_by="Score.time")
    tags = sa.Column(sa.String(255), nullable=False)

    def __init__(self, id=None, name=None):
        self.id = id
        self.name = name
        self.tags = ""

    def _get_tags(self):
        if len(self.tags) == 0:
            return []
        else:
            return self.tags.split(';')

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'profile_image': self.profile_image,
            'bg_image': self.bg_image,
            'scores': [s.serialize() for s in self.scores],
            'tags': self._get_tags(),
        }


class Booking(db.Model):  # type: ignore
    __tablename__ = 'bookings'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    first_name = sa.Column(sa.String(100))
    room_id = sa.Column(sa.Integer,
                        sa.ForeignKey('rooms.id', ondelete='CASCADE'))
    # TODO: I'm not exactly sure what gets loaded here. If it is only Room
    # without the scores, this is fine. However, it seems it doubles the
    # query time for Bookings.
    room = orm.relationship('Room')
    slot_from = sa.Column(sa.Integer)
    slot_to = sa.Column(sa.Integer)
    created_at = sa.Column(sa.Integer)

    def __init__(self,
                 id=None,
                 first_name=None,
                 name=None,
                 room=None,
                 slot_from=None,
                 slot_to=None,
                 created_at=None):
        self.id = id
        self.first_name = first_name
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
    room_id = sa.Column(sa.Integer,
                        sa.ForeignKey('rooms.id', ondelete='CASCADE'))
    time = sa.Column(sa.Integer)
    created_at = sa.Column(sa.Integer)

    def __init__(self,
                 id=None,
                 name=None,
                 time=None,
                 room=None,
                 created_at=None):
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


class File(db.Model):  # type: ignore
    __tablename__ = 'files'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(100))
    content_type = sa.Column(sa.String(100))
    created_at = sa.Column(sa.Integer)

    def __init__(self, id=None, name=None, content_type=None, created_at=None):
        self.id = id

        if name is None:
            raise Exception("name cannot be empty")
        self.name = name

        if content_type is None:
            raise Exception("content_type cannot be empty")
        self.content_type = content_type

        if created_at is None:
            self.created_at = int(datetime.now().timestamp())
        else:
            self.created_at = created_at

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'content_type': self.content_type,
            'created_at': self.created_at
        }
