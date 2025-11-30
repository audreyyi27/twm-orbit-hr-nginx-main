# This file defines data validation and serialization schemas using Pydantic.

from dataclasses import dataclass
import enum
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Any, Dict, Optional, List, Literal,Annotated, Union
from datetime import datetime, date
import uuid
from fastapi import File,UploadFile

from app.models import CandidateStatusEnum


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    employee_id: str
    fullname: str
    email: Optional[str]
    phone: Optional[str]
    positions: Optional[str]
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Log in (Input validation) 
class LoginIn(BaseModel):
    username: str
    password: str

class Candidate(BaseModel):
    """Simplified Candidate schema matching actual DB fields"""
    model_config = ConfigDict(extra="ignore", from_attributes=True)
    
    # Core fields that exist in your DB
    uuid: uuid.UUID
    email: Optional[str] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    
    # English field names matching database
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    experience_month: Optional[int] = None  # total experience in months
    highest_degree: Optional[str] = None
    job_preference: Optional[str] = None
    location_preference: Optional[str] = None
    
    # Social media
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    codepen: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    
    # Additional info
    certificate: Optional[str] = None
    volunteer_organization_experience: Optional[str] = None
    awards_from_preference: Optional[str] = None
    expected_salary: Optional[str] = None
    about_me: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    awards: Optional[str] = None
    organization: Optional[str] = None
    date_scraped: Optional[datetime] = None  # When data was scraped
    applied_as: Optional[str] = None  # junior developer / senior developer
    candidate_status: Optional[CandidateStatusEnum] = None  # Current recruitment status
    # CV/Resume
    cv_file: Optional[str] = None  # CV filename

    

class CandidateCreate(BaseModel):
    """For creating new candidates - matches actual DB fields"""
    model_config = ConfigDict(extra="ignore")
    
    email: Optional[str] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    experience_month: Optional[int] = None
    highest_degree: Optional[str] = None
    job_preference: Optional[str] = None
    location_preference: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    codepen: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    certificate: Optional[str] = None
    volunteer_organization_experience: Optional[str] = None
    awards_from_preference: Optional[str] = None
    expected_salary: Optional[str] = None
    about_me: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    awards: Optional[str] = None
    organization: Optional[str] = None
    cv_file: Optional[str] = None
    date_scraped: Optional[datetime] = None
    applied_as: Optional[str] = None
    candidate_status: Optional[CandidateStatusEnum] = None

class CandidateUpdate(BaseModel):

    email: Optional[EmailStr] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    experience_month: Optional[int] = None
    highest_degree: Optional[str] = None
    job_preference: Optional[str] = None
    location_preference: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    codepen: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    certificate: Optional[str] = None
    volunteer_organization_experience: Optional[str] = None
    awards_from_preference: Optional[str] = None
    expected_salary: Optional[str] = None
    about_me: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    awards: Optional[str] = None
    organization: Optional[str] = None
    cv_file: Optional[str] = None
    candidate_status: Optional[CandidateStatusEnum] = None

@dataclass
class CandidatePayload:
    candidate:CandidateCreate
    resume:UploadFile


class CandidateOut(BaseModel):
    uuid: uuid.UUID  # Changed from 'id' to match DB column
    model_config = ConfigDict(from_attributes=True) 

class Metadata(BaseModel):
    total_pages: int
    page: int
    per_page: int
    # New: total_items for frontend to avoid separate count endpoint
    total_items: int | None = None
class PaginatedOut(BaseModel):
    items: List[Any]
    meta: Metadata

class ResponseOut(BaseModel):
    items: Any

class CandidateStageOut(BaseModel):
    model_config = ConfigDict(extra="ignore", from_attributes=True)
    id:uuid.UUID
    candidate_id:uuid.UUID 
    entered_at: datetime
    exited_at: Optional[datetime]
    duration_seconds:Optional[int]  
    hr_private_notes:Optional[str] 
    send_email_on_reject: bool 
    email_sent_at:Optional[datetime] 
    created_by:uuid.UUID 
    stage_key: CandidateStatusEnum

class CandidateStageCreate(BaseModel):
    id:list[uuid.UUID]
    note:str
    candidate_status:CandidateStatusEnum


class CandidateCountOut(BaseModel):
    items: Dict[Union[CandidateStatusEnum, Literal["all"]],int]

class EmailEnum(str,enum.Enum):
    rejection = "rejection"
    approve = "approve"
    information = "information"
    offering = "offering"
    hired = "hired"

class EmailTemplateOut(BaseModel):
    items: Dict[Literal["template"],str]

class SendEmail(BaseModel):
    subject:str
    body:str

class CandidateReport(BaseModel):

    email: EmailStr
    name: Optional[str]
    whatsapp: Optional[str]
    total_experience: Optional[float]
    highest_degree: Optional[str] 
    salary_expectation: Optional[float] 
    domicile: Optional[str]
    processed_status: Optional[str]
    primary_programming_language: Optional[str] 
    programming_language_experience: Optional[str] 

    model_config = {"from_attributes": True}


class PeriodEnum(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"
    all_time = "all_time"
    custom = "custom"

class BucketItem(BaseModel):
    bucket_start: datetime
    counts: Dict[str, int]

class Dashboard(BaseModel):
    period: PeriodEnum
    from_: Optional[datetime] = None
    to: Optional[datetime] = None
    buckets: List[BucketItem]
class DashboardResponse(BaseModel):
    items:Dashboard

# Employee (matches actual database)
class Employee(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    uuid: uuid.UUID
    team: Optional[str] = None
    team_id: Optional[str] = None  # Format: team_1, team_2, etc.
    name: Optional[str] = None
    chinese_name: Optional[str] = None
    employee_id: Optional[str] = None  
    email: Optional[str] = None
    phone_no: Optional[str] = None
    it_field_work_experience: Optional[int] = None  # Integer
    programming_languages: Optional[str] = None
    frameworks_libraries: Optional[str] = None
    tools_platforms: Optional[str] = None
    databases: Optional[str] = None
    specialization: Optional[str] = None
    ios_android: Optional[str] = None
    current_projects: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    role: Optional[str] = None
    job_desc: Optional[str] = None
    nt_account: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# TEAM 

class Team(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    team_id: str  # Format: team_1, team_2, etc.
    team_name: str
    team_description: Optional[str] = None
 
class TeamCreate(BaseModel):
    team_name: str
    team_description: Optional[str] = None
    # team_id will be auto-generated in format: team_1, team_2, etc.

# Project schemas (matches employee_projects table)
class Project(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    project_id: str  # String, not UUID (e.g., 'ORBIT000007')
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    division: Optional[str] = None
    contact_window: Optional[str] = None
    # Note: Projects are NOT tied to a specific team - employees from different teams can work on the same project
    

class ProjectCreate(BaseModel):
    project_id: Optional[str] = None  # Optional, may be auto-generated
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    division: Optional[str] = None
    contact_window: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    division: Optional[str] = None
    contact_window: Optional[str] = None


# Employee Project Task schemas (matches employee_projects_tasks table)
class EmployeeProjectTask(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    task_id: uuid.UUID
    employee_uuid: uuid.UUID
    project_id: str  # String, matches Project.project_id
    contribution: Optional[str] = None


class EmployeeProjectTaskCreate(BaseModel):
    employee_uuid: uuid.UUID
    project_id: str  # String, matches Project.project_id
    contribution: Optional[str] = None


class EmployeeProjectTaskUpdate(BaseModel):
    contribution: Optional[str] = None


class EmployeeProjectTaskWithDetails(BaseModel):
    """Task with populated employee and project names for display"""
    model_config = ConfigDict(from_attributes=True)
    
    task_id: uuid.UUID
    employee_uuid: uuid.UUID
    employee_name: Optional[str] = None  # From employee table
    project_id: str  # String, matches Project.project_id
    project_name: Optional[str] = None  # From employee_projects table
    contribution: Optional[str] = None


class EmployeeProjectItem(BaseModel):
    """Project item in employee's projects array"""
    task_id: str
    project_id: str
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    contribution: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None  # ISO format string
    end_date: Optional[str] = None  # ISO format string


class EmployeeProjectDto(BaseModel):
    """Employee with their active projects"""
    uuid: str
    name: Optional[str] = None
    chinese_name: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    projects: List[EmployeeProjectItem] = []


class TeamMemberWithProjects(BaseModel):
    """Team member with their active projects (used in TeamProjectsDto)"""
    uuid: str
    name: Optional[str] = None
    chinese_name: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    projects: List[EmployeeProjectItem] = []


class TeamProjectsDto(BaseModel):
    """Team with all members and their active projects"""
    team_name: str
    members: List[TeamMemberWithProjects] = []


# Project Dashboard schemas
class ProjectMember(BaseModel):
    """Employee info for project members list"""
    model_config = ConfigDict(from_attributes=True)
    
    task_id: uuid.UUID  # For managing the assignment
    employee_uuid: uuid.UUID
    name: Optional[str] = None
    chinese_name: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_name: Optional[str] = None  # Employee's team name from employee.team
    specialization: Optional[str] = None
    programming_languages: Optional[str] = None
    contribution: Optional[str] = None  # Their contribution to this project


class ProjectCard(BaseModel):
    """Project card/box for dashboard"""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    project_id: str  # String, not UUID (e.g., 'ORBIT000007')
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None  # Keep for database compatibility
    completed_date: Optional[date] = None  # Alias for frontend (same as end_date)
    division: Optional[str] = None
    contact_window: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None  # Populated from team table
    member_count: int = 0  # Count of employees assigned
    members: Optional[List[ProjectMember]] = None  # List of employees working on this project


class ProjectDetails(BaseModel):
    """Detailed project view with team and members"""
    project: Project
    team: Optional[Team] = None
    members: List[ProjectMember] = []


class ProjectDashboard(BaseModel):
    """Dashboard overview of all projects"""
    projects: List[ProjectCard]
    total_projects: int = 0
    active_projects: int = 0
    completed_projects: int = 0


# User schemas

class UserCreate(BaseModel):
    username: str
    password: str
    fullname: str
    employee_id: str
    email: Optional[EmailStr]
    phone: Optional[str]
    positions: Optional[str] = None
    role: Optional[str] = "employee"  # default employee

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        from app.security import validate_password_strength
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    fullname: str
    employee_id: str
    email: Optional[EmailStr]
    phone: Optional[str]
    positions: Optional[str]
    role: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    refresh_token: Optional[str]
    user: Optional[UserOut]  # include user info



class ProjectDetail(BaseModel):
    """Individual project detail in employee's projects array"""
    task_id: str
    project_id: str
    project_name: str
    project_description: Optional[str] = None
    contribution: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None






