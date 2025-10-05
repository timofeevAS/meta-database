import unittest
import psycopg2
from manager.core.extractor.postgres import PostgresExtractor
from tests.conf.configure import config


class TestPostgresExtractor(unittest.TestCase):
    """Unit tests for PostgresExtractor using unittest framework."""

    @classmethod
    def setUpClass(cls):
        """Create PostgresExtractor once for all tests."""
        conn_params = dict(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password,
            dbname=config.dbname,
        )
        cls.conn_params = conn_params
        cls.extractor = PostgresExtractor(conn_params)

    @classmethod
    def tearDownClass(cls):
        """Close extractor if it exposes close()."""
        close = getattr(cls.extractor, "close", None)
        if callable(close):
            close()

    def _exec_sql(self, sql):
        """Run raw SQL in a separate psycopg2 connection."""
        with psycopg2.connect(**self.conn_params) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()

    def setUp(self):
        """Prepare clean test tables."""
        self._exec_sql("""--sql
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
            DROP TABLE IF EXISTS tmp_users, tmp_orders, tmp_products CASCADE;
            CREATE TABLE tmp_users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL
            );
            CREATE TABLE tmp_orders (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES tmp_users(id),
                amount DECIMAL NOT NULL
            );
            CREATE TABLE tmp_products (
                id SERIAL PRIMARY KEY,
                title TEXT
            );
        """)

    def tearDown(self):
        """Clean up after each test."""
        self._exec_sql("""
            DROP TABLE IF EXISTS tmp_users, tmp_orders, tmp_products CASCADE;
        """)

    def test_list_tables_includes_temporary(self):
        """Check that list_tables() finds tables created by this test."""
        tables = self.extractor.list_tables()
        table_names = {t["table_name"] for t in tables}

        self.assertEqual({"tmp_users", "tmp_orders", "tmp_products"}, table_names)
        
        self.assertEqual([
            {'name': 'id', 'data_type': 'integer', 'is_nullable': False, 'ordinal_position': 1, 'default': "nextval('tmp_users_id_seq'::regclass)"},
            {'name': 'name', 'data_type': 'text', 'is_nullable': False, 'ordinal_position': 2, 'default': None}], 
            self.extractor.list_columns("public", "tmp_users"))
        
        self.assertEqual([
            {'name': 'id', 'data_type': 'integer', 'is_nullable': False, 'ordinal_position': 1, 'default': "nextval('tmp_orders_id_seq'::regclass)"},
            {'name': 'user_id', 'data_type': 'integer', 'is_nullable': True, 'ordinal_position': 2, 'default': None},
            {'name': 'amount', 'data_type': 'numeric', 'is_nullable': False, 'ordinal_position': 3, 'default': None}], 
            self.extractor.list_columns("public", "tmp_orders"))
        
        self.assertEqual([
            {'name': 'id', 'data_type': 'integer', 'is_nullable': False, 'ordinal_position': 1, 'default': "nextval('tmp_products_id_seq'::regclass)"},
            {'name': 'title', 'data_type': 'text', 'is_nullable': True, 'ordinal_position': 2, 'default': None}],
            self.extractor.list_columns("public", "tmp_products"))

    def test_table_schemas_are_valid(self):
        """Check that all returned schemas are non-empty and not system schemas."""
        tables = self.extractor.list_tables()
        for t in tables:
            self.assertIsInstance(t["schema"], str)
            self.assertNotIn(t["schema"], ("pg_catalog", "information_schema"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
