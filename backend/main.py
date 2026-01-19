import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from cache import CACHE_KEY_LOCATIONS, CACHE_TTL_SECONDS, cache_get_json, cache_set_json, invalidate_locations_cache
# and your existing load function, e.g. load_locations()
from auth import create_token, require_admin
from data_store import load_locations, create_location, update_location, delete_location
import httpx
from urllib.parse import quote


load_dotenv()
MAPBOX_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")
if not MAPBOX_TOKEN:
    raise RuntimeError("Missing MAPBOX_ACCESS_TOKEN")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=[
    #     "http://localhost:5173", 
    #     "http://127.0.0.1:5173",
    #     "http://192.168.1.180:5173"
    # ],  
    allow_origins=["https://js-okc-happy-hour.vercel.app/"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginReq(BaseModel):
    password: str

@app.get("/admin/geocode")
async def admin_geocode(q: str, _: bool = Depends(require_admin)):
    # q is an address string like "123 Main St, Oklahoma City, OK"
    if not q or len(q.strip()) < 5:
        raise HTTPException(status_code=400, detail="Query too short")

    # Bias results toward OKC area; optional but helpful
    # Mapbox expects lon,lat for proximity
    proximity = "-97.5164,35.4676"

    url = (
        "https://api.mapbox.com/geocoding/v5/mapbox.places/"
        f"{quote(q)}.json"
    )

    params = {
        "access_token": MAPBOX_TOKEN,
        "limit": 1,
        "proximity": proximity,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding provider error")

    data = r.json()
    feats = data.get("features") or []
    if not feats:
        return {"ok": True, "found": False}

    f = feats[0]
    lon, lat = f["center"]
    return {
        "ok": True,
        "found": True,
        "lat": lat,
        "lon": lon,
        "place_name": f.get("place_name"),
    }

@app.post("/auth/login")
def login(req: LoginReq):
    if req.password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Bad password")
    return {"token": create_token()}

@app.get("/locations")
async def locations():
    cached = await cache_get_json(CACHE_KEY_LOCATIONS)
    if cached is not None:
        return cached

    data = load_locations()  # <-- your existing Google Sheets -> list[dict]
    await cache_set_json(CACHE_KEY_LOCATIONS, data, CACHE_TTL_SECONDS)
    return data

# Public
@app.get("/locations")
def get_locations():
    df = load_locations()
    return df.to_dict(orient="records")

# Admin (protected)
@app.get("/admin/locations")
def admin_list(_: bool = Depends(require_admin)):
    # df = load_locations()
    # return df.to_dict(orient="records")
    return load_locations()

@app.post("/admin/locations")
async def admin_add(payload: dict, _: bool = Depends(require_admin)):
    create_location(payload)
    await invalidate_locations_cache()
    return {"ok": True}

@app.put("/admin/locations/{loc_id}")
async def admin_update(loc_id: str, payload: dict, _: bool = Depends(require_admin)):
    update_location(loc_id, payload)
    await invalidate_locations_cache()
    return {"ok": True}

@app.delete("/admin/locations/{loc_id}")
async def admin_delete(loc_id: str, _: bool = Depends(require_admin)):
    delete_location(loc_id)
    await invalidate_locations_cache()
    return {"ok": True}

