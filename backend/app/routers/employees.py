# Simple employee endpoints

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from math import ceil

from app import models, schemas
from app.db import get_db
from app.deps import get_current_user_hr

router = APIRouter(prefix='/employees', tags=['employees'])


@router.get("", response_model=schemas.PaginatedOut)
async def get_employees(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    """Get all employees with pagination"""
    
    query = select(models.Employee)
    
    # Search (multiple fields) - handle NULL values explicitly
    if search:
        search_conditions = []
        
        # Search name if not null (use and_ to check both conditions)
        search_conditions.append(
            models.Employee.name.isnot(None) & models.Employee.name.ilike(f"%{search}%")
        )
        
        # Search employee_id if not null
        search_conditions.append(
            models.Employee.employee_id.isnot(None) & models.Employee.employee_id.ilike(f"%{search}%")
        )
        
        # Search email if not null
        search_conditions.append(
            models.Employee.email.isnot(None) & models.Employee.email.ilike(f"%{search}%")
        )
        
        query = query.where(or_(*search_conditions))
    
    # Count
    total = await db.execute(select(func.count()).select_from(query.subquery()))
    total_items = total.scalar()
    total_pages = ceil(total_items / per_page) if total_items > 0 else 0
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    # Execute
    result = await db.execute(query)
    employees = result.scalars().all()
    
    return schemas.PaginatedOut(
        items=[schemas.Employee.model_validate(e) for e in employees],
        meta=schemas.Metadata(page=page, per_page=per_page, total_pages=total_pages)
    )


@router.get("/{uuid}")
async def get_employee(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    """Get single employee by UUID"""
    
    result = await db.execute(
        select(models.Employee).where(models.Employee.uuid == uuid)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        return {"error": "Employee not found"}
    
    return schemas.Employee.model_validate(employee)


