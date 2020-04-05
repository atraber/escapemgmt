"""empty message

Revision ID: d2b871758c58
Revises: c91278fbb7db
Create Date: 2020-04-04 13:06:35.796295

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import mysql
from models import Preset, PresetGroup

# revision identifiers, used by Alembic.
revision = 'd2b871758c58'
down_revision = 'c91278fbb7db'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('presetgroups',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.PrimaryKeyConstraint('id'))
    op.add_column('presets',
                  sa.Column('preset_group_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'presets', 'presetgroups', ['preset_group_id'],
                          ['id'])

    # Data Migration
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    presetGroup = PresetGroup(name='Default')
    session.add(presetGroup)
    session.commit()

    presetGroups = session.query(PresetGroup).all()

    presets = session.query(Preset).all()
    for preset in presets:
        preset.preset_group_id = presetGroups[0].id
    session.add_all(presets)
    session.commit()

    op.alter_column('presets',
                    'preset_group_id',
                    existing_type=sa.Integer(),
                    nullable=False)


def downgrade():
    op.drop_constraint(None, 'presets', type_='foreignkey')
    op.drop_column('presets', 'preset_group_id')
    op.drop_table('presetgroups')
