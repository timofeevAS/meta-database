from urllib.parse import ParseResult
import dsnparse

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Sequence

from psycopg2 import connect
from psycopg2.extras import execute_values

from manager.config import settings
from manager.core.extractor.base import ColumnInfo, ForeignKeyInfo, PrimaryKeyInfo
from manager.schemas.metadata import Column, Database, Credential, ForeignKey, ForeignKeyColumn, PrimaryKey, PrimaryKeyColumn, Table
from manager.services.metadata_db.tx import tx

from manager.core.extractor.postgres import PostgresExtractor

def _ensure_database(cur, db_name: str) -> Database:
    cur.execute("""--sql
        INSERT INTO databases(name)
        values (%s)
        returning id
    """, (db_name,))
    return Database(id=cur.fetchone()[0], name=db_name)

def _ensure_credentials(cur, database_id: int, parsed_dsn) -> Credential:
    host = parsed_dsn.host
    port = parsed_dsn.port
    username = parsed_dsn.username
    password = parsed_dsn.password

    cur.execute("""--sql
        INSERT INTO credentials (database_id, host_ipv4, port, username, password)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (database_id, host, port, username, password))
    cred_id = cur.fetchone()[0]

    return Credential(
        id=cred_id,
        database_id=database_id,
        host_ipv4=host,
        port=port,
        username=username,
        password=password,
    )

def _ensure_tables(cur, database_id: int, tables: List[Dict[str, Any]]) -> List[Table]:
    ensured: List[Table] = []
    for tables in tables:
        table_name: str = tables["table_name"]
        cur.execute("""--sql
            INSERT INTO tables (database_id, name)
            VALUES (%s, %s)
            RETURNING id
        """, (database_id, table_name))
        table_id = cur.fetchone()[0]
        ensured.append(Table(id=table_id, database_id=database_id, name=table_name))

    return ensured

def _ensure_columns(cur, table_id: int, columns: List[ColumnInfo]) -> List[Column]:
    ensured: List[Column] = []
    for column in columns:
        cur.execute("""--sql
            INSERT INTO columns (table_id, name, data_type)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (table_id, column["name"], column["data_type"]))
        column_id = cur.fetchone()[0]
        ensured.append(Column(id=column_id, table_id=table_id, name=column["name"], data_type=column["data_type"]))

    return ensured

def _ensure_primary_key(cur, table_id: int) -> PrimaryKey:
    cur.execute("""--sql
        INSERT INTO primary_keys (table_id)
        VALUES (%s)
        RETURNING id
    """, (table_id,))
    primary_key_id: int = cur.fetchone()[0]
    return PrimaryKey(id=primary_key_id, table_id=table_id)

def _ensure_primary_key_columns(cur, primary_key_id: int, pkeys: List[PrimaryKeyInfo]) -> List[PrimaryKeyColumn]:
    ensured: List[PrimaryKeyColumn] = []
    for pkey in pkeys:
        for column, ordinal_position in zip(pkey["columns"], pkey["ordinal_positions"]):
            cur.execute("""--sql
                        SELECT id FROM columns WHERE name = %s
                        """, (column,))

            column_id: int = cur.fetchone()[0]

            cur.execute("""--sql
                INSERT INTO primary_key_columns (pk_id, column_id, ordinal_position)
                VALUES (%s, %s, %s)
            """, (primary_key_id, column_id, ordinal_position))
            ensured.append(PrimaryKeyColumn(pk_id=primary_key_id, column_id=column_id, ordinal_position=ordinal_position))

    return ensured

def _ensure_foreign_keys(cur, table_id: int, fkeys: List[ForeignKeyInfo], db_id: int) -> List[ForeignKey]:
    ensured: List[ForeignKey] = []
    for fkey in fkeys:
        cur.execute("""--sql
            SELECT id FROM tables WHERE name = %s AND database_id = %s;
        """, (fkey["referenced_table"], db_id,))

        rows = cur.fetchall()[0]
        ref_table_id: int = rows[0]

        cur.execute("""--sql
            INSERT INTO foreign_keys (table_id, referenced_table_id)
            VALUES (%s, %s)
            RETURNING id
        """, (table_id, ref_table_id,))
        foreign_key_id: int = cur.fetchone()[0]
        ensured.append(
            ForeignKey(id=foreign_key_id, table_id=table_id, referenced_table_id=ref_table_id))
        
        for ordinal_position, (src_name, tgt_name) in enumerate(fkey["column_pairs"], start=1):
            # Source column id.
            cur.execute("""--sql
                SELECT id FROM columns
                WHERE table_id = %s AND name = %s
            """, (table_id, src_name))
            src_col_id = cur.fetchone()[0]

            # Ref table id.
            cur.execute("""--sql
                SELECT id FROM columns
                WHERE table_id = %s AND name = %s
            """, (ref_table_id, tgt_name))
            tgt_col_id = cur.fetchone()[0]

            cur.execute("""--sql
                INSERT INTO foreign_key_columns
                    (fk_id, column_id, referenced_column_id, ordinal_position)
                VALUES (%s, %s, %s, %s)
            """, (foreign_key_id, src_col_id, tgt_col_id, ordinal_position))

    return ensured

def fill_metadata_from_dsn(dsn: str) -> None:
    """
    Atomic filling of metadata from DSN string.
    """
    parsed_dsn = dsnparse.parse(dsn)

    db_name = parsed_dsn.paths[0]
    with tx() as conn:
            with conn.cursor() as cur:
                # 1-level SQL tables.
                database: Database = _ensure_database(cur, db_name)
                
                # 2-level SQL tables.
                credentials: Credential = _ensure_credentials(cur, database.id, parsed_dsn)

                # Other metadata can get just from remote connection with PostgresExtractor.
                extractor: PostgresExtractor = PostgresExtractor(
                    dict(
                        host=parsed_dsn.host,
                        port=parsed_dsn.port,
                        user=parsed_dsn.username,
                        password=parsed_dsn.password,
                        dbname=db_name,
                        )
                    )
                
                tables: List[Table] = _ensure_tables(cur, database.id, extractor.list_tables(db_name))
                
                # 3-level SQL tables.
                # Ensure columns for each tables.
                columns_by_table: Dict[int, List[Column]] = {}
                for table in tables: 
                    # TODO: big abstarction problem with "public" here.
                    # TODO: should add database_id?
                    columns: List[Column] = _ensure_columns(cur, table.id, extractor.list_columns("public", table.name))
                    columns_by_table[table.id] = columns
                
                pk_by_tables: Dict[int, PrimaryKey] = {}
                for table in tables: 
                    # TODO: big abstarction problem with "public" here.
                    pkey: PrimaryKey = _ensure_primary_key(cur, table.id)
                    pkey_columns: List[PrimaryKeyColumn] = \
                        _ensure_primary_key_columns(cur, pkey.id, extractor.list_primary_keys("public", table.name))
                    
                # TODO make foreign keys
                for table in tables:
                    # TODO: should add database_id?
                    fkeys = _ensure_foreign_keys(cur, table.id, extractor.list_foreign_keys("public", table.name), database.id)
                    
                    
def save_query(database_name: str, sql_query: str):
    with tx() as conn:
            with conn.cursor() as cur:
                cur.execute("""--sql
                            SELECT id FROM databases WHERE name = %s
                            """, (database_name,))

                database_id: int = cur.fetchone()[0]
                cur.execute("""--sql
                            INSERT INTO saved_queries (database_id, sql_query) VALUES(%s, %s);    
                            """, (database_id, sql_query))