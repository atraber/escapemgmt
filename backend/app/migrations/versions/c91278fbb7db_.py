"""empty message

Revision ID: c91278fbb7db
Revises: ac1e6e615fb2
Create Date: 2019-10-05 16:57:46.808251

"""
from alembic import op
import sqlalchemy as sa

from sqlalchemy import orm
from sqlalchemy.dialects import mysql

from models import Room

# revision identifiers, used by Alembic.
revision = 'c91278fbb7db'
down_revision = 'ac1e6e615fb2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('rooms',
                  sa.Column('tags', sa.String(length=255), nullable=True))

    # Data Migration
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    rooms = session.query(Room).all()
    for room in rooms:
        room.tags = ''
    session.add_all(rooms)
    session.commit()

    op.alter_column('rooms',
                    'tags',
                    existing_type=sa.String(length=255),
                    nullable=False)


def downgrade():
    op.drop_column('rooms', 'tags')
