"""
Assisterly Database Layer — SQLite Persistent Storage
Provides schema definition, connection management, initialization, and synthetic data seeding.
"""

import os
import sqlite3
from typing import Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "assisterly.db")


def get_db_path() -> str:
    """Return the database path from environment variable or default location."""
    path = os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)
    # Ensure directory exists
    dir_name = os.path.dirname(os.path.abspath(path))
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)
    return path


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Open and return a SQLite connection with foreign keys and Row factory enabled."""
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS caregivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    availability TEXT NOT NULL DEFAULT 'Available Now',
    rate REAL NOT NULL DEFAULT 40.0,
    rating REAL NOT NULL DEFAULT 4.90,
    initials TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #1F3D3B, #7A9E99)',
    bio TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    age INTEGER,
    dob TEXT,
    preferred_time TEXT,
    booking_date TEXT,
    gender TEXT,
    address TEXT,
    skills TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    meta TEXT NOT NULL,
    caregiver_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shift_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id TEXT NOT NULL,
    label TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caregiver_id TEXT NOT NULL,
    booking_date TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
);
"""

# Realistic synthetic seed caregivers matching UI directory data
SEED_CAREGIVERS = [
    {
        "id": "cg-101",
        "name": "Sister Sarah Ramesh",
        "specialty": "Post-Surgery Care",
        "availability": "Available Now",
        "rate": 45.0,
        "rating": 4.98,
        "initials": "SR",
        "color": "linear-gradient(135deg, #1F3D3B, #7A9E99)",
        "bio": "Senior ICU Nurse with 8+ years specializing in post-operative care, tracheostomy hygiene, and ventilator assistance.",
        "email": "sarah.ramesh@assisterly.com",
        "phone": "9876543210",
        "age": 34,
        "address": "42 Cross Cut Road, Gandhipuram, Coimbatore, TN 641012",
        "skills": "nursing,firstaid"
    },
    {
        "id": "cg-102",
        "name": "Rajesh Kumar",
        "specialty": "Physical Rehab",
        "availability": "This Week",
        "rate": 38.0,
        "rating": 4.95,
        "initials": "RK",
        "color": "linear-gradient(135deg, #C66B3D, #E8DCC8)",
        "bio": "Mobility & Stroke Therapist certified in patient lifting techniques, wheelchair transfers, and limb rehabilitation.",
        "email": "rajesh.kumar@assisterly.com",
        "phone": "9876543211",
        "age": 39,
        "address": "15 Avinashi Road, Peelamedu, Coimbatore, TN 641004",
        "skills": "elderly,firstaid"
    },
    {
        "id": "cg-103",
        "name": "Anitha Mary",
        "specialty": "Dementia Care",
        "availability": "Available Now",
        "rate": 40.0,
        "rating": 4.99,
        "initials": "AM",
        "color": "linear-gradient(135deg, #7A9E99, #1F3D3B)",
        "bio": "Elderly Dementia Care Specialist expert in cognitive engagement games, routine maintenance, and gentle companion care.",
        "email": "anitha.mary@assisterly.com",
        "phone": "9876543212",
        "age": 31,
        "address": "88 DB Road, RS Puram, Coimbatore, TN 641002",
        "skills": "elderly,cooking"
    },
    {
        "id": "cg-104",
        "name": "David Miller",
        "specialty": "Physical Rehab",
        "availability": "Available Tomorrow",
        "rate": 42.0,
        "rating": 4.90,
        "initials": "DM",
        "color": "linear-gradient(135deg, #C66B3D, #1F3D3B)",
        "bio": "Neuro-muscular rehab specialist supervising post-stroke exercise regimens and balance training.",
        "email": "david.miller@assisterly.com",
        "phone": "9876543213",
        "age": 42,
        "address": "21 Trichy Road, Singanallur, Coimbatore, TN 641005",
        "skills": "nursing,firstaid"
    },
    {
        "id": "cg-105",
        "name": "Elena Rostova",
        "specialty": "Elderly Care",
        "availability": "This Week",
        "rate": 36.0,
        "rating": 4.97,
        "initials": "ER",
        "color": "linear-gradient(135deg, #7A9E99, #C66B3D)",
        "bio": "Geriatric Care veteran focused on daily living assistance, medication reminders, and companionship visits.",
        "email": "elena.rostova@assisterly.com",
        "phone": "9876543214",
        "age": 46,
        "address": "7 Race Course Road, Coimbatore, TN 641018",
        "skills": "elderly,housekeeping,cooking"
    },
    {
        "id": "cg-106",
        "name": "Priya Natarajan",
        "specialty": "Child Care",
        "availability": "Available Now",
        "rate": 32.0,
        "rating": 4.93,
        "initials": "PN",
        "color": "linear-gradient(135deg, #1F3D3B, #C66B3D)",
        "bio": "Certified pediatric care assistant supporting families with special-needs children and daily routines.",
        "email": "priya.natarajan@assisterly.com",
        "phone": "9876543215",
        "age": 28,
        "address": "104 Mettupalayam Road, Saibaba Colony, Coimbatore, TN 641011",
        "skills": "firstaid,cooking"
    },
    {
        "id": "cg-107",
        "name": "Michael Okafor",
        "specialty": "Special Needs",
        "availability": "Available Tomorrow",
        "rate": 41.0,
        "rating": 4.96,
        "initials": "MO",
        "color": "linear-gradient(135deg, #E8DCC8, #1F3D3B)",
        "bio": "Special Needs support worker trained in behavioral therapy assistance and sensory-friendly care routines.",
        "email": "michael.okafor@assisterly.com",
        "phone": "9876543216",
        "age": 35,
        "address": "62 Palakkad Main Road, Kuniyamuthur, Coimbatore, TN 641008",
        "skills": "nursing,firstaid"
    },
    {
        "id": "cg-108",
        "name": "Fatima Al-Sayed",
        "specialty": "Post-Surgery Care",
        "availability": "This Week",
        "rate": 44.0,
        "rating": 4.94,
        "initials": "FA",
        "color": "linear-gradient(135deg, #7A9E99, #E8DCC8)",
        "bio": "Recovery-ward nurse specializing in wound dressing, pain management, and mobility recovery plans.",
        "email": "fatima.alsayed@assisterly.com",
        "phone": "9876543217",
        "age": 37,
        "address": "33 Marudhamalai Road, Vadavalli, Coimbatore, TN 641041",
        "skills": "nursing,firstaid"
    }
]

SEED_SHIFTS = [
    {
        "id": "shift-1",
        "title": "Morning Shift — Mr. Ramesh Iyer",
        "meta": "Today, 7:00 AM – 11:00 AM · Sister Sarah Ramesh",
        "caregiver_id": "cg-101",
        "tasks": [
            {"label": "Administer morning medication", "done": 1, "sort_order": 1},
            {"label": "Assist with bathing & hygiene", "done": 1, "sort_order": 2},
            {"label": "Prepare and serve breakfast", "done": 0, "sort_order": 3},
            {"label": "Log vitals (BP, temperature, pulse)", "done": 0, "sort_order": 4},
        ],
    },
    {
        "id": "shift-2",
        "title": "Afternoon Shift — Mrs. Kamala Devi",
        "meta": "Today, 1:00 PM – 5:00 PM · Anitha Mary",
        "caregiver_id": "cg-103",
        "tasks": [
            {"label": "Cognitive engagement activity", "done": 1, "sort_order": 1},
            {"label": "Mobility / short walk assistance", "done": 0, "sort_order": 2},
            {"label": "Afternoon medication check", "done": 0, "sort_order": 3},
        ],
    },
    {
        "id": "shift-3",
        "title": "Night Shift — Mr. David Fernandes",
        "meta": "Today, 9:00 PM – 6:00 AM · Rajesh Kumar",
        "caregiver_id": "cg-102",
        "tasks": [
            {"label": "Reposition patient (pressure sore prevention)", "done": 0, "sort_order": 1},
            {"label": "Overnight vitals check", "done": 0, "sort_order": 2},
            {"label": "Wound dressing change", "done": 0, "sort_order": 3},
            {"label": "Morning handover notes", "done": 0, "sort_order": 4},
        ],
    },
]


def init_db(db_path: Optional[str] = None) -> None:
    """Initialize database tables idempotently without dropping existing data."""
    conn = get_db_connection(db_path)
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
    finally:
        conn.close()


def seed_db(db_path: Optional[str] = None, force: bool = False) -> None:
    """Seed synthetic caregivers and shifts if database is empty or force=True."""
    conn = get_db_connection(db_path)
    try:
        cur = conn.cursor()

        # Check if caregivers table has data
        cur.execute("SELECT COUNT(*) FROM caregivers")
        cg_count = cur.fetchone()[0]

        if cg_count == 0 or force:
            if force:
                cur.execute("DELETE FROM shift_tasks")
                cur.execute("DELETE FROM shifts")
                cur.execute("DELETE FROM bookings")
                cur.execute("DELETE FROM caregivers")

            for cg in SEED_CAREGIVERS:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO caregivers (
                        id, name, specialty, availability, rate, rating,
                        initials, color, bio, email, phone, age, address, skills
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cg["id"], cg["name"], cg["specialty"], cg["availability"],
                        cg["rate"], cg["rating"], cg["initials"], cg["color"],
                        cg["bio"], cg["email"], cg["phone"], cg["age"],
                        cg["address"], cg["skills"]
                    ),
                )

            for shift in SEED_SHIFTS:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO shifts (id, title, meta, caregiver_id)
                    VALUES (?, ?, ?, ?)
                    """,
                    (shift["id"], shift["title"], shift["meta"], shift.get("caregiver_id")),
                )
                for t in shift["tasks"]:
                    cur.execute(
                        """
                        INSERT INTO shift_tasks (shift_id, label, done, sort_order)
                        VALUES (?, ?, ?, ?)
                        """,
                        (shift["id"], t["label"], t["done"], t["sort_order"]),
                    )

            conn.commit()
    finally:
        conn.close()
