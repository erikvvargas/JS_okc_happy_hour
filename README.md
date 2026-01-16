# OKC Happy Hour Guide

Welcome to the repo for the OKC Happy Hour Map! 

### Local Dev Steps
- from `/backend`: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- from `/frontend`: `npm run dev -- --host 0.0.0.0 --port 5173`
- Required env vars, refer to `.env.example` in `/frontend` and `/backend`

### In Progress
- Changing light/dark mode based on the current time of day
- Updating data store to get away from Google Sheets and move to Postgres
- Change from local hosting and bring online to the public 