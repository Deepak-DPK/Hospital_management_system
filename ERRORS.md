# 🔧 HMS — Error Reference & Troubleshooting Guide

---

## HTTP Status Codes

| Code | Meaning | Common Cause |
|---|---|---|
| 400 | Bad Request | Invalid ID format, missing fields, wrong current password |
| 401 | Unauthorized | Missing or expired JWT token |
| 403 | Forbidden | Wrong role for this action, wrong admin code |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered, time slot booked, bed occupied, duplicate bed number |
| 422 | Unprocessable Entity | Pydantic validation failed (invalid email, short password, etc.) |
| 500 | Internal Server Error | Database connection failed, unexpected error |

---

## Common Errors & Fixes

### Setup Errors

**`MONGO_DETAILS environment variable is not set`**
```
RuntimeError: MONGO_DETAILS environment variable is not set
```
→ You forgot to create `backend/.env` or the variable is missing.
```bash
cp backend/.env.example backend/.env
# Then fill in your MongoDB URI
```

---

**`ConfigurationError: The DNS query name does not exist`**
```
pymongo.errors.ConfigurationError: The DNS query name does not exist: _mongodb._tcp.cluster.mongodb.net
```
→ Your MongoDB URI still has placeholder values.  
→ Replace `<username>`, `<password>`, `<cluster>` with your real Atlas values.

---

**`ModuleNotFoundError: No module named 'fastapi'`**
→ Virtual environment is not activated or dependencies not installed.
```bash
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt

# Windows
.venv\Scripts\activate
pip install -r requirements.txt
```

---

**`ValueError: password cannot be longer than 72 bytes`**
→ Old `passlib` is installed. The project uses `bcrypt` directly.
```bash
pip install -r requirements.txt --force-reinstall
```

---

**`python3: command not found`** (Windows)
→ On Windows use `python` instead of `python3`.  
→ If neither works, Python is not in PATH — reinstall from [python.org](https://python.org) and check **"Add Python to PATH"**.

---

**PowerShell execution policy error** (Windows)
```
.venv\Scripts\activate cannot be loaded because running scripts is disabled
```
→ Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Auth Errors

**`Invalid or expired token`**
→ JWT has expired (24h) or `JWT_SECRET` changed between restarts.  
→ Log out and log back in.

---

**`Email already registered`**
→ Use a different email or log in with the existing account.

---

**`Invalid admin registration code`**
→ Enter the correct `HMS_ADMIN_CODE` from your `.env` file (default: `HMS_ADMIN_2024`).

---

**`Current password is incorrect`**
→ You entered the wrong existing password on the Change Password form.

---

### Appointment Errors

**`This time slot is already booked for this doctor`**
→ That doctor already has an appointment at that exact date and time.  
→ Choose a different time slot.

---

**`Doctor or patient not found`**
→ The selected user ID no longer exists in the database.  
→ Refresh the page and try again.

---

### Bed Errors

**`Bed is already occupied`**
→ The bed already has a patient admitted.  
→ Discharge the current patient first, then admit a new one.

---

**`Bed G-101 already exists in General Ward A`**
→ Duplicate bed number in the same ward.  
→ Use a unique bed number.

---

### Frontend Errors

**`Failed to fetch` in browser**
→ The backend is not running.
```bash
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn main:app --reload
```

---

**CORS error in browser console**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5500' has been blocked by CORS policy
```
→ You're opening the frontend from the wrong origin.  
→ Always serve via:
```bash
cd frontend && python3 -m http.server 5500
```
→ Then open `http://localhost:5500` — not `http://0.0.0.0:5500` or `file://`.

---

**`No doctors registered yet`** (when booking appointment)
→ Register at least one Doctor account first, then book appointments as a Patient.

---

### Port Errors

**`Address already in use` — port 8000 or 5500**

Linux/macOS:
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:5500 | xargs kill -9
```

Windows:
```bat
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

Or use a different port:
```bash
uvicorn main:app --reload --port 8001
```

---

## Diagnostic Commands

### Test MongoDB connection
```bash
cd backend && source .venv/bin/activate
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

### Check what collections exist
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

### Test all imports
```bash
python -c "import fastapi, motor, bcrypt, jose; print('All imports OK')"
```

### View interactive API docs (Swagger UI)
```
http://localhost:8000/docs
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

---

## Still stuck?

1. Check the FastAPI logs in Terminal 1 — errors print there in real time
2. Open browser DevTools (F12) → Console tab for frontend errors
3. Open browser DevTools → Network tab to see exact API request/response
4. Visit `http://localhost:8000/docs` to test API endpoints directly
