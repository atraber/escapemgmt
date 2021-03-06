"""empty message

Revision ID: 648cb9b987c8
Revises: 8ac926e61120
Create Date: 2020-04-13 15:00:04.635818

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '648cb9b987c8'
down_revision = '8ac926e61120'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('presetgroups',
                  sa.Column('hidden', sa.Boolean(), nullable=False))


def downgrade():
    op.drop_column('presetgroups', 'hidden')
