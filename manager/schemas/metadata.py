# manager/schemas/metadata.py
from __future__ import annotations
from typing import List, Tuple, Optional
from pydantic import BaseModel, Field, ConfigDict


# -----------------------------------------------------------------------------
# Atomic entities (mirror DB tables; read-only / immutable)
# -----------------------------------------------------------------------------

class Database(BaseModel):
    """Database row (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    name: str


class Table(BaseModel):
    """Table row (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    database_id: int
    name: str


class Column(BaseModel):
    """Column row (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    table_id: int
    name: str
    data_type: str


class PrimaryKey(BaseModel):
    """Primary key header (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    table_id: int


class PrimaryKeyColumn(BaseModel):
    """Primary key column mapping with ordering (read-only)."""
    model_config = ConfigDict(frozen=True)

    pk_id: int
    column_id: int
    ordinal_position: int


class ForeignKey(BaseModel):
    """Foreign key header (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    table_id: int                 # source table
    referenced_table_id: int      # target table


class ForeignKeyColumn(BaseModel):
    """Foreign key column mapping with ordering (read-only)."""
    model_config = ConfigDict(frozen=True)

    fk_id: int
    column_id: int                # source column id
    referenced_column_id: int     # target column id
    ordinal_position: int


class Credential(BaseModel):
    """Credentials row (read-only)."""
    model_config = ConfigDict(frozen=True)

    id: int
    database_id: int
    host_ipv4: str
    port: int
    username: str
    password: str