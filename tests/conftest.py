"""
Pytest fixtures for Assisterly backend test suite.
Configures an isolated temporary SQLite database for testing.
"""

import os
import pytest
from app import create_app
from db import init_db, seed_db


@pytest.fixture
def app(tmp_path):
    """Create and configure a new Flask app instance for each test session."""
    test_db_path = str(tmp_path / "test_assisterly.db")

    # Initialize and seed temporary database
    init_db(test_db_path)
    seed_db(test_db_path, force=True)

    app = create_app({
        "TESTING": True,
        "DATABASE_PATH": test_db_path
    })

    yield app


@pytest.fixture
def client(app):
    """Flask test client fixture."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Flask test CLI runner fixture."""
    return app.test_cli_runner()
