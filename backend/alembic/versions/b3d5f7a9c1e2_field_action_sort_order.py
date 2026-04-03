"""field e action: sort_order por escopo

Revision ID: b3d5f7a9c1e2
Revises: a1c3d5e7f9b1
Create Date: 2026-04-03

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3d5f7a9c1e2"
down_revision: Union[str, Sequence[str], None] = "a1c3d5e7f9b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _backfill_sort_order(connection: sa.Connection, table: str) -> None:
    rows = connection.execute(
        sa.text(f"SELECT id, scope_id FROM {table} ORDER BY scope_id, id")
    ).fetchall()
    current_scope: int | None = None
    idx = 0
    for row in rows:
        row_id, scope_id = int(row[0]), int(row[1])
        if scope_id != current_scope:
            current_scope = scope_id
            idx = 0
        connection.execute(
            sa.text(f"UPDATE {table} SET sort_order = :so WHERE id = :id"),
            {"so": idx, "id": row_id},
        )
        idx += 1


def upgrade() -> None:
    op.add_column(
        "field",
        sa.Column("sort_order", sa.Integer(), nullable=True),
    )
    op.add_column(
        "action",
        sa.Column("sort_order", sa.Integer(), nullable=True),
    )

    conn = op.get_bind()
    assert conn is not None
    dialect = conn.dialect.name
    if dialect == "postgresql":
        # Backfill sem contexto de auditoria; triggers exigem tenant na sessão.
        op.execute("ALTER TABLE field DISABLE TRIGGER field_valora_audit_trg")
        op.execute('ALTER TABLE "action" DISABLE TRIGGER action_valora_audit_trg')
    try:
        _backfill_sort_order(conn, "field")
        _backfill_sort_order(conn, "action")
    finally:
        if dialect == "postgresql":
            op.execute("ALTER TABLE field ENABLE TRIGGER field_valora_audit_trg")
            op.execute('ALTER TABLE "action" ENABLE TRIGGER action_valora_audit_trg')

    op.alter_column(
        "field",
        "sort_order",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.alter_column(
        "action",
        "sort_order",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.create_index(
        "field_scope_sort_idx",
        "field",
        ["scope_id", "sort_order", "id"],
        unique=False,
    )
    op.create_index(
        "action_scope_sort_idx",
        "action",
        ["scope_id", "sort_order", "id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("action_scope_sort_idx", table_name="action")
    op.drop_index("field_scope_sort_idx", table_name="field")
    op.drop_column("action", "sort_order")
    op.drop_column("field", "sort_order")
