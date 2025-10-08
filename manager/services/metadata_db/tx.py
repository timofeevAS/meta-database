from contextlib import contextmanager
from psycopg2.extensions import connection
from .pool import get_pool

@contextmanager
def tx(readonly: bool = False):
    """
    Context for transactions.

    Example:
        from manager.services.metadata_db.tx import tx

        with tx() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM databases;")
                rows = cur.fetchall()
    """
    
    pool = get_pool()
    conn: connection = pool.getconn()
    try:
        if readonly:
            conn.set_session(readonly=True, autocommit=False)
        else:
            conn.set_session(readonly=False, autocommit=False)

        yield conn
        if not readonly:
            conn.commit()
    except Exception:
        if not readonly:
            conn.rollback()
        raise
    finally:
        pool.putconn(conn)
