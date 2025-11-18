import json
from fastapi import Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.security import HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import Candidate, CandidateCreate, CandidatePayload
from app.utils.utils import normalize_empty_strings
from .db import get_db
from . import models, security
from .cache import cache_get, cache_set
import hashlib


security_scheme = HTTPBearer()


async def get_current_user(request: Request, token: str = Depends(security_scheme), db: AsyncSession = Depends(get_db)):
    jwt_token = token.credentials
    payload = security.decode_token(jwt_token)
    if not payload or 'sub' not in payload:
        raise HTTPException(status_code=401, detail='Invalid token')
    user_id = payload['sub']
    
    # Check cache first
    token_hash = hashlib.sha256(jwt_token.encode()).hexdigest()
    cache_key = f"user_session:{token_hash}"
    cached_user = await cache_get(cache_key)
    
    if cached_user:
        return models.User(**cached_user)
    
    # Single optimized query: JOIN user and session tables
    stmt = await db.execute(
        select(models.User)
        .join(models.UserSession, models.User.id == models.UserSession.user_id)
        .where(
            models.UserSession.session_token_hash == token_hash,
            models.UserSession.is_active == True,
            models.User.id == user_id
        )
    )
    user = stmt.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail='Invalid session or user not found')
    
    # Cache user data for 30 minutes
    user_dict = {
        'id': str(user.id),
        'username': user.username,
        'fullname': user.fullname,
        'email': user.email,
        'role': user.role.value if user.role else None,
        'is_active': user.is_active
    }
    await cache_set(cache_key, user_dict, ttl=1800)  # 30 minutes
    
    return user

async def get_current_user_hr(db: AsyncSession = Depends(get_db),current=Depends(get_current_user)):
    stmt = await db.execute(select(models.User).where(models.User.id == current.id, models.User.role.in_([models.UserRoleEnum.hr_admin])))
    allowed = stmt.scalars().first()
    if not allowed:
        raise HTTPException(status_code=403, detail='Not allowed')
    return current

async def get_current_user_team_manager(
    db: AsyncSession = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """
    Allow access for HR admins and team leads (hiring managers).
    """
    stmt = await db.execute(
        select(models.User).where(
            models.User.id == current.id,
            models.User.role.in_(
                [models.UserRoleEnum.hr_admin, models.UserRoleEnum.team_lead]
            ),
        )
    )
    allowed = stmt.scalars().first()
    if not allowed:
        raise HTTPException(status_code=403, detail='Not allowed')
    return current

async def parse_new_candidate(
    candidate: str = Form(...),  # JSON string
    resume: UploadFile = File(...)
) -> CandidatePayload:
    raw = json.loads(candidate)
    cleaned = normalize_empty_strings(raw, CandidateCreate)
    candidate_model = CandidateCreate.model_validate(cleaned)
    return CandidatePayload(candidate=candidate_model, resume=resume)