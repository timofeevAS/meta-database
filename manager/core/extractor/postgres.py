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
        self.connect()

        query = """--sql
            SELECT
                a.attnum AS ordinal_position,
                a.attname AS column_name,
                pg_catalog.format_type(a.atttypid, a.atttypmod) AS formatted_type,
                NOT a.attnotnull AS is_nullable,
                pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS column_default
            FROM pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_catalog.pg_attrdef ad
                ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
            WHERE n.nspname = %s
            AND c.relname = %s
            AND a.attnum > 0
            AND NOT a.attisdropped
            ORDER BY a.attnum;
        """
        self.cursor.execute(query, (table_schema, table_name))
        rows = self.cursor.fetchall()

        return [
            ColumnInfo(
                name=r[1],
                data_type=r[2],
                is_nullable=bool(r[3]),
                ordinal_position=int(r[0]),
                default=r[4],
            )
            for r in rows
        ]

    def list_primary_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[PrimaryKeyInfo]:
        """
        Return primary key definitions. For most engines it's 0 or 1 rows per table,
        but keep List for flexibility and future extension.
        """
        query = """--sql
            SELECT
                tc.constraint_name,
                kcu.column_name,
                kcu.ordinal_position
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = %s
            AND tc.table_name = %s
            ORDER BY kcu.ordinal_position;
        """

        with self.conn.cursor() as cur:
            cur.execute(query, (table_schema, table_name))
            rows = cur.fetchall()

        if not rows:
            return []

        pk_map = {}
        for constraint_name, column_name, ordinal_position in rows:
            if constraint_name not in pk_map:
                pk_map[constraint_name] = {
                    "constraint_name": constraint_name,
                    "columns": [],
                    "ordinal_positions": [],
                }
            pk_map[constraint_name]["columns"].append(column_name)
            pk_map[constraint_name]["ordinal_positions"].append(ordinal_position)

        return list(pk_map.values())

    def list_foreign_keys(
        self,
        table_schema: str,
        table_name: str,
    ) -> List[ForeignKeyInfo]:
        """
        Return foreign keys, preserving column order. Include referenced schema/table
        and a column mapping (src->tgt).
        """
        sql = """--sql
            SELECT
                con.conname AS constraint_name,
                src_ns.nspname AS src_schema,
                src_rel.relname AS src_table,
                tgt_ns.nspname AS tgt_schema,
                tgt_rel.relname AS tgt_table,
                src_att.attname AS src_col,
                tgt_att.attname AS tgt_col,
                ord.n AS position
            FROM pg_constraint con
            JOIN pg_class src_rel ON con.conrelid = src_rel.oid
            JOIN pg_namespace src_ns ON src_rel.relnamespace = src_ns.oid
            JOIN pg_class tgt_rel ON con.confrelid = tgt_rel.oid
            JOIN pg_namespace tgt_ns ON tgt_rel.relnamespace = tgt_ns.oid
            -- align i-th key of conkey with i-th key of confkey
            JOIN LATERAL generate_subscripts(con.conkey, 1) AS ord(n) ON TRUE
            LEFT JOIN pg_attribute src_att
                ON src_att.attrelid = src_rel.oid
            AND src_att.attnum   = con.conkey[ord.n]
            LEFT JOIN pg_attribute tgt_att
                ON tgt_att.attrelid = tgt_rel.oid
            AND tgt_att.attnum   = con.confkey[ord.n]
            WHERE con.contype = 'f'
            AND src_ns.nspname = %s
            AND src_rel.relname = %s
            ORDER BY con.conname, ord.n;
        """

        with self.conn.cursor() as cur:
            cur.execute(sql, (table_schema, table_name))
            rows = cur.fetchall()

        # rows cols order as in SELECT
        # (constraint_name, src_schema, src_table, tgt_schema, tgt_table, src_col, tgt_col, position)
        fks: dict[str, ForeignKeyInfo] = {}
        for constraint_name, _src_schema, _src_table, tgt_schema, tgt_table, src_col, tgt_col, _pos in rows:
            if constraint_name not in fks:
                fks[constraint_name] = {
                    "constraint_name": constraint_name,
                    "columns": [],
                    "referenced_schema": tgt_schema,
                    "referenced_table": tgt_table,
                    "referenced_columns": [],
                    "column_pairs": [],
                }
            fks[constraint_name]["columns"].append(src_col)
            fks[constraint_name]["referenced_columns"].append(tgt_col)

        # fill pairs preserving order
        for fk in fks.values():
            fk["column_pairs"] = list(zip(fk["columns"], fk["referenced_columns"]))

        return list(fks.values())