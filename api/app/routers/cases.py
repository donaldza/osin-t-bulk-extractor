from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.case import Case
from ..models.user import User
from ..services.auth import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseCreate(BaseModel):
    name: str
    description: str | None = None


@router.get("")
async def list_cases(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(Case).where(Case.created_by == user.id).order_by(Case.created_at.desc()))
    return result.all()


@router.post("", status_code=201)
async def create_case(payload: CaseCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    case = Case(name=payload.name, description=payload.description, created_by=user.id)
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case


@router.get("/{case_id}")
async def get_case(case_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    case = await db.scalar(select(Case).where(Case.id == case_id, Case.created_by == user.id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
