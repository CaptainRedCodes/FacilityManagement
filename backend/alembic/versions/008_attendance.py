"""Create attendance table

Revision ID: 008
Revises: 007
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("location_id", sa.Integer(), nullable=False),
        sa.Column("check_in_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("check_out_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_in_latitude", sa.Float(), nullable=False),
        sa.Column("check_in_longitude", sa.Float(), nullable=False),
        sa.Column("distance_from_location_meters", sa.Float(), nullable=True),
        sa.Column("is_late", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("late_by_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="present"
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["employee_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_attendance_id"), "attendance", ["id"], unique=False)
    op.create_index(
        op.f("ix_attendance_employee_id"), "attendance", ["employee_id"], unique=False
    )
    op.create_index(op.f("ix_attendance_date"), "attendance", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_attendance_date"), table_name="attendance")
    op.drop_index(op.f("ix_attendance_employee_id"), table_name="attendance")
    op.drop_index(op.f("ix_attendance_id"), table_name="attendance")
    op.drop_table("attendance")
