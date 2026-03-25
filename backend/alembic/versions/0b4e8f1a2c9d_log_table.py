"""log table

Revision ID: 0b4e8f1a2c9d
Revises: f8a91c2d3e4b
Create Date: 2026-03-25 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "0b4e8f1a2c9d"
down_revision: Union[str, Sequence[str], None] = "f8a91c2d3e4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "log",
        sa.Column(
            "id",
            sa.BigInteger(),
            autoincrement=True,
            nullable=False,
            comment="Identificador do log.",
        ),
        sa.Column(
            "member_id",
            sa.BigInteger(),
            nullable=False,
            comment="Ligação com a pessoa que fez a modificação.",
        ),
        sa.Column(
            "tenant_id",
            sa.BigInteger(),
            nullable=False,
            comment="Ligação com o licenciado.",
        ),
        sa.Column(
            "table_name",
            sa.Text(),
            nullable=False,
            comment="Nome da tabela que foi modificada.",
        ),
        sa.Column(
            "action_type",
            sa.Text(),
            nullable=False,
            comment="Tipo da modificação: I (insert), U (update), D (delete).",
        ),
        sa.Column(
            "row",
            JSONB(),
            nullable=False,
            comment="Conteúdo da linha; JSON vazio em caso de delete.",
        ),
        sa.Column(
            "moment_utc",
            sa.DateTime(timezone=False),
            nullable=False,
            server_default=sa.text("(now() AT TIME ZONE 'UTC')"),
            comment="Momento em que ocorreu a ação.",
        ),
        sa.CheckConstraint(
            "table_name IN ("
            "'tenant', 'account', 'member', 'scope', 'location', 'unity')",
            name="log_table_name_chk",
        ),
        sa.CheckConstraint(
            "action_type IN ('I', 'U', 'D')",
            name="log_action_type_chk",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenant.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["member.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="Registra modificações feitas nas demais tabelas.",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("log")
