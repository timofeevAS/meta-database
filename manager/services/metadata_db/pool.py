from psycopg2 import pool

_pool: pool.SimpleConnectionPool | None = None

def init_pool(dsn: str, minconn: int = 1, maxconn: int = 10):
    """
    Initialising global pool of database connections.
    NOTE: Must call from layer where we know DSN (for example from services/__init__.py).
    """
    global _pool
    if _pool is None:
        _pool = pool.SimpleConnectionPool(
            minconn,
            maxconn,
            dsn=dsn,
        )

def get_pool() -> pool.SimpleConnectionPool:
    if _pool is None:
        raise RuntimeError("Connection pool is not initialized. Call init_pool(dsn) first.")
    return _pool