# 🏥 HMS — Hospital Management System

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

A full-stack **Hospital Management System** that streamlines patient care, doctor workflows, and hospital administration in one platform. Built with FastAPI, MongoDB Atlas, and plain Vanilla JS — no frontend framework, no build step.

The system supports three distinct roles — **Patient**, **Doctor**, and **Admin** — each with their own dashboard, permissions, and workflow. Everything from booking appointments to generating printable invoices is handled end-to-end.

---

## What it does

**Patients** can register, book appointments with doctors, view their medical records and prescriptions, check bills, and download printable invoices.

**Doctors** manage their daily schedule, add medical records and prescriptions for patients, admit/discharge patients to beds, and generate bills.

**Admins** get a live stats dashboard and full control over all data — appointments, patients, doctors, beds, billing, and user management.

---

## Features

### 🧑‍⚕️ Patient
> `Book appointments` · `View medical records` · `View prescriptions` · `Pay & download bills` · `Profile management`

### 👨‍⚕️ Doctor
> `Manage daily schedule` · `Add medical records` · `Issue prescriptions` · `Admit & discharge patients` · `Create bills` · `Bed management`

### 🛡️ Admin
> `Live stats dashboard` · `Full appointment control` · `Manage all patients & doctors` · `Bed & ward CRUD` · `Mark bills paid` · `All doctor & patient actions`

---

### Core Capabilities

```
📅  Appointments     Smart booking with doctor conflict detection
📋  Medical Records  Full diagnosis history per patient
💊  Prescriptions    Multi-medicine prescriptions with instructions
🛏️  Bed Management   Ward-level admit / discharge / maintenance
🧾  Billing          Itemized bills + GST + printable PDF invoice
🔐  RBAC Auth        JWT-based, 3 roles, bcrypt passwords
🔍  Search           Live patient search, appointment filter by status
👤  Profiles         Update info, change password for all roles
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI 0.115, Uvicorn |
| Database | MongoDB Atlas via Motor 3.x (async) |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic V2 |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript |

---

## Project Structure

```
hms/
├── backend/
│   ├── main.py            # All API routes
│   ├── models.py          # Pydantic models & validators
│   ├── auth.py            # JWT auth & role guards
│   ├── database.py        # Motor async client
│   ├── requirements.txt   # Pinned dependencies
│   └── .env.example       # Environment variable template
├── frontend/
│   ├── index.html         # SPA dashboard shell
│   ├── login.html         # Login & Register
│   ├── bill.html          # Printable invoice
│   ├── app.js             # All frontend logic
│   └── style.css          # Responsive white/blue theme
├── setup.sh               # One-command setup — Linux/macOS
├── setup.bat              # One-command setup — Windows
├── INSTALL.md             # Full installation & deployment guide
├── ERRORS.md              # Error reference & troubleshooting
├── WORKFLOWS.md           # End-to-end user workflow diagrams
├── .gitignore
└── README.md
```

---

## Quick Start

```bash
# Linux / macOS
bash setup.sh

# Windows
setup.bat
```

Then edit `backend/.env` with your MongoDB URI and secrets, and run:

```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend && python3 -m http.server 5500
```

Open `http://localhost:5500/login.html` in your browser.

---

## Roles

| Role | Registration | Access |
|---|---|---|
| Patient | Open — no code | Appointments, records, prescriptions, bills |
| Doctor | Open — enter specialization | Patient management, records, prescriptions, beds, billing |
| Admin | Requires `HMS_ADMIN_CODE` | Full access + live stats dashboard |

---

## API

Base URL: `http://localhost:8000`  
Interactive docs (Swagger UI): `http://localhost:8000/docs`

All protected routes require: `Authorization: Bearer <token>`

| Group | Key Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `PUT /auth/profile` · `PUT /auth/password` |
| Users | `GET /doctors` · `GET /patients?search=&skip=&limit=` |
| Appointments | `POST /appointments` · `GET /appointments` · `PUT /appointments/{id}/status` · `DELETE /appointments/{id}` |
| Records | `POST /records` · `GET /records/{patient_id}` · `DELETE /records/{id}` |
| Prescriptions | `POST /prescriptions` · `GET /prescriptions/{patient_id}` · `DELETE /prescriptions/{id}` |
| Beds | `GET /beds` · `POST /beds` · `PUT /beds/{id}/admit` · `PUT /beds/{id}/discharge` · `DELETE /beds/{id}` |
| Billing | `POST /bills` · `GET /bills/{patient_id}` · `GET /bill/{id}` · `PUT /bills/{id}/pay` |
| Stats | `GET /stats` (admin only) |

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- Admin registration protected by a secret code
- All role checks enforced server-side
- `backend/.env` is gitignored — never committed

---

## Documentation

| File | Contents |
|---|---|
| [INSTALL.md](./INSTALL.md) | Full setup, environment variables, MongoDB config, deployment to Render + Vercel |
| [WORKFLOWS.md](./WORKFLOWS.md) | End-to-end pipelines for Patient, Doctor, and Admin with flow diagrams |
| [ERRORS.md](./ERRORS.md) | Every error message, HTTP status codes, diagnostic commands, and fixes |

---

## License

MIT — free to use, modify, and distribute.
