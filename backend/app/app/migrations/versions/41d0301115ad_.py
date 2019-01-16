"""empty message

Revision ID: 41d0301115ad
Revises: c1cfeb3e688e
Create Date: 2019-01-16 22:24:21.477488

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import mysql

from app.models import Stream

# revision identifiers, used by Alembic.
revision = '41d0301115ad'
down_revision = 'c1cfeb3e688e'
branch_labels = None
depends_on = None


def upgrade():
    # Schema Migration
    op.create_table('presets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.alter_column('devices', 'screen_enable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=False)
    op.add_column('streams', sa.Column('active', sa.Boolean(), nullable=False))
    op.add_column('streams', sa.Column('preset_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'streams', 'presets', ['preset_id'], ['id'])

    bind = op.get_bind()
    session = orm.Session(bind=bind)

    # Data Migration
    session.query(Stream)
    streams = session.query(Stream).all()
    for stream in streams:
        stream.active = True
    session.add_all(streams)
    session.commit()


def downgrade():
    op.drop_constraint('streams_ibfk_1', 'streams', type_='foreignkey')
    op.drop_column('streams', 'preset_id')
    op.drop_column('streams', 'active')
    op.alter_column('devices', 'screen_enable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=True)
    op.drop_table('presets')
