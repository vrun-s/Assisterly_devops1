"""
Shifts and Checklist API automated test suite.
"""

def test_list_shifts(client):
    """Test retrieving all shifts with their checklist tasks."""
    res = client.get("/api/shifts")
    assert res.status_code == 200
    shifts = res.get_json()
    assert isinstance(shifts, list)
    assert len(shifts) >= 3

    # Check shift-1 structure
    s1 = next(s for s in shifts if s["id"] == "shift-1")
    assert "Morning Shift" in s1["title"]
    assert "tasks" in s1
    assert len(s1["tasks"]) >= 4
    # Check task structure
    t = s1["tasks"][0]
    assert "id" in t
    assert "label" in t
    assert isinstance(t["done"], bool)


def test_update_checklist_item_persistence(client):
    """Test toggling a checklist item status and verifying persistence in database."""
    # Find a task in shift-1 that is not done (or check task 3)
    shifts = client.get("/api/shifts").get_json()
    s1 = next(s for s in shifts if s["id"] == "shift-1")
    target_task = next(t for t in s1["tasks"] if not t["done"])
    task_id = target_task["id"]

    # Update to done: True
    update_res = client.put(f"/api/checklist/{task_id}", json={"done": True})
    assert update_res.status_code == 200
    assert update_res.get_json()["done"] is True

    # Retrieve shifts again and verify persistence
    shifts_after = client.get("/api/shifts").get_json()
    s1_after = next(s for s in shifts_after if s["id"] == "shift-1")
    task_after = next(t for t in s1_after["tasks"] if t["id"] == task_id)
    assert task_after["done"] is True

    # Toggle back to False
    update_res_2 = client.put(f"/api/checklist/{task_id}", json={"done": False})
    assert update_res_2.status_code == 200
    assert update_res_2.get_json()["done"] is False


def test_create_shift_and_checklist_item(client):
    """Test creating a new shift and adding a checklist item."""
    new_shift = {
        "title": "Evening Rehab Shift — Mr. John",
        "meta": "Today, 5:00 PM – 9:00 PM · David Miller",
        "tasks": [
            {"label": "Limb mobility exercise", "done": False}
        ]
    }
    create_res = client.post("/api/shifts", json=new_shift)
    assert create_res.status_code == 200
    shift_data = create_res.get_json()
    shift_id = shift_data["id"]
    assert len(shift_data["tasks"]) == 1

    # Add a checklist item
    add_res = client.post(f"/api/shifts/{shift_id}/checklist", json={"label": "Record recovery notes", "done": False})
    assert add_res.status_code == 201
    assert add_res.get_json()["label"] == "Record recovery notes"

    # Verify shift checklist endpoint
    checklist_res = client.get(f"/api/shifts/{shift_id}/checklist")
    assert checklist_res.status_code == 200
    tasks = checklist_res.get_json()
    assert len(tasks) == 2


def test_nonexistent_checklist_item(client):
    """Test updating a nonexistent checklist item returns 404."""
    res = client.put("/api/checklist/99999", json={"done": True})
    assert res.status_code == 404
