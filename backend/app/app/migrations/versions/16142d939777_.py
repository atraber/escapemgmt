"""empty message

Revision ID: 16142d939777
Revises: 23b74dec26e1
Create Date: 2019-06-10 17:35:16.142154

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '16142d939777'
down_revision = '23b74dec26e1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('bookings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=True),
    sa.Column('room_id', sa.Integer(), nullable=True),
    sa.Column('slot_from', sa.Integer(), nullable=True),
    sa.Column('slot_to', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('bookings')
