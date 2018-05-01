from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine(
#    'mysql+pymysql://raspimgmt:raspberrypi@192.168.0.150/raspimgmt?charset=utf8',
    'mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8',
    connect_args = {
        'port': 3306
    },
    echo='debug',
#    echo_pool=True
)

db_session = scoped_session(
    sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False
    )
)

Base = declarative_base()

def init_db():
    import db.models
    Base.metadata.create_all(engine)

    from db.models import Device, Stream, Room, Score
    db_session.add_all([
        Device(name='admin'),
        Device(name='test'),
        Stream(name='test'),
        Stream(name='test2'),
        Stream(name='test4'),
        Room(name='Die geheimnisvolle Bibliothek'),
        Room(name='Auf Houdini\'s Spuren'),
        Room(name='Das Gefängnis'),
        Room(name='Das Labor'),
    ])
    db_session.commit()

    bib = db_session.query(Room).filter_by(name='Die geheimnisvolle Bibliothek').first()
    db_session.add(Score(name='Michel', time=60*13, room=bib))
    db_session.add(Score(name='Globi', time=60*45, room=bib))
    db_session.add(Score(name='Ale', time=60*55, room=bib))
    db_session.add(Score(name='Alice', time=60*10, room=bib))
    db_session.add(Score(name='Dom', time=60*5, room=bib))
    db_session.commit()

    print('Initialized the database.')
