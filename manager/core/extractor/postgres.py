import psycopg2
from typing import List, Dict, Any
from manager.core.extractor.base import BaseExtractor, ColumnInfo, ForeignKeyInfo, PrimaryKeyInfo


class PostgresExtractor(BaseExtractor):
    """
    PostgreSQL implementation of BaseExtractor.
    Provides methods to extract metadata using information_schema and pg_catalog.
    """

    def __init__(self, conn_params: Dict[str, Any]):
        super().__init__(conn_params)
        self.conn = None
        self.cursor = None

    def connect(self):
        """Establish connection to the PostgreSQL database."""
        if self.conn is None:
            self.conn = psycopg2.connect(**self.conn_params)
            self.cursor = self.conn.cursor()

    def close(self):
        """Close database cursor and connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        self.cursor = None
        self.conn = None

    # -------------------------
    # Metadata extraction
    # -------------------------

    def list_tables(self, database: str = None) -> List[Dict[str, Any]]:
        """
        Retrieve all user-defined tables from the database.

        Returns:
            List of dictionaries with keys:
                - schema: schema name
                - table_name: table name
                - table_type: BASE TABLE
        """
        self.connect()

        query = """--sql
            SELECT
                table_schema,
                table_name,
                table_type
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        """

        self.cursor.execute(query)
        
        rows = self.cursor.fetchall()
        
        return [
            {'schema': r[0], 'table_name': r[1], 'table_type': r[2]}
            for r in rows
        ]
    
    def list_columns(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[ColumnInfo]:
        """
        Return columns with types and nullability. Include ordinal_position for stable ordering.
        """
        raise NotImplementedError()

    def list_primary_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[PrimaryKeyInfo]:
        """
        Return primary key definitions. For most engines it's 0 or 1 rows per table,
        but keep List for flexibility and future extension.
        """
        raise NotImplementedError()

    def list_foreign_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[ForeignKeyInfo]:
        """
        Return foreign keys, preserving column order. Include referenced schema/table
        and a column mapping (src->tgt).
        """
        raise NotImplementedError()