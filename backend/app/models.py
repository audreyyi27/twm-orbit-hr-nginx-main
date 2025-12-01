from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum, Text, UniqueConstraint, Integer, Float, Date, ForeignKey,BigInteger, Index, LargeBinary
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
import uuid
from .db import Base
from pydantic import EmailStr
from datetime import datetime

class UserRoleEnum(str, enum.Enum):
    employee = 'employee'
    hr_admin = 'hr_admin'
    team_lead = 'team_lead'


class AttendanceStatusEnum(str, enum.Enum):
    clocked_in = 'clocked_in'
    clocked_out = 'clocked_out'
    partial = 'partial'
    permission = 'permission'


class CandidateStatusEnum(str, enum.Enum):
    applied = 'applied'
    resume_scraped = 'resume_scraped'
    screened = 'screened'
    survey = 'survey'
    coding_test = 'coding_test'
    interview_team_lead = 'interview_team_lead'
    interview_general_manager = 'interview_general_manager'
    offer = 'offer'
    hired = 'hired'
    rejected = 'rejected'


# users
class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    fullname = Column(String, nullable=False)
    employee_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    positions = Column(String)
    role: UserRoleEnum = Column(Enum(UserRoleEnum, name="user_role"), default=UserRoleEnum.employee, nullable=False)  # type: ignore[assignment, var-annotated]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    created_stages = relationship("CandidateStages",back_populates="creator")


# sessions for single-login enforcement
class UserSession(Base):
    __tablename__ = 'user_sessions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    session_token_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user_agent = Column(Text)
    ip_address = Column(String)
    is_active = Column(Boolean, default=True)


class Candidates(Base):
    __tablename__ = "candidates"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    experience_month = Column(Integer, nullable=True)
    highest_degree = Column(String(100), nullable=True)
    job_preference = Column(Text, nullable=True)
    location_preference = Column(Text, nullable=True)
    instagram = Column(String(150), nullable=True)
    linkedin = Column(String(150), nullable=True)
    github = Column(String(150), nullable=True)
    codepen = Column(String(150), nullable=True)
    facebook = Column(String(150), nullable=True)
    twitter = Column(String(150), nullable=True)
    certificate = Column(Text, nullable=True)
    volunteer_organization_experience = Column(Text, nullable=True)
    awards_from_preference = Column(Text, nullable=True)
    expected_salary = Column(String(100), nullable=True)
    about_me = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    awards = Column(Text, nullable=True)
    organization = Column(Text, nullable=True)
    whatsapp = Column(String(50), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    cv_file = Column(String(255), nullable=True)
    
    date_scraped = Column(DateTime(timezone=True), nullable=True)
    applied_as = Column(String(100), nullable=True)
    candidate_status: Optional[CandidateStatusEnum] = Column(Enum(CandidateStatusEnum, name="candidate_status", create_type=False), nullable=True, default=CandidateStatusEnum.applied)  # type: ignore[assignment, var-annotated]

    stages = relationship("CandidateStages", back_populates="candidate")


class CandidateStages(Base):
    __tablename__ = 'candidate_stages'
    id = Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True),ForeignKey("candidates.uuid",ondelete="CASCADE"),nullable=False)
    entered_at= Column(DateTime(timezone=True),server_default=func.now())
    exited_at=Column(DateTime(timezone=True),nullable=True)
    duration_seconds  =Column(BigInteger,nullable=True)
    hr_private_notes = Column(Text,nullable=True)
    send_email_on_reject = Column(Boolean,default=False)
    email_sent_at = Column(DateTime(timezone=True),nullable=True)
    created_by = Column(UUID(as_uuid=True),ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    stage_key: CandidateStatusEnum = Column(Enum(CandidateStatusEnum,name="candidate_status",create_type=False),nullable=False)  # type: ignore[assignment, var-annotated]
    candidate = relationship("Candidates",back_populates="stages")
    creator = relationship("User",back_populates="created_stages")



# Employee 
class Employee(Base):
    __tablename__ = "employee" 
    
    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team = Column(String)
    team_id = Column(String(50), ForeignKey('employee_team.team_id'))
    name = Column(String, nullable=True)
    chinese_name = Column(String)
    employee_id = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=True)
    phone_no = Column(String)
    it_field_work_experience = Column(Integer) 
    programming_languages = Column(Text)
    frameworks_libraries = Column(Text)
    tools_platforms = Column(Text)
    databases = Column(Text)
    specialization = Column(Text)
    ios_android = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    role = Column(String)
    job_desc = Column(Text)
    nt_account = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    # with team table 
    team_rel = relationship("Team", back_populates="members", foreign_keys=[team_id])

    #  with employee_project_task table 
    project_tasks = relationship("EmployeeProjectTask", back_populates="employee", cascade="all, delete-orphan")  # ✅ Added cascade


# Team model (employee_team table)
class Team(Base):
    __tablename__ = "employee_team"
    
    team_id = Column(String(50), primary_key=True)
    team_name = Column(String(100), unique=True, nullable=False)
    team_description = Column(Text)
    
    # Relationships
    members = relationship("Employee", back_populates="team_rel", foreign_keys="[Employee.team_id]")
    # Note: No direct team->projects relationship. Get projects via: team.members -> employee.project_tasks -> task.project


# Project model (employee_projects table)
class Project(Base):
    __tablename__ = "orbit_projects"
    
    project_id = Column(String(100), primary_key=True)
    project_name = Column(String(255), index=True)
    project_description = Column(Text)
    status = Column(String(50), nullable=True, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    division = Column(String(50), nullable=True)
    contact_window = Column(String(100), nullable=True)
    
    # Relationships
    # Note: Projects are NOT tied to a specific team - employees from different teams can work on the same project
    # Projects WITHOUT members will still be returned (empty list for assigned_employees)
    assigned_employees = relationship(
        "EmployeeProjectTask", 
        back_populates="project", 
        cascade="all, delete-orphan",
        lazy="select"  # Use lazy loading to ensure projects without members are included
    )



class EmployeeProjectTask(Base):
    __tablename__ = "employee_projects_tasks"
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_uuid = Column(UUID(as_uuid=True), ForeignKey("employee.uuid", ondelete='CASCADE'), nullable=False)  # ✅ Added ondelete
    contribution = Column(String(100)) 
    project_id = Column(String(100), ForeignKey("orbit_projects.project_id", ondelete='CASCADE'), nullable=False) 
    
    # Relationships
    employee = relationship("Employee", back_populates="project_tasks")
    project = relationship("Project", back_populates="assigned_employees")  # ✅ FIXED: Changed from "EmployeeProjects" to "Project"
    
    # Table constraints
    __table_args__ = (
        UniqueConstraint('employee_uuid', 'project_id', name='unique_employee_project'),
    )


# Indexes for better query performance
Index('idx_candidates_email', Candidates.email)
Index('idx_candidates_date_scraped', Candidates.date_scraped)
Index('idx_candidates_status', Candidates.candidate_status)  # type: ignore[arg-type]
Index('idx_user_sessions_token', UserSession.session_token_hash)
Index('idx_user_sessions_active', UserSession.is_active)

# ✅ ADD: New indexes for employee_project_task
Index('idx_employee_project_task_employee', EmployeeProjectTask.employee_uuid)
Index('idx_employee_project_task_project', EmployeeProjectTask.project_id)

# ✅ ADD: New indexes for performance optimization
Index('idx_project_name', Project.project_name)
Index('idx_employee_name', Employee.name)
Index('idx_employee_role', Employee.role)