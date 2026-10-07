"""add account initial balance

Revision ID: 9dc87c59d26b
Revises: 7a6deda00f2a
Create Date: 2026-08-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9dc87c59d26b"
down_revision: Union[str, Sequence[str], None] = "7a6deda00f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Ajoute le solde initial des comptes.

    Les comptes existants reçoivent 0 € afin de
    préserver les données déjà présentes.
    """

    op.add_column(
        "accounts",
        sa.Column(
            "initial_balance",
            sa.Numeric(12, 2),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE accounts
        SET initial_balance = 0
        WHERE initial_balance IS NULL
        """
    )

    op.alter_column(
        "accounts",
        "initial_balance",
        existing_type=sa.Numeric(12, 2),
        nullable=False,
    )


def downgrade() -> None:
    """Supprime le solde initial des comptes."""

    op.drop_column(
        "accounts",
        "initial_balance",
    )