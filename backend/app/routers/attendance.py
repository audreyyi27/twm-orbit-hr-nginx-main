# Attendance endpoints with employee relationships

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import models, models_attendance, schemas_attendance
from app.db import get_db, get_attendance_db
from app.deps import get_current_user_hr

router = APIRouter(prefix='/attendance', tags=['attendance'])


@router.get("/employee/{nt_account}/attendance", response_model=List[schemas_attendance.AttendanceResponse])
async def get_employee_attendance(
    nt_account: str,
    hr_db: AsyncSession = Depends(get_db),
    attendance_db: AsyncSession = Depends(get_attendance_db),
    current = Depends(get_current_user_hr)
):
    """Get all attendance records for an employee by their nt_account"""
    
    # Step 1: Verify employee exists in HR database
    hr_result = await hr_db.execute(
        select(models.Employee).where(models.Employee.nt_account == nt_account)
    )
    employee = hr_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee with nt_account '{nt_account}' not found")
    
    # Step 2: Find matching user in attendance database (case-insensitive)
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
    
    # Step 3: Get all attendance records
    attendance_result = await attendance_db.execute(
        select(models_attendance.Attendance)
        .where(models_attendance.Attendance.user_id == attendance_user.id)
        .order_by(models_attendance.Attendance.attendance_date.desc())
    )
    attendances = attendance_result.scalars().all()
    
    return attendances


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

    