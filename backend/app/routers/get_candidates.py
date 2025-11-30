# app/routers/get_candidates.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, func, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Optional
from math import ceil

from app import models, schemas
from app.db import get_db
from app.deps import get_current_user_hr


router = APIRouter(prefix='/candidates', tags=['candidates']) 

@router.get(
    "",
    response_model=schemas.PaginatedOut,
    summary="List candidates with filters",
    description="Get paginated list of candidates with search, date range, and sorting",
    responses={
        200: {"description": "Successfully retrieved candidates"},
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Requires HR admin role"},
    }
)
async def get_candidates(
    
    # Page
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    per_page: int = Query(10, ge=1, le=100, description="Number of results per page"),

    # Search(by name / email)
    search: Optional[str] = Query(None, description="Search by name or email"),

    # Date filters - NOW ENABLED! date_scraped exists in DB
    start_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),

    # Sorting
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),

    # Dependencies
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):


# 1. Build base query from Candidates table
    query = select(models.Candidates)

# 2. Search (by name / email)
    if search:
            query = query.where(or_(
                models.Candidates.name.ilike(f"%{search}%"),
                models.Candidates.email.ilike(f"%{search}%"),
            ))

#  3. Date range filters - NOW ENABLED! (date_scraped exists in DB)
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(models.Candidates.date_scraped >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d")
            end = end + timedelta(days=1)
            query = query.where(models.Candidates.date_scraped < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

 # 4. Count total items for pagination
    total_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total_items = total_result.scalar()
    total_pages = ceil(total_items / per_page) if total_items > 0 else 0
    

# 5. Sorting by date_scraped (ENABLED! Field exists in DB)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(models.Candidates.date_scraped))
    else:
        query = query.order_by(asc(models.Candidates.date_scraped))
    
# 6. Show only 1 page of data (ex. Page 1: offset=0,  limit=10 )
# offset and limit 
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)


# 7. Execute query and fetch results from database
    result = await db.execute(query)
    candidates = result.scalars().all()

# 8. Build response metadata
    meta = schemas.Metadata(
        total_pages=total_pages,
        page=page,
        per_page=per_page,
        total_items=total_items
    )
    
    # 9. Return paginated response
    return schemas.PaginatedOut(
        items=[schemas.Candidate.model_validate(c) for c in candidates],
        meta=meta
    )
# ======= end for get_candidate() function =======

# 10. Get each candidate Details profile 
@router.get(
    "/{candidate_id}",
    response_model=schemas.Candidate,
    summary="Get candidate by ID",
    description="Retrieve a single candidate's full details by their UUID",
    responses={
        200: {"description": "Successfully retrieved candidate"},
        404: {"description": "Candidate not found"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - Requires HR admin role"},
    }
)
async def get_candidate_by_id(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    
      # Query database for specific candidate
    query = select(models.Candidates).where(
        models.Candidates.uuid == candidate_id
    )
    result = await db.execute(query)
    candidate = result.scalars().first()
    
    # Return 404 if not found
    if not candidate:
        raise HTTPException(
            status_code=404, 
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    return candidate


# 11. Check if the email existed in the database
@router.get(
    "/email/{email}",
    response_model=schemas.Candidate,
    summary="Get candidate by email",
    description="Retrieve a candidate by their email address",
    responses={
        200: {"description": "Successfully retrieved candidate"},
        404: {"description": "Candidate not found"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - Requires HR admin role"},
    }
)
async def get_candidate_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    """
    Search for a candidate by their email address.
    
    **Path Parameter:**
    - **email**: Email address to search for
    
    **Returns:** Candidate object if found
    """
    
    # Query database by email
    query = select(models.Candidates).where(
        models.Candidates.email == email
    )
    result = await db.execute(query)
    candidate = result.scalars().first()
    
    # Return 404 if not found
    if not candidate:
        raise HTTPException(
            status_code=404, 
            detail=f"Candidate with email {email} not found"
        )
    
    return candidate

# 12. count total candidates
@router.get(
    "/stats/count",
    summary="Count total candidates",
    description="Get total number of candidates in database",
    responses={
        200: {"description": "Successfully retrieved count"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - Requires HR admin role"},
    }
)
async def count_candidates(
    db: AsyncSession = Depends(get_db),
    current = Depends(get_current_user_hr)
):
    
    # Count all candidates
    stmt = select(func.count()).select_from(models.Candidates)
    result = await db.execute(stmt)
    total = result.scalar()
    
    return {"total": total}

