from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.user import User
from ..services.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str


def user_payload(user: User):
    return {"id": user.id, "username": user.email, "role": user.role.value}


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    if payload.username.strip().lower() != "user":
        raise HTTPException(status_code=401, detail="Unknown user")
    user = await db.scalar(select(User).where(User.email == "User"))
    if not user:
        raise HTTPException(status_code=503, detail="Generic user is not ready")
    return {"access_token": create_access_token({"sub": str(user.id)}), "token_type": "bearer"}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user_payload(user)
