import os, json
import pandas as pd
from sqlalchemy import select, delete, update
from db import SessionLocal
from models import Location, Submission
from datetime import datetime, timezone, time
from uuid import uuid4


def _time_to_str(t):
    if t is None:
        return None
    # psycopg returns datetime.time
    return t.strftime("%H:%M")

def _parse_time_hhmm(s: str | None) -> time | None:
    if not s:
        return None
    s = str(s).strip()
    if not s:
        return None
    # Accept "HH:MM" or "HH:MM:SS"
    parts = s.split(":")
    if len(parts) < 2:
        raise ValueError(f"Invalid time format: {s}")
    hh = int(parts[0])
    mm = int(parts[1])
    ss = int(parts[2]) if len(parts) >= 3 else 0
    return time(hour=hh, minute=mm, second=ss)

def load_locations():
    with SessionLocal() as db:
        rows = db.execute(select(Location)).scalars().all()

    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "name": r.name,
            "address": r.address,
            "lat": r.lat,
            "lon": r.lon,
            "days": r.days,
            "start_time": _time_to_str(r.start_time),
            "end_time": _time_to_str(r.end_time),
            "happy_hour": r.happy_hour,
            "updated_at": (r.updated_at.isoformat() if r.updated_at else None),
        })
    return out


def create_location(payload: dict):
    with SessionLocal() as db:
        loc_id = str(payload.get("id") or uuid4())
        loc = Location(
            id=loc_id,
            name=str(payload["name"]),
            address=payload.get("address"),
            lat=float(payload["lat"]),
            lon=float(payload["lon"]),
            days=payload.get("days"),
            happy_hour=payload.get("happy_hour"),
            # description=payload.get("description"),
            start_time=_parse_time_hhmm(payload.get("start_time")),
            end_time=_parse_time_hhmm(payload.get("end_time")),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(loc)
        db.commit()
    return {"ok": True}

def update_location(loc_id: str, payload: dict):
    with SessionLocal() as db:
        db.execute(
            update(Location)
            .where(Location.id == loc_id)
            .values(
                name=payload.get("name"),
                address=payload.get("address"),
                lat=float(payload.get("lat")),
                lon=float(payload.get("lon")),
                days=payload.get("days"),
                happy_hour=payload.get("happy_hour"),
                # description=payload.get("description"),
                start_time=payload.get("start_time"),  # see note below
                end_time=payload.get("end_time"),
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
    return {"ok": True}

def delete_location(loc_id: str):
    with SessionLocal() as db:
        db.execute(delete(Location).where(Location.id == loc_id))
        db.commit()
    return {"ok": True}


# functions related to user actions goes here

def create_submission(payload: dict) -> str:
    sub_id = str(uuid4())

    with SessionLocal() as db:
        sub = Submission(
            id=sub_id,
            name=str(payload["name"]).strip(),
            address=(payload.get("address") or "").strip() or None,
            lat=float(payload["lat"]) if payload.get("lat") not in (None, "") else None,
            lon=float(payload["lon"]) if payload.get("lon") not in (None, "") else None,
            happy_hour=(payload.get("happy_hour") or "").strip() or None,
            days=payload.get("days"),
            start_time=_parse_time_hhmm(payload.get("start_time")),
            end_time=_parse_time_hhmm(payload.get("end_time")),
            note=(payload.get("note") or "").strip() or None,
            status="pending",
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(sub)
        db.commit()
    return sub_id

def list_submissions(status: str = "pending"):
    with SessionLocal() as db:
        rows = db.execute(
            select(Submission).where(Submission.status == status)
        ).scalars().all()

    def t2s(t): return t.strftime("%H:%M") if t else None

    return [{
        "id": r.id,
        "name": r.name,
        "address": r.address,
        "lat": r.lat,
        "lon": r.lon,
        "happy_hour": r.happy_hour,
        "days": r.days,
        "start_time": t2s(r.start_time),
        "end_time": t2s(r.end_time),
        "note": r.note,
        "status": r.status,
        "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
        "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
    } for r in rows]

def approve_submission(sub_id: str):
    with SessionLocal() as db:
        sub = db.execute(select(Submission).where(Submission.id == sub_id)).scalar_one()

        # Reuse create_location() by building a payload
        loc_payload = {
            "name": sub.name,
            "address": sub.address,
            "lat": sub.lat,
            "lon": sub.lon,
            "days": sub.days,
            "start_time": sub.start_time.strftime("%H:%M") if sub.start_time else None,
            "end_time": sub.end_time.strftime("%H:%M") if sub.end_time else None,
            "happy_hour": sub.happy_hour,
        }

        create_location(loc_payload)  # existing Neon insert for locations

        db.execute(
            update(Submission)
            .where(Submission.id == sub_id)
            .values(status="approved", reviewed_at=datetime.now(timezone.utc))
        )
        db.commit()

def reject_submission(sub_id: str):
    with SessionLocal() as db:
        result = db.execute(
            update(Submission)
            .where(Submission.id == sub_id)
            .values(
                status="rejected",
                reviewed_at=datetime.now(timezone.utc),
            )
        )
        if result.rowcount == 0:
            raise ValueError("Submission not found")
        db.commit()