"""Test configuration for the local InsightFlow API suite."""

import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure importing main.py during collection never writes a database into the
# repository, even when a developer has not configured a separate test database.
_TEST_BOOTSTRAP_DIR = tempfile.TemporaryDirectory(prefix="insightflow-test-bootstrap-")
os.environ["INSIGHTFLOW_DATABASE_PATH"] = str(
    Path(_TEST_BOOTSTRAP_DIR.name) / "bootstrap.sqlite3"
)

import pytest
from fastapi.testclient import TestClient

import main as insightflow


@pytest.fixture
def client(tmp_path, monkeypatch):
    """Give every test an isolated SQLite database and a fresh API client."""
    monkeypatch.setattr(
        insightflow,
        "DATABASE_PATH",
        tmp_path / "insightflow-test.sqlite3",
    )
    insightflow.initialize_database()

    with TestClient(insightflow.app) as test_client:
        yield test_client
