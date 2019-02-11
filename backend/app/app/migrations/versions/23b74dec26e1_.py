"""empty message

Revision ID: 23b74dec26e1
Revises: 16370610cea6
Create Date: 2019-02-09 12:00:54.543548

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import mysql

from app.models import Stream
from app.models import StreamView

# revision identifiers, used by Alembic.
revision = '23b74dec26e1'
down_revision = '16370610cea6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('streamviews',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('stream_id', sa.Integer(), nullable=True),
    sa.Column('url', sa.String(length=255), nullable=True),
    sa.Column('crop_x1', sa.Integer(), nullable=False),
    sa.Column('crop_x2', sa.Integer(), nullable=False),
    sa.Column('crop_y1', sa.Integer(), nullable=False),
    sa.Column('crop_y2', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['stream_id'], ['streams.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(None, 'device_streams', 'presets', ['preset_id'], ['id'])
    op.alter_column('devices', 'screen_enable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=False)

    # Data Migration
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    streams = session.query(Stream).all()
    for stream in streams:
        streamview = StreamView(
            stream_id=stream.id,
            url=stream.url,
            crop_x1=stream.crop_x1,
            crop_x2=stream.crop_x2,
            crop_y1=stream.crop_y1,
            crop_y2=stream.crop_y2,
        )
        session.add(streamview)
    session.commit()

    # Remove old columns
    op.drop_column('streams', 'crop_x1')
    op.drop_column('streams', 'url')
    op.drop_column('streams', 'crop_y2')
    op.drop_column('streams', 'crop_x2')
    op.drop_column('streams', 'crop_y1')


def downgrade():
    op.add_column('streams', sa.Column('crop_y1', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.add_column('streams', sa.Column('crop_x2', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.add_column('streams', sa.Column('crop_y2', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.add_column('streams', sa.Column('url', mysql.VARCHAR(length=255), nullable=True))
    op.add_column('streams', sa.Column('crop_x1', mysql.INTEGER(display_width=11), autoincrement=False, nullable=False))
    op.alter_column('devices', 'screen_enable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=True)
    op.drop_constraint(None, 'device_streams', type_='foreignkey')
    op.drop_table('streamviews')
