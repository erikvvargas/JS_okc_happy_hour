import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import create_token, require_admin
from data_store import load_locations, add_location, update_location, delete_location

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://192.168.1.180:5173"
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginReq(BaseModel):
    password: str

@app.post("/auth/login")
def login(req: LoginReq):
    if req.password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Bad password")
    return {"token": create_token()}

# Public
@app.get("/locations")
def get_locations():
    df = load_locations()
    return df.to_dict(orient="records")

# Admin (protected)
@app.get("/admin/locations")
def admin_list(_: bool = Depends(require_admin)):
    df = load_locations()
    return df.to_dict(orient="records")

@app.post("/admin/locations")
def admin_add(payload: dict, _: bool = Depends(require_admin)):
    return add_location(payload)

@app.put("/admin/locations/{loc_id}")
def admin_update(loc_id: str, payload: dict, _: bool = Depends(require_admin)):
    return update_location(loc_id, payload)

@app.delete("/admin/locations/{loc_id}")
def admin_delete(loc_id: str, _: bool = Depends(require_admin)):
    return delete_location(loc_id)
