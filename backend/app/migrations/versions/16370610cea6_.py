"""empty message

Revision ID: 16370610cea6
Revises: c1cfeb3e688e
Create Date: 2019-01-25 16:51:40.963815

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import mysql

from models import Preset
from models import Stream

# revision identifiers, used by Alembic.
revision = '16370610cea6'
down_revision = 'c1cfeb3e688e'
branch_labels = None
depends_on = None


def upgrade():
    # Scehma Migration
    op.create_table('presets', sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=True),
                    sa.Column('active', sa.Boolean(), nullable=False),
                    sa.PrimaryKeyConstraint('id'))
    op.add_column('device_streams',
                  sa.Column('preset_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'device_streams', 'presets', ['preset_id'],
                          ['id'])
    op.alter_column('devices',
                    'screen_enable',
                    existing_type=mysql.TINYINT(display_width=1),
                    nullable=False)

    # Data Migration
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    default_preset = Preset(name='Default')
    session.add(default_preset)

    streams = session.query(Stream).all()
    for stream in streams:
        stream.preset = default_preset
    session.add_all(streams)
    session.commit()


def downgrade():
    op.alter_column('devices',
                    'screen_enable',
                    existing_type=mysql.TINYINT(display_width=1),
                    nullable=True)
    op.drop_constraint('device_streams_ibfk_3',
                       'device_streams',
                       type_='foreignkey')
    op.drop_column('device_streams', 'preset_id')
    op.drop_table('presets')
