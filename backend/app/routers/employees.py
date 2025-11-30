# Employee endpoints with project relationships

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_, case
from sqlalchemy.orm import selectinload
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
        
        # Search name if not null
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
    total_items = total.scalar() or 0  # Ensure it's never None
    total_pages = ceil(total_items / per_page) if total_items > 0 else 0
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    # Execute
    result = await db.execute(query)
    employees = result.scalars().all()
    
    return schemas.PaginatedOut(
        items=[schemas.Employee.model_validate(e) for e in employees],
        meta=schemas.Metadata(total_pages=total_pages, page=page, per_page=per_page, total_items=total_items)
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


@router.get("/{uuid}/projects", response_model=schemas.EmployeeProjectDto)
async def get_employee_with_projects(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    """Get employee with all their active projects"""
    
    # Get employee
    result = await db.execute(
        select(models.Employee).where(models.Employee.uuid == uuid)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        return {"error": "Employee not found"}
    
    # Get employee's project tasks (include all projects, no status filter)
    tasks_result = await db.execute(
        select(models.EmployeeProjectTask)
        .options(selectinload(models.EmployeeProjectTask.project))
        .join(models.Project, models.EmployeeProjectTask.project_id == models.Project.project_id)
        .where(models.EmployeeProjectTask.employee_uuid == uuid)
    )
    tasks = tasks_result.scalars().all()
    
    # Build projects array
    projects = []
    for task in tasks:
        if task.project:
            projects.append({
                "task_id": str(task.task_id),
                "project_id": str(task.project.project_id),
                "project_name": task.project.project_name,
                "project_description": task.project.project_description,
                "contribution": task.contribution,
                "status": task.project.status,
                "start_date": task.project.start_date.isoformat() if task.project.start_date else None,
                "end_date": task.project.end_date.isoformat() if task.project.end_date else None,
            })
    
    return {
        "uuid": str(employee.uuid),
        "name": employee.name,
        "chinese_name": employee.chinese_name,
        "employee_id": employee.employee_id,
        "email": employee.email,
        "role": employee.role,
        "team": employee.team,
        "projects": projects
    }


@router.get("/teams/{team_name}/projects", response_model=schemas.TeamProjectsDto)
async def get_team_projects(
    team_name: str,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    """Get team with all members and all their projects (via employee_project_task + orbit_projects)"""
    
    # Decode URL-encoded team name / id
    from urllib.parse import unquote
    decoded = unquote(team_name)

    # 1) Find the team by name OR id
    team_result = await db.execute(
        select(models.Team).where(
            or_(
                func.lower(models.Team.team_name) == func.lower(decoded),
                func.lower(models.Team.team_id) == func.lower(decoded),
            )
        )
    )
    team = team_result.scalar_one_or_none()
    if not team:
        return {"team_name": decoded, "members": []}

    # 2) Get all employees in this team (ordered with team leader first)
    employees_result = await db.execute(
        select(models.Employee)
        .where(models.Employee.team_id == team.team_id)
        .order_by(
            case(
                (func.lower(models.Employee.role) == "team leader", 0),
                else_=1
            ),
            models.Employee.name.asc()
        )
    )
    employees = employees_result.scalars().all()

    if not employees:
        return {"team_name": team.team_name, "members": []}

    # 3) Fetch ALL project tasks for these employees in a single query
    employee_uuids = [e.uuid for e in employees]
    tasks_result = await db.execute(
        select(models.EmployeeProjectTask, models.Project)
        .join(models.Project, models.EmployeeProjectTask.project_id == models.Project.project_id)
        .where(models.EmployeeProjectTask.employee_uuid.in_(employee_uuids))
    )
    task_rows = tasks_result.all()

    # Group tasks by employee_uuid
    tasks_by_employee: dict = {}
    for task, project in task_rows:
        tasks_by_employee.setdefault(task.employee_uuid, []).append({
            "task_id": str(task.task_id),
            "project_id": project.project_id,
            "project_name": project.project_name,
            "project_description": project.project_description,
            "contribution": task.contribution,
            "status": project.status,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "division": project.division,
            "contact_window": project.contact_window,
        })

    # 4) Build members list in DTO shape
    members = []
    for employee in employees:
        projects = tasks_by_employee.get(employee.uuid, [])
        members.append({
            "uuid": str(employee.uuid),
            "name": employee.name,
            "chinese_name": employee.chinese_name,
            "employee_id": employee.employee_id,
            "email": employee.email,
            "role": employee.role,
            "team": employee.team,
            "projects": projects,
        })

    return {
        "team_name": team.team_name,
        "members": members,
    }