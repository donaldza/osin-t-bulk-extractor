import asyncio
import json

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models.case import Case
from ..models.feature import Alert, Feature, Histogram
from ..models.scan import Scan
from ..models.user import User
from ..services.auth import get_current_user
from ..workers.scan_tasks import run_scan_task

router = APIRouter(prefix="/cases", tags=["scans"])
scan_router = APIRouter(prefix="/scans", tags=["scans"])


class ScanCreate(BaseModel):
    image_path: str
    config: dict = {}


async def owned_scan(scan_id: int, user: User, db: AsyncSession):
    scan = await db.scalar(select(Scan).join(Case).where(Scan.id == scan_id, Case.created_by == user.id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/{case_id}/scans")
async def list_scans(case_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    case = await db.scalar(select(Case).where(Case.id == case_id, Case.created_by == user.id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    result = await db.scalars(select(Scan).where(Scan.case_id == case_id).order_by(Scan.created_at.desc()))
    return result.all()


@router.post("/{case_id}/scans", status_code=202)
async def create_scan(case_id: int, payload: ScanCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    case = await db.scalar(select(Case).where(Case.id == case_id, Case.created_by == user.id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    scan = Scan(case_id=case_id, image_path=payload.image_path, config=payload.config)
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    run_scan_task.delay(scan.id)
    return scan


@scan_router.get("/{scan_id}")
async def get_scan(scan_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await owned_scan(scan_id, user, db)


@scan_router.get("/{scan_id}/features")
async def features(scan_id: int, feature_type: str | None = Query(None, alias="type"), search: str | None = None,
                   limit: int = Query(100, le=1000), offset: int = 0,
                   user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_scan(scan_id, user, db)
    query = select(Feature).where(Feature.scan_id == scan_id)
    if feature_type:
        query = query.where(Feature.feature_type == feature_type)
    if search:
        query = query.where(Feature.value.ilike(f"%{search}%"))
    return (await db.scalars(query.order_by(Feature.id).limit(limit).offset(offset))).all()


@scan_router.get("/{scan_id}/histograms")
async def histograms(scan_id: int, feature_type: str = Query(..., alias="type"),
                     user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_scan(scan_id, user, db)
    return (await db.scalars(select(Histogram).where(
        Histogram.scan_id == scan_id, Histogram.feature_type == feature_type
    ).order_by(Histogram.count.desc()).limit(500))).all()


@scan_router.get("/{scan_id}/alerts")
async def alerts(scan_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_scan(scan_id, user, db)
    return (await db.scalars(select(Alert).where(Alert.scan_id == scan_id).order_by(Alert.id))).all()


@scan_router.get("/{scan_id}/summary")
async def summary(scan_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_scan(scan_id, user, db)
    rows = await db.execute(select(Feature.feature_type, func.count()).where(Feature.scan_id == scan_id).group_by(Feature.feature_type))
    return {feature_type: count for feature_type, count in rows}


@scan_router.websocket("/{scan_id}/progress")
async def progress(scan_id: int, websocket: WebSocket):
    await websocket.accept()
    client = redis.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.subscribe(f"scan_progress:{scan_id}")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1)
            if message:
                payload = message["data"].decode() if isinstance(message["data"], bytes) else message["data"]
                await websocket.send_text(payload if isinstance(payload, str) else json.dumps(payload))
            await asyncio.sleep(0.1)
    finally:
        await pubsub.unsubscribe(f"scan_progress:{scan_id}")
        await client.aclose()
