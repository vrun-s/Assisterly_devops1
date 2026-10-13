"""
Assisterly Flask Backend Application
Exposes REST API endpoints and serves frontend static assets.
"""

import os
import re
from datetime import datetime, timezone
from flask import Flask, jsonify, request, send_from_directory
from db import get_db_connection, get_db_path, init_db, seed_db


def create_app(test_config=None) -> Flask:
    """Application factory for Assisterly."""
    app = Flask(__name__, static_folder=None)

    # Configure database path
    if test_config and "DATABASE_PATH" in test_config:
        app.config["DATABASE_PATH"] = test_config["DATABASE_PATH"]
        os.environ["DATABASE_PATH"] = test_config["DATABASE_PATH"]
    else:
        app.config["DATABASE_PATH"] = get_db_path()

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "assisterly-dev-secret-key-721")

    # Ensure schema and initial seed data exist
    with app.app_context():
        init_db(app.config["DATABASE_PATH"])
        seed_db(app.config["DATABASE_PATH"])

    def get_conn():
        return get_db_connection(app.config["DATABASE_PATH"])

    # --------------------------------------------------------------------------
    # Frontend Static File Serving
    # --------------------------------------------------------------------------
    @app.route("/")
    def serve_index():
        return send_from_directory(".", "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        # Prevent accessing sensitive files
        forbidden = [".env", ".git", "requirements", ".pytest", ".pyc", "assisterly.db"]
        if any(f in path for f in forbidden):
            return jsonify({"error": "Forbidden"}), 403

        if os.path.exists(path) and os.path.isfile(path):
            return send_from_directory(".", path)
        return jsonify({"error": "Not Found", "path": path}), 404

    # --------------------------------------------------------------------------
    # API: Health Check
    # --------------------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health_check():
        try:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM caregivers")
            cg_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM shifts")
            shifts_count = cur.fetchone()[0]
            conn.close()

            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database": "connected",
                "caregivers_count": cg_count,
                "shifts_count": shifts_count,
                "version": "1.0.0"
            }), 200
        except Exception as e:
            return jsonify({
                "status": "unhealthy",
                "error": "Database connectivity failure"
            }), 500

    # --------------------------------------------------------------------------
    # API: Caregivers
    # --------------------------------------------------------------------------
    @app.route("/api/caregivers", methods=["GET"])
    def list_caregivers():
        search_query = request.args.get("search", "").strip().lower()
        specialty = request.args.get("specialty", "").strip()
        availability = request.args.get("availability", "").strip()

        sql = """
            SELECT id, name, specialty, availability, rate, rating,
                   initials, color, bio, email, phone, age, address, skills, notes, created_at
            FROM caregivers
            WHERE 1=1
        """
        params = []

        if specialty:
            sql += " AND specialty = ?"
            params.append(specialty)

        if availability:
            sql += " AND availability = ?"
            params.append(availability)

        if search_query:
            sql += " AND (LOWER(name) LIKE ? OR LOWER(specialty) LIKE ? OR LOWER(bio) LIKE ?)"
            pattern = f"%{search_query}%"
            params.extend([pattern, pattern, pattern])

        sql += " ORDER BY rating DESC, name ASC"

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()

        caregivers = [dict(r) for r in rows]
        return jsonify(caregivers), 200

    @app.route("/api/caregivers/<caregiver_id>", methods=["GET"])
    def get_caregiver(caregiver_id):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, name, specialty, availability, rate, rating,
                   initials, color, bio, email, phone, age, address, skills, notes,
                   booking_date, preferred_time, gender, created_at
            FROM caregivers
            WHERE id = ?
            """,
            (caregiver_id,),
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": f"Caregiver '{caregiver_id}' not found"}), 404

        data = dict(row)
        # Format skills list if string
        if data.get("skills"):
            data["skills_list"] = [s.strip() for s in data["skills"].split(",") if s.strip()]
        else:
            data["skills_list"] = []

        return jsonify(data), 200

    @app.route("/api/caregivers", methods=["POST"])
    def create_caregiver():
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON request body"}), 400

        # Validate required fields: name, email, phone
        name = (data.get("name") or data.get("fullName") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()

        if len(name) < 3:
            return jsonify({"error": "Full name must be at least 3 characters long"}), 400

        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            return jsonify({"error": "A valid email address is required"}), 400

        cleaned_phone = re.sub(r"[\s\-]", "", phone)
        if len(cleaned_phone) < 10:
            return jsonify({"error": "Phone number must be at least 10 digits"}), 400

        # Generate ID & defaults
        conn = get_conn()
        cur = conn.cursor()

        # Generate clean sequential/random caregiver ID
        cur.execute("SELECT COUNT(*) FROM caregivers")
        count = cur.fetchone()[0]
        caregiver_id = data.get("id") or f"cg-{101 + count}"

        # Ensure ID uniqueness
        cur.execute("SELECT id FROM caregivers WHERE id = ?", (caregiver_id,))
        if cur.fetchone():
            caregiver_id = f"cg-{101 + count}-{int(datetime.now(timezone.utc).timestamp()) % 1000}"

        # Initials & styling
        parts = [p for p in name.split() if p]
        initials = (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper() if parts else "CG"

        colors = [
            "linear-gradient(135deg, #1F3D3B, #7A9E99)",
            "linear-gradient(135deg, #C66B3D, #E8DCC8)",
            "linear-gradient(135deg, #7A9E99, #1F3D3B)",
            "linear-gradient(135deg, #C66B3D, #1F3D3B)",
            "linear-gradient(135deg, #1F3D3B, #C66B3D)"
        ]
        color = data.get("color") or colors[count % len(colors)]

        specialty = data.get("specialty") or data.get("seatingPreference") or "In-Home Care"
        # Map frontend option codes if present
        specialty_map = {
            "in-home": "In-Home Care",
            "medical-escort": "Medical Escort",
            "night-shift": "Night Shift Monitoring",
            "rehab": "Post-Stroke Rehab"
        }
        specialty = specialty_map.get(specialty, specialty)

        availability = data.get("availability") or "Available Now"
        rate = float(data.get("rate") or 40.0)
        rating = float(data.get("rating") or 4.90)
        bio = data.get("bio") or f"Dedicated care assistant specializing in {specialty} with verified credentials."
        age = int(data.get("age")) if data.get("age") else None
        dob = data.get("dob")
        preferred_time = data.get("preferredTime") or data.get("preferred_time")
        booking_date = data.get("bookingDate") or data.get("booking_date")
        gender = data.get("gender")
        address = (data.get("address") or "").strip()
        skills = data.get("skills") or ""
        notes = data.get("notes") or data.get("additionalNotes") or ""

        cur.execute(
            """
            INSERT INTO caregivers (
                id, name, specialty, availability, rate, rating, initials, color,
                bio, email, phone, age, dob, preferred_time, booking_date, gender,
                address, skills, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                caregiver_id, name, specialty, availability, rate, rating, initials, color,
                bio, email, cleaned_phone, age, dob, preferred_time, booking_date, gender,
                address, skills, notes
            ),
        )
        conn.commit()

        # Fetch and return inserted record
        cur.execute("SELECT * FROM caregivers WHERE id = ?", (caregiver_id,))
        created = dict(cur.fetchone())
        conn.close()

        return jsonify(created), 201

    @app.route("/api/caregivers/<caregiver_id>", methods=["PUT"])
    def update_caregiver(caregiver_id):
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON request body"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM caregivers WHERE id = ?", (caregiver_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": f"Caregiver '{caregiver_id}' not found"}), 404

        # Validate updates if supplied
        if "name" in data and len(data["name"].strip()) < 3:
            conn.close()
            return jsonify({"error": "Name must be at least 3 characters"}), 400

        allowed_fields = [
            "name", "specialty", "availability", "rate", "rating", "bio",
            "email", "phone", "age", "address", "skills", "notes", "preferred_time"
        ]
        updates = []
        params = []
        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = ?")
                params.append(data[field])

        if not updates:
            conn.close()
            return jsonify({"error": "No valid fields provided for update"}), 400

        params.append(caregiver_id)
        cur.execute(f"UPDATE caregivers SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

        cur.execute("SELECT * FROM caregivers WHERE id = ?", (caregiver_id,))
        updated = dict(cur.fetchone())
        conn.close()

        return jsonify(updated), 200

    @app.route("/api/caregivers/<caregiver_id>/book", methods=["POST"])
    def book_caregiver(caregiver_id):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM caregivers WHERE id = ?", (caregiver_id,))
        cg = cur.fetchone()
        if not cg:
            conn.close()
            return jsonify({"error": f"Caregiver '{caregiver_id}' not found"}), 404

        req_data = request.get_json(silent=True) or {}
        booking_date = req_data.get("bookingDate") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        notes = req_data.get("notes") or ""

        cur.execute(
            """
            INSERT INTO bookings (caregiver_id, booking_date, notes, status)
            VALUES (?, ?, ?, 'confirmed')
            """,
            (caregiver_id, booking_date, notes),
        )
        booking_id = cur.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            "message": "Caregiver booked successfully",
            "booking_id": booking_id,
            "caregiver_id": caregiver_id,
            "caregiver_name": cg["name"],
            "status": "confirmed"
        }), 201

    @app.route("/api/bookings", methods=["GET"])
    def list_bookings():
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT b.id, b.caregiver_id, b.booking_date, b.notes, b.status, b.created_at,
                   c.name as caregiver_name, c.specialty
            FROM bookings b
            JOIN caregivers c ON b.caregiver_id = c.id
            ORDER BY b.created_at DESC
            """
        )
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify(rows), 200

    # --------------------------------------------------------------------------
    # API: Shifts & Checklist
    # --------------------------------------------------------------------------
    @app.route("/api/shifts", methods=["GET"])
    def list_shifts():
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, title, meta, caregiver_id, created_at FROM shifts ORDER BY id ASC")
        shift_rows = cur.fetchall()

        shifts = []
        for s in shift_rows:
            shift_dict = dict(s)
            cur.execute(
                """
                SELECT id, shift_id, label, done, sort_order
                FROM shift_tasks
                WHERE shift_id = ?
                ORDER BY sort_order ASC, id ASC
                """,
                (shift_dict["id"],),
            )
            tasks = []
            for t in cur.fetchall():
                task_dict = dict(t)
                task_dict["done"] = bool(task_dict["done"])
                tasks.append(task_dict)

            shift_dict["tasks"] = tasks
            shifts.append(shift_dict)

        conn.close()
        return jsonify(shifts), 200

    @app.route("/api/shifts/<shift_id>", methods=["GET"])
    def get_shift(shift_id):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, title, meta, caregiver_id, created_at FROM shifts WHERE id = ?", (shift_id,))
        shift_row = cur.fetchone()
        if not shift_row:
            conn.close()
            return jsonify({"error": f"Shift '{shift_id}' not found"}), 404

        shift_dict = dict(shift_row)
        cur.execute(
            "SELECT id, shift_id, label, done, sort_order FROM shift_tasks WHERE shift_id = ? ORDER BY sort_order ASC",
            (shift_id,),
        )
        tasks = []
        for t in cur.fetchall():
            task_dict = dict(t)
            task_dict["done"] = bool(task_dict["done"])
            tasks.append(task_dict)

        shift_dict["tasks"] = tasks
        conn.close()
        return jsonify(shift_dict), 200

    @app.route("/api/shifts", methods=["POST"])
    def create_shift():
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON request body"}), 400

        title = (data.get("title") or "").strip()
        meta = (data.get("meta") or "").strip()
        if not title or not meta:
            return jsonify({"error": "Both 'title' and 'meta' are required for a shift"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM shifts")
        count = cur.fetchone()[0]
        shift_id = data.get("id") or f"shift-{count + 1}"

        cur.execute(
            "INSERT INTO shifts (id, title, meta, caregiver_id) VALUES (?, ?, ?, ?)",
            (shift_id, title, meta, data.get("caregiver_id")),
        )

        tasks = data.get("tasks", [])
        for idx, task in enumerate(tasks):
            label = task.get("label", "").strip()
            done = 1 if task.get("done") else 0
            if label:
                cur.execute(
                    "INSERT INTO shift_tasks (shift_id, label, done, sort_order) VALUES (?, ?, ?, ?)",
                    (shift_id, label, done, idx + 1),
                )

        conn.commit()
        conn.close()
        return get_shift(shift_id)

    @app.route("/api/shifts/<shift_id>/checklist", methods=["GET"])
    def get_shift_checklist(shift_id):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM shifts WHERE id = ?", (shift_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": f"Shift '{shift_id}' not found"}), 404

        cur.execute(
            "SELECT id, shift_id, label, done, sort_order FROM shift_tasks WHERE shift_id = ? ORDER BY sort_order ASC",
            (shift_id,),
        )
        tasks = []
        for t in cur.fetchall():
            d = dict(t)
            d["done"] = bool(d["done"])
            tasks.append(d)

        conn.close()
        return jsonify(tasks), 200

    @app.route("/api/shifts/<shift_id>/checklist", methods=["POST"])
    def add_checklist_item(shift_id):
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON request body"}), 400

        label = (data.get("label") or "").strip()
        if not label:
            return jsonify({"error": "Task 'label' is required"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM shifts WHERE id = ?", (shift_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": f"Shift '{shift_id}' not found"}), 404

        done = 1 if data.get("done") else 0
        cur.execute("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM shift_tasks WHERE shift_id = ?", (shift_id,))
        next_order = cur.fetchone()[0]

        cur.execute(
            "INSERT INTO shift_tasks (shift_id, label, done, sort_order) VALUES (?, ?, ?, ?)",
            (shift_id, label, done, next_order),
        )
        task_id = cur.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            "id": task_id,
            "shift_id": shift_id,
            "label": label,
            "done": bool(done),
            "sort_order": next_order
        }), 201

    @app.route("/api/checklist/<int:task_id>", methods=["PUT", "PATCH"])
    def update_checklist_item(task_id):
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON request body"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, shift_id, label, done, sort_order FROM shift_tasks WHERE id = ?", (task_id,))
        task = cur.fetchone()
        if not task:
            conn.close()
            return jsonify({"error": f"Checklist item '{task_id}' not found"}), 404

        updates = []
        params = []
        if "done" in data:
            updates.append("done = ?")
            params.append(1 if data["done"] else 0)

        if "label" in data:
            lbl = data["label"].strip()
            if not lbl:
                conn.close()
                return jsonify({"error": "Task label cannot be empty"}), 400
            updates.append("label = ?")
            params.append(lbl)

        if not updates:
            conn.close()
            return jsonify({"error": "No valid fields to update"}), 400

        params.append(task_id)
        cur.execute(f"UPDATE shift_tasks SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

        cur.execute("SELECT id, shift_id, label, done, sort_order FROM shift_tasks WHERE id = ?", (task_id,))
        updated = dict(cur.fetchone())
        updated["done"] = bool(updated["done"])
        conn.close()

        return jsonify(updated), 200

    # --------------------------------------------------------------------------
    # Global Error Handlers (No stack traces returned to client)
    # --------------------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({"error": "Bad Request", "message": str(err)}), 400

    @app.errorhandler(404)
    def not_found(err):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(err):
        return jsonify({"error": "Method Not Allowed"}), 405

    @app.errorhandler(500)
    def internal_server_error(err):
        return jsonify({"error": "Internal Server Error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Starting Assisterly server on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
