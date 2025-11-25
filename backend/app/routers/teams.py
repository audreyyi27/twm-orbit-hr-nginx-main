from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, case, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from uuid import UUID

from app import models, schemas
from app.db import get_db
from app.deps import get_current_user_hr

router = APIRouter(prefix='/teams', tags=['teams'])


"""Get all teams with their projects and members"""
@router.get("/with-details", response_model=List[Dict[str, Any]])
async def get_teams_with_details(
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    
    # Get all teams
    teams_result = await db.execute(
        select(models.Team).order_by(models.Team.team_name)
    )
    teams = teams_result.scalars().all()
    
# Sort teams naturally by extracting numbers from team_name
    import re
    def team_sort_key(team):
        match = re.search(r'\d+', team.team_name or '')
        return (int(match.group()) if match else 999999, team.team_name.lower())
    
    teams.sort(key=team_sort_key)
    result = []

    
    for team in teams:
        # Get team's members (employees)
        members_result = await db.execute(
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
        members = members_result.scalars().all()
        
        # Get projects that team members are working on (via employee_project_task junction table)
        # This gets all unique projects where at least one team member is assigned
        # Get employee UUIDs for this team
        team_member_uuids = [m.uuid for m in members]
        
        if team_member_uuids:
            projects_result = await db.execute(
                select(models.Project)
                .join(models.EmployeeProjectTask, models.Project.project_id == models.EmployeeProjectTask.project_id)
                .where(models.EmployeeProjectTask.employee_uuid.in_(team_member_uuids))
                .order_by(models.Project.project_name)
            )
            # Use dict to deduplicate by project_id (preserves order in Python 3.7+)
            projects_dict = {p.project_id: p for p in projects_result.scalars().all()}
            projects = list(projects_dict.values())
        else:
            projects = []
        
        result.append({
            "team": schemas.Team.model_validate(team),
            "projects": [schemas.Project.model_validate(p) for p in projects],
            "members": [schemas.Employee.model_validate(m) for m in members]
        })
    
    return result


"""Get project details with members assigned to it"""
@router.get("/projects/{project_id}", response_model=Dict[str, Any])
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
        members.append(employee_dict)
    
    return {
        "project": schemas.Project.model_validate(project),
        "team": None,  # Projects are not tied to a single team
        "members": members
    }