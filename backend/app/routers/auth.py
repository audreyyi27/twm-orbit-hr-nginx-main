from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, update
import os
from sqlalchemy.ext.asyncio import AsyncSession
from .. import models, schemas, security
from ..db import get_db
from ..limiter import limiter
from ..cache import cache_delete
import hashlib


router = APIRouter(prefix='/auth', tags=['auth'])

@router.post('/register', response_model=schemas.UserOut)
@limiter.limit("100/minute")
async def register(request: Request, user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # cek username/email unik
    q = await db.execute(select(models.User).where(models.User.username == user_in.username))
    if q.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")

    q = await db.execute(select(models.User).where(models.User.email == user_in.email))
    if q.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = security.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username,
        password_hash=hashed_pw,
        fullname=user_in.fullname,
        employee_id=user_in.employee_id,
        positions=user_in.positions,
        email=user_in.email,
        phone=user_in.phone,
        role=user_in.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post('/login', response_model=schemas.Token)
@limiter.limit("100/minute") 
async def login(request: Request, payload: schemas.LoginIn, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(models.User).where(models.User.username == payload.username))
    user = q.scalars().first()
    if not user or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')


    # Session policy: allow multiple sessions if enabled via env var
    allow_multi = os.getenv("ALLOW_MULTI_SESSIONS", "false").lower() in ("1", "true", "yes")
    if not allow_multi:
        # single session enforcement: deactivate other active sessions
        await db.execute(update(models.UserSession).where(models.UserSession.user_id == user.id).values(is_active=False))
        await db.commit()  # Commit the deactivation first

    access_token = security.create_access_token(str(user.id))
    refresh_token = security.create_refresh_token(str(user.id))

    # store hashed session token
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
    session = models.UserSession(user_id=user.id, session_token_hash=token_hash, is_active=True,
    user_agent=request.headers.get('user-agent'), ip_address=request.client.host)
    db.add(session)
    await db.commit()

    # Return user data
    user_data = schemas.UserOut.model_validate(user)


    return schemas.Token(access_token=access_token, refresh_token=refresh_token, user=user_data)


@router.post('/logout')
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    auth = request.headers.get('authorization')
    if not auth:
        raise HTTPException(status_code=401, detail='Not authenticated')
    
    try:
        token = auth.split(' ')[1]
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Invalidate cache
        cache_key = f"user_session:{token_hash}"
        await cache_delete(cache_key)
        
        stmt = await db.execute(select(models.UserSession).where(models.UserSession.session_token_hash == token_hash, models.UserSession.is_active==True))
        ses = stmt.scalars().first()
        if ses:
            ses.is_active = False
            await db.commit()
            return {"msg":"logged out"}
        else:
            # Session not found, but still return success (already logged out)
            return {"msg":"already logged out"}
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail='Invalid authorization header format')