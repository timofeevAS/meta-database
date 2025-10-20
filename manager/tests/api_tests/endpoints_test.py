import unittest
import httpx

from fastapi.testclient import TestClient
from manager.services.metadata_db.repo import insert_database
from manager.services.metadata_db.tx import tx
from manager.tests.conf.configure import config
from manager.app import create_app


class HealthEndpointTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Test application for all class.
        cls.dsn = f"postgresql://{config.user}:{config.password}@{config.host}:{config.port}/{config.dbname}"
        cls.app = create_app(test_dsn=cls.dsn)
        cls.client = TestClient(cls.app)

        # Setting up database.
        schema_sql = """--sql
            -- =======================
            -- DROP EXISTING TABLES (если уже есть)
            -- =======================
            DROP TABLE IF EXISTS
                credentials,
                foreign_key_columns,
                foreign_keys,
                primary_key_columns,
                primary_keys,
                columns,
                tables,
                databases
            CASCADE;

            -- =======================
            -- DATABASES
            -- =======================
            CREATE TABLE databases (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );

            -- =======================
            -- TABLES
            -- =======================
            CREATE TABLE tables (
                id SERIAL PRIMARY KEY,
                database_id INT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL
            );

            -- =======================
            -- COLUMNS
            -- =======================
            CREATE TABLE columns (
                id SERIAL PRIMARY KEY,
                table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                data_type VARCHAR(50) NOT NULL
            );

            -- =======================
            -- PRIMARY KEYS
            -- =======================
            CREATE TABLE primary_keys (
                id SERIAL PRIMARY KEY,
                table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE
            );

            CREATE TABLE primary_key_columns (
                pk_id INT NOT NULL REFERENCES primary_keys(id) ON DELETE CASCADE,
                column_id INT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
                ordinal_position INT NOT NULL,                  -- порядок колонки внутри PK
                PRIMARY KEY (pk_id, ordinal_position),
                UNIQUE (pk_id, column_id)
            );

            -- =======================
            -- FOREIGN KEYS
            -- =======================
            CREATE TABLE foreign_keys (
                id SERIAL PRIMARY KEY,
                table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,            -- таблица-источник
                referenced_table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE  -- таблица-цель
            );

            CREATE TABLE foreign_key_columns (
                fk_id INT NOT NULL REFERENCES foreign_keys(id) ON DELETE CASCADE,
                column_id INT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,            -- колонка-источник
                referenced_column_id INT NOT NULL REFERENCES columns(id) ON DELETE CASCADE, -- колонка-цель
                ordinal_position INT NOT NULL,                                              -- порядок в составе FK
                PRIMARY KEY (fk_id, ordinal_position),
                UNIQUE (fk_id, column_id, referenced_column_id)
            );

            -- =======================
            -- CREDENTIALS
            -- =======================
            CREATE TABLE credentials (
                id SERIAL PRIMARY KEY,
                database_id INT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
                host_ipv4 VARCHAR(255) NOT NULL,
                port INT NOT NULL CHECK (port > 0 AND port <= 65535),
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        """

        with tx() as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)
        
        insert_database("database1")
        insert_database("database2")
        insert_database("database3")

    def test_health_endpoint(self):
        response: httpx.Response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual({"status": "ok"}, response.json())

    def test_get_databases_endpoint(self):
        response: httpx.Response = self.client.get("/api/databases")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([{"id": 1, "name": "database1"}, {"id": 2, "name": "database2"}, {"id": 3, "name": "database3"}], response.json())

    def test_get_database_address(self):
        response: httpx.Response = self.client.post("/api/metadata/fill", json={"dsn": self.dsn})
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/api/databases/metadata_test/address")
        self.assertEqual(response.status_code, 200)
        self.assertEqual("localhost:55432", response.json())


if __name__ == "__main__":
    unittest.main()