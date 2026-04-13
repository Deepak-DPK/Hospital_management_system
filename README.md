# 🏥 HMS — Hospital Management System

A full-stack Hospital Management System built with **FastAPI** (Python 3.12), **MongoDB Atlas**, and **Vanilla HTML/CSS/JS**. Supports three roles — Patient, Doctor, and Admin — with full RBAC, appointment scheduling, medical records, prescriptions, bed management, billing, and printable invoices.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup — Backend](#setup--backend)
- [Setup — Frontend](#setup--frontend)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Role Guide](#role-guide)
- [API Reference](#api-reference)
- [Error Reference](#error-reference)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Features

| Module | Patient | Doctor | Admin |
|---|:---:|:---:|:---:|
| Dashboard with live stats | ✓ | ✓ | ✓ |
| Book / view appointments | ✓ | view | ✓ |
| Complete / cancel appointments | — | ✓ | ✓ |
| Medical records (view) | ✓ | — | — |
| Medical records (add/delete) | — | ✓ | ✓ |
| Prescriptions (view) | ✓ | — | — |
| Prescriptions (create) | — | ✓ | ✓ |
| Bed & ward management | — | admit/discharge | full CRUD |
| Billing (view own bills) | ✓ | — | — |
| Billing (create / mark paid) | — | create | full |
| Printable invoice (PDF) | ✓ | ✓ | ✓ |
| Profile & password change | ✓ | ✓ | ✓ |
| Patient search | — | ✓ | ✓ |
| Appointment search & filter | ✓ | ✓ | ✓ |

---

## Tech Stack

**Backend**
- Python 3.12
- FastAPI 0.115 + Uvicorn
- MongoDB Atlas via Motor 3.x (async)
- Pydantic V2 for validation
- python-jose for JWT auth
- bcrypt for password hashing

**Frontend**
- Vanilla HTML5 / CSS3 / JavaScript (no build step)
- Inter font via Google Fonts
- Served via Python's built-in HTTP server (dev) or Vercel (prod)

---

## Project Structure

```
hms/
├── backend/
│   ├── main.py          # FastAPI app, all routes
│   ├── models.py        # Pydantic models & validators
│   ├── auth.py          # JWT, bcrypt, role guards
│   ├── database.py      # Motor client, collection helpers
│   ├── requirements.txt # Pinned Python dependencies
│   └── .env.example     # Environment variable template
│
├── frontend/
│   ├── index.html       # Main SPA shell (dashboard)
│   ├── login.html       # Login / Register page
│   ├── bill.html        # Printable invoice page
│   ├── app.js           # All SPA logic (routing, pages, API calls)
│   └── style.css        # White/blue theme, responsive
│
├── setup.sh             # One-command setup (Linux / macOS)
├── setup.bat            # One-command setup (Windows)
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.12+ | [python.org](https://python.org) |
| pip | latest | bundled with Python |
| MongoDB Atlas account | free M0 | [cloud.mongodb.com](https://cloud.mongodb.com) |
| A modern browser | Chrome / Firefox / Edge | — |

---

## Setup — Backend

### Quick Start (recommended)

**Linux / macOS:**
```bash
cd hms
bash setup.sh
```

**Windows:**
```
Double-click setup.bat
OR
cd hms
setup.bat
```

Both scripts will:
- Check your Python version
- Create a virtual environment
- Install all dependencies
- Create `backend/.env` from the template if it doesn't exist

After running, edit `backend/.env` with your real values, then follow [Running the App](#running-the-app).

---

### Manual Setup

#### 1. Create a virtual environment

```bash
cd hms/backend
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows
```

#### 2. Install dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure environment variables

```bash
cp .env.example .env             # Linux / macOS
# copy .env.example .env         # Windows
```

Open `.env` and fill in your values (see [Environment Variables](#environment-variables)).

#### 4. Verify the setup

```bash
python -c "import fastapi, motor, bcrypt, jose; print('All OK')"
```

---

## Setup — Frontend

No build step required. The frontend is plain HTML/JS.

Just make sure the `API` constant in `app.js` and `bill.html` points to your backend:

```js
// frontend/app.js  (line 1)
const API = 'http://localhost:8000';
```

Change this to your deployed backend URL when going to production.

---

## Environment Variables

Create `backend/.env` from the template:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|---|:---:|---|
| `MONGO_DETAILS` | ✅ | Full MongoDB Atlas connection URI |
| `JWT_SECRET` | ✅ | Random secret for signing JWTs (min 32 chars) |
| `HMS_ADMIN_CODE` | ✅ | Secret code required to register as Admin |
| `VERCEL_URL` | ❌ | Your Vercel frontend URL (for CORS in production) |

### Getting your MongoDB URI

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. Create a database user (Database Access → Add New User)
4. Allow your IP (Network Access → Add IP Address)
5. Click **Connect** → **Drivers** → **Python** → copy the URI
6. Replace `<password>` with your actual password

### Generating a JWT secret

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output as `JWT_SECRET` in your `.env`.

---

## Running the App

You need **two terminals** running simultaneously.

### Terminal 1 — Backend

**Linux / macOS:**
```bash
cd hms/backend
source .venv/bin/activate
uvicorn main:app --reload
```

**Windows:**
```bat
cd hms\backend
.venv\Scripts\activate
uvicorn main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process using WatchFiles
```

### Terminal 2 — Frontend

**Linux / macOS:**
```bash
cd hms/frontend
python3 -m http.server 5500
```

**Windows:**
```bat
cd hms\frontend
python -m http.server 5500
```

### Open in browser

| URL | Page |
|---|---|
| `http://localhost:5500/login.html` | Login / Register |
| `http://localhost:5500` | Dashboard (after login) |
| `http://localhost:5500/bill.html?id=<id>` | Invoice |

---

## Role Guide

### Registering accounts

Go to `http://localhost:5500/login.html` → **Create Account**

| Role | Notes |
|---|---|
| **Patient** | Select "Patient" — no code needed |
| **Doctor** | Select "Doctor" — enter your specialization |
| **Admin** | Select "Admin" — enter the `HMS_ADMIN_CODE` from your `.env` (default: `HMS_ADMIN_2024`) |

> ⚠️ Change `HMS_ADMIN_CODE` in `.env` before going to production.

---

### Patient workflow

1. **Login** → Dashboard shows upcoming appointments and unpaid bills
2. **My Appointments** → Book a new appointment with any doctor
3. **Medical Records** → View records added by your doctor
4. **Prescriptions** → View prescriptions issued to you
5. **My Bills** → View bills, click "View" to open printable invoice
6. **My Profile** → Update name, phone, change password

---

### Doctor workflow

1. **Login** → Dashboard shows today's schedule
2. **Appointments** → Mark appointments as completed or cancel them
3. **Patients** → Search patients, view full history, prescribe, add records, create bills
4. **Add Records** → Add medical records for any patient
5. **Prescriptions** → Issue prescriptions with multiple medicines
6. **Beds / Wards** → Admit and discharge patients
7. **Billing** → Create itemized bills for patients

---

### Admin workflow

1. **Login** → Dashboard shows live stats (patients, doctors, beds, bills)
2. **All Appointments** → View and manage all appointments across all doctors
3. **Patients** → Full patient list with search
4. **Doctors** → View all registered doctors
5. **Medical Records** → Add records for any patient
6. **Prescriptions** → Issue prescriptions
7. **Beds / Wards** → Add/delete beds, admit/discharge patients, set maintenance
8. **Billing** → Create bills, mark bills as paid
9. **My Profile** → Update profile and password

---

## API Reference

Base URL: `http://localhost:8000`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✓ | Get current user profile |
| PUT | `/auth/profile` | ✓ | Update name / phone / specialization |
| PUT | `/auth/password` | ✓ | Change password |

**Register body:**
```json
{
  "name": "Dr. Smith",
  "email": "smith@hospital.com",
  "password": "secret123",
  "role": "doctor",
  "specialization": "Cardiology",
  "phone": "+91 98765 43210",
  "admin_code": ""
}
```

### Users

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/doctors?search=` | — | List all doctors |
| GET | `/patients?search=&skip=&limit=` | doctor/admin | List patients (paginated) |

### Appointments

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/appointments` | ✓ | Book appointment |
| GET | `/appointments?date=&status=` | ✓ | Get appointments (role-filtered) |
| PUT | `/appointments/{id}/status` | ✓ | Update status (scheduled/completed/cancelled) |
| DELETE | `/appointments/{id}` | admin | Delete appointment |

### Medical Records

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/records` | doctor/admin | Add medical record |
| GET | `/records/{patient_id}` | ✓ | Get patient's records |
| DELETE | `/records/{id}` | doctor/admin | Delete record |

### Prescriptions

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/prescriptions` | doctor/admin | Create prescription |
| GET | `/prescriptions/{patient_id}` | ✓ | Get patient's prescriptions |
| DELETE | `/prescriptions/{id}` | doctor/admin | Delete prescription |

### Beds

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/beds` | ✓ | List all beds |
| POST | `/beds` | admin | Add bed |
| PUT | `/beds/{id}/admit` | doctor/admin | Admit patient |
| PUT | `/beds/{id}/discharge` | doctor/admin | Discharge patient |
| PUT | `/beds/{id}/maintenance` | admin | Set maintenance status |
| DELETE | `/beds/{id}` | admin | Delete bed |

### Billing

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/bills` | doctor/admin | Create bill |
| GET | `/bills/{patient_id}` | ✓ | Get patient's bills |
| GET | `/bill/{bill_id}` | ✓ | Get single bill (for invoice) |
| PUT | `/bills/{id}/pay` | admin | Mark bill as paid |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| GET | `/stats` | admin | Live dashboard statistics |

---

## Error Reference

### HTTP Status Codes

| Code | Meaning | Common Cause |
|---|---|---|
| 400 | Bad Request | Invalid ID format, missing fields, wrong current password |
| 401 | Unauthorized | Missing or expired JWT token |
| 403 | Forbidden | Wrong role for this action, wrong admin code |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered, time slot already booked, bed already occupied, duplicate bed number |
| 422 | Unprocessable Entity | Pydantic validation failed (invalid email, short password, etc.) |
| 500 | Internal Server Error | Database connection failed, unexpected error |

### Common Errors & Fixes

**`MONGO_DETAILS environment variable is not set`**
→ You forgot to create `backend/.env` or the variable is missing. Copy `.env.example` to `.env` and fill it in.

**`ConfigurationError: The DNS query name does not exist`**
→ Your MongoDB URI has a placeholder value. Replace `<username>`, `<password>`, `<cluster>` with real values.

**`Invalid or expired token`**
→ Your JWT has expired (24h) or `JWT_SECRET` changed. Log out and log back in.

**`Email already registered`**
→ Use a different email or log in with the existing account.

**`This time slot is already booked for this doctor`**
→ Choose a different date/time for the appointment.

**`Invalid admin registration code`**
→ Enter the correct `HMS_ADMIN_CODE` from your `.env` file.

**`Failed to fetch` in browser**
→ The backend is not running. Start it with `uvicorn main:app --reload` in Terminal 1.

**`CORS error` in browser console**
→ You're opening the frontend from a different port or directly as a `file://` URL. Always use `python3 -m http.server 5500` and open `http://localhost:5500`.

**`ValueError: password cannot be longer than 72 bytes`**
→ You have an old `passlib` installed. Run `pip install -r requirements.txt` to get `bcrypt` instead.

**`ModuleNotFoundError`**
→ Virtual environment not activated. Run `source .venv/bin/activate` first.

**`Address already in use` on port 8000 or 5500**
→ Another process is using that port. Kill it:

```bash
# Linux / macOS — find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

```bat
:: Windows — find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

Or just use a different port:
```bash
uvicorn main:app --reload --port 8001
```

---

## Deployment

### Backend — Render (free tier)

1. Push `hms/` to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `hms/backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard (same as `.env`)
6. Copy the Render URL (e.g. `https://hms-api.onrender.com`)

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** `hms/frontend`
   - **Framework Preset:** Other
   - **Build Command:** *(leave empty)*
   - **Output Directory:** `.`
4. Deploy
5. Copy the Vercel URL (e.g. `https://hms.vercel.app`)

### After deploying both

1. Update `VERCEL_URL` in your Render environment variables
2. Update `const API = '...'` in `frontend/app.js` and `frontend/bill.html` to your Render URL
3. Redeploy frontend

---

## Security Notes

- **Never commit `backend/.env`** — it's in `.gitignore`
- Change `HMS_ADMIN_CODE` to something strong before going live
- Generate a proper `JWT_SECRET` (32+ random hex chars)
- In production, restrict MongoDB Network Access to your server's IP only
- Tokens expire after 24 hours — users must re-login
- Passwords are hashed with bcrypt (cost factor 12)
- All admin-only routes are protected server-side — frontend role checks are UX only

---

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python3 --version   # Linux/macOS — must be 3.12+
python --version    # Windows

# Check venv is active
which python        # Linux/macOS — should point to .venv/bin/python
where python        # Windows — should point to .venv\Scripts\python.exe

# Reinstall dependencies
pip install -r requirements.txt

# Test imports
python -c "import fastapi, motor, bcrypt, jose; print('All OK')"
```

**Windows: `python3` not found**
→ On Windows, use `python` instead of `python3`. If neither works, Python is not in your PATH — reinstall from [python.org](https://python.org) and check "Add Python to PATH".

**Windows: `source` command not found**
→ `source` is Linux/macOS only. On Windows use `.venv\Scripts\activate` instead.

**Windows: execution policy error on `.venv\Scripts\activate`**
→ Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MongoDB connection fails

```bash
# Test connection manually
python -c "
import asyncio, os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv()
async def test():
    c = AsyncIOMotorClient(os.getenv('MONGO_DETAILS'), serverSelectionTimeoutMS=5000)
    await c.admin.command('ping')
    print('MongoDB connected OK')
asyncio.run(test())
"
```

### Check what collections exist in MongoDB

```bash
python -c "
import asyncio, os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv()
async def check():
    c = AsyncIOMotorClient(os.getenv('MONGO_DETAILS'))
    cols = await c['hms_db'].list_collection_names()
    print('Collections:', cols)
asyncio.run(check())
"
```

### Reset all data (drop database)

```bash
python -c "
import asyncio, os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv()
async def drop():
    c = AsyncIOMotorClient(os.getenv('MONGO_DETAILS'))
    await c.drop_database('hms_db')
    print('Database dropped.')
asyncio.run(drop())
"
```

### View API docs (Swagger UI)

FastAPI auto-generates interactive API docs:

```
http://localhost:8000/docs
```

Use this to test any endpoint directly in the browser.

---

## License

MIT — free to use, modify, and distribute.
