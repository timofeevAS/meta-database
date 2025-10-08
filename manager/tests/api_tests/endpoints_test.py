import unittest
import httpx

from fastapi.testclient import TestClient
from manager.app import create_app


class HealthEndpointTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Test application for all class.
        cls.app = create_app()
        cls.client = TestClient(cls.app)

    def test_health_endpoint(self):
        response: httpx.Response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual({"status": "ok"}, response.json())

if __name__ == "__main__":
    unittest.main()