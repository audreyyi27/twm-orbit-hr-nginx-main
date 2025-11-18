from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import schemas, models, security
from ..db import get_db
from ..deps import get_current_user


router = APIRouter(prefix='/users', tags=['users'])


@router.post('/', response_model=schemas.UserOut)
async def create_user(payload: schemas.UserCreate, db: AsyncSession = Depends(get_db), current=Depends(get_current_user)):
    # only admin can create new users
    # check role
    stmt = await db.execute(select(models.UserRole).where(models.UserRole.user_id == current.id, models.UserRole.role=='hr_admin'))
    is_admin = stmt.scalars().first()
    if not is_admin:
        raise HTTPException(status_code=403, detail='Not allowed')
    hashed = security.hash_password(payload.password)
    user = models.User(username=payload.username, password_hash=hashed, fullname=payload.fullname,
    employee_id=payload.employee_id, email=payload.email, phone=payload.phone)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get('/me', response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user