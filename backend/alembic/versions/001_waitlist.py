"""Create waitlist table

Revision ID: 001
Revises:
Create Date: 2026-02-18

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "waitlist",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_waitlist_email"), "waitlist", ["email"], unique=True)
    op.create_index(op.f("ix_waitlist_id"), "waitlist", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_waitlist_id"), table_name="waitlist")
    op.drop_index(op.f("ix_waitlist_email"), table_name="waitlist")
    op.drop_table("waitlist")
