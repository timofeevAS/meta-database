from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypedDict, Tuple, Iterable


# ---- Typed payloads for strong typing & IDE help ----

class TableInfo(TypedDict):
    schema: str
    table_name: str
    table_type: str  # e.g. 'BASE TABLE' | 'VIEW' | engine-specific


class ColumnInfo(TypedDict, total=False):
    name: str
    data_type: str                # "numeric(10,2)" / "timestamp with time zone"
    is_nullable: bool
    ordinal_position: int
    default: Optional[str] = None


class PrimaryKeyInfo(TypedDict):
    constraint_name: str
    columns: List[str]           # ordered by ordinal_position
    ordinal_positions: List[int] # same length as columns


class ForeignKeyInfo(TypedDict):
    constraint_name: str
    columns: List[str]             # source columns (ordered)
    referenced_schema: str
    referenced_table: str
    referenced_columns: List[str]  # target columns (ordered)
    # Optional: explicit mapping (src->tgt) preserving order
    column_pairs: List[Tuple[str, str]]


class BaseExtractor(ABC):
    """
    Abstract base class for metadata extractors across engines (Postgres/MySQL/MSSQL/...).

    Implementations should return normalized, engine-agnostic structures using the
    TypedDicts above. Keep column order for composite keys (ordinal_position).
    """

    def __init__(self, conn_params: Dict[str, Any]):
        """
        Connection parameters, engine-specific. Example (Postgres):

            {
                'host': 'localhost',
                'port': 5432,
                'user': 'appuser',
                'password': 'secret',
                'dbname': 'app'
            }
        """
        self.conn_params = conn_params

    def connect(self) -> None:
        """Optional: establish a connection if your driver needs explicit open."""
        raise NotImplementedError("connect() is optional; override if needed.")

    def close(self) -> None:
        """Optional: close resources."""
        raise NotImplementedError("close() is optional; override if needed.")

    def __enter__(self) -> "BaseExtractor":
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        try:
            self.close()
        except NotImplementedError:
            pass

    # ---- core API ----

    @abstractmethod
    def list_tables(
        self,
        database: Optional[str] = None,
        *,
        schemas: Optional[List[str]] = None,
        include_system_schemas: bool = False,
    ) -> List[TableInfo]:
        """
        Return tables/views. `schemas` filters specific schemas; system schemas may be excluded by default.
        """

    @abstractmethod
    def list_columns(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[ColumnInfo]:
        """
        Return columns with types and nullability. Include ordinal_position for stable ordering.
        """

    @abstractmethod
    def list_primary_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[PrimaryKeyInfo]:
        """
        Return primary key definitions. For most engines it's 0 or 1 rows per table,
        but keep List for flexibility and future extension.
        """

    @abstractmethod
    def list_foreign_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[ForeignKeyInfo]:
        """
        Return foreign keys, preserving column order. Include referenced schema/table
        and a column mapping (src->tgt).
        """

    # ---- optional: streaming variants for big catalogs ----
    def iter_tables(
        self,
        database: Optional[str] = None,
        *,
        schemas: Optional[List[str]] = None,
        include_system_schemas: bool = False,
    ) -> Iterable[TableInfo]:
        """Default wrapper over list_tables; override for cursor-based streaming if needed."""
        return iter(self.list_tables(database, schemas=schemas, include_system_schemas=include_system_schemas))
