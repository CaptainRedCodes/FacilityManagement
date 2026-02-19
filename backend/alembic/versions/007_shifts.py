"""Create shifts table

Revision ID: 007
Revises: 006
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shifts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("location_id", sa.Integer(), nullable=False),
        sa.Column("shift_name", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column(
            "grace_period_minutes", sa.Integer(), nullable=False, server_default="15"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("location_id"),
    )
    op.create_index(op.f("ix_shifts_id"), "shifts", ["id"], unique=False)
    op.create_index(
        op.f("ix_shifts_location_id"), "shifts", ["location_id"], unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_shifts_location_id"), table_name="shifts")
    op.drop_index(op.f("ix_shifts_id"), table_name="shifts")
    op.drop_table("shifts")
