"""event: age NOT NULL; remove moment_utc e CHECK event_unity_moment_pair

Revision ID: e5f6a7b8c9d0
Revises: a3b4c5d6e7f8
Create Date: 2026-04-15

- Adiciona event.age (INTEGER, NOT NULL após backfill).
- Backfill: fatos com unity_id e moment_utc: age = max(0, moment_utc::date - unity.creation_utc::date);
  padrão (sem unity_id): age = 0.
- Remove CHECK event_unity_moment_pair e coluna moment_utc.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "a3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "event" DISABLE TRIGGER event_valora_audit_trg')

    op.add_column(
        "event",
        sa.Column(
            "age",
            sa.Integer(),
            nullable=True,
            comment=(
                "Idade do lote no eixo do escopo (unidade implícita definida pelos campos de "
                "idade do escopo). Obrigatório para fato e para padrão (standard)."
            ),
        ),
    )

    if bind.dialect.name == "postgresql":
        op.execute(
            sa.text(
                """
                UPDATE event AS e
                SET age = GREATEST(0, (e.moment_utc::date - u.creation_utc::date))
                FROM unity AS u
                WHERE e.unity_id IS NOT NULL
                  AND e.moment_utc IS NOT NULL
                  AND u.id = e.unity_id
                """
            )
        )
        op.execute(
            sa.text(
                """
                UPDATE event
                SET age = 0
                WHERE age IS NULL
                """
            )
        )
    else:
        op.execute(
            sa.text(
                """
                UPDATE event AS e
                SET age = MAX(
                    0,
                    CAST(JULIANDAY(e.moment_utc) - JULIANDAY(u.creation_utc) AS INTEGER)
                )
                FROM unity AS u
                WHERE e.unity_id IS NOT NULL
                  AND e.moment_utc IS NOT NULL
                  AND u.id = e.unity_id
                """
            )
        )
        op.execute(sa.text("UPDATE event SET age = 0 WHERE age IS NULL"))

    op.alter_column(
        "event",
        "age",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.drop_constraint("event_unity_moment_pair", "event", type_="check")
    op.drop_column("event", "moment_utc")

    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "event" ENABLE TRIGGER event_valora_audit_trg')


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "event" DISABLE TRIGGER event_valora_audit_trg')

    op.add_column(
        "event",
        sa.Column(
            "moment_utc",
            sa.DateTime(timezone=False),
            nullable=True,
            comment=(
                "Momento do fato. Presente apenas quando unity_id é informado. NULL em "
                "eventos-padrão (standard), sem unity_id."
            ),
        ),
    )

    if bind.dialect.name == "postgresql":
        op.execute(
            sa.text(
                """
                UPDATE event AS e
                SET moment_utc = (u.creation_utc::date + e.age * INTERVAL '1 day')
                FROM unity AS u
                WHERE e.unity_id IS NOT NULL
                  AND u.id = e.unity_id
                """
            )
        )
    else:
        op.execute(
            sa.text(
                """
                UPDATE event AS e
                SET moment_utc = datetime(u.creation_utc, '+' || CAST(e.age AS TEXT) || ' days')
                FROM unity AS u
                WHERE e.unity_id IS NOT NULL
                  AND u.id = e.unity_id
                """
            )
        )

    op.create_check_constraint(
        "event_unity_moment_pair",
        "event",
        "(unity_id IS NULL AND moment_utc IS NULL) OR "
        "(unity_id IS NOT NULL AND moment_utc IS NOT NULL)",
    )

    op.drop_column("event", "age")

    if bind.dialect.name == "postgresql":
        op.execute('ALTER TABLE "event" ENABLE TRIGGER event_valora_audit_trg')
