"""Update users table - add FKs for location and department

Revision ID: 005
Revises: 004
Create Date: 2026-02-19

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("location_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("department_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_location_id",
        "users",
        "locations",
        ["location_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_users_department_id",
        "users",
        "departments",
        ["department_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_column("users", "location")
    op.drop_column("users", "department")


def downgrade() -> None:
    op.add_column("users", sa.Column("location", sa.String(length=255), nullable=True))
    op.add_column(
        "users", sa.Column("department", sa.String(length=255), nullable=True)
    )
    op.drop_constraint("fk_users_department_id", "users", type_="foreignkey")
    op.drop_constraint("fk_users_location_id", "users", type_="foreignkey")
    op.drop_column("users", "location_id")
    op.drop_column("users", "department_id")
