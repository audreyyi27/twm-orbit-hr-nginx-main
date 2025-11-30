#!/usr/bin/env python3
"""
Comprehensive Candidate Seeder
Creates 1000 candidate records with all related models for performance testing
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import List
import faker

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Import your models and database
from app.db import AsyncSessionLocal
from app.models import User, Candidates, CandidateStages, UserRoleEnum, CandidateStatusEnum
from app.security import get_password_hash

# Initialize faker for realistic data
fake = faker.Faker()

class CandidateSeeder:
    def __init__(self):
        self.users_created = []
        self.candidates_created = []
        self.stages_created = []
        
    async def create_users(self, db: AsyncSession, count: int = 10):
        """Create HR users and team leads for the system"""
        print(f"Creating {count} users...")
        
        # Create HR Admin
        hr_admin = User(
            id=uuid.uuid4(),
            username="hr_admin",
            password_hash=get_password_hash("admin123"),
            fullname="HR Administrator",
            employee_id="HR001",
            email="hr@company.com",
            phone="+6281234567890",
            positions="HR Manager",
            role=UserRoleEnum.hr_admin,
            is_active=True
        )
        db.add(hr_admin)
        self.users_created.append(hr_admin)
        
        # Create Team Leads
        for i in range(3):
            team_lead = User(
                id=uuid.uuid4(),
                username=f"teamlead{i+1}",
                password_hash=get_password_hash("teamlead123"),
                fullname=fake.name(),
                employee_id=f"TL{i+1:03d}",
                email=fake.email(),
                phone=fake.phone_number(),
                positions="Team Lead",
                role=UserRoleEnum.team_lead,
                is_active=True
            )
            db.add(team_lead)
            self.users_created.append(team_lead)
        
        # Create HR Staff
        for i in range(count - 4):
            hr_staff = User(
                id=uuid.uuid4(),
                username=f"hr{i+1}",
                password_hash=get_password_hash("hr123"),
                fullname=fake.name(),
                employee_id=f"HR{i+2:03d}",
                email=fake.email(),
                phone=fake.phone_number(),
                positions="HR Staff",
                role=UserRoleEnum.hr_admin,
                is_active=True
            )
            db.add(hr_staff)
            self.users_created.append(hr_staff)
        
        await db.commit()
        print(f"✅ Created {len(self.users_created)} users")
        return self.users_created

    async def create_candidates(self, db: AsyncSession, count: int = 1000):
        """Create 1000 candidate records with realistic data"""
        print(f"Creating {count} candidates...")
        
        # Programming languages and frameworks
        programming_languages = [
            "Python", "JavaScript", "Java", "C#", "Go", "Rust", "PHP", "Ruby", 
            "Swift", "Kotlin", "TypeScript", "C++", "C", "Scala", "R"
        ]
        
        frameworks = [
            "React", "Vue.js", "Angular", "Django", "Flask", "FastAPI", "Spring Boot",
            "Laravel", "Express.js", "Next.js", "Nuxt.js", "Svelte", "ASP.NET Core"
        ]
        
        operating_systems = ["Windows", "macOS", "Linux", "Ubuntu", "CentOS", "Debian"]
        
        degrees = ["Bachelor's", "Master's", "PhD", "Diploma", "Associate's", "High School"]
        
        cities = [
            "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar",
            "Palembang", "Tangerang", "Depok", "Bekasi", "Yogyakarta", "Malang"
        ]
        
        for i in range(count):
            # Generate realistic candidate data
            applied_date = fake.date_time_between(start_date='-2y', end_date='now')
            
            candidate = Candidates(
                id=uuid.uuid4(),
                email=fake.email(),
                name=fake.name(),
                whatsapp=fake.phone_number(),
                total_experience=round(random.uniform(0.5, 15.0), 1),
                highest_degree=random.choice(degrees),
                salary_expectation=random.randint(5000000, 50000000),
                qualified_criteria1=random.choice([True, False]),
                qualified_criteria2=random.choice([True, False]),
                date_standardized=fake.date_time_between(start_date=applied_date, end_date='now'),
                form_timestamp=fake.date_time_between(start_date=applied_date, end_date='now'),
                work_experience=fake.text(max_nb_chars=500),
                last_project_description=fake.text(max_nb_chars=300),
                primary_programming_language=random.choice(programming_languages),
                programming_language_experience=fake.text(max_nb_chars=200),
                operating_systems=", ".join(random.sample(operating_systems, random.randint(1, 3))),
                frameworks_libraries=", ".join(random.sample(frameworks, random.randint(2, 5))),
                server_experience=fake.text(max_nb_chars=150),
                domicile=random.choice(cities),
                processed_status=random.choice(list(CandidateStatusEnum)),
                os_skills=fake.text(max_nb_chars=100),
                development_methodology=fake.text(max_nb_chars=200),
                learning_new_tech_reaction=fake.text(max_nb_chars=150),
                environment_change_readiness=fake.text(max_nb_chars=150),
                team_work_experience=fake.text(max_nb_chars=200),
                remote_work_experience=fake.text(max_nb_chars=150),
                ai_ml_experience=fake.text(max_nb_chars=100),
                tools_ide_used=", ".join(random.sample([
                    "VS Code", "IntelliJ", "Eclipse", "Sublime Text", "Vim", "Emacs",
                    "PyCharm", "WebStorm", "Android Studio", "Xcode"
                ], random.randint(2, 4))),
                learning_new_skills=fake.text(max_nb_chars=150),
                learning_sources=fake.text(max_nb_chars=100),
                git_experience=fake.text(max_nb_chars=100),
                virtualization_experience=fake.text(max_nb_chars=100),
                prd_foreign_language_approach=fake.text(max_nb_chars=150),
                multiple_deadlines_strategy=fake.text(max_nb_chars=150),
                complex_project_experience=fake.text(max_nb_chars=200),
                ai_tools_usage=fake.text(max_nb_chars=100),
                remote_work_interest=random.choice(["Yes", "No", "Maybe"]),
                company_interest_reason=fake.text(max_nb_chars=200),
                coding_test_date=fake.date_time_between(start_date=applied_date, end_date='now') if random.choice([True, False]) else None,
                team_lead_interview_date=fake.date_time_between(start_date=applied_date, end_date='now') if random.choice([True, False]) else None,
                final_interview_date=fake.date_time_between(start_date=applied_date, end_date='now') if random.choice([True, False]) else None,
                final_decision=random.choice(["Hired", "Rejected", "Pending", "Withdrawn"]) if random.choice([True, False]) else None,
                form_responses_link=f"https://forms.google.com/responses/{fake.uuid4()}",
                coding_test=fake.text(max_nb_chars=100) if random.choice([True, False]) else None,
                interview_status=random.choice(["Scheduled", "Completed", "Cancelled", "Rescheduled"]) if random.choice([True, False]) else None,
                coding_score=round(random.uniform(60, 100), 1) if random.choice([True, False]) else None,
                interview_date=fake.date_time_between(start_date=applied_date, end_date='now') if random.choice([True, False]) else None,
                interview_panel=fake.name() if random.choice([True, False]) else None,
                panel=fake.name() if random.choice([True, False]) else None,
                meeting_link=f"https://meet.google.com/{fake.word()}-{fake.word()}-{fake.word()}" if random.choice([True, False]) else None,
                host_password=fake.password() if random.choice([True, False]) else None,
                team_lead_interview=fake.text(max_nb_chars=100) if random.choice([True, False]) else None,
                salary_nego=random.randint(5000000, 50000000) if random.choice([True, False]) else None,
                criteria_1=fake.text(max_nb_chars=50) if random.choice([True, False]) else None,
                criteria_2=fake.text(max_nb_chars=50) if random.choice([True, False]) else None,
                submitted_form_responses=fake.text(max_nb_chars=200) if random.choice([True, False]) else None,
                test_language_confirmation=random.choice(programming_languages) if random.choice([True, False]) else None,
                attend_status=random.choice(["Attended", "Not Attended", "Rescheduled"]) if random.choice([True, False]) else None,
                resume_url=f"https://resumes.company.com/{fake.uuid4()}.pdf" if random.choice([True, False]) else None,
                applied_at=applied_date,
                assigned_recruiter=str(random.choice(self.users_created).id) if self.users_created else None,
                notes=fake.text(max_nb_chars=300) if random.choice([True, False]) else None,
                created_at=applied_date,
                updated_at=fake.date_time_between(start_date=applied_date, end_date='now')
            )
            
            db.add(candidate)
            self.candidates_created.append(candidate)
            
            # Show progress every 100 records
            if (i + 1) % 100 == 0:
                print(f"  📝 Created {i + 1} candidates...")
                await db.commit()  # Commit in batches
        
        await db.commit()
        print(f"✅ Created {len(self.candidates_created)} candidates")
        return self.candidates_created

    async def create_candidate_stages(self, db: AsyncSession):
        """Create candidate stages for all candidates"""
        print("Creating candidate stages...")
        
        stage_sequence = [
            CandidateStatusEnum.applied,
            CandidateStatusEnum.resume_scraped,
            CandidateStatusEnum.screened,
            CandidateStatusEnum.survey,
            CandidateStatusEnum.coding_test,
            CandidateStatusEnum.interview_team_lead,
            CandidateStatusEnum.interview_general_manager,
            CandidateStatusEnum.offer,
            CandidateStatusEnum.hired
        ]
        
        for candidate in self.candidates_created:
            # Randomly determine how many stages this candidate went through
            max_stages = random.randint(1, len(stage_sequence))
            current_stages = stage_sequence[:max_stages]
            
            for i, stage in enumerate(current_stages):
                entered_at = fake.date_time_between(
                    start_date=candidate.applied_at, 
                    end_date='now'
                )
                
                # Calculate exit time (next stage or current time if last stage)
                if i < len(current_stages) - 1:
                    # Not the last stage, so they exited this stage
                    exited_at = fake.date_time_between(
                        start_date=entered_at, 
                        end_date='now'
                    )
                    duration_seconds = int((exited_at - entered_at).total_seconds())
                else:
                    # Last stage, might still be in it
                    if random.choice([True, False]):  # 50% chance they're still in this stage
                        exited_at = None
                        duration_seconds = None
                    else:
                        exited_at = fake.date_time_between(
                            start_date=entered_at, 
                            end_date='now'
                        )
                        duration_seconds = int((exited_at - entered_at).total_seconds())
                
                stage_record = CandidateStages(
                    id=uuid.uuid4(),
                    candidate_id=candidate.id,
                    entered_at=entered_at,
                    exited_at=exited_at,
                    duration_seconds=duration_seconds,
                    hr_private_notes=fake.text(max_nb_chars=200) if random.choice([True, False]) else None,
                    send_email_on_reject=random.choice([True, False]),
                    email_sent_at=fake.date_time_between(start_date=entered_at, end_date='now') if random.choice([True, False]) else None,
                    created_by=random.choice(self.users_created).id,
                    stage_key=stage
                )
                
                db.add(stage_record)
                self.stages_created.append(stage_record)
        
        await db.commit()
        print(f"✅ Created {len(self.stages_created)} candidate stages")
        return self.stages_created

    async def run_seeder(self, candidate_count: int = 1000):
        """Run the complete seeder"""
        print("🚀 Starting Candidate Seeder...")
        print("=" * 50)
        
        async with AsyncSessionLocal() as db:
            try:
                # Step 1: Create users
                await self.create_users(db, count=10)
                
                # Step 2: Create candidates
                await self.create_candidates(db, count=candidate_count)
                
                # Step 3: Create candidate stages
                await self.create_candidate_stages(db)
                
                print("=" * 50)
                print("🎉 Seeder completed successfully!")
                print(f"📊 Summary:")
                print(f"   - Users created: {len(self.users_created)}")
                print(f"   - Candidates created: {len(self.candidates_created)}")
                print(f"   - Candidate stages created: {len(self.stages_created)}")
                print("=" * 50)
                
            except Exception as e:
                print(f"❌ Error during seeding: {e}")
                await db.rollback()
                raise

async def main():
    """Main function to run the seeder"""
    seeder = CandidateSeeder()
    await seeder.run_seeder(candidate_count=1000)

if __name__ == "__main__":
    asyncio.run(main())
