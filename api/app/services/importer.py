"""
Imports bulk_extractor output files into PostgreSQL.
Reuses parsing logic modelled on python/bulk_extractor_reader.py.
"""
import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from sqlalchemy.orm import Session

from ..models.feature import Feature, Histogram, Alert
from ..models.scan import Scan, ScanStatus

HISTOGRAM_SUFFIX = "_histogram.txt"
STOP_SUFFIX = "_stopped.txt"
SKIP_FILES = {"report.xml", "alerts.txt"}

# Feature files to skip (not per-feature, they are carved blobs or metadata)
SKIP_FEATURE_FILES = {"wordlist"}

def _parse_feature_line(line: str) -> tuple[str | None, str, str]:
    """Returns (forensic_path, value, context) from a tab-separated feature line."""
    if line.startswith("#"):
        return None, "", ""
    parts = line.split("\t", 2)
    if len(parts) < 2:
        return None, "", ""
    forensic_path = parts[0]
    value = parts[1]
    context = parts[2] if len(parts) > 2 else ""
    return forensic_path, value, context

def _offset_from_path(forensic_path: str) -> int | None:
    """Extract numeric byte offset from a forensic path like '1024' or '1024-ZIP-0'."""
    m = re.match(r"^(\d+)", forensic_path)
    return int(m.group(1)) if m else None

def import_results(scan_id: int, outdir: str, db: Session) -> dict:
    outpath = Path(outdir)
    counts = {}

    # --- Feature files ---
    for fpath in sorted(outpath.glob("*.txt")):
        fname = fpath.name
        if fname in SKIP_FILES:
            continue
        if fname.endswith(HISTOGRAM_SUFFIX) or fname.endswith(STOP_SUFFIX):
            continue

        feature_type = fpath.stem
        if feature_type in SKIP_FEATURE_FILES:
            continue

        rows = []
        with open(fpath, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    continue
                forensic_path, value, context = _parse_feature_line(line)
                if forensic_path is None:
                    continue
                rows.append(Feature(
                    scan_id=scan_id,
                    feature_type=feature_type,
                    offset=_offset_from_path(forensic_path),
                    forensic_path=forensic_path,
                    value=value[:4096],    # cap very long values
                    context=context[:2048] if context else None,
                ))
                if len(rows) >= 5000:
                    db.bulk_save_objects(rows)
                    db.flush()
                    rows = []

        if rows:
            db.bulk_save_objects(rows)
            db.flush()

        counts[feature_type] = counts.get(feature_type, 0)

    # --- Histogram files ---
    for fpath in sorted(outpath.glob(f"*{HISTOGRAM_SUFFIX}")):
        feature_type = fpath.name[: -len(HISTOGRAM_SUFFIX)]
        rows = []
        with open(fpath, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t", 1)
                if len(parts) < 2:
                    continue
                count_str, value = parts
                m = re.match(r"n=(\d+)", count_str)
                if not m:
                    continue
                rows.append(Histogram(
                    scan_id=scan_id,
                    feature_type=feature_type,
                    value=value[:2048],
                    count=int(m.group(1)),
                ))
        if rows:
            db.bulk_save_objects(rows)
            db.flush()

    # --- alerts.txt ---
    alerts_file = outpath / "alerts.txt"
    if alerts_file.exists():
        rows = []
        with open(alerts_file, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    continue
                forensic_path, value, context = _parse_feature_line(line)
                if forensic_path is None:
                    continue
                rows.append(Alert(
                    scan_id=scan_id,
                    offset=_offset_from_path(forensic_path),
                    value=value[:4096],
                    context=context[:2048] if context else None,
                ))
        if rows:
            db.bulk_save_objects(rows)
            db.flush()

    # --- report.xml (DFXML) for metadata ---
    report_xml = outpath / "report.xml"
    image_hash = None
    total_bytes = None
    elapsed_seconds = None

    if report_xml.exists():
        try:
            tree = ET.parse(report_xml)
            root = tree.getroot()
            ns = {"be": "http://afflib.org/bulk_extractor/"}

            def find_text(tag):
                el = root.find(f".//{tag}")
                return el.text.strip() if el is not None and el.text else None

            hash_el = root.find(".//hashdigest[@type='SHA1']")
            if hash_el is not None and hash_el.text:
                image_hash = hash_el.text.strip()

            tb = find_text("total_bytes")
            if tb:
                total_bytes = int(tb)

            es = find_text("elapsed_seconds")
            if es:
                elapsed_seconds = float(es)
        except Exception:
            pass

    scan = db.get(Scan, scan_id)
    if scan:
        if image_hash:
            scan.image_hash = image_hash
        if total_bytes:
            scan.total_bytes = total_bytes
        if elapsed_seconds:
            scan.elapsed_seconds = elapsed_seconds

    db.commit()
    return counts
