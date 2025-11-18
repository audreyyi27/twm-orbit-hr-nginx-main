from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, case, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from uuid import UUID

from app import models, schemas
from app.db import get_db
from app.deps import get_current_user_hr

router = APIRouter(prefix='/projects', tags=['projects'])


"""Get all projects with their assigned members"""


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_projects_dashboard(
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Get all projects
    projects_result = await db.execute(
        select(models.Project).order_by(models.Project.project_name)
    )
    all_projects = projects_result.scalars().all()
    
    # Build project cards with member counts
    project_cards = []
    
    for project in all_projects:
        # Count members assigned to this project
        member_count_result = await db.execute(
            select(func.count(models.EmployeeProjectTask.task_id))
            .where(models.EmployeeProjectTask.project_id == project.project_id)
        )
        member_count = member_count_result.scalar() or 0
        
        # Build project card
        project_dict = schemas.Project.model_validate(project).model_dump()
        project_dict['member_count'] = member_count
        project_dict['members'] = []  # Empty for dashboard view
        
        project_cards.append(project_dict)
    
    # Calculate statistics
    total_projects = len(project_cards)
    active_projects = sum(1 for p in project_cards if p.get('status', '').lower() == 'active')
    completed_projects = sum(1 for p in project_cards if p.get('status', '').lower() == 'completed')
    
    return {
        "projects": project_cards,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects
    }


"""Get project details with all assigned members"""
@router.get("/{project_id}", response_model=Dict[str, Any])
async def get_project_details(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Get project
    project_result = await db.execute(
        select(models.Project).where(models.Project.project_id == project_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get employees assigned to this project (via employee_project_task junction table)
    # Include their contribution details from the junction table
    members_result = await db.execute(
        select(
            models.Employee,
            models.EmployeeProjectTask.task_id,
            models.EmployeeProjectTask.contribution
        )
        .join(models.EmployeeProjectTask, models.Employee.uuid == models.EmployeeProjectTask.employee_uuid)
        .where(models.EmployeeProjectTask.project_id == project_id)
        .order_by(
            case(
                (func.lower(models.Employee.role) == "team leader", 0),
                else_=1
            ),
            models.Employee.name.asc()
        )
    )
    members_data = members_result.all()
    
    # Build member list with contribution info
    members = []
    for employee, task_id, contribution in members_data:
        employee_dict = schemas.Employee.model_validate(employee).model_dump()
        employee_dict['task_id'] = str(task_id)
        employee_dict['contribution'] = contribution
        employee_dict['team_name'] = employee.team  # Map team to team_name for frontend
        members.append(employee_dict)
    
    return {
        "project": schemas.Project.model_validate(project),
        "team": None,  # Projects are not tied to a single team
        "members": members
    }


"""ADD MEMBER to a project"""
@router.post("/{project_id}/members")
async def add_project_member(
    project_id: UUID,
    task_create: schemas.EmployeeProjectTaskCreate,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Verify project exists
    project_result = await db.execute(
        select(models.Project).where(models.Project.project_id == project_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify employee exists
    employee_result = await db.execute(
        select(models.Employee).where(models.Employee.uuid == task_create.employee_uuid)
    )
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if already assigned
    existing_result = await db.execute(
        select(models.EmployeeProjectTask)
        .where(
            models.EmployeeProjectTask.employee_uuid == task_create.employee_uuid,
            models.EmployeeProjectTask.project_id == project_id
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Employee already assigned to this project")
    
    # Create the assignment
    new_task = models.EmployeeProjectTask(
        employee_uuid=task_create.employee_uuid,
        project_id=project_id,
        contribution=task_create.contribution
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    return schemas.EmployeeProjectTask.model_validate(new_task)


"""Remove a member from a project"""
@router.delete("/{project_id}/members/{task_id}")
async def remove_project_member(
    project_id: UUID,
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Find the task assignment
    task_result = await db.execute(
        select(models.EmployeeProjectTask)
        .where(
            models.EmployeeProjectTask.task_id == task_id,
            models.EmployeeProjectTask.project_id == project_id
        )
    )
    task = task_result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    await db.delete(task)
    await db.commit()
    
    return {"message": "Member removed from project successfully"}


"""Get all employees grouped by team for adding to projects"""
@router.get("/available-employees/all", response_model=List[Dict[str, Any]])
async def get_available_employees(
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Get all employees with their team info
    employees_result = await db.execute(
        select(models.Employee)
        .order_by(models.Employee.team.asc(), models.Employee.name.asc())
    )
    employees = employees_result.scalars().all()
    
    # Group by team
    grouped = {}
    for employee in employees:
        team_name = employee.team or "No Team"
        if team_name not in grouped:
            grouped[team_name] = []
        
        grouped[team_name].append({
            "uuid": str(employee.uuid),
            "name": employee.name,
            "chinese_name": employee.chinese_name,
            "employee_id": employee.employee_id,
            "email": employee.email,
            "role": employee.role,
            "team": employee.team
        })
    
    # Convert to list format for frontend
    result = []
    for team_name, members in grouped.items():
        result.append({
            "team_name": team_name,
            "members": members
        })
    
    return result

