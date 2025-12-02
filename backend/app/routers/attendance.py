# Attendance endpoints with employee relationships

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, cast
from datetime import datetime
from urllib.parse import unquote
from uuid import UUID

from app import models, models_attendance, schemas_attendance
from app.db import get_db, get_attendance_db
from app.deps import get_current_user_hr

router = APIRouter(prefix='/attendance', tags=['attendance'])


@router.get("/employee/{nt_account}/attendance", response_model=List[schemas_attendance.AttendanceResponse])
async def get_employee_attendance(
    nt_account: str,
    date: Optional[str] = None,  # Optional date filter in YYYY-MM-DD format
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr)
):
    """Get attendance records for an employee by their nt_account. Optionally filter by date."""
    
    # Step 1: Verify employee exists in HR database
    hr_result = await hr_db.execute(
        select(models.Employee).where(models.Employee.nt_account == nt_account)
    )
    employee = hr_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee with nt_account '{nt_account}' not found")
    
    # Step 2: Find matching user in attendance database
    # Try direct match first (uses index), then fall back to case-insensitive
    attendance_user_result = await attendance_db.execute(
        select(models_attendance.AttendanceUser).where(
            models_attendance.AttendanceUser.username == nt_account
        )
    )
    attendance_user = attendance_user_result.scalar_one_or_none()
    
    # If direct match fails, try case-insensitive (slower, but necessary if data is inconsistent)
    if not attendance_user:
        attendance_user_result = await attendance_db.execute(
            select(models_attendance.AttendanceUser).where(
                func.lower(models_attendance.AttendanceUser.username) == nt_account.lower()
            )
        )
        attendance_user = attendance_user_result.scalar_one_or_none()
    
    if not attendance_user:
        raise HTTPException(
            status_code=404, 
            detail=f"No attendance user found for nt_account '{nt_account}'"
        )
    
    # Step 3: Get attendance records with optional date filter
    query = select(models_attendance.Attendance).where(
        models_attendance.Attendance.user_id == attendance_user.id
    )
    
    # If date filter is provided, add it to the query (uses composite index idx_attendance_user_date)
    if date:
        try:
            filter_date = datetime.strptime(date, '%Y-%m-%d').date()
            query = query.where(models_attendance.Attendance.attendance_date == filter_date)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD")
    
    query = query.order_by(models_attendance.Attendance.attendance_date.desc())
    
    attendance_result = await attendance_db.execute(query)
    attendances = attendance_result.scalars().all()
    
    return attendances


@router.get(
    "/team/{team_identifier}/attendance",
    response_model=schemas_attendance.TeamAttendanceResponse,
)
async def get_team_attendance(
    team_identifier: str,
    date: Optional[str] = None,  # Optional date filter in YYYY-MM-DD format
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr),
):
    """
    Get attendance (optionally for a specific date) for all members of a team.
    `team_identifier` can be either team_id (e.g. 'team_1') or team_name.
    """
    decoded = unquote(team_identifier)

    # 1) Find the team by name OR id
    team_result = await hr_db.execute(
        select(models.Team).where(
            or_(
                func.lower(models.Team.team_name) == func.lower(decoded),
                func.lower(models.Team.team_id) == func.lower(decoded),
            )
        )
    )
    team = team_result.scalar_one_or_none()
    if not team:
        return schemas_attendance.TeamAttendanceResponse(
            team_id=decoded,
            team_name=decoded,
            date=None,
            members=[],
        )

    # 2) Get all employees in this team
    employees_result = await hr_db.execute(
        select(models.Employee).where(models.Employee.team_id == team.team_id)
    )
    employees = employees_result.scalars().all()

    if not employees:
        return schemas_attendance.TeamAttendanceResponse(
            team_id=str(team.team_id),
            team_name=str(team.team_name),
            date=None,
            members=[],
        )

    # Optional date parsing (shared for all members)
    filter_date = None
    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    members_out: List[schemas_attendance.TeamMemberAttendance] = []

    for employee in employees:
        # Default: no attendance record
        attendance_record = None

        if employee.nt_account:
            # Find matching user in attendance database (case-insensitive)
            attendance_user_result = await attendance_db.execute(
                select(models_attendance.AttendanceUser).where(
                    func.lower(models_attendance.AttendanceUser.username) == employee.nt_account.lower()
                )
            )
            attendance_user = attendance_user_result.scalar_one_or_none()

            if attendance_user:
                # Build attendance query for this user
                att_query = select(models_attendance.Attendance).where(
                    models_attendance.Attendance.user_id == attendance_user.id
                )

                if filter_date:
                    att_query = att_query.where(
                        models_attendance.Attendance.attendance_date == filter_date
                    )

                att_query = att_query.order_by(
                    models_attendance.Attendance.attendance_date.desc()
                )

                att_result = await attendance_db.execute(att_query)
                attendance = att_result.scalars().first()

                if attendance:
                    attendance_record = schemas_attendance.AttendanceResponse.model_validate(attendance)

        members_out.append(
            schemas_attendance.TeamMemberAttendance(
                employee_uuid=cast(UUID, employee.uuid),
                employee_id=str(employee.employee_id) if employee.employee_id is not None else None,
                name=str(employee.name) if employee.name is not None else None,
                chinese_name=str(employee.chinese_name) if employee.chinese_name is not None else None,
                email=str(employee.email) if employee.email is not None else None,
                role=str(employee.role) if employee.role is not None else None,
                team_id=str(employee.team_id) if employee.team_id is not None else None,
                nt_account=str(employee.nt_account) if employee.nt_account is not None else None,
                attendance=attendance_record,
            )
        )

    # Note: we omit echoing the parsed date to avoid strict None-only validation issues.
    # Clients can rely on the requested query parameter as the effective date.
    return schemas_attendance.TeamAttendanceResponse(
        team_id=str(team.team_id),
        team_name=str(team.team_name),
        date=None,
        members=members_out,
    )


@router.get("/employee/{nt_account}/leave", response_model=List[schemas_attendance.LeaveResponse])
async def get_employee_leave(
    nt_account: str,
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr)
):
    """Get all leave records for an employee by their nt_account"""
    
    # Step 1: Verify employee exists in HR database
    hr_result = await hr_db.execute(
        select(models.Employee).where(models.Employee.nt_account == nt_account)
    )
    employee = hr_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee with nt_account '{nt_account}' not found")
    
    # Step 2: Find matching user in attendance database
    attendance_user_result = await attendance_db.execute(
        select(models_attendance.AttendanceUser).where(
            func.lower(models_attendance.AttendanceUser.username) == nt_account.lower()
        )
    )
    attendance_user = attendance_user_result.scalar_one_or_none()
    
    if not attendance_user:
        raise HTTPException(
            status_code=404, 
            detail=f"No attendance user found for nt_account '{nt_account}'"
        )
    
    # Step 3: Get all leave records
    leave_result = await attendance_db.execute(
        select(models_attendance.Leave)
        .where(models_attendance.Leave.user_id == attendance_user.id)
        .order_by(models_attendance.Leave.start_date.desc())
    )
    leaves = leave_result.scalars().all()
    
    return leaves


@router.get("/employee/{nt_account}/overtime", response_model=List[schemas_attendance.OvertimeResponse])
async def get_employee_overtime(
    nt_account: str,
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr)
):
    """Get all overtime records for an employee by their nt_account"""
    
    # Step 1: Verify employee exists in HR database
    hr_result = await hr_db.execute(
        select(models.Employee).where(models.Employee.nt_account == nt_account)
    )
    employee = hr_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee with nt_account '{nt_account}' not found")
    
    # Step 2: Find matching user in attendance database
    attendance_user_result = await attendance_db.execute(
        select(models_attendance.AttendanceUser).where(
            func.lower(models_attendance.AttendanceUser.username) == nt_account.lower()
        )
    )
    attendance_user = attendance_user_result.scalar_one_or_none()
    
    if not attendance_user:
        raise HTTPException(
            status_code=404, 
            detail=f"No attendance user found for nt_account '{nt_account}'"
        )
    
    # Step 3: Get all overtime records
    overtime_result = await attendance_db.execute(
        select(models_attendance.Overtime)
        .where(models_attendance.Overtime.user_id == attendance_user.id)
        .order_by(models_attendance.Overtime.start_date.desc())
    )
    overtimes = overtime_result.scalars().all()
    
    return overtimes 


@router.get("/project/{project_id}/members/attendance", 
           response_model=List[schemas_attendance.ProjectMemberAttendanceResponse])
async def get_project_members_with_attendance(
    project_id: str,
    date: Optional[str] = None,  # Optional date filter in YYYY-MM-DD format
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr)
):
    """Get all members of a project with their attendance records"""
    
    # Step 1: Get all members (tasks) for this project
    tasks_result = await hr_db.execute(
        select(models.EmployeeProjectTask)
        .where(models.EmployeeProjectTask.project_id == project_id)
    )
    tasks = tasks_result.scalars().all()
    
    if not tasks:
        return []
    
    # Step 2: For each task, get employee info and attendance
    members_with_attendance = []
    
    for task in tasks:
        # Get employee details
        employee_result = await hr_db.execute(
            select(models.Employee).where(models.Employee.uuid == task.employee_uuid)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            continue
            
        # Default: no attendance record
        attendance_record = None
        
        if employee.nt_account:
            # Find matching user in attendance database
            attendance_user_result = await attendance_db.execute(
                select(models_attendance.AttendanceUser).where(
                    func.lower(models_attendance.AttendanceUser.username) == employee.nt_account.lower()
                )
            )
            attendance_user = attendance_user_result.scalar_one_or_none()
            
            if attendance_user:
                # Build attendance query
                att_query = select(models_attendance.Attendance).where(
                    models_attendance.Attendance.user_id == attendance_user.id
                )
                
                # Optional date filter
                if date:
                    try:
                        filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                        att_query = att_query.where(
                            models_attendance.Attendance.attendance_date == filter_date
                        )
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
                
                att_query = att_query.order_by(
                    models_attendance.Attendance.attendance_date.desc()
                )
                
                att_result = await attendance_db.execute(att_query)
                attendance = att_result.scalars().first()
                
                if attendance:
                    attendance_record = schemas_attendance.AttendanceResponse.model_validate(attendance)
        
        # Build response - handle None values properly
        # Helper function to safely convert to string or None
        def safe_str(value) -> Optional[str]:
            if value is None:
                return None
            str_value = str(value).strip()
            return str_value if str_value else None
        
        members_with_attendance.append(
            schemas_attendance.ProjectMemberAttendanceResponse(
                task_id=str(task.task_id),
                employee_uuid=cast(UUID, employee.uuid),
                employee_id=safe_str(employee.employee_id),
                name=safe_str(employee.name),
                chinese_name=safe_str(employee.chinese_name),
                email=safe_str(employee.email),
                role=safe_str(employee.role),
                team_name=safe_str(employee.team),
                nt_account=safe_str(employee.nt_account),
                contribution=safe_str(task.contribution),
                programming_languages=safe_str(employee.programming_languages),
                attendance=attendance_record,
            )
        )
    
    return members_with_attendance