from sqlalchemy import String, Text, ForeignKey, BigInteger, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

class Feature(Base):
    __tablename__ = "features"
    __table_args__ = (
        Index("ix_features_scan_type", "scan_id", "feature_type"),
        Index("ix_features_value", "value"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), nullable=False)
    feature_type: Mapped[str] = mapped_column(String(64), nullable=False)
    offset: Mapped[int | None] = mapped_column(BigInteger)
    forensic_path: Mapped[str | None] = mapped_column(Text)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str | None] = mapped_column(Text)

    scan: Mapped["Scan"] = relationship("Scan", back_populates="features")


class Histogram(Base):
    __tablename__ = "histograms"
    __table_args__ = (
        Index("ix_histograms_scan_type", "scan_id", "feature_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), nullable=False)
    feature_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)

    scan: Mapped["Scan"] = relationship("Scan", back_populates="histograms")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str | None] = mapped_column(Text)
    offset: Mapped[int | None] = mapped_column(BigInteger)

    scan: Mapped["Scan"] = relationship("Scan", back_populates="alerts")
