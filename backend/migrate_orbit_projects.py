"""
Migration script to add missing columns to orbit_projects table.
Run this script to update the database schema to match the Project model.

Usage:
    python backend/migrate_orbit_projects.py
"""
import asyncio
import sys
from sqlalchemy import text, inspect
from app.db import engine
from app.models import Project


async def migrate_orbit_projects():
    """Add missing columns to orbit_projects table"""
    
    # List of columns that should exist in the table
    required_columns = {
        'status': 'VARCHAR(50)',
        'project_description': 'TEXT',
        'start_date': 'DATE',
        'end_date': 'DATE',
        'division': 'VARCHAR(50)',
        'contact_window': 'VARCHAR(100)',
    }
    
    async with engine.begin() as conn:
        # Check existing columns
        result = await conn.execute(text("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'orbit_projects'
            ORDER BY column_name
        """))
        
        existing_columns = {row[0]: row[1] for row in result.fetchall()}
        print(f"Existing columns: {list(existing_columns.keys())}")
        
        # Check if project_descriptions exists (old plural name)
        if 'project_descriptions' in existing_columns and 'project_description' not in existing_columns:
            print("Renaming project_descriptions to project_description...")
            await conn.execute(text("ALTER TABLE orbit_projects RENAME COLUMN project_descriptions TO project_description"))
            existing_columns['project_description'] = existing_columns.pop('project_descriptions')
        
        # Add missing columns
        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                print(f"Adding column: {column_name} ({column_type})...")
                try:
                    await conn.execute(text(f"ALTER TABLE orbit_projects ADD COLUMN {column_name} {column_type}"))
                    print(f"✓ Successfully added {column_name}")
                except Exception as e:
                    print(f"✗ Error adding {column_name}: {e}")
            else:
                print(f"✓ Column {column_name} already exists")
        
        # Ensure primary key exists
        pk_result = await conn.execute(text("""
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'orbit_projects'
            AND constraint_type = 'PRIMARY KEY'
        """))
        
        if not pk_result.fetchone():
            if 'project_id' in existing_columns:
                print("Adding primary key constraint on project_id...")
                try:
                    await conn.execute(text("ALTER TABLE orbit_projects ADD PRIMARY KEY (project_id)"))
                    print("✓ Successfully added primary key constraint")
                except Exception as e:
                    print(f"✗ Error adding primary key: {e}")
            else:
                print("⚠ Warning: project_id column doesn't exist, cannot add primary key")
        else:
            print("✓ Primary key constraint already exists")
    
    print("\n✓ Migration completed!")


async def main():
    try:
        await migrate_orbit_projects()
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

