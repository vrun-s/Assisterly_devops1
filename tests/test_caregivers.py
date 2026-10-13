"""
Caregivers API automated test suite.
"""

def test_list_caregivers(client):
    """Test retrieving all caregivers."""
    res = client.get("/api/caregivers")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) >= 8
    # Verify structure
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "specialty" in first
    assert "rate" in first
    assert "rating" in first


def test_filter_caregivers_by_specialty(client):
    """Test filtering caregivers by specialty."""
    res = client.get("/api/caregivers?specialty=Dementia+Care")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 1
    assert all(c["specialty"] == "Dementia Care" for c in data)


def test_filter_caregivers_by_search(client):
    """Test search caregivers by text."""
    res = client.get("/api/caregivers?search=sarah")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 1
    assert any("Sarah" in c["name"] for c in data)


def test_get_existing_caregiver(client):
    """Test retrieving an existing caregiver by ID."""
    res = client.get("/api/caregivers/cg-101")
    assert res.status_code == 200
    data = res.get_json()
    assert data["id"] == "cg-101"
    assert "Sister Sarah Ramesh" in data["name"]
    assert "skills_list" in data


def test_get_nonexistent_caregiver(client):
    """Test retrieving a nonexistent caregiver returns 404."""
    res = client.get("/api/caregivers/cg-999999")
    assert res.status_code == 404
    data = res.get_json()
    assert "error" in data


def test_create_caregiver_success(client):
    """Test creating a new caregiver successfully."""
    payload = {
        "fullName": "Kavitha Sundar",
        "email": "kavitha.sundar@example.com",
        "phone": "9876543299",
        "age": 29,
        "specialty": "Elderly Care",
        "availability": "Available Now",
        "rate": 42.0,
        "address": "12 Cross Cut Road, Coimbatore",
        "skills": "nursing,firstaid"
    }
    res = client.post("/api/caregivers", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["name"] == "Kavitha Sundar"
    assert data["email"] == "kavitha.sundar@example.com"
    assert data["initials"] == "KS"
    assert "id" in data

    # Verify caregiver can now be retrieved
    fetch_res = client.get(f"/api/caregivers/{data['id']}")
    assert fetch_res.status_code == 200


def test_create_caregiver_validation_failures(client):
    """Test validation errors for invalid or missing fields."""
    # Missing name
    res = client.post("/api/caregivers", json={"email": "a@b.com", "phone": "9876543210"})
    assert res.status_code == 400
    assert "name" in res.get_json()["error"].lower()

    # Invalid email
    res = client.post("/api/caregivers", json={"name": "John Doe", "email": "invalid-email", "phone": "9876543210"})
    assert res.status_code == 400
    assert "email" in res.get_json()["error"].lower()

    # Invalid phone
    res = client.post("/api/caregivers", json={"name": "John Doe", "email": "john@doe.com", "phone": "123"})
    assert res.status_code == 400
    assert "phone" in res.get_json()["error"].lower()


def test_update_caregiver(client):
    """Test updating an existing caregiver."""
    update_data = {
        "availability": "Available Tomorrow",
        "rate": 50.0,
        "bio": "Updated senior specialist credentials."
    }
    res = client.put("/api/caregivers/cg-101", json=update_data)
    assert res.status_code == 200
    data = res.get_json()
    assert data["availability"] == "Available Tomorrow"
    assert data["rate"] == 50.0
    assert data["bio"] == "Updated senior specialist credentials."


def test_book_caregiver(client):
    """Test booking a caregiver and persisting the booking."""
    res = client.post("/api/caregivers/cg-101/book", json={"notes": "Post-surgery morning care"})
    assert res.status_code == 201
    data = res.get_json()
    assert data["caregiver_id"] == "cg-101"
    assert data["status"] == "confirmed"

    # Verify booking appears in list
    b_res = client.get("/api/bookings")
    assert b_res.status_code == 200
    bookings = b_res.get_json()
    assert any(b["caregiver_id"] == "cg-101" for b in bookings)
