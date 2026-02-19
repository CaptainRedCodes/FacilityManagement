"""Add geo fields to locations table

Revision ID: 006
Revises: 005
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("locations", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("locations", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column(
        "locations",
        sa.Column(
            "allowed_radius_meters", sa.Integer(), nullable=False, server_default="150"
        ),
    )


def downgrade() -> None:
    op.drop_column("locations", "allowed_radius_meters")
    op.drop_column("locations", "longitude")
    op.drop_column("locations", "latitude")
