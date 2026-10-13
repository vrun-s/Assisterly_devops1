"""
Assisterly CLI Database Seeder
Usage:
    python seed.py
    python seed.py --force
"""

import sys
from db import init_db, seed_db, get_db_path

if __name__ == "__main__":
    force = "--force" in sys.argv
    path = get_db_path()
    print(f"Initializing database at: {path}")
    init_db()
    print(f"Seeding synthetic records (force={force})...")
    seed_db(force=force)
    print("Database initialization and seeding completed successfully.")
