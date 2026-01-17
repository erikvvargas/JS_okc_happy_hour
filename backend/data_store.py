import os, json
# import gspread
import pandas as pd
# from google.oauth2.service_account import Credentials
from sqlalchemy import select, delete, update
from db import SessionLocal
from models import Location
from datetime import datetime, timezone, time
# SHEET_NAME = "happy_hour_data"
# WORKSHEET_NAME = "Sheet1"

# def get_client():
#     creds_dict = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
#     creds = Credentials.from_service_account_info(
#         creds_dict,
#         scopes=[
#             "https://www.googleapis.com/auth/spreadsheets",
#             "https://www.googleapis.com/auth/drive",
#         ],
#     )
#     return gspread.authorize(creds)

# def get_ws():
#     client = get_client()
#     sheet = client.open(SHEET_NAME)
#     return sheet.worksheet(WORKSHEET_NAME)

# def _time_to_str(t):
#     if t is None:
#         return None
#     # psycopg returns datetime.time
#     return t.strftime("%H:%M")

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
            # "description": r.description,
            "updated_at": (r.updated_at.isoformat() if r.updated_at else None),
        })
    return out

# def _header(ws):
#     return ws.row_values(1)

# def _find_row_index_by_id(ws, loc_id: str) -> int:
#     # Find row index where column 'id' equals loc_id
#     headers = _header(ws)
#     if "id" not in headers:
#         raise ValueError("Sheet must have an 'id' column")
#     id_col = headers.index("id") + 1  # 1-based
#     col_values = ws.col_values(id_col)  # includes header at index 0
#     for i, v in enumerate(col_values[1:], start=2):  # start=2 => sheet row number
#         if str(v).strip() == str(loc_id).strip():
#             return i
#     raise KeyError(f"ID not found: {loc_id}")

def create_location(payload: dict):
    with SessionLocal() as db:
        loc = Location(
            id=str(payload["id"]),
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
