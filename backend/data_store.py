import os, json
import pandas as pd
import httpx
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
            lat_raw = payload.get("lat"),
            lon_raw = payload.get("lon"),
            lat = float(lat_raw) if lat_raw not in (None, "") else None,
            lon = float(lon_raw) if lon_raw not in (None, "") else None,
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
                lat_raw = payload.get("lat"),
                lon_raw = payload.get("lon"),
                lat = float(lat_raw) if lat_raw not in (None, "") else None,
                lon = float(lon_raw) if lon_raw not in (None, "") else None,
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

def geocode_mapbox(address: str) -> tuple[float, float] | None:
    token = os.getenv("MAPBOX_TOKEN")
    if not token:
        raise ValueError("Missing MAPBOX_TOKEN env var")

    url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + httpx.URL(address).raw_path.decode("utf-8") + ".json"
    # Simpler if you prefer:
    # url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{quote(address)}.json"

    params = {
        "access_token": token,
        "limit": 1,
        "types": "address,poi",
        # optional bias near OKC:
        "proximity": "-97.5164,35.4676",
    }

    with httpx.Client(timeout=10) as client:
        r = client.get(url, params=params)
        r.raise_for_status()
        data = r.json()

    feats = data.get("features") or []
    if not feats:
        return None

    # Mapbox returns [lon, lat]
    lon, lat = feats[0]["center"]
    return float(lat), float(lon)


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
        sub = db.execute(select(Submission).where(Submission.id == sub_id)).scalar_one_or_none()
        if not sub:
            raise ValueError("Submission not found")

        # Auto-geocode if missing lat/lon
        if (sub.lat is None or sub.lon is None):
            if not sub.address:
                raise ValueError("Submission missing address; cannot geocode. Edit submission and add address/lat/lon.")
            result = geocode_mapbox(sub.address)
            if not result:
                raise ValueError("Geocode failed (no results). Edit submission and enter lat/lon manually.")
            lat, lon = result
            # persist back onto the submission for audit
            db.execute(
                update(Submission)
                .where(Submission.id == sub_id)
                .values(lat=lat, lon=lon)
            )
            db.commit()
            db.refresh(sub)  # optional; or just set sub.lat/sub.lon if you prefer

        # Build payload for your existing locations insert
        loc_payload = {
            "name": sub.name,
            "address": sub.address,
            "lat": sub.lat,
            "lon": sub.lon,
            "happy_hour": sub.happy_hour,
            "days": sub.days,
            "start_time": sub.start_time.strftime("%H:%M") if sub.start_time else None,
            "end_time": sub.end_time.strftime("%H:%M") if sub.end_time else None,
        }

        create_location(loc_payload)

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

def update_submission(sub_id: str, payload: dict):
    lat_raw = payload.get("lat")
    lon_raw = payload.get("lon")
    lat = float(lat_raw) if lat_raw not in (None, "") else None
    lon = float(lon_raw) if lon_raw not in (None, "") else None

    with SessionLocal() as db:
        result = db.execute(
            update(Submission)
            .where(Submission.id == sub_id)
            .values(
                name=(payload.get("name") or "").strip(),
                address=(payload.get("address") or "").strip() or None,
                happy_hour=(payload.get("happy_hour") or "").strip() or None,
                days=payload.get("days"),
                start_time=_parse_time_hhmm(payload.get("start_time")),
                end_time=_parse_time_hhmm(payload.get("end_time")),
                note=(payload.get("note") or "").strip() or None,
                lat=lat,
                lon=lon,
            )
        )
        if result.rowcount == 0:
            raise ValueError("Submission not found")
        db.commit()