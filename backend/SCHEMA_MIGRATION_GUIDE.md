# PostgreSQL Schema Migration Guide

## Overview
This guide explains how to combine two separate databases (`orbit-recruitment` and `db_twm_attendance`) into one database using PostgreSQL schemas.

## Benefits
- ✅ Single database connection
- ✅ Logical separation via schemas
- ✅ Easier cross-schema queries
- ✅ Simpler deployment and backup

## Step 1: Create Schemas in PostgreSQL

Connect to your target database (e.g., `orbit-recruitment`) and run:

```sql
-- Create schemas
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS orbit;

-- Grant permissions (adjust as needed)
GRANT ALL ON SCHEMA hr TO audreyirwanto;
GRANT ALL ON SCHEMA orbit TO audreyirwanto;
```

## Step 2: Update Environment Variables

**Before:**
```env
DATABASE_URL=postgresql+asyncpg://audreyirwanto::@127.0.0.1:5432/orbit-recruitment
ATTENDANCE_DATABASE_URL=postgresql+asyncpg://audreyirwanto::@127.0.0.1:5432/db_twm_attendance
```

**After:**
```env
DATABASE_URL=postgresql+asyncpg://audreyirwanto::@127.0.0.1:5432/orbit-recruitment
# ATTENDANCE_DATABASE_URL is no longer needed
```

## Step 3: Migrate Data (If Needed)

If you have existing data in `db_twm_attendance`, migrate it:

```sql
-- Example: Migrate attendance table
-- 1. Export from old database
pg_dump -h 127.0.0.1 -U audreyirwanto -d db_twm_attendance -t attendance > attendance_backup.sql

-- 2. Import to new schema (modify schema in SQL file)
-- Change: CREATE TABLE attendance
-- To: CREATE TABLE hr.attendance

-- 3. Import
psql -h 127.0.0.1 -U audreyirwanto -d orbit-recruitment < attendance_backup.sql
```

## Step 4: Update Models

### Schema Assignment Strategy

**Option A: Use 'hr' schema for attendance, default/public for orbit**
- Attendance tables → `hr` schema
- Orbit/Recruitment tables → `public` (default) schema

**Option B: Use both schemas explicitly**
- Attendance tables → `hr` schema  
- Orbit/Recruitment tables → `orbit` schema

### Model Changes Required

1. **Add `__table_args__` to attendance models:**
```python
class Attendance(Base):
    __tablename__ = 'attendance'
    __table_args__ = {"schema": "hr"}  # ✅ Add this
    # ... rest of model
```

2. **Update Foreign Keys:**
   - **Same schema:** `ForeignKey('table_name.column')` (no change)
   - **Cross-schema:** `ForeignKey('schema_name.table_name.column')`

3. **Update all models in `models.py`** - see example file

## Step 5: Update Foreign Key References

### Examples:

**Before (same database, no schema):**
```python
user_id = Column(UUID, ForeignKey('users.id'))
```

**After (cross-schema):**
```python
# If User is in 'orbit' schema and Attendance is in 'hr' schema
user_id = Column(UUID, ForeignKey('orbit.users.id'))
```

**After (same schema):**
```python
# If both in 'hr' schema
attendance_id = Column(UUID, ForeignKey('hr.attendance.id'))
```

## Step 6: Update Database Connection

No changes needed to `db.py` - it will automatically work with schemas once models are updated.

## Step 7: Update Queries (If Needed)

SQLAlchemy handles schemas automatically, but if you write raw SQL:

**Before:**
```sql
SELECT * FROM attendance WHERE user_id = '...'
```

**After:**
```sql
SELECT * FROM hr.attendance WHERE user_id = '...'
```

## Step 8: Test

1. Update models
2. Run migrations/create tables
3. Test API endpoints
4. Verify data integrity

## Important Considerations

### ⚠️ Foreign Key Constraints
- Cross-schema foreign keys work but require explicit schema reference
- Example: `ForeignKey('orbit.users.id')` when referencing from `hr` schema

### ⚠️ Indexes
- Indexes are created in the same schema as the table
- No changes needed to Index() declarations

### ⚠️ Enum Types
- PostgreSQL enum types are database-level, not schema-level
- If you have enum conflicts, you may need to namespace them

### ⚠️ Relationships
- SQLAlchemy relationships work across schemas automatically
- Just ensure foreign keys are correctly specified

## Rollback Plan

If something goes wrong:
1. Keep both databases running during migration
2. Test thoroughly before removing old database
3. Have backups of both databases

## Next Steps

1. Review `models_schema_example.py` for patterns
2. Update `models.py` with schema assignments
3. Create schemas in PostgreSQL
4. Test with a development database first
5. Migrate production data carefully

