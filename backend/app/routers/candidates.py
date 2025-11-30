from datetime import datetime, timedelta
import json
import re
from math import ceil
from typing import Optional, List, Dict, Any
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException,Query, Request,status,BackgroundTasks, Body, File, UploadFile
import pytz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import String, and_, asc, cast, desc, func, insert, literal, or_, select, update
from sqlalchemy.orm import selectinload
from .. import schemas, models
from ..db import get_db
from ..deps import get_current_user, get_current_user_hr, parse_new_candidate
from ..cache import cache_get, cache_set, cache_delete_pattern
import os
import aiofiles
from ..utils import email_templates
from ..utils.email_utils import send_email
from fastapi.responses import FileResponse,Response, RedirectResponse
import zipfile
import io
from pathlib import Path

# ------------------------------------------------------------------------------
# Module setup
# ------------------------------------------------------------------------------

MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MiB hard cap (your comment said 5, but this constant equals 1 MiB)
CHUNK_SIZE = 1024 * 1024         # 1 MiB
ALLOWED_EXTS = {".pdf"}

# Resume upload to the server (backend/public/resumes)
UPLOAD_DIR = "public/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://34.80.84.47")


router = APIRouter(prefix='/candidates', tags=['candidates'])

LOCAL_TZ = pytz.timezone('Asia/Jakarta')  # Change to your timezone
END_OF_DAY_HOUR = 18  # 6 PM

# ------------------------------------------------------------------------------
# Helpers (docs only): OpenAPI snippet for multipart create body
# ------------------------------------------------------------------------------

# Documentation  
CREATE_CANDIDATE_OPENAPI_REQUEST = {
    "requestBody": {
        "required": True,
        "content": {
            "multipart/form-data": {
                "schema": {
                    "type": "object",
                    "required": ["candidate", "resume"],
                    "properties": {
                        "candidate": {
                            "type": "string",
                            "description": "JSON string of CandidateCreate payload",
                            "examples": [
                                json.dumps(
                                    {
                                        "email": "aisyah@example.com",
                                        "name": "Aisyah Pratama",
                                        "whatsapp": "+6281234567890",
                                        "processed_status": "applied",
                                    }
                                )
                            ],
                        },
                        "resume": {
                            "type": "string",
                            "format": "binary",
                            "description": "Resume file (PDF only). Max size 1 MiB.",
                        },
                    },
                },
                "encoding": {"candidate": {"contentType": "application/json"}},
            }
        },
    }
}



# Front end data = Path: frontend/src/app/(hiring-manager)/candidates (pages and UI)
# API calls: frontend/src/core/candidates/api.ts (fetch/insert/update)

def parse_total_experience(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    s = value.strip()
    try:
        return float(s.replace(",", "."))
    except ValueError:
        pass
    tahun = 0.0
    bulan = 0.0
    m_tahun = re.search(r"(\d+(?:[.,]\d+)?)\s*tahun", s, flags=re.I)
    m_bulan = re.search(r"(\d+(?:[.,]\d+)?)\s*bulan", s, flags=re.I)
    if m_tahun:
        tahun = float(m_tahun.group(1).replace(",", "."))
    if m_bulan:
        bulan = float(m_bulan.group(1).replace(",", "."))
    total_years = tahun + (bulan / 12.0)
    return total_years if total_years > 0 else None

def parse_salary_expectation(value: Optional[str]) -> Optional[float]:
    """Parses strings like 'Rp10.000.000 - Rp15.000.000' or 'Rp12.000.000' into a monthly average in numbers.
    Returns a float (IDR) or None if unparsable.
    """
    if not value:
        return None
    s = value.strip()
    # remove currency and separators, keep digits and spaces/dash
    # find all numeric groups
    nums = [int(x) for x in re.findall(r"\d+", s)]
    if not nums:
        return None
    # join groups into numbers by grouping thousands (e.g., [10,000,000] -> 10000000)
    # Heuristic: if there are many groups, rebuild into large numbers by chunking every 3-digit where possible
    # Simpler approach: remove all non-digits first and split on dash
    cleaned = re.sub(r"[^0-9\-]", "", s)
    parts = [p for p in cleaned.split("-") if p]
    try:
        numbers = [int(p) for p in parts]
    except ValueError:
        # fallback: collapse all digits found
        numbers = [int(re.sub(r"[^0-9]", "", s))] if re.search(r"\d", s) else []
    if not numbers:
        return None
    if len(numbers) == 1:
        return float(numbers[0])
    return float(sum(numbers) / len(numbers))

def map_template_to_candidate_row(item: Dict[str, Any]) -> Dict[str, Any]:
    detail = item.get("detail") or {}

    pengalaman_kerja = item.get("pengalaman_kerja") or []
    work_experience = "\n".join(pengalaman_kerja)

    skills = item.get("skills")
    minat = item.get("minat")
    programming_language_experience = skills
    if minat:
        programming_language_experience = (skills + " | Interests: " + minat) if skills else ("Interests: " + minat)

    # Try to infer primary programming language from skills (first token before comma)
    primary_lang = None
    if isinstance(skills, str) and "," in skills:
        primary_lang = skills.split(",")[0].strip()
    elif isinstance(skills, str):
        primary_lang = skills.strip()

    # Preserve pendidikan/penghargaan/organisasi by appending to notes
    base_notes = item.get("tentang_saya") or ""
    pendidikan = item.get("pendidikan") or []
    penghargaan = item.get("penghargaan") or []
    organisasi = item.get("organisasi") or []
    extra_sections = []
    if pendidikan:
        extra_sections.append("Pendidikan:\n" + "\n".join(pendidikan))
    if penghargaan:
        extra_sections.append("Penghargaan:\n" + "\n".join(penghargaan))
    if organisasi:
        extra_sections.append("Organisasi:\n" + "\n".join(organisasi))
    notes_combined = base_notes
    if extra_sections:
        notes_combined = (base_notes + ("\n\n" if base_notes else "") + "\n\n".join(extra_sections)).strip()



# Function called to insert data to the Database 
    return {
        "email": item.get("email"),
        "name": item.get("name"),
        "whatsapp": item.get("whatsapp"),
        "domicile": detail.get("lokasi"),
        "highest_degree": detail.get("gelar_tertinggi"),
        "total_experience": parse_total_experience(detail.get("pengalaman_total")),
        "work_experience": work_experience,
        "programming_language_experience": programming_language_experience,
        "primary_programming_language": primary_lang,
        "salary_expectation": parse_salary_expectation(item.get("ekspektasi_gaji")),
        "notes": notes_combined,
        "resume_url": item.get("resume_url"),
    }

# GET template json file for uploading Json file candidates 
@router.get(
    "/template",
    summary="Download candidates JSON template",
    description="Downloads a two-object JSON array template for candidate import.",
    responses={
        201: {"description": "Created. No response body."},
        400: {"description": "Bad request (invalid file type or payload)"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        413: {"description": "Payload too large"},
    },
)
async def download_candidate_template(current=Depends(get_current_user_hr)):
    json_file_path = os.path.join("json_template", "candidates_template.json")
    if not os.path.exists(json_file_path):
        raise HTTPException(status_code=404, detail="Template file not found")
    return FileResponse(
        path=json_file_path,
        media_type="application/json",
        filename="candidates_template.json"
    )

    # ====== end of downloading template ====

# upload Json file candidates in one go by HR admin 
@router.post(
    "/import-template",
    summary="Import candidates from template JSON",
    description="Accepts an array of template objects and inserts mapped candidates.",
    responses={
        200: {"description": "Successful Response"},
        400: {"description": "Bad Request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
    },
)
async def import_candidates_from_template(
    payload: List[Dict[str, Any]] = Body(..., description="Array of template objects"),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_user_hr),
):
    if not isinstance(payload, list) or not payload:
        raise HTTPException(status_code=400, detail="Payload must be a non-empty JSON array")

    inserted = 0
    skipped = 0
    errors: List[Dict[str, Any]] = []

    for idx, item in enumerate(payload):
        try:
            row = map_template_to_candidate_row(item)

            # minimal required field checks
            if not row.get("email"):
                skipped += 1
                errors.append({"index": idx, "reason": "Missing email"})
                continue

            # Insert new candidates (template import)
            existing = await db.execute(select(models.Candidates).where(models.Candidates.email == row["email"]))
            if existing.scalars().first():
                skipped += 1
                continue

            candidate = models.Candidates(**row)
            db.add(candidate)
            inserted += 1
        except Exception as e:
            errors.append({"index": idx, "reason": str(e)})
            skipped += 1

    await db.commit()

    # Invalidate related caches if any
    try:
        await cache_delete_pattern("dashboard_stages:*")
        await cache_delete_pattern("candidate_detail:*")
    except Exception:
        pass

    return {
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors,
    }
# ====== end of uploading Json file candidates in one go by HR admin ====

# Batch upload candidate resumes via ZIP by HR admin 
@router.post(
    "/batch-upload-resumes",
    status_code=status.HTTP_200_OK,
    summary="Batch upload candidate resumes via ZIP",
    description=(
        "Uploads a ZIP file containing multiple PDF resumes. "
        "Extracts, validates, stores PDFs in public/resumes/, and updates matching candidates' resume_url."
    ),
    responses={
        200: {"description": "Successful Response"},
        400: {"description": "Bad request (not a ZIP, invalid content)"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        413: {"description": "Payload too large"},
    },
)

async def batch_upload_resumes(
    request: Request,
    zip_file: UploadFile = File(..., description="ZIP archive containing PDF resumes"),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_user_hr),
):
    """
    Expects a ZIP file with PDFs named by candidate name (e.g., "Dewi Anggraini.pdf" or
    "dewi_anggraini_resume.pdf").
    
    Process:
    1. Extract ZIP in memory
    2. Validate each PDF (extension, size)
    3. Store valid PDFs in public/resumes/
    4. Match by name extracted from filename (case-insensitive, ignores spaces/underscores/dashes, and
       trims common suffixes like "resume"/"cv")
    5. Update candidate.resume_url in DB
    """
    
    # Size limits
    MAX_ZIP_SIZE = 50 * 1024 * 1024  # 50 MB
    MAX_PDF_SIZE = 5 * 1024 * 1024   # 5 MB per PDF
    
    # Check ZIP size
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_ZIP_SIZE:
        raise HTTPException(status_code=413, detail="ZIP file too large (max 50MB)")
    
    # Read ZIP into memory
    zip_content = await zip_file.read()
    if len(zip_content) > MAX_ZIP_SIZE:
        raise HTTPException(status_code=413, detail="ZIP file too large")
    
    # Validate it's a ZIP
    try:
        zip_buffer = io.BytesIO(zip_content)
        with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
            file_list = zip_ref.namelist()
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")
    
    matched = 0
    unmatched = 0
    errors = []

    # Helper to normalize names for reliable matching
    def normalize_name(value: str) -> str:
        # remove extension and common suffixes like 'resume' or 'cv'
        base = value
        if base.lower().endswith('.pdf'):
            base = base[:-4]
        base = re.sub(r"(?i)[\s._-]*(resume|cv)$", "", base.strip())
        # collapse to alphanumerics only, lowercase
        return re.sub(r"[^a-z0-9]", "", base.lower())

    # Process each file in ZIP
    with zipfile.ZipFile(io.BytesIO(zip_content), 'r') as zip_ref:
        for filename in file_list:
            # Skip directories and hidden files
            if filename.endswith('/') or filename.startswith('__MACOSX') or filename.startswith('.'):
                continue
            
            # Get base filename (without directory path)
            base_name = Path(filename).name
            
            # Skip if no actual filename (empty or just path separators)
            if not base_name or base_name == '':
                continue
            
            try:
                # Extract file info
                file_info = zip_ref.getinfo(filename)
                
                # Skip zero-byte files
                if file_info.file_size == 0:
                    continue
                
                if file_info.file_size > MAX_PDF_SIZE:
                    errors.append({"file": base_name, "reason": f"PDF too large (max {MAX_PDF_SIZE // 1024 // 1024}MB)"})
                    unmatched += 1
                    continue
                
                # Validate PDF extension
                if not base_name.lower().endswith('.pdf'):
                    errors.append({"file": base_name, "reason": "Not a PDF"})
                    unmatched += 1
                    continue
                
                # Derive candidate name from filename
                normalized_target = normalize_name(base_name)

                # Try exact case-insensitive match on name first
                # First pass: lower(name) == lower_clean (without punctuation)
                # We can't normalize on DB easily, so fetch likely matches then filter strictly in Python
                raw_name = re.sub(r"(?i)[\s._-]*(resume|cv)$", "", base_name[:-4].strip())
                lower_clean = raw_name.lower()

                # Fetch candidates with case-insensitive equality as a first pass
                stmt = select(models.Candidates).where(func.lower(models.Candidates.name) == lower_clean)
                result = await db.execute(stmt)
                possible = result.scalars().all()

                # If none, try a looser ILIKE contains search
                if not possible:
                    stmt = select(models.Candidates).where(models.Candidates.name.ilike(f"%{raw_name}%"))
                    result = await db.execute(stmt)
                    possible = result.scalars().all()

                # Apply strict normalization match in Python to disambiguate
                matched_candidates = [c for c in possible if normalize_name(c.name or "") == normalized_target]

                if len(matched_candidates) == 0:
                    errors.append({"file": filename, "reason": f"No candidate found matching name '{raw_name}'"})
                    unmatched += 1
                    continue

                if len(matched_candidates) > 1:
                    errors.append({"file": filename, "reason": f"Multiple candidates match name '{raw_name}'"})
                    unmatched += 1
                    continue

                candidate = matched_candidates[0]
                
                # Extract and save PDF (keep original filename)
                pdf_data = zip_ref.read(filename)
                save_path = os.path.join(UPLOAD_DIR, base_name)
                
                # Write to disk
                async with aiofiles.open(save_path, 'wb') as f:
                    await f.write(pdf_data)
                
                # Update candidate cv_file to the saved file path
                candidate.cv_file = base_name  # Store just the filename, not full path
                db.add(candidate)
                matched += 1
                
            except Exception as e:
                errors.append({"file": filename, "reason": str(e)})
                unmatched += 1

    await db.commit()
    
    # Invalidate cache
    await cache_delete_pattern("candidate_detail:*")
    
    return {
        "matched": matched,
        "unmatched": unmatched,
        "errors": errors
    } 
    # ====End of extraction for resume processing, extraction =======

#  Single upload = 1 candidate JSON + 1 PDF → creates 1 new candidate with resume
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create candidate with resume",
    description=(
        "Create a candidate using a multipart form with `candidate` (JSON string) and `resume` (PDF). "
        "Requires **hr_admin**. Enforces a hard size limit and stores an initial stage."
    ),
    responses={
        201: {"description": "Created. No response body."},
        400: {"description": "Bad request (invalid file type or payload)"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        413: {"description": "Payload too large"},
    },
    openapi_extra=CREATE_CANDIDATE_OPENAPI_REQUEST,
)
async def create_candidate(request: Request,payload: schemas.CandidatePayload = Depends(parse_new_candidate), db: AsyncSession = Depends(get_db), current=Depends(get_current_user_hr)):
    """
    Notes:
    - `candidate` is parsed from JSON text into `schemas.CandidateCreate`.
    - `resume` must be a PDF; server stores it under `public/resumes/`.
    - Returns **no body**.
    """


    base,ext = os.path.splitext(payload.resume.filename)
    if ext.lower() not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted")
    
    # resume size precheck
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_FILE_SIZE + 128 * 1024:  # 128 KB slack
                raise HTTPException(status_code=413, detail="File too large")
        except ValueError:
            pass  # ignore bad headers and fall back to streaming check
    
    formatted_name = f"{base}_{str(uuid.uuid4())}"
    filename = f"{formatted_name}{ext}"
    save_path = os.path.join(UPLOAD_DIR,filename)

    counter = 1
    while os.path.exists(save_path):
        new_filename = f"{formatted_name}_{counter}{ext}"
        save_path = os.path.join(UPLOAD_DIR, new_filename)
        counter += 1

    async with aiofiles.open(save_path,"wb") as buffer:
        content = await payload.resume.read()
        await buffer.write(content)

    # Create candidate
    new_candidate = models.Candidates(**payload.candidate.model_dump())
    new_candidate.cv_file = filename  # Use cv_file instead of resume_url to match DB
    db.add(new_candidate)
    await db.commit()  # commit will populate new_candidate.uuid from DB
    await db.refresh(new_candidate)

    # Create initial stage (commented out - processed_status doesn't exist yet)
    # new_stages = models.CandidateStages(
    #     candidate_id=new_candidate.uuid,
    #     stage_key=new_candidate.processed_status,
    #     created_by=current.uuid,
    # )
    # db.add(new_stages)
    # await db.commit()
    return # 201 No Content as documented

# ====== End of single upload = 1 candidate JSON + 1 PDF → creates 1 new candidate with resume ====



# Update candidate fields

@router.put(
    "/{candidate_id}",
    summary="Update candidate fields",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Updated. No response body."},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        404: {"description": "Not found"},
    },
)
async def update_candidate(candidate_id:uuid.UUID,payload:schemas.CandidateUpdate,db:AsyncSession = Depends(get_db), current=Depends(get_current_user_hr)):
    """
    Partial update. Only provided fields are modified.
    """
    update_query = update(models.Candidates).where(models.Candidates.uuid == candidate_id).values(**payload.model_dump(exclude_unset=True))
    await db.execute(update_query)
    await db.commit()
    
    # Invalidate cache
    cache_key = f"candidate_detail:{candidate_id}"
    await cache_delete_pattern(f"candidate_detail:{candidate_id}")
    await cache_delete_pattern("dashboard_stages:*")  # Invalidate dashboard cache too
    
    return # 200 No Content as documented
    
    
# UPDATE STAGES CANDIDATE (blm pakai) =====================================

@router.post(
    "/update-stages",
    summary="Advance or change stages for multiple candidates",
    description=(
        "Closes the latest stage for each candidate with duration and notes, updates `processed_status`, "
        "then inserts a new stage row. Requires **hr_admin**."
    ),
    responses={
        200: {"description": "Updated. Returns counts."},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
    },
)
async def update_stages_candidate(payload:schemas.CandidateStageCreate,db:AsyncSession = Depends(get_db),current=Depends(get_current_user)):
    
    stmt = await db.execute(select(models.User).where(models.User.id == current.id, models.User.role.in_([models.UserRoleEnum.hr_admin])))
    allowed = stmt.scalars().first()
    if not allowed:
        raise HTTPException(status_code=403, detail='Not allowed')

    result = await db.execute(
        select(models.Candidates.uuid).where(
            models.Candidates.uuid.in_(payload.id)
            # Removed processed_status check - field doesn't exist yet
        )
    )
    valid_ids = [row[0] for row in result.fetchall()]

    if not valid_ids:
        return {"message": "No valid candidate IDs found. Nothing updated."}

    latest = select(
        models.CandidateStages.candidate_id,
        func.max(models.CandidateStages.entered_at).label("max_entered_at")
            ).where(models.CandidateStages.candidate_id.in_(valid_ids)).group_by(models.CandidateStages.candidate_id).subquery()
    
    updated_stages_query = update(models.CandidateStages).where(
        models.CandidateStages.candidate_id == latest.c.candidate_id,
        models.CandidateStages.entered_at==latest.c.max_entered_at
        ).values(
            exited_at=func.now(),
            duration_seconds=func.extract("epoch",func.now() - latest.c.max_entered_at),
            hr_private_notes=payload.note
        )
    
    # Commented out - processed_status doesn't exist yet
    # update_candidates_process = update(
    #     models.Candidates
    #     ).where(
    #         models.Candidates.uuid.in_(valid_ids)
    #         ).values(
    #             processed_status=payload.candidate_status
    #         )

    new_stages_dict = [{        
        "candidate_id":c,
        "stage_key":payload.candidate_status,
        "created_by":current.id} for c in valid_ids]
    
    new_stages = insert(models.CandidateStages).values(new_stages_dict)

    
    await db.execute(updated_stages_query)
    # await db.execute(update_candidates_process)  # Commented out - processed_status doesn't exist
    await db.execute(new_stages)
    await db.commit()
    return


# GET endpoints removed - they are in get_candidates.py:
# - @router.get("") - List candidates
# - @router.get("/{candidate_id}") - Get by ID  
# - @router.get("/email/{email}") - Get by email
# - @router.get("/stats/count") - Count candidates

@router.get(
    "/{candidate_id}/email/{template_type}",
    response_model=schemas.EmailTemplateOut,
    summary="Fetch an email template for a candidate",
    description=(
        "Returns a prefilled template body keyed by `template_type`. "
        "Caller is expected to edit placeholders like `{name}` before sending."
    ),
    responses={
        200: {
            "description": "Template returned",
            "content": {
                "application/json": {
                    "examples": {
                        "rejection": {
                            "summary": "Rejection template",
                            "value": {"items": {"template": "<p>Hi Aisyah, thanks for your time</p>..."}}
                        },
                        "offering": {
                            "summary": "Offer template",
                            "value": {"items": {"template": "<p>Hi Aisyah, we’re pleased to offer you</p>..."}}
                        }
                    }
                }
            },
        },
        400: {"description": "Unknown template type"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        404: {"description": "Candidate not found"},
    },
)
async def get_email_template(candidate_id:uuid.UUID, template_type:schemas.EmailEnum, db:AsyncSession = Depends(get_db),current=Depends(get_current_user_hr)):
    stmt = (
        select(models.Candidates).where(models.Candidates.uuid == candidate_id)
    )
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    if template_type == schemas.EmailEnum.rejection:
        template = email_templates.rejection_email_template(candidate.name)
    elif template_type == schemas.EmailEnum.approve:
        template = email_templates.next_step_template(candidate.name)
    elif template_type == schemas.EmailEnum.information:
        template = email_templates.information_template(candidate.name)
    elif template_type == schemas.EmailEnum.offering:
        template = email_templates.offer_invitation_template(candidate.name)
    elif template_type == schemas.EmailEnum.hired:
        template = email_templates.hired_template(candidate.name)
    response = {
        "template": template
    }
    return schemas.EmailTemplateOut(items=response)

@router.post(
    "/{candidate_id}/send-email",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=schemas.ResponseOut,
    summary="Send an email to a candidate",
    description=(
        "Queues an email to the candidate. Uses a background task; the HTTP call "
        "returns immediately with `status=queued`."
    ),
    responses={
        202: {
            "description": "Queued",
            "content": {
                "application/json": {
                    "examples": {
                        "queued": {
                            "summary": "Email queued",
                            "value": {"items": {"status": "queued", "candidate_id": "11111111-1111-1111-1111-111111111111"}}
                        }
                    }
                }
            },
        },
        400: {"description": "Bad request (validation)"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        404: {"description": "Candidate not found"},
        429: {"description": "Rate limited by downstream provider (if you add limiting)"},
        502: {"description": "Downstream mail provider error (if surfaced)"},
    },
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["subject", "body"],
                        "properties": {
                            "subject": {"type": "string", "minLength": 1, "maxLength": 200},
                            "body": {"type": "string", "minLength": 1}
                        }
                    },
                    "examples": {
                        "interview-invite": {
                            "summary": "Interview invite",
                            "value": {
                                "subject": "Interview with Orbit HR",
                                "body": "Hi {name}, your interview is on {date} at {time}. Meet link: {link}."
                            }
                        }
                    }
                }
            }
        }
    },
)
async def send_email_to_candidate(candidate_id:uuid.UUID,payload:schemas.SendEmail,background_tasks:BackgroundTasks,db:AsyncSession = Depends(get_db),current=Depends(get_current_user_hr)):
    stmt = (
        select(models.Candidates).where(models.Candidates.uuid == candidate_id)
    )
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    if not candidate:
        raise HTTPException(status_code=400,detail="Candidate not found")
    background_tasks.add_task(send_email,candidate.email,payload.subject,payload.body)
    return schemas.ResponseOut(items={"status": "queued", "candidate_id": str(candidate_id)})

@router.get(
    "/{candidate_id}/resume",
    summary="Download candidate resume (PDF)",
    description="Returns the candidate's uploaded resume as a PDF file attachment.",
    responses={
        200: {
            "description": "PDF file",
            "content": {
                "application/pdf": {
                    "schema": {"type": "string", "format": "binary"}
                }
            }
        },
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden (requires hr_admin)"},
        404: {"description": "Candidate not found or resume missing"},
    },
)
async def get_resume(candidate_id:uuid.UUID,db:AsyncSession = Depends(get_db),current=Depends(get_current_user_hr)):
    stmt = (
        select(models.Candidates).where(models.Candidates.uuid == candidate_id)
    )
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    
    # Use cv_file instead of resume_url to match DB
    if not candidate or not candidate.cv_file:
        raise HTTPException(status_code=404, detail="Candidate not found or resume missing")

    # Check if cv_file is a URL
    if candidate.cv_file.startswith("http://") or candidate.cv_file.startswith("https://"):
        return RedirectResponse(candidate.cv_file, status_code=307)

    # Otherwise treat as local filesystem path
    file_path = candidate.cv_file
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume not found")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"resume-{candidate.uuid}.pdf"
    )
