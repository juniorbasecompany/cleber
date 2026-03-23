"""member current scope

Revision ID: 6d16b920a3ec
Revises: 2c5d5d8620b3
Create Date: 2026-03-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6d16b920a3ec"
down_revision: Union[str, Sequence[str], None] = "2c5d5d8620b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "member",
        sa.Column(
            "current_scope_id",
            sa.BigInteger(),
            nullable=True,
            comment="Escopo atualmente selecionado pelo usuário dentro do licenciado.",
        ),
    )
    op.create_foreign_key(
        "member_current_scope_id_fkey",
        "member",
        "scope",
        ["current_scope_id"],
        ["id"],
        onupdate="CASCADE",
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("member_current_scope_id_fkey", "member", type_="foreignkey")
    op.drop_column("member", "current_scope_id")
