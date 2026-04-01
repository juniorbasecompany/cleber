"""enable_unaccent_extension

Revision ID: a1c3d5e7f9b1
Revises: 9b57df201f8a
Create Date: 2026-04-01 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1c3d5e7f9b1"
down_revision: Union[str, Sequence[str], None] = "9b57df201f8a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "unaccent";')


def downgrade() -> None:
    op.execute('DROP EXTENSION IF EXISTS "unaccent";')
