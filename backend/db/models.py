from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from db.database import Base

device_streams_association_table = Table('device_streams', Base.metadata,
    Column('device_id', Integer, ForeignKey('devices.id')),
    Column('stream_id', Integer, ForeignKey('streams.id'))
)

class Device(Base):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    mac = Column(String(17))
    screen_enable = Column(Boolean)
    last_seen = Column(Integer)
    streams = relationship("Stream",
                    secondary=device_streams_association_table)

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

class Stream(Base):
    __tablename__ = 'streams'

    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    url = Column(String(255))
    width = Column(Integer)
    height = Column(Integer)
    orientation = Column(Integer)

    def __init__(self, id=None, name=None, url=None, orientation=0, width=1080, height=720):
        self.id = id
        self.name = name
        self.url = url
        self.width = width
        self.height = height
        self.orientation = orientation

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'width': self.width,
            'height': self.height,
            'orientation': self.orientation,
        }

class Room(Base):
    __tablename__ = 'rooms'

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    description = Column(Text)
    profile_image = Column(String(255))
    bg_image = Column(String(255))
    scores = relationship("Score", order_by="Score.time")

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

class Score(Base):
    __tablename__ = 'scores'

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    room_id = Column(Integer, ForeignKey('rooms.id'))
    time = Column(Integer)
    created_at = Column(Integer)

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
