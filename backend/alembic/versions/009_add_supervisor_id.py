"""Add supervisor_id to users table

Revision ID: 009
Revises: 008
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("supervisor_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_supervisor_id",
        "users",
        "users",
        ["supervisor_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_supervisor_id", "users", ["supervisor_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_supervisor_id", table_name="users")
    op.drop_constraint("fk_users_supervisor_id", "users", type_="foreignkey")
    op.drop_column("users", "supervisor_id")
