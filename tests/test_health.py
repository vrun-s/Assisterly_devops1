"""
Health endpoint automated test suite.
"""

def test_health_check_success(client):
    """Test that /api/health returns 200 with database connectivity and counts."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data
    assert data["caregivers_count"] >= 8
    assert data["shifts_count"] >= 3
