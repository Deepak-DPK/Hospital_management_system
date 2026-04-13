# 📦 HMS — Installation Guide

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Python | 3.12+ | [python.org](https://python.org) |
| MongoDB Atlas account | Free M0 | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Modern browser | Chrome / Firefox / Edge | — |

---

## Quick Setup (Recommended)

**Linux / macOS:**
```bash
cd hms
bash setup.sh
```

**Windows:**
```
cd hms
setup.bat
```

The script will create the virtual environment, install dependencies, and generate `backend/.env` from the template. Then skip to [Configure Environment Variables](#configure-environment-variables).

---

## Manual Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/hms.git
cd hms
```

### 2. Create virtual environment

```bash
cd backend

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Verify installation

```bash
python -c "import fastapi, motor, bcrypt, jose; print('All OK')"
```

---

## Configure Environment Variables

```bash
# Linux / macOS
cp backend/.env.example backend/.env

# Windows
copy backend\.env.example backend\.env
```

Open `backend/.env` and fill in:

```env
MONGO_DETAILS=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<appname>
JWT_SECRET=<your-random-secret>
HMS_ADMIN_CODE=HMS_ADMIN_2024
VERCEL_URL=
```

### Getting your MongoDB URI

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. **Database Access** → Add New Database User → set username & password
4. **Network Access** → Add IP Address → Allow Access from Anywhere (for dev)
5. Click **Connect** → **Drivers** → **Python** → copy the URI
6. Replace `<password>` with your actual password in the URI

### Generating a JWT secret

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output as `JWT_SECRET` in your `.env`.

---

## Running the App

You need **two terminals** open simultaneously.

### Terminal 1 — Backend

```bash
# Linux / macOS
cd hms/backend
source .venv/bin/activate
uvicorn main:app --reload

# Windows
cd hms\backend
.venv\Scripts\activate
uvicorn main:app --reload
```

Expected:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 — Frontend

```bash
# Linux / macOS
cd hms/frontend
python3 -m http.server 5500

# Windows
cd hms\frontend
python -m http.server 5500
```

### Open in browser

| URL | Page |
|---|---|
| `http://localhost:5500/login.html` | Login / Register |
| `http://localhost:5500` | Dashboard |
| `http://localhost:8000/docs` | API docs (Swagger UI) |

---

## First-Time Account Setup

Go to `http://localhost:5500/login.html` → **Create Account**

| Role | Code required | Notes |
|---|:---:|---|
| Patient | No | Standard user |
| Doctor | No | Enter specialization |
| Admin | Yes | Enter `HMS_ADMIN_CODE` from `.env` |

> Register at least one Doctor before patients can book appointments.

---

## Deployment

### Backend — Render (free tier)

1. Push `hms/` to GitHub
2. [render.com](https://render.com) → New → Web Service → connect repo
3. Settings:
   - **Root Directory:** `hms/backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all `.env` variables in Render's Environment tab
5. Copy your Render URL (e.g. `https://hms-api.onrender.com`)

### Frontend — Vercel

1. [vercel.com](https://vercel.com) → New Project → import repo
2. Settings:
   - **Root Directory:** `hms/frontend`
   - **Framework Preset:** Other
   - **Build Command:** *(leave empty)*
   - **Output Directory:** `.`
3. Deploy and copy your Vercel URL

### After deploying both

1. Update `VERCEL_URL` in Render's environment variables
2. Update `const API = '...'` in `frontend/app.js` and `frontend/bill.html` to your Render URL
3. Redeploy frontend on Vercel

---

## Security Checklist Before Going Live

- [ ] `backend/.env` is in `.gitignore` and never committed
- [ ] `JWT_SECRET` is a strong random 32+ char hex string
- [ ] `HMS_ADMIN_CODE` changed from the default value
- [ ] MongoDB Network Access restricted to your server IP
- [ ] `VERCEL_URL` set correctly in CORS config

---

> For errors and troubleshooting see [ERRORS.md](./ERRORS.md)
