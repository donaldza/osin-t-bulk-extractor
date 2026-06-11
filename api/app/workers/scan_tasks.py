from datetime import datetime, timezone
from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from .celery_app import celery_app
from ..config import settings
from ..models.scan import Scan, ScanStatus
from ..services.scan_runner import run_scan_sync
from ..services.importer import import_results


def _sync_db() -> Session:
    engine = create_engine(settings.sync_database_url)
    return Session(engine)


@celery_app.task(bind=True, name="run_scan")
def run_scan_task(self, scan_id: int):
    db = _sync_db()
    scan = db.get(Scan, scan_id)
    if not scan:
        return

    outdir = str(Path(settings.scans_dir) / f"scan_{scan_id}")
    scan.status = ScanStatus.running
    scan.started_at = datetime.now(timezone.utc)
    scan.outdir = outdir
    db.commit()

    try:
        result = run_scan_sync(scan_id, scan.image_path, outdir, scan.config or {})

        if result["returncode"] != 0:
            scan.status = ScanStatus.failed
            scan.error_message = f"bulk_extractor exited with code {result['returncode']}"
            db.commit()
            return

        import_results(scan_id, outdir, db)

        scan.status = ScanStatus.complete
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        scan.status = ScanStatus.failed
        scan.error_message = str(exc)
        db.commit()
        raise
    finally:
        db.close()
