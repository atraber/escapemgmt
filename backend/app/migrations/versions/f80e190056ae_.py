"""empty message

Revision ID: f80e190056ae
Revises: 16142d939777
Create Date: 2019-06-11 21:45:28.316476

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f80e190056ae'
down_revision = '16142d939777'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        'bookings',
        sa.Column('first_name', sa.String(length=100), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('bookings', 'first_name')
    # ### end Alembic commands ###