from psycopg2.extras import RealDictCursor
from .tx import tx

# --- DATABASES ---
def insert_database(name: str) -> int:
    """Insert a new database record or return existing id."""
    with tx() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""--sql
            INSERT INTO databases(name) VALUES (%s) RETURNING id;
        """, (name,))
        return cur.fetchone()["id"]


def list_databases() -> list[str]:
    """Return a list of all database names."""
    with tx(readonly=True) as conn, conn.cursor() as cur:
        cur.execute("SELECT name FROM databases ORDER BY name;")
        return [row[0] for row in cur.fetchall()]