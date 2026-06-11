import os
import re
import subprocess
import asyncio
from pathlib import Path
from typing import Optional
import redis as sync_redis

from ..config import settings

PROGRESS_RE = re.compile(r"(\d+:\d+:\d+)\s+Offset\s+(\d+)MB\s+\((\d+\.\d+)%\)")

def build_args(scan_id: int, image_path: str, outdir: str, config: dict) -> list[str]:
    args = [
        settings.engine_binary,
        "-o", outdir,
        "-j", str(config.get("threads", os.cpu_count() or 4)),
        "-G", str(config.get("pagesize", 16 * 1024 * 1024)),
        "-g", str(config.get("marginsize", 4 * 1024 * 1024)),
        "-1",  # legacy stdout progress output
    ]
    for scanner in config.get("disabled_scanners", []):
        args += ["-x", scanner]
    for scanner in config.get("enabled_scanners", []):
        args += ["-e", scanner]
    args.append(image_path)
    return args

def run_scan_sync(scan_id: int, image_path: str, outdir: str, config: dict) -> dict:
    """Run bulk_extractor synchronously (called from Celery worker)."""
    Path(outdir).mkdir(parents=True, exist_ok=True)
    args = build_args(scan_id, image_path, outdir, config)

    r = sync_redis.from_url(settings.redis_url)
    channel = f"scan_progress:{scan_id}"

    proc = subprocess.Popen(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    for line in proc.stdout:
        line = line.rstrip()
        m = PROGRESS_RE.search(line)
        if m:
            r.publish(channel, f'{{"percent": {m.group(3)}, "offset_mb": {m.group(2)}, "elapsed": "{m.group(1)}"}}')

    proc.wait()
    r.publish(channel, '{"percent": 100, "done": true}')
    return {"returncode": proc.returncode, "outdir": outdir}
