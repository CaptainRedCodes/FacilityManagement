"""Create locations table

Revision ID: 003
Revises: 002
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_locations_name"), "locations", ["name"], unique=True)
    op.create_index(op.f("ix_locations_id"), "locations", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_locations_id"), table_name="locations")
    op.drop_index(op.f("ix_locations_name"), table_name="locations")
    op.drop_table("locations")
