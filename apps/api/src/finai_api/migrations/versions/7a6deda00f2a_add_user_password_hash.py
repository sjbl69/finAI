"""add user password hash

Revision ID: 7a6deda00f2a
Revises: fe15690ac8d1
Create Date: 2026-08-23 17:08:47.896871
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7a6deda00f2a"
down_revision: Union[str, Sequence[str], None] = "fe15690ac8d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add password_hash to existing users safely."""

    # 1. Add the column temporarily as nullable.
    op.add_column(
        "users",
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=True,
        ),
    )

    # 2. Give existing users a temporary unusable password hash.
    # They will need to use the new registration/password flow.
    op.execute(
        """
        UPDATE users
        SET password_hash = '$2b$12$00000000000000000000000000000000000000000000000000000'
        WHERE password_hash IS NULL
        """
    )

    # 3. Make the column mandatory for all future users.
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )


def downgrade() -> None:
    """Remove password_hash."""

    op.drop_column("users", "password_hash")