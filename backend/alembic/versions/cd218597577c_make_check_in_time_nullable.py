"""make check_in_time nullable

Revision ID: cd218597577c
Revises: 009
Create Date: 2026-02-20 14:38:52.516836

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "cd218597577c"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("attendance", "check_in_time", nullable=True)


def downgrade() -> None:
    op.alter_column("attendance", "check_in_time", nullable=False)
