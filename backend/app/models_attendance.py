from typing import Optional, Type, Any
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, ForeignKey, Float, Date, Time, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid

# Separate Base for attendance database
# Type annotation helps Mypy understand this is a valid base class
AttendanceBase: Type[Any] = declarative_base()


class AttendanceUser(AttendanceBase):
    """User table in attendance database"""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    fullname = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    positions = Column(String, nullable=True)
    role = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="user", cascade="all, delete-orphan")
    leaves = relationship("Leave", back_populates="user", cascade="all, delete-orphan")
    overtimes = relationship("Overtime", back_populates="user", cascade="all, delete-orphan")


class Attendance(AttendanceBase):
    """Main attendance records table - daily attendance with clock in/out"""
    __tablename__ = 'attendances'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    attendance_date = Column(Date, nullable=False)
    
    # Clock In
    clock_in_time = Column(DateTime(timezone=True), nullable=True)
    clock_in_latitude = Column(Float, nullable=True)
    clock_in_longitude = Column(Float, nullable=True)
    clock_in_address = Column(Text, nullable=True)
    
    # Clock Out
    clock_out_time = Column(DateTime(timezone=True), nullable=True)
    clock_out_latitude = Column(Float, nullable=True)
    clock_out_longitude = Column(Float, nullable=True)
    clock_out_address = Column(Text, nullable=True)
    
    # Additional Info
    work_description = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("AttendanceUser", back_populates="attendances")
    logs = relationship("AttendanceLog", back_populates="attendance", cascade="all, delete-orphan")


class Leave(AttendanceBase):
    """Leave requests table"""
    __tablename__ = 'leave'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    type = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration = Column(String, nullable=True)
    status = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("AttendanceUser", back_populates="leaves")


class Overtime(AttendanceBase):
    """Overtime requests table"""
    __tablename__ = 'overtime'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    type = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("AttendanceUser", back_populates="overtimes")


class AttendanceLog(AttendanceBase):
    """Attendance logs table"""
    __tablename__ = 'attendance_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_id = Column(UUID(as_uuid=True), ForeignKey('attendances.id', ondelete='CASCADE'), nullable=True)
    event_type = Column(Text, nullable=True)
    event_time = Column(DateTime(timezone=True), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    
    # Relationships
    attendance = relationship("Attendance", back_populates="logs")
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    user = relationship("AttendanceUser", back_populates="attendance_logs")


# ==================== INDEXES FOR PERFORMANCE ====================

# User indexes
Index('idx_attendance_user_username', AttendanceUser.username)
Index('idx_attendance_user_employee_id', AttendanceUser.employee_id)
Index('idx_attendance_user_email', AttendanceUser.email)
Index('idx_attendance_user_active', AttendanceUser.is_active)

# Attendance indexes
Index('idx_attendance_user_id', Attendance.user_id)
Index('idx_attendance_date', Attendance.attendance_date)
Index('idx_attendance_status', Attendance.status)
Index('idx_attendance_user_date', Attendance.user_id, Attendance.attendance_date)

# Leave indexes
Index('idx_leave_user_id', Leave.user_id)
Index('idx_leave_status', Leave.status)
Index('idx_leave_dates', Leave.start_date, Leave.end_date)

# Overtime indexes
Index('idx_overtime_user_id', Overtime.user_id)
Index('idx_overtime_status', Overtime.status)
Index('idx_overtime_dates', Overtime.start_date, Overtime.end_date)

# AttendanceLog indexes
Index('idx_attendance_log_attendance_id', AttendanceLog.attendance_id)
Index('idx_attendance_log_user_id', AttendanceLog.user_id)
Index('idx_attendance_log_event_time', AttendanceLog.event_time)