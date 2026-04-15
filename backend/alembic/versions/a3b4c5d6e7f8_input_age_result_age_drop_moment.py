"""input.age nullable; result.age; remove result.moment_utc

Revision ID: a3b4c5d6e7f8
Revises: d5e6f7a8b9c0
Create Date: 2026-04-14

- Adiciona input.age (INTEGER, nullable) para eventos recorrentes por idade.
- Adiciona result.age (NOT NULL após backfill), remove result.moment_utc.
- Backfill: age = max(0, (result.moment_utc::date - unity.creation_utc::date)).
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "result" DISABLE TRIGGER result_valora_audit_trg')

    op.add_column(
        "input",
        sa.Column(
            "age",
            sa.Integer(),
            nullable=True,
            comment=(
                "Idade em dias na qual o valor foi registrado; NULL quando não recorrente."
            ),
        ),
    )

    op.add_column(
        "result",
        sa.Column("age", sa.Integer(), nullable=True),
    )

    if bind.dialect.name == "postgresql":
        op.execute(
            sa.text(
                """
                UPDATE result AS r
                SET age = GREATEST(0, (r.moment_utc::date - u.creation_utc::date))
                FROM unity AS u
                WHERE u.id = r.unity_id
                """
            )
        )
    else:
        op.execute(
            sa.text(
                """
                UPDATE result AS r
                SET age = MAX(
                    0,
                    CAST(JULIANDAY(r.moment_utc) - JULIANDAY(u.creation_utc) AS INTEGER)
                )
                FROM unity AS u
                WHERE u.id = r.unity_id
                """
            )
        )

    op.alter_column(
        "result",
        "age",
        existing_type=sa.Integer(),
        nullable=False,
        comment=(
            "Idade (dias) do lote no momento do resultado; alinhada à convenção "
            "idade ≈ data(execution) − data(creation_utc) da unidade na migração."
        ),
    )

    op.drop_column("result", "moment_utc")

    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "result" ENABLE TRIGGER result_valora_audit_trg')


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "result" DISABLE TRIGGER result_valora_audit_trg')

    op.add_column(
        "result",
        sa.Column(
            "moment_utc",
            sa.DateTime(timezone=False),
            nullable=True,
            comment="Restaurado no downgrade; preencher antes de NOT NULL.",
        ),
    )
    if bind.dialect.name == "postgresql":
        op.execute(
            sa.text(
                """
                UPDATE result AS r
                SET moment_utc = (DATE(u.creation_utc) + r.age * INTERVAL '1 day')
                FROM unity AS u
                WHERE u.id = r.unity_id
                """
            )
        )
    else:
        op.execute(
            sa.text(
                """
                UPDATE result AS r
                SET moment_utc = datetime(u.creation_utc, '+' || CAST(r.age AS TEXT) || ' days')
                FROM unity AS u
                WHERE u.id = r.unity_id
                """
            )
        )

    op.alter_column(
        "result",
        "moment_utc",
        existing_type=sa.DateTime(timezone=False),
        nullable=False,
    )

    op.drop_column("result", "age")
    op.drop_column("input", "age")

    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "result" ENABLE TRIGGER result_valora_audit_trg')
