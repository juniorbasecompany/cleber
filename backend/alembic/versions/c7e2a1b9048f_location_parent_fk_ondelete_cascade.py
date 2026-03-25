"""location parent FK ondelete cascade

Revision ID: c7e2a1b9048f
Revises: 6d16b920a3ec
Create Date: 2026-03-25 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c7e2a1b9048f"
down_revision: Union[str, Sequence[str], None] = "6d16b920a3ec"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        "location_parent_same_scope_fk",
        "location",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "location_parent_same_scope_fk",
        "location",
        "location",
        ["scope_id", "parent_location_id"],
        ["scope_id", "id"],
        onupdate="CASCADE",
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "location_parent_same_scope_fk",
        "location",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "location_parent_same_scope_fk",
        "location",
        "location",
        ["scope_id", "parent_location_id"],
        ["scope_id", "id"],
        onupdate="CASCADE",
        ondelete="RESTRICT",
    )
