from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional, List
from uuid import uuid4
import pytz

from ..db import get_db
from ..deps import get_current_user
from .. import models, schemas


router = APIRouter(prefix='/attendance', tags=['attendance'])

# Timezone configuration - adjust to your local timezone
LOCAL_TZ = pytz.timezone('Asia/Jakarta')  # Change to your timezone
END_OF_DAY_HOUR = 18  # 6 PM


def get_local_now():
    """Get current time in local timezone"""
    return datetime.now(LOCAL_TZ)


def get_today_date():
    """Get today's date in local timezone"""
    return get_local_now().date()


@router.get('/today', response_model=Optional[schemas.AttendanceResponse])
async def get_today_attendance(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get today's attendance record for the current user"""
    today = get_today_date()
    
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.user_id == current_user.id,
                models.Attendance.attendance_date == today
            )
        )
    )
    attendance = query.scalar_one_or_none()
    
    if attendance:
        return schemas.AttendanceResponse.from_orm(attendance)
    return None


@router.post('/clock-in', response_model=schemas.AttendanceResponse)
async def clock_in(
    request: schemas.ClockInRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Clock in for the current user"""
    today = get_today_date()
    now = get_local_now()
    
    # Check if already clocked in today
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.user_id == current_user.id,
                models.Attendance.attendance_date == today
            )
        )
    )
    existing = query.scalar_one_or_none()
    
    if existing:
        if existing.status == 'clocked_in':
            raise HTTPException(
                status_code=400,
                detail="Already clocked in for today"
            )
        elif existing.status == 'clocked_out':
            raise HTTPException(
                status_code=400,
                detail="Already completed attendance for today"
            )
    
    # Create new attendance record
    attendance = models.Attendance(
        id=uuid4(),
        user_id=current_user.id,
        attendance_date=today,
        clock_in_time=now,
        clock_in_latitude=request.latitude,
        clock_in_longitude=request.longitude,
        clock_in_address=request.address,
        status='clocked_in',
        created_at=now,
        updated_at=now
    )
    
    db.add(attendance)
    
    # Create attendance log
    log = models.AttendanceLog(
        id=uuid4(),
        attendance_id=attendance.id,
        event_type='clock_in',
        event_time=now,
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
        description=f"Clocked in at {now.strftime('%H:%M:%S')}",
        activity="Clocked in"
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(attendance)
    
    # Schedule auto clock-out check (optional, if using background tasks)
    # background_tasks.add_task(schedule_auto_clockout, attendance.id, db)
    
    return schemas.AttendanceResponse.from_orm(attendance)


@router.put('/clock-out', response_model=schemas.AttendanceResponse)
async def clock_out(
    request: schemas.ClockOutRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Clock out for the current user"""
    today = get_today_date()
    now = get_local_now()
    
    # Find today's attendance record
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.user_id == current_user.id,
                models.Attendance.attendance_date == today
            )
        )
    )
    attendance = query.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="No attendance record found for today"
        )
    
    if attendance.status != 'clocked_in':
        raise HTTPException(
            status_code=400,
            detail=f"Cannot clock out. Current status: {attendance.status}"
        )
    
    # Update attendance record
    attendance.clock_out_time = now
    attendance.clock_out_latitude = request.latitude
    attendance.clock_out_longitude = request.longitude
    attendance.clock_out_address = request.address
    attendance.work_description = request.work_description
    attendance.activity = request.activity
    attendance.status = 'clocked_out'
    attendance.updated_at = now
    
    # Create attendance log
    log = models.AttendanceLog(
        id=uuid4(),
        attendance_id=attendance.id,
        event_type='clock_out',
        event_time=now,
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
        description=f"Clocked out at {now.strftime('%H:%M:%S')}. Work: {request.work_description[:100]}",
        activity="Clocked out"
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(attendance)
    
    return schemas.AttendanceResponse.from_orm(attendance)


@router.get('/history', response_model=List[schemas.AttendanceResponse])
async def get_attendance_history(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get attendance history for the current user"""
    query = select(models.Attendance).where(
        models.Attendance.user_id == current_user.id
    )
    
    # Filter by month and year if provided
    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        query = query.where(
            and_(
                models.Attendance.attendance_date >= start_date,
                models.Attendance.attendance_date <= end_date
            )
        )
    elif year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query = query.where(
            and_(
                models.Attendance.attendance_date >= start_date,
                models.Attendance.attendance_date <= end_date
            )
        )
    
    # Order by date descending and apply pagination
    query = query.order_by(models.Attendance.attendance_date.asc())
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    attendances = result.scalars().all()
    
    return [schemas.AttendanceResponse.from_orm(att) for att in attendances]


@router.get('/stats/week', response_model=schemas.WeeklyStats)
async def get_weekly_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get weekly attendance statistics for the current user"""
    today = get_today_date()
    # Get Monday of current week
    days_since_monday = today.weekday()
    monday = today - timedelta(days=days_since_monday)
    # Get Friday (or today if before Friday)
    friday = min(monday + timedelta(days=4), today)

    # Query attendance records for this week
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.user_id == current_user.id,
                models.Attendance.attendance_date >= monday,
                models.Attendance.attendance_date <= friday
            )
        )
    )
    attendances = query.scalars().all()

    # --- Helpers ---
    def average_times(datetimes, tz_offset_hours=7):
        """Return average time of day as HH:MM string"""
        if not datetimes:
            return None
        # normalize to local timezone first
        local_times = [dt.astimezone(timezone(timedelta(hours=tz_offset_hours))) for dt in datetimes]
        seconds = [t.hour * 3600 + t.minute * 60 + t.second for t in local_times]
        avg_seconds = sum(seconds) / len(seconds)

        # hours = int(avg_seconds // 3600)
        # minutes = int((avg_seconds % 3600) // 60)
        # return f"{hours:02d}:{minutes:02d}"

        # convert seconds back into a datetime (dummy date)
        dummy_date = datetime(2000, 1, 1) + timedelta(seconds=avg_seconds)
        return dummy_date.strftime("%I:%M %p")

    # --- Stats ---
    days_present = len(attendances)
    total_days = (friday - monday).days + 1

    total_minutes = 0
    clock_in_times = []
    clock_out_times = []

    for att in attendances:
        if att.clock_in_time:
            clock_in_times.append(att.clock_in_time)
        if att.clock_out_time:
            clock_out_times.append(att.clock_out_time)
        if att.clock_in_time and att.clock_out_time:
            duration = att.clock_out_time - att.clock_in_time
            total_minutes += int(duration.total_seconds() / 60)

    avg_clock_in = average_times(clock_in_times)
    avg_clock_out = average_times(clock_out_times)

    return schemas.WeeklyStats(
        days_present=days_present,
        total_days=total_days,
        total_hours=total_minutes // 60,
        total_minutes=total_minutes % 60,
        avg_clock_in_time=avg_clock_in,
        avg_clock_out_time=avg_clock_out
    )

@router.post('/backtrack-clockout', response_model=schemas.AttendanceResponse)
async def backtrack_clockout(
    request: schemas.BacktrackClockOutRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Backtrack (undo) the most recent clock-out for the current user"""
    today = get_today_date()
    now = get_local_now()
    
    # Find today's attendance record
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.user_id == current_user.id,
                models.Attendance.attendance_date == today
            )
        )
    )
    attendance = query.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="No attendance record found for today"
        )
    
    if not attendance or attendance.status != "clocked_out":
        raise HTTPException(
            status_code=400,
            detail="No clock-out record found for today to backtrack"
        )
    
    # Save reason (optional: in audit field)
    attendance.reason = request.reason
    # Update attendance record
    attendance.clock_out_time = None
    attendance.clock_out_latitude = None
    attendance.clock_out_longitude = None
    attendance.clock_out_address = None
    attendance.work_description = None
    attendance.activity = None
    attendance.status = 'clocked_in'
    attendance.updated_at = now
    
    # Create attendance log
    log = models.AttendanceLog(
        id=uuid4(),
        attendance_id=attendance.id,
        event_type="backtrack_clock_out",
        event_time=now,
        latitude=None,
        longitude=None,
        address=None,
        description=f"Clock-out backtracked. Reason: {request.reason[:200]}",
        activity="Backtrack Clock-Out"
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(attendance)
    
    return schemas.AttendanceResponse.from_orm(attendance)

@router.get("/team/members", response_model=schemas.TeamMembersResponse)
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "team_lead":
        raise HTTPException(status_code=403, detail="Not authorized")

    query = await db.execute(
        select(models.TeamMembers, models.User)
        .join(models.User, models.TeamMembers.member_id == models.User.id)
        .where(models.TeamMembers.team_lead_id == current_user.id)
    )
    results = query.all()

    members = [
        schemas.TeamMember(
            member_id=user.id,
            employee_id=user.employee_id,
            fullname=user.fullname,
            email=user.email,
            role=user.role,
            positions=user.positions,
        )
        for team_member, user in results
    ]

    return schemas.TeamMembersResponse(
        team_lead_id=current_user.id,
        team_lead_name=current_user.fullname,
        members=members
    )

@router.get("/team/history", response_model=List[schemas.AttendanceTeamResponse])
async def get_team_attendance_history(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get attendance history for all members under the current team lead.
    """

    # Only team leads can access
    if current_user.role != "team_lead":
        raise HTTPException(status_code=403, detail="Not authorized")

    query = (
    select(models.Attendance, models.User)
    .join(models.User, models.Attendance.user_id == models.User.id)
    .join(models.TeamMembers, models.User.id == models.TeamMembers.member_id)
    .where(models.TeamMembers.team_lead_id == current_user.id)
    )
    
    # Step 3: Filter by month/year if provided
    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        query = query.where(
            and_(
                models.Attendance.attendance_date >= start_date,
                models.Attendance.attendance_date <= end_date
            )
        )
    elif year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query = query.where(
            and_(
                models.Attendance.attendance_date >= start_date,
                models.Attendance.attendance_date <= end_date
            )
        )

    # Step 4: Order by date ascending and apply pagination
    query = query.order_by(models.Attendance.attendance_date.asc())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    attendances = result.scalars().all()

    return [schemas.AttendanceTeamResponse.from_orm(att) for att in attendances]

@router.post("/permission", response_model=schemas.PermissionResponse)
async def request_permission(
    request: schemas.PermissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Submit a permission request (sick, leave, etc.).
    """
    # Create new attendance record with permission
    new_permission = models.Attendance(
        user_id=current_user.id,
        permission_date=request.permission_date,
        permission_category=request.category,
        permission_description=request.description,
        status=models.AttendanceStatusEnum.permission,
    )
    db.add(new_permission)
    await db.commit()
    await db.refresh(new_permission)

    # Log the event
    log = models.AttendanceLog(
        attendance_id=new_permission.id,
        event_type="permission",
        event_time=new_permission.created_at,
        description=request.description,
        permission_date=request.permission_date,
        permission_category=request.category,
        permission_description=request.description,
    )
    db.add(log)
    await db.commit()

    return new_permission

@router.get('/logs/{attendance_id}', response_model=List[schemas.AttendanceLogResponse])
async def get_attendance_logs(
    attendance_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all logs for a specific attendance record"""
    # First verify the attendance belongs to the current user
    att_query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.id == attendance_id,
                models.Attendance.user_id == current_user.id
            )
        )
    )
    attendance = att_query.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )
    
    # Get logs
    logs_query = await db.execute(
        select(models.AttendanceLog)
        .where(models.AttendanceLog.attendance_id == attendance_id)
        .order_by(models.AttendanceLog.event_time)
    )
    logs = logs_query.scalars().all()
    
    return [schemas.AttendanceLogResponse.from_orm(log) for log in logs]


@router.post('/auto-clockout', response_model=dict)
async def auto_clockout_all(
    db: AsyncSession = Depends(get_db),
    # Add authentication for admin/system only
    # current_user=Depends(get_admin_user)
):
    """
    Auto clock-out all users who forgot to clock out.
    This should be called by a cron job at the end of working hours.
    """
    today = get_today_date()
    now = get_local_now()
    
    # Set clock out time to 6 PM of today
    end_of_day = datetime.combine(today, time(END_OF_DAY_HOUR, 0, 0))
    end_of_day = LOCAL_TZ.localize(end_of_day)
    
    # Find all attendance records that are still clocked_in
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.attendance_date == today,
                models.Attendance.status == 'clocked_in'
            )
        )
    )
    attendances = query.scalars().all()
    
    updated_count = 0
    for attendance in attendances:
        # Update to partial status with auto clock-out
        attendance.clock_out_time = end_of_day
        attendance.status = 'partial'
        attendance.work_description = attendance.work_description or "Auto clocked-out by system"
        attendance.activity = attendance.activity or "Auto clocked-out by system"
        attendance.updated_at = now
        
        # Create log for auto clock-out
        log = models.AttendanceLog(
            id=uuid4(),
            attendance_id=attendance.id,
            event_type='auto_clock_out',
            event_time=end_of_day,
            description=f"Automatically clocked out at {END_OF_DAY_HOUR}:00 by system",
            activity=f"Automatically clocked out at {END_OF_DAY_HOUR}:00 by system"
        )
        db.add(log)
        updated_count += 1
    
    await db.commit()
    
    return {
        "message": f"Auto clock-out completed",
        "updated_count": updated_count,
        "timestamp": now.isoformat()
    }


# Optional: Endpoint to manually fix a partial attendance (admin only)
@router.put('/{attendance_id}/fix', response_model=schemas.AttendanceResponse)
async def fix_partial_attendance(
    attendance_id: str,
    request: schemas.ClockOutRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Fix a partial attendance record by providing the missing clock-out information"""
    query = await db.execute(
        select(models.Attendance).where(
            and_(
                models.Attendance.id == attendance_id,
                models.Attendance.user_id == current_user.id
            )
        )
    )
    attendance = query.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )
    
    if attendance.status != 'partial':
        raise HTTPException(
            status_code=400,
            detail="This attendance record is not partial"
        )
    
    # Update the attendance record
    attendance.work_description = request.work_description
    attendance.activity = request.activity
    attendance.status = 'clocked_out'
    attendance.updated_at = get_local_now()
    
    # Create log for the fix
    log = models.AttendanceLog(
        id=uuid4(),
        attendance_id=attendance.id,
        event_type='manual_fix',
        event_time=get_local_now(),
        description=f"Manually fixed partial attendance. Work: {request.work_description[:100]}",
        activity=f"Manually fixed partial attendance. Work: {request.activity[:100]}"
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(attendance)
    
    return schemas.AttendanceResponse.from_orm(attendance)