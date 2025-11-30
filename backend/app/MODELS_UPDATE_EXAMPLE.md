# How to Update Your models.py with Schemas

## Key Pattern: Combining Schema with Existing __table_args__

If you already have `__table_args__` for constraints, combine them:

### Example 1: Model with UniqueConstraint (like EmployeeProjectTask)

**BEFORE:**
```python
class EmployeeProjectTask(Base):
    __tablename__ = "employee_projects_tasks"
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_uuid = Column(UUID(as_uuid=True), ForeignKey("employee.uuid", ondelete='CASCADE'), nullable=False)
    project_id = Column(String(100), ForeignKey("orbit_projects.project_id", ondelete='CASCADE'), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('employee_uuid', 'project_id', name='unique_employee_project'),
    )
```

**AFTER (with schema):**
```python
class EmployeeProjectTask(Base):
    __tablename__ = "employee_projects_tasks"
    __table_args__ = (
        UniqueConstraint('employee_uuid', 'project_id', name='unique_employee_project'),
        {"schema": "orbit"}  # ✅ Add schema here
    )
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_uuid = Column(UUID(as_uuid=True), ForeignKey("orbit.employee.uuid", ondelete='CASCADE'), nullable=False)  # ✅ Update FK
    project_id = Column(String(100), ForeignKey("orbit.orbit_projects.project_id", ondelete='CASCADE'), nullable=False)  # ✅ Update FK
```

### Example 2: Model without __table_args__ (like User, Employee)

**BEFORE:**
```python
class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # ... rest
```

**AFTER:**
```python
class User(Base):
    __tablename__ = 'users'
    __table_args__ = {"schema": "orbit"}  # ✅ Add this (or "public" for default)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # ... rest
```

## Complete Checklist for models.py

### 1. Add Attendance Models (if missing)
```python
class Attendance(Base):
    __tablename__ = 'attendance'
    __table_args__ = {"schema": "hr"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('orbit.users.id', ondelete='CASCADE'), nullable=False)
    attendance_date = Column(Date, nullable=False)
    clock_in_time = Column(DateTime(timezone=True))
    clock_out_time = Column(DateTime(timezone=True))
    clock_in_latitude = Column(Float)
    clock_in_longitude = Column(Float)
    clock_in_address = Column(Text)
    clock_out_latitude = Column(Float)
    clock_out_longitude = Column(Float)
    clock_out_address = Column(Text)
    work_description = Column(Text)
    activity = Column(String(255))
    status = Column(Enum(AttendanceStatusEnum, name="attendance_status"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AttendanceLog(Base):
    __tablename__ = 'attendance_log'
    __table_args__ = {"schema": "hr"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_id = Column(UUID(as_uuid=True), ForeignKey('hr.attendance.id', ondelete='CASCADE'), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_time = Column(DateTime(timezone=True), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    description = Column(Text)
    activity = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### 2. Update All Existing Models

For each model, add `__table_args__ = {"schema": "orbit"}` (or keep in "public" schema):

- ✅ User → `{"schema": "orbit"}` or `{"schema": "public"}`
- ✅ UserSession → same schema as User
- ✅ Candidates → `{"schema": "orbit"}`
- ✅ CandidateStages → `{"schema": "orbit"}`
- ✅ Employee → `{"schema": "orbit"}`
- ✅ Team → `{"schema": "orbit"}`
- ✅ Project → `{"schema": "orbit"}`
- ✅ EmployeeProjectTask → combine with existing `__table_args__`

### 3. Update Foreign Keys

**Rules:**
- Same schema: `ForeignKey("table.column")` → `ForeignKey("schema.table.column")` (optional but clearer)
- Cross-schema: `ForeignKey("table.column")` → `ForeignKey("schema.table.column")` (REQUIRED)

**Examples:**
```python
# UserSession.user_id → User.id (same schema)
user_id = Column(UUID, ForeignKey('orbit.users.id'))  # ✅ Explicit schema

# CandidateStages.candidate_id → Candidates.uuid (same schema)
candidate_id = Column(UUID, ForeignKey('orbit.candidates.uuid'))  # ✅ Explicit schema

# Attendance.user_id → User.id (CROSS-SCHEMA: hr → orbit)
user_id = Column(UUID, ForeignKey('orbit.users.id'))  # ✅ MUST specify schema

# AttendanceLog.attendance_id → Attendance.id (same schema: hr → hr)
attendance_id = Column(UUID, ForeignKey('hr.attendance.id'))  # ✅ Explicit schema
```

### 4. Update EmployeeProjectTask (Special Case)

Since it already has `__table_args__`:

```python
class EmployeeProjectTask(Base):
    __tablename__ = "employee_projects_tasks"
    __table_args__ = (
        UniqueConstraint('employee_uuid', 'project_id', name='unique_employee_project'),
        {"schema": "orbit"}  # ✅ Add schema to tuple
    )
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_uuid = Column(UUID(as_uuid=True), ForeignKey("orbit.employee.uuid", ondelete='CASCADE'), nullable=False)
    project_id = Column(String(100), ForeignKey("orbit.orbit_projects.project_id", ondelete='CASCADE'), nullable=False)
```

## What You DON'T Need to Change

✅ **Queries in routers** - SQLAlchemy handles schemas automatically
✅ **Relationships** - They work across schemas
✅ **Indexes** - They're created in the same schema as the table
✅ **db.py** - No changes needed

## Summary

1. ✅ Add `__table_args__ = {"schema": "hr"}` to attendance models
2. ✅ Add `__table_args__ = {"schema": "orbit"}` to orbit/recruitment models (or keep in "public")
3. ✅ Update ForeignKey references to include schema when crossing schemas
4. ✅ Combine schema with existing `__table_args__` tuples
5. ✅ Create schemas in PostgreSQL first
6. ✅ Test thoroughly

