"""input: drop age column

Revision ID: c3d5e7f9a1b4
Revises: d1c2b3a4e5f6
Create Date: 2026-04-21

- Remove a coluna `input.age`, adicionada em `a3b4c5d6e7f8` mas nunca
  consumida pelo motor de cálculo (`_calculate_scope_current_age`
  indexa o runtime apenas por `field_id`).
- Dados existentes em `input.age` são descartados pela migração; o
  downgrade recria a coluna vazia (`nullable=True`), sem backfill.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d5e7f9a1b4"
down_revision: Union[str, Sequence[str], None] = "d1c2b3a4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("input", "age")


def downgrade() -> None:
    op.add_column(
        "input",
        sa.Column(
            "age",
            sa.Integer(),
            nullable=True,
            comment=(
                "Restaurado no downgrade; preencher manualmente se necessário."
            ),
        ),
    )
