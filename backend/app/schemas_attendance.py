from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date, time
from uuid import UUID


# ==================== ATTENDANCE SCHEMAS ====================
class AttendanceCreate(BaseModel):
    user_id: UUID
    attendance_date: date
    clock_in_time: Optional[datetime] = None
    clock_in_latitude: Optional[float] = None
    clock_in_longitude: Optional[float] = None
    clock_in_address: Optional[str] = None
    clock_out_time: Optional[datetime] = None
    clock_out_latitude: Optional[float] = None
    clock_out_longitude: Optional[float] = None
    clock_out_address: Optional[str] = None
    work_description: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: UUID
    user_id: UUID
    attendance_date: date
    clock_in_time: Optional[datetime] = None
    clock_in_address: Optional[str] = None
    clock_out_time: Optional[datetime] = None
    clock_out_address: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TeamMemberAttendance(BaseModel):
    employee_uuid: UUID
    employee_id: Optional[str] = None
    name: Optional[str] = None
    chinese_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[str] = None
    nt_account: Optional[str] = None
    attendance: Optional[AttendanceResponse] = None


class TeamAttendanceResponse(BaseModel):
    team_id: str
    team_name: str
    date: Optional[date] = None
    members: List[TeamMemberAttendance]


# ==================== LEAVE SCHEMAS ====================
class LeaveCreate(BaseModel):
    user_id: UUID
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration: Optional[str] = None
    reason: Optional[str] = None


class LeaveResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== OVERTIME SCHEMAS ====================
class OvertimeCreate(BaseModel):
    user_id: UUID
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[str] = None
    reason: Optional[str] = None


class OvertimeResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)