"""Add credential version for token revocation.

Revision ID: 0002_credential_version
Revises: 0001_create_users
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_credential_version"
down_revision: Union[str, None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("credential_version", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "credential_version")