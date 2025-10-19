from psycopg2.extras import RealDictCursor

from typing import List

from manager.schemas.metadata import Database
from .tx import tx

# --- DATABASES ---
def insert_database(name: str) -> Database:
    """Insert a new database row and return it as a Pydantic model."""
    # TODO: DDL doesn't have UNIQUE(name), so duplicates are possible.
    with tx() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "INSERT INTO databases(name) VALUES (%s) RETURNING id, name;",
            (name,),
        )
        row = cur.fetchone()
        # Database is frozen (read-only), safe to return
        return Database(id=row["id"], name=row["name"])

def list_databases() -> List[Database]:
    """Return all databases as view models (name only)."""
    with tx(readonly=True) as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, name FROM databases ORDER BY id;")
        rows = cur.fetchall()
        return [Database(id=r["id"], name=r["name"]) for r in rows]
    
def get_database_address_by_name(name: str) -> str:
    """Return address of database in format domain:port."""
    with tx(readonly=True) as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""--sql
                    SELECT c.host_ipv4, c.port
                    FROM credentials AS c
                    JOIN databases AS d ON d.id = c.database_id
                    WHERE d.name = %s;
                    """, (name,))
        rows = cur.fetchone()
        return f"{rows["host_ipv4"]}:{rows["port"]}"