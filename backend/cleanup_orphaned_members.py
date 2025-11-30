"""
Script to identify and clean up orphaned employee_project_task records.

This script finds records where employee_uuid doesn't exist in the employee table
and optionally deletes them.
"""
import asyncio
from sqlalchemy import text
from app.db import AsyncSessionLocal


async def find_orphaned_records():
    """Find employee_project_task records with invalid employee_uuid"""
    async with AsyncSessionLocal() as db:
        # Find orphaned records
        query = text("""
            SELECT 
                ept.task_id,
                ept.employee_uuid,
                ept.project_id,
                ept.contribution
            FROM employee_projects_tasks ept
            LEFT JOIN employee e ON ept.employee_uuid = e.uuid
            WHERE e.uuid IS NULL
            ORDER BY ept.project_id;
        """)
        
        result = await db.execute(query)
        orphaned = result.fetchall()
        
        if not orphaned:
            print("✅ No orphaned records found!")
            return []
        
        print(f"\n⚠️  Found {len(orphaned)} orphaned records:")
        print("-" * 100)
        for row in orphaned:
            print(f"Task ID: {row.task_id}")
            print(f"  Employee UUID: {row.employee_uuid} (NOT FOUND IN employee table)")
            print(f"  Project ID: {row.project_id}")
            print(f"  Contribution: {row.contribution}")
            print("-" * 100)
        
        return orphaned


async def delete_orphaned_records():
    """Delete employee_project_task records with invalid employee_uuid"""
    async with AsyncSessionLocal() as db:
        # Delete orphaned records
        query = text("""
            DELETE FROM employee_projects_tasks
            WHERE employee_uuid NOT IN (
                SELECT uuid FROM employee
            )
            RETURNING task_id, employee_uuid, project_id;
        """)
        
        result = await db.execute(query)
        deleted = result.fetchall()
        await db.commit()
        
        if not deleted:
            print("✅ No orphaned records to delete!")
            return
        
        print(f"\n🗑️  Deleted {len(deleted)} orphaned records:")
        for row in deleted:
            print(f"  - Task {row.task_id}: employee_uuid={row.employee_uuid}, project_id={row.project_id}")


async def verify_cleanup():
    """Verify that all employee_project_task records now have valid employee_uuid"""
    async with AsyncSessionLocal() as db:
        # Verify with INNER JOIN
        query = text("""
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT ept.employee_uuid) as unique_employees,
                COUNT(DISTINCT ept.project_id) as unique_projects
            FROM employee_projects_tasks ept
            INNER JOIN employee e ON ept.employee_uuid = e.uuid;
        """)
        
        result = await db.execute(query)
        stats = result.fetchone()
        
        print("\n✅ Database verification:")
        print(f"  Total valid records: {stats.total_records}")
        print(f"  Unique employees: {stats.unique_employees}")
        print(f"  Unique projects: {stats.unique_projects}")


async def main():
    print("=" * 100)
    print("ORPHANED EMPLOYEE PROJECT TASK CLEANUP")
    print("=" * 100)
    
    # Step 1: Find orphaned records
    orphaned = await find_orphaned_records()
    
    if orphaned:
        # Step 2: Ask for confirmation
        print("\n" + "=" * 100)
        response = input("\n⚠️  Do you want to DELETE these orphaned records? (yes/no): ").strip().lower()
        
        if response == "yes":
            await delete_orphaned_records()
            print("\n" + "=" * 100)
            await verify_cleanup()
            print("\n✅ Cleanup complete!")
        else:
            print("\n❌ Cleanup cancelled.")
    
    print("=" * 100)


if __name__ == "__main__":
    asyncio.run(main())
