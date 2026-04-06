"""action: add is_recurrent flag

Revision ID: f5c3d7e9a1b2
Revises: e2f4a6b8c0d1
Create Date: 2026-04-06

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f5c3d7e9a1b2"
down_revision: Union[str, Sequence[str], None] = "e2f4a6b8c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "action",
        sa.Column(
            "is_recurrent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("action", "is_recurrent")
