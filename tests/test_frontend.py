"""
Frontend and Static Asset Serving automated test suite.
"""

def test_serve_index_html(client):
    """Test serving index.html at root route."""
    res = client.get("/")
    assert res.status_code == 200
    assert b"Assisterly" in res.data
    assert b"caregiver-form" in res.data


def test_serve_directory_page(client):
    """Test serving directory.html."""
    res = client.get("/directory.html")
    assert res.status_code == 200
    assert b"Caregiver Directory" in res.data
    assert b"directory-grid" in res.data


def test_serve_dashboard_page(client):
    """Test serving dashboard.html."""
    res = client.get("/dashboard.html")
    assert res.status_code == 200
    assert b"Shift Dashboard" in res.data
    assert b"shift-list" in res.data


def test_serve_details_page(client):
    """Test serving details.html."""
    res = client.get("/details.html")
    assert res.status_code == 200
    assert b"Registration Confirmation" in res.data


def test_serve_css_and_js_assets(client):
    """Test serving CSS and JS frontend assets."""
    css_res = client.get("/style.css")
    assert css_res.status_code == 200
    assert len(css_res.data) > 0

    js_res = client.get("/directory.js")
    assert js_res.status_code == 200
    assert b"loadCaregivers" in js_res.data


def test_forbidden_sensitive_files(client):
    """Test that accessing sensitive files returns 403 Forbidden."""
    res1 = client.get("/requirements.txt")
    assert res1.status_code == 403
    res2 = client.get("/data/assisterly.db")
    assert res2.status_code == 403
