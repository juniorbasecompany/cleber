"""event: age_field_id + moment_utc nullable; result: unity_id + formula FK restrict

Revision ID: b4e6f8a0c2d1
Revises: a2b3c4d5e6f7
Create Date: 2026-04-08

Suporte ao conceito de evento-padrão (standard):
- event.age_field_id referencia o campo de idade usado no padrão.
- event.moment_utc passa a ser nullable (padrão não tem data concreta).
- result.unity_id (NOT NULL) indica a unidade do resultado, mesmo para padrão.
- result.formula_id FK muda de ON DELETE CASCADE para RESTRICT.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4e6f8a0c2d1"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- event ---------------------------------------------------------------
    op.add_column(
        "event",
        sa.Column(
            "age_field_id",
            sa.BigInteger(),
            nullable=True,
            comment=(
                "Indica o campo de idade usado em eventos-padrão (standard). "
                "Quando presente, o evento não tem unity_id nem moment_utc."
            ),
        ),
    )
    op.create_foreign_key(
        "event_age_field_id_fkey",
        "event",
        "field",
        ["age_field_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )

    op.alter_column(
        "event",
        "moment_utc",
        existing_type=sa.DateTime(timezone=False),
        nullable=True,
        server_default=None,
        comment=(
            "Momento do evento ou da medição. NULL para eventos-padrão (standard), "
            "que usam age_field_id em vez de data concreta."
        ),
    )

    # -- result --------------------------------------------------------------
    op.add_column(
        "result",
        sa.Column(
            "unity_id",
            sa.BigInteger(),
            nullable=False,
            comment=(
                "Unidade à qual o resultado pertence. Preenchido mesmo quando "
                "o evento-origem é um padrão (sem unity_id próprio)."
            ),
        ),
    )
    op.create_foreign_key(
        "result_unity_id_fkey",
        "result",
        "unity",
        ["unity_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )

    op.drop_constraint("result_formula_id_fkey", "result", type_="foreignkey")
    op.create_foreign_key(
        "result_formula_id_fkey",
        "result",
        "formula",
        ["formula_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    # -- result (reverso) ----------------------------------------------------
    op.drop_constraint("result_formula_id_fkey", "result", type_="foreignkey")
    op.create_foreign_key(
        "result_formula_id_fkey",
        "result",
        "formula",
        ["formula_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="CASCADE",
    )

    op.drop_constraint("result_unity_id_fkey", "result", type_="foreignkey")
    op.drop_column("result", "unity_id")

    # -- event (reverso) -----------------------------------------------------
    op.alter_column(
        "event",
        "moment_utc",
        existing_type=sa.DateTime(timezone=False),
        nullable=False,
        server_default=sa.text("(now() AT TIME ZONE 'UTC')"),
    )

    op.drop_constraint("event_age_field_id_fkey", "event", type_="foreignkey")
    op.drop_column("event", "age_field_id")
