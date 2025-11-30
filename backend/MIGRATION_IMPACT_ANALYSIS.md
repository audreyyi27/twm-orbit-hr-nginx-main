# Migration Impact Analysis: Adding PostgreSQL Schemas

## Quick Answer: **Minimal Code Impact** ✅

Adding schemas via migrations will **NOT** break your existing code if done correctly. Here's what changes and what doesn't:

---

## What Migrations Do

**Migrations change the DATABASE structure, not your Python code logic.**

When you run a migration to add schemas:
- ✅ Creates schemas in PostgreSQL (`CREATE SCHEMA hr; CREATE SCHEMA orbit;`)
- ✅ Moves tables to schemas (`ALTER TABLE attendance SET SCHEMA hr;`)
- ✅ Updates foreign key constraints
- ❌ **Does NOT change your Python code automatically**

---

## Code Changes Required (Minimal)

### 1. **models.py** - MUST Update ✅

**Why:** SQLAlchemy needs to know which schema each table belongs to.

**What to change:**
```python
# BEFORE
class User(Base):
    __tablename__ = 'users'
    # ...

# AFTER
class User(Base):
    __tablename__ = 'users'
    __table_args__ = {"schema": "orbit"}  # ✅ Add this
    # ...
```

**Impact:** ✅ **Only models.py changes** - No other files need schema references in queries!

### 2. **Foreign Keys in models.py** - Update Cross-Schema FKs ✅

**Why:** Foreign keys crossing schemas need explicit schema reference.

**What to change:**
```python
# BEFORE (same schema)
user_id = Column(UUID, ForeignKey('users.id'))

# AFTER (cross-schema: hr → orbit)
user_id = Column(UUID, ForeignKey('orbit.users.id'))  # ✅ Add schema
```

**Impact:** ✅ **Only in models.py** - SQLAlchemy handles the rest automatically!

---

## Code That Does NOT Need Changes ✅

### 1. **Routers (employees.py, attendances.py, etc.)** - NO CHANGES ✅

**Why:** SQLAlchemy automatically uses the schema from your model definitions.

**Example - This code works WITHOUT changes:**
```python
# This query automatically uses the correct schema!
query = await db.execute(
    select(models.Attendance).where(
        models.Attendance.user_id == current_user.id
    )
)
```

**Why it works:**
- `models.Attendance` has `__table_args__ = {"schema": "hr"}`
- SQLAlchemy automatically generates: `SELECT * FROM hr.attendance WHERE ...`
- **You don't need to write `hr.attendance` in your queries!**

### 2. **Relationships** - NO CHANGES ✅

```python
# This still works automatically!
attendance.logs  # SQLAlchemy knows to look in hr.attendance_log
user.created_stages  # SQLAlchemy knows the schema
```

### 3. **Raw SQL Queries** - MAY Need Updates ⚠️

**If you have raw SQL (rare):**
```python
# BEFORE
await db.execute(text("SELECT * FROM attendance"))

# AFTER (if using raw SQL)
await db.execute(text("SELECT * FROM hr.attendance"))
```

**But:** Most code uses SQLAlchemy ORM, so this is usually not needed.

### 4. **db.py, main.py, etc.** - NO CHANGES ✅

Connection code doesn't need schema information.

---

## Migration Process (Step by Step)

### Step 1: Update models.py (Code Change)
```python
# Add schemas to all models
class Attendance(Base):
    __tablename__ = 'attendance'
    __table_args__ = {"schema": "hr"}  # ✅ Add this
    # ...
```

### Step 2: Create Migration (Database Change)
```bash
# Generate migration
alembic revision --autogenerate -m "add_postgresql_schemas"

# This creates a migration file that will:
# - CREATE SCHEMA hr;
# - CREATE SCHEMA orbit;
# - ALTER TABLE attendance SET SCHEMA hr;
# - ALTER TABLE users SET SCHEMA orbit;
# - Update foreign keys
```

### Step 3: Review Migration File
```python
# alembic/versions/xxxx_add_postgresql_schemas.py
def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS hr")
    op.execute("CREATE SCHEMA IF NOT EXISTS orbit")
    op.execute("ALTER TABLE attendance SET SCHEMA hr")
    # ... etc
```

### Step 4: Run Migration (Database Change)
```bash
alembic upgrade head
```

### Step 5: Test Your Code
- ✅ All existing queries should work
- ✅ Relationships should work
- ✅ No code changes needed in routers

---

## What Happens to Existing Data?

### Option A: Move Existing Tables to Schemas
```sql
-- Migration moves tables
ALTER TABLE attendance SET SCHEMA hr;
ALTER TABLE users SET SCHEMA orbit;
```
**Result:** ✅ Data is preserved, just moved to a schema

### Option B: Create New Tables in Schemas
```sql
-- Migration creates new tables in schemas
CREATE TABLE hr.attendance (...);
-- Then migrate data
INSERT INTO hr.attendance SELECT * FROM attendance;
```
**Result:** ✅ Data is copied to new schema location

---

## Breaking Changes (What to Watch For)

### ❌ If You DON'T Update models.py
```python
# If you run migration but DON'T update models.py:
class Attendance(Base):
    __tablename__ = 'attendance'
    # Missing: __table_args__ = {"schema": "hr"}

# Result: SQLAlchemy looks for "public.attendance" 
# But table is now in "hr.attendance"
# ❌ BREAKS: Table not found errors
```

### ❌ If You DON'T Update Cross-Schema Foreign Keys
```python
# If Attendance is in "hr" schema and User is in "orbit" schema:
user_id = Column(UUID, ForeignKey('users.id'))  # ❌ Missing schema

# Result: Foreign key constraint fails
# ✅ Fix: ForeignKey('orbit.users.id')
```

### ✅ Safe Approach
1. Update models.py FIRST (add schemas)
2. Test locally with `Base.metadata.create_all()` 
3. Then create and run migration
4. Verify everything works

---

## Summary Table

| Component | Needs Change? | Why |
|-----------|--------------|-----|
| **models.py** | ✅ YES | Add `__table_args__ = {"schema": "..."}` |
| **Foreign Keys (models.py)** | ✅ YES (cross-schema only) | Update to `ForeignKey('schema.table.column')` |
| **Routers** | ❌ NO | SQLAlchemy handles schemas automatically |
| **Relationships** | ❌ NO | Work automatically |
| **db.py** | ❌ NO | Connection doesn't need schema info |
| **Raw SQL** | ⚠️ MAYBE | Only if you have raw SQL queries |
| **Frontend** | ❌ NO | No impact on frontend |

---

## Recommended Approach

### Phase 1: Update Code (models.py)
```python
# Add schemas to all models
__table_args__ = {"schema": "hr"}  # or "orbit"
```

### Phase 2: Test Locally
```python
# Use create_all() to test
from app.db import init_db
await init_db()  # Creates tables in correct schemas
```

### Phase 3: Create Migration
```bash
alembic revision --autogenerate -m "add_schemas"
```

### Phase 4: Run Migration
```bash
alembic upgrade head
```

### Phase 5: Verify
- ✅ All API endpoints work
- ✅ Data is accessible
- ✅ Relationships work

---

## Bottom Line

**Adding schemas via migration:**
- ✅ **Minimal code impact** (only models.py)
- ✅ **No router changes needed**
- ✅ **No query changes needed**
- ✅ **Relationships work automatically**
- ⚠️ **Must update models.py** (add `__table_args__`)
- ⚠️ **Must update cross-schema foreign keys**

**The migration itself only changes the database structure. Your code logic stays the same!**

