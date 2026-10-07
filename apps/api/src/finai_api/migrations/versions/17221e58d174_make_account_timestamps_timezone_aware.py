"""make account timestamps timezone aware

Revision ID: 17221e58d174
Revises: fb405f78818e
Create Date: 2026-08-22 14:55:33.660494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17221e58d174'
down_revision: Union[str, Sequence[str], None] = 'fb405f78818e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:   
    op.alter_column(
        "accounts",
        "created_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "accounts",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
    pass
