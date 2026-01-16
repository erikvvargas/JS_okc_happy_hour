import os, json
import gspread
import pandas as pd
from google.oauth2.service_account import Credentials

SHEET_NAME = "happy_hour_data"
WORKSHEET_NAME = "Sheet1"

def get_client():
    creds_dict = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds = Credentials.from_service_account_info(
        creds_dict,
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ],
    )
    return gspread.authorize(creds)

def get_ws():
    client = get_client()
    sheet = client.open(SHEET_NAME)
    return sheet.worksheet(WORKSHEET_NAME)

def load_locations():
    ws = get_ws()
    data = ws.get_all_records()
    df = pd.DataFrame(data)
    if len(df) == 0:
        return pd.DataFrame(columns=["id","name","address","lat","lon","happy_hour","days","start_time","end_time","description"])
    df["lat"] = df["lat"].astype(float)
    df["lon"] = df["lon"].astype(float)
    df["id"] = df["id"].astype(str)
    return df

def _header(ws):
    return ws.row_values(1)

def _find_row_index_by_id(ws, loc_id: str) -> int:
    # Find row index where column 'id' equals loc_id
    headers = _header(ws)
    if "id" not in headers:
        raise ValueError("Sheet must have an 'id' column")
    id_col = headers.index("id") + 1  # 1-based
    col_values = ws.col_values(id_col)  # includes header at index 0
    for i, v in enumerate(col_values[1:], start=2):  # start=2 => sheet row number
        if str(v).strip() == str(loc_id).strip():
            return i
    raise KeyError(f"ID not found: {loc_id}")

def add_location(payload: dict):
    ws = get_ws()
    headers = _header(ws)

    # Ensure an id exists
    if "id" not in payload or str(payload["id"]).strip() == "":
        # simple id strategy: max existing id + 1
        df = load_locations()
        if len(df) == 0:
            new_id = "1"
        else:
            numeric = pd.to_numeric(df["id"], errors="coerce").dropna()
            new_id = str(int(numeric.max()) + 1) if len(numeric) else str(len(df) + 1)
        payload["id"] = new_id

    row = [payload.get(h, "") for h in headers]
    ws.append_row(row, value_input_option="USER_ENTERED")
    return {"ok": True, "id": str(payload["id"])}

def update_location(loc_id: str, payload: dict):
    ws = get_ws()
    headers = _header(ws)
    row_idx = _find_row_index_by_id(ws, loc_id)

    # Build updated row: start from existing row values mapped by headers
    existing = ws.row_values(row_idx)
    # Pad existing to header length
    existing += [""] * (len(headers) - len(existing))
    current = dict(zip(headers, existing))

    # Apply updates
    for k, v in payload.items():
        if k in headers:
            current[k] = v

    # Ensure id stays consistent
    current["id"] = str(loc_id)

    updated_row = [current.get(h, "") for h in headers]
    ws.update(f"A{row_idx}:{gspread.utils.rowcol_to_a1(row_idx, len(headers))}", [updated_row])
    return {"ok": True, "id": str(loc_id)}

def delete_location(loc_id: str):
    ws = get_ws()
    row_idx = _find_row_index_by_id(ws, loc_id)
    ws.delete_rows(row_idx)
    return {"ok": True, "id": str(loc_id)}
