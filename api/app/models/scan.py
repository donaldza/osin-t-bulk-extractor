from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime, Enum as SAEnum, BigInteger, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import enum

class ScanStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    complete = "complete"
    failed = "failed"

class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    image_hash: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[ScanStatus] = mapped_column(SAEnum(ScanStatus), default=ScanStatus.queued, index=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    outdir: Mapped[str | None] = mapped_column(Text)
    total_bytes: Mapped[int | None] = mapped_column(BigInteger)
    elapsed_seconds: Mapped[float | None]
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    case: Mapped["Case"] = relationship("Case", back_populates="scans")
    features: Mapped[list["Feature"]] = relationship("Feature", back_populates="scan", cascade="all, delete-orphan")
    histograms: Mapped[list["Histogram"]] = relationship("Histogram", back_populates="scan", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="scan", cascade="all, delete-orphan")
