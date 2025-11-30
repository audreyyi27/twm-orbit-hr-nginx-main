from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, case, func, delete
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
    response: Response,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Force no caching - immediate fresh data
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    # Optimized: Get all projects with member counts in a single query using LEFT JOIN
    projects_result = await db.execute(
        select(
            models.Project.project_id,
            models.Project.project_name,
            models.Project.project_description,
            models.Project.status,
            models.Project.start_date,
            models.Project.end_date,
            models.Project.division,
            models.Project.contact_window,
            func.count(models.EmployeeProjectTask.task_id).label('member_count')
        )
        .outerjoin(models.EmployeeProjectTask, models.Project.project_id == models.EmployeeProjectTask.project_id)
        .group_by(
            models.Project.project_id,
            models.Project.project_name,
            models.Project.project_description,
            models.Project.status,
            models.Project.start_date,
            models.Project.end_date,
            models.Project.division,
            models.Project.contact_window
        )
        .order_by(models.Project.project_name)
    )
    projects_data = projects_result.all()
    
    # Build project cards directly without Pydantic validation overhead
    project_cards = []
    total_projects = 0
    active_projects = 0
    completed_projects = 0
    
    for row in projects_data:
        status_lower = (row.status or '').lower()
        
        # Build project card dictionary directly
        project_cards.append({
            'project_id': row.project_id,
            'project_name': row.project_name,
            'project_description': row.project_description,
            'status': row.status,
            'start_date': row.start_date.isoformat() if row.start_date else None,
            'end_date': row.end_date.isoformat() if row.end_date else None,
            'completed_date': row.end_date.isoformat() if row.end_date else None,
            'division': row.division,
            'contact_window': row.contact_window,
            'member_count': row.member_count or 0,
            'members': []
        })
        
        # Calculate stats in single pass
        total_projects += 1
        if status_lower == 'active':
            active_projects += 1
        elif status_lower == 'completed':
            completed_projects += 1
    
    return {
        "projects": project_cards,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects
    }


"""Get project details with all assigned members"""
@router.get("/{project_id}", response_model=Dict[str, Any])
async def get_project_details(
    project_id: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Force no caching - immediate fresh data
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    # Get project with specific columns only
    project_result = await db.execute(
        select(
            models.Project.project_id,
            models.Project.project_name,
            models.Project.project_description,
            models.Project.status,
            models.Project.start_date,
            models.Project.end_date,
            models.Project.division,
            models.Project.contact_window
        ).where(models.Project.project_id == project_id)
    )
    project_row = project_result.one_or_none()
    
    if not project_row:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build project dict directly
    project_dict = {
        'project_id': project_row.project_id,
        'project_name': project_row.project_name,
        'project_description': project_row.project_description,
        'status': project_row.status,
        'start_date': project_row.start_date.isoformat() if project_row.start_date else None,
        'end_date': project_row.end_date.isoformat() if project_row.end_date else None,
        'division': project_row.division,
        'contact_window': project_row.contact_window
    }
    
    # Get employees with specific columns only - optimized query
    # Use INNER JOIN to only return tasks with valid employees (filters out orphaned records)
    members_result = await db.execute(
        select(
            models.Employee.uuid,
            models.Employee.name,
            models.Employee.chinese_name,
            models.Employee.employee_id,
            models.Employee.email,
            models.Employee.role,
            models.Employee.team,
            models.Employee.specialization,
            models.Employee.programming_languages,
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
    
    # Build member list directly without Pydantic validation
    # Only includes tasks where employee still exists (orphaned tasks are automatically filtered by INNER JOIN)
    members = []
    for row in members_data:
        members.append({
            'uuid': str(row.uuid),
            'name': row.name,
            'chinese_name': row.chinese_name,
            'employee_id': row.employee_id,
            'email': row.email,
            'role': row.role,
            'team_name': row.team,
            'specialization': row.specialization,
            'programming_languages': row.programming_languages,
            'task_id': str(row.task_id),
            'contribution': row.contribution
        })
    
    return {
        "project": project_dict,
        "team": None,  # Projects are not tied to a single team
        "members": members
    }


"""ADD MEMBER to a project"""

@router.post("/{project_id}/members")
async def add_project_member(
    project_id: str,
    task_create: schemas.EmployeeProjectTaskCreate,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Verify project exists
    sanitized_id = project_id.strip().strip('<>').strip()
    project_result = await db.execute(
        select(models.Project).where(models.Project.project_id == sanitized_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        # Collect existing project IDs for debugging (limit 20)
        existing_ids_result = await db.execute(select(models.Project.project_id))
        all_ids = [row[0] for row in existing_ids_result.fetchall()]
        sample_ids = all_ids[:20]
        raise HTTPException(status_code=404, detail=f"Project not found. Provided id='{sanitized_id}'. Existing sample ids={sample_ids}")
    
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
            models.EmployeeProjectTask.project_id == sanitized_id
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Employee already assigned to this project")
    
    # Create the assignment
    new_task = models.EmployeeProjectTask(
        employee_uuid=task_create.employee_uuid,
        project_id=sanitized_id,
        contribution=task_create.contribution
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    # Return the full member data including employee info (for immediate display)
    return {
        "task_id": str(new_task.task_id),
        "employee_uuid": str(new_task.employee_uuid),
        "project_id": new_task.project_id,
        "contribution": new_task.contribution,
        "employee": {
            "uuid": str(employee.uuid),
            "name": employee.name,
            "chinese_name": employee.chinese_name,
            "employee_id": employee.employee_id,
            "email": employee.email,
            "role": employee.role,
            "team": employee.team,
            "team_name": employee.team
        }
    }


"""Remove a member from a project"""
@router.delete("/{project_id}/members/{task_id}")
async def remove_project_member(
    project_id: str,
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
    
    # Delete using SQLAlchemy 2.0 async syntax
    await db.execute(
        delete(models.EmployeeProjectTask)
        .where(models.EmployeeProjectTask.task_id == task_id)
    )
    await db.commit()
    
    return {"message": "Member removed from project successfully"}


"""Get all employees grouped by team for adding to projects"""


@router.get("/available-employees/all", response_model=List[Dict[str, Any]])
async def get_available_employees(
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Get all employees - deduplicate by UUID to ensure uniqueness
    employees_result = await db.execute(
        select(models.Employee)
        .order_by(models.Employee.team.asc(), models.Employee.name.asc())
    )
    all_employees = employees_result.scalars().all()
    
    # Step 1: Deduplicate by UUID globally (keep first occurrence only)
    seen_uuids = {}  # Map UUID -> employee (first occurrence)
    for employee in all_employees:
        uuid_str = str(employee.uuid).strip() if employee.uuid else None
        if uuid_str and uuid_str not in seen_uuids:
            seen_uuids[uuid_str] = employee
        # Note: Duplicate UUIDs are silently ignored (first occurrence is kept)
    
    # Step 2: Group deduplicated employees by team
    grouped = {}
    for uuid_str, employee in seen_uuids.items():
        team_name = employee.team or "No Team"
        if team_name not in grouped:
            grouped[team_name] = []
        
        grouped[team_name].append({
            "uuid": uuid_str,
            "name": employee.name,
            "chinese_name": employee.chinese_name,
            "employee_id": employee.employee_id,
            "email": employee.email,
            "role": employee.role,
            "team": employee.team
        })
    
    # Step 3: Final defensive deduplication within each team (in case of any issues)
    for team_name in list(grouped.keys()):
        team_members = grouped[team_name]
        seen_in_team = {}
        deduplicated_members = []
        for member in team_members:
            uuid_str = str(member.get("uuid", "")).strip()
            if uuid_str and uuid_str not in seen_in_team:
                seen_in_team[uuid_str] = member
                deduplicated_members.append(member)
        grouped[team_name] = deduplicated_members
    
    # Convert to list format for frontend
    result = []
    for team_name, members in grouped.items():
        result.append({
            "team_name": team_name,
            "members": members
        })
    
    return result

"""Update project details"""
@router.put("/{project_id}", response_model=Dict[str, Any])
async def update_project(
    project_id: str,
    project_update: schemas.ProjectUpdate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Force no caching
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    # Get the project
    sanitized_id = project_id.strip().strip('<>').strip()
    project_result = await db.execute(
        select(models.Project).where(models.Project.project_id == sanitized_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        existing_ids_result = await db.execute(select(models.Project.project_id))
        all_ids = [row[0] for row in existing_ids_result.fetchall()]
        sample_ids = all_ids[:20]
        raise HTTPException(status_code=404, detail=f"Project not found. Provided id='{sanitized_id}'. Existing sample ids={sample_ids}")
    
    # Update fields if provided
    if project_update.project_name is not None:
        project.project_name = project_update.project_name
    if project_update.project_description is not None:
        project.project_description = project_update.project_description
    if project_update.status is not None:
        project.status = project_update.status
    if project_update.contact_window is not None:
        project.contact_window = project_update.contact_window
    if project_update.division is not None:
        project.division = project_update.division
    if project_update.start_date is not None:
        project.start_date = project_update.start_date
    if project_update.end_date is not None:
        project.end_date = project_update.end_date
    
    await db.commit()
    await db.refresh(project)
    
    # Return updated project in same format as get_project_details
    return {
        "project": {
            'project_id': project.project_id,
            'project_name': project.project_name,
            'project_description': project.project_description,
            'status': project.status,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'division': project.division,
            'contact_window': project.contact_window
        },
        "team": None,
        "members": []
    }

"""Alternative explicit Update endpoint (distinct path to avoid method conflicts)"""
@router.put("/{project_id}/update", response_model=Dict[str, Any])
async def update_project_explicit(
    project_id: str,
    project_update: schemas.ProjectUpdate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    # Force no caching
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    sanitized_id = project_id.strip().strip('<>').strip()
    project_result = await db.execute(
        select(models.Project).where(models.Project.project_id == sanitized_id)
    )
    project = project_result.scalar_one_or_none()
    if not project:
        existing_ids_result = await db.execute(select(models.Project.project_id))
        all_ids = [row[0] for row in existing_ids_result.fetchall()]
        sample_ids = all_ids[:20]
        raise HTTPException(status_code=404, detail=f"Project not found. Provided id='{sanitized_id}'. Sample existing ids={sample_ids}")

    if project_update.project_name is not None:
        project.project_name = project_update.project_name
    if project_update.project_description is not None:
        project.project_description = project_update.project_description
    if project_update.status is not None:
        project.status = project_update.status
    if project_update.contact_window is not None:
        project.contact_window = project_update.contact_window
    if project_update.division is not None:
        project.division = project_update.division
    if project_update.start_date is not None:
        project.start_date = project_update.start_date
    if project_update.end_date is not None:
        project.end_date = project_update.end_date

    await db.commit()
    await db.refresh(project)

    return {
        "project": {
            'project_id': project.project_id,
            'project_name': project.project_name,
            'project_description': project.project_description,
            'status': project.status,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'division': project.division,
            'contact_window': project.contact_window
        },
        "team": None,
        "members": []
    }