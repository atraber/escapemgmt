"""empty message

Revision ID: 8ac926e61120
Revises: d2b871758c58
Create Date: 2020-04-11 12:28:16.581088

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8ac926e61120'
down_revision = 'd2b871758c58'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('bookings_ibfk_1', 'bookings', type_='foreignkey')
    op.create_foreign_key(None,
                          'bookings',
                          'rooms', ['room_id'], ['id'],
                          ondelete='CASCADE')
    op.drop_constraint('device_streams_ibfk_1',
                       'device_streams',
                       type_='foreignkey')
    op.drop_constraint('device_streams_ibfk_3',
                       'device_streams',
                       type_='foreignkey')
    op.drop_constraint('device_streams_ibfk_2',
                       'device_streams',
                       type_='foreignkey')
    op.create_foreign_key(None,
                          'device_streams',
                          'streams', ['stream_id'], ['id'],
                          ondelete='CASCADE')
    op.create_foreign_key(None,
                          'device_streams',
                          'presets', ['preset_id'], ['id'],
                          ondelete='CASCADE')
    op.create_foreign_key(None,
                          'device_streams',
                          'devices', ['device_id'], ['id'],
                          ondelete='CASCADE')
    op.add_column('devices',
                  sa.Column('preset_group_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None,
                          'devices',
                          'presetgroups', ['preset_group_id'], ['id'],
                          ondelete='SET NULL')
    op.drop_constraint('presets_ibfk_1', 'presets', type_='foreignkey')
    op.create_foreign_key(None,
                          'presets',
                          'presetgroups', ['preset_group_id'], ['id'],
                          ondelete='CASCADE')
    op.drop_constraint('scores_ibfk_1', 'scores', type_='foreignkey')
    op.create_foreign_key(None,
                          'scores',
                          'rooms', ['room_id'], ['id'],
                          ondelete='CASCADE')
    op.drop_constraint('streamviews_ibfk_1', 'streamviews', type_='foreignkey')
    op.create_foreign_key(None,
                          'streamviews',
                          'streams', ['stream_id'], ['id'],
                          ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'streamviews', type_='foreignkey')
    op.create_foreign_key('streamviews_ibfk_1', 'streamviews', 'streams',
                          ['stream_id'], ['id'])
    op.drop_constraint(None, 'scores', type_='foreignkey')
    op.create_foreign_key('scores_ibfk_1', 'scores', 'rooms', ['room_id'],
                          ['id'])
    op.drop_constraint(None, 'presets', type_='foreignkey')
    op.create_foreign_key('presets_ibfk_1', 'presets', 'presetgroups',
                          ['preset_group_id'], ['id'])
    op.drop_constraint(None, 'devices', type_='foreignkey')
    op.drop_column('devices', 'preset_group_id')
    op.drop_constraint(None, 'device_streams', type_='foreignkey')
    op.drop_constraint(None, 'device_streams', type_='foreignkey')
    op.drop_constraint(None, 'device_streams', type_='foreignkey')
    op.create_foreign_key('device_streams_ibfk_2', 'device_streams', 'streams',
                          ['stream_id'], ['id'])
    op.create_foreign_key('device_streams_ibfk_3', 'device_streams', 'presets',
                          ['preset_id'], ['id'])
    op.create_foreign_key('device_streams_ibfk_1', 'device_streams', 'devices',
                          ['device_id'], ['id'])
    op.drop_constraint(None, 'bookings', type_='foreignkey')
    op.create_foreign_key('bookings_ibfk_1', 'bookings', 'rooms', ['room_id'],
                          ['id'])
    # ### end Alembic commands ###
