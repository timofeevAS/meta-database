import unittest

import dsnparse

class DsnparsePostgresTestCase(unittest.TestCase):
    def test_basic_postgresql_dsn(self):
        dsn = "postgresql://pguser:pgpass@db.example.com:5432/mydb"

        r = dsnparse.parse(dsn)
        self.assertIn(r.scheme, ("postgresql", "postgres"))   # допускаем оба варианта схемы
        self.assertEqual(r.username, "pguser")
        self.assertEqual(r.password, "pgpass")
        self.assertEqual(r.host, "db.example.com")
        self.assertEqual(r.port, 5432)
        self.assertEqual(r.hostloc, "db.example.com:5432")

        self.assertIsInstance(r.paths, list)
        self.assertGreaterEqual(len(r.paths), 1)
        self.assertEqual(r.paths[0], "mydb")