"""scope directory

Revision ID: 8a44c22a9c7e
Revises: 43942feaf161
Create Date: 2026-03-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8a44c22a9c7e"
down_revision: Union[str, Sequence[str], None] = "43942feaf161"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "scope",
        sa.Column(
            "id",
            sa.BigInteger(),
            autoincrement=True,
            nullable=False,
            comment="Identificador do escopo.",
        ),
        sa.Column(
            "name",
            sa.Text(),
            nullable=False,
            comment="Nome do escopo: Aves, Soja, Leite...",
        ),
        sa.Column(
            "display_name",
            sa.Text(),
            nullable=False,
            comment=(
                "Descrição do escopo: Aves para produção de ovos, "
                "Soja em grãos, Leite..."
            ),
        ),
        sa.Column(
            "tenant_id",
            sa.BigInteger(),
            nullable=False,
            comment="Ligação do escopo ao licenciado.",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenant.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="Escopo do projeto: Aves, Soja, Leite...",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("scope")
