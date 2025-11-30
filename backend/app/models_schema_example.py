"""
EXAMPLE: How to add PostgreSQL schemas to your models

This file shows the pattern - you'll need to apply this to ALL models in models.py

SCHEMA ORGANIZATION:
- "hr" schema: For attendance-related tables (Attendance, AttendanceLog)
- "orbit" schema: For recruitment/orbit-related tables (Users, Candidates, Employee, Team, Project, etc.)

IMPORTANT NOTES:
1. Foreign keys across schemas need explicit schema reference
2. All models in the same schema can reference each other normally
3. You'll need to create the schemas in PostgreSQL first
4. Update DATABASE_URL to point to one database (e.g., orbit-recruitment)
"""

from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum, Text, UniqueConstraint, 
    Integer, Float, Date, ForeignKey, BigInteger, Index, LargeBinary
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
import uuid
from .db import Base
from datetime import datetime

# ============================================================================
# ATTENDANCE MODELS (HR Schema)
# ============================================================================

class Attendance(Base):
    """Attendance model in 'hr' schema"""
    __tablename__ = 'attendance'
    __table_args__ = {"schema": "hr"}  # ✅ Add schema here
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('orbit.users.id', ondelete='CASCADE'), nullable=False)  # ✅ Cross-schema FK
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
    
    logs = relationship("AttendanceLog", back_populates="attendance", cascade="all, delete-orphan")


class AttendanceLog(Base):
    """Attendance log model in 'hr' schema"""
    __tablename__ = 'attendance_log'
    __table_args__ = {"schema": "hr"}  # ✅ Add schema here
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_id = Column(UUID(as_uuid=True), ForeignKey('hr.attendance.id', ondelete='CASCADE'), nullable=False)  # ✅ Same schema FK
    event_type = Column(String(50), nullable=False)  # clock_in, clock_out, etc.
    event_time = Column(DateTime(timezone=True), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    description = Column(Text)
    activity = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    attendance = relationship("Attendance", back_populates="logs")


# ============================================================================
# RECRUITMENT/ORBIT MODELS (Orbit Schema - or default/public schema)
# ============================================================================

class User(Base):
    """User model - can be in default schema or 'orbit' schema"""
    __tablename__ = 'users'
    # Option 1: Default schema (public) - no __table_args__ needed
    # Option 2: Orbit schema - uncomment below:
    # __table_args__ = {"schema": "orbit"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    fullname = Column(String, nullable=False)
    employee_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    positions = Column(String)
    role = Column(Enum(UserRoleEnum, name="user_role"), default=UserRoleEnum.employee, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Employee(Base):
    """Employee model - in orbit schema"""
    __tablename__ = "employee"
    # __table_args__ = {"schema": "orbit"}  # ✅ Uncomment if using orbit schema
    
    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(String(50), ForeignKey('orbit.employee_team.team_id'))  # ✅ If using orbit schema
    # OR: ForeignKey('employee_team.team_id') if same schema
    name = Column(String, nullable=True)
    # ... rest of fields


class Team(Base):
    """Team model - in orbit schema"""
    __tablename__ = "employee_team"
    # __table_args__ = {"schema": "orbit"}  # ✅ Uncomment if using orbit schema
    
    team_id = Column(String(50), primary_key=True)
    team_name = Column(String(100), unique=True, nullable=False)
    team_description = Column(Text)
    
    members = relationship("Employee", back_populates="team_rel")


# ============================================================================
# KEY POINTS FOR FOREIGN KEYS:
# ============================================================================
"""
1. SAME SCHEMA:
   ForeignKey('table_name.column')  # Works fine

2. CROSS-SCHEMA:
   ForeignKey('schema_name.table_name.column')  # Must specify schema

3. EXAMPLES:
   - Attendance.user_id → User.id (cross-schema):
     ForeignKey('orbit.users.id')  # or 'public.users.id' if default
   
   - AttendanceLog.attendance_id → Attendance.id (same schema):
     ForeignKey('hr.attendance.id')  # Explicit schema for clarity
"""

