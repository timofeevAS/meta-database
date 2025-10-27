import psycopg2
from psycopg2.extras import RealDictCursor

from manager.schemas.metadata import Credential
from manager.services.metadata_db.repo import get_credentials

def execute_query(database_name: str, sql_query: str):
    db_creds: Credential = get_credentials(database_name)
    
    dsn = (
        f"host={db_creds.host_ipv4} "
        f"port={db_creds.port} "
        f"dbname={database_name} "
        f"user={db_creds.username} "
        f"password={db_creds.password}"
    )

    try:
        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql_query)

                if cur.description:
                    rows = cur.fetchall()
                    return rows  # List of dicts.
                else:
                    raise Exception("Problems with SQL Query. (Can be only SELECT query.)")
    except Exception as e:
        return {"status": "error", "message": str(e)}
