"""unity: kind_id_list renomeado para item_id_list (referencia item.id)

Valores antigos em kind_id_list eram kind.id; não são semanticamente item.id.
Linhas existentes em unity são removidas antes do rename para evitar dados inválidos.

Revision ID: a1b2c3d4e5f8
Revises: f2a3b4c5d6e7
Create Date: 2026-04-05

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f8"
down_revision: Union[str, Sequence[str], None] = "f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM unity")
    op.execute("ALTER TABLE unity RENAME COLUMN kind_id_list TO item_id_list")
    op.execute(
        "COMMENT ON COLUMN unity.item_id_list IS "
        "'Lista de IDs de item (catálogo) no escopo.'"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE unity RENAME COLUMN item_id_list TO kind_id_list")
    op.execute(
        "COMMENT ON COLUMN unity.kind_id_list IS 'Lista de IDs de tipos de item.'"
    )
