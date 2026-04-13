import os
import uuid
from datetime import datetime
from typing import Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import (ADMIN_CODE, create_token, get_current_user, hash_password,
                  require_admin, require_doctor_or_admin, verify_password)
from database import (get_appointments_collection, get_beds_collection,
                      get_bills_collection, get_prescriptions_collection,
                      get_records_collection, get_users_collection)
from models import (Appointment, AppointmentCreate, Bed, BedAdmit, BedCreate,
                    Bill, BillCreate, MedicalRecord, MedicalRecordCreate,
                    PasswordChange, Prescription, PrescriptionCreate,
                    UserLogin, UserProfileUpdate, UserRegister)

load_dotenv()
app = FastAPI(title="HMS — Hospital Management System")

_origins = ["http://localhost:5500", "http://127.0.0.1:5500"]
_v = os.getenv("VERCEL_URL")
if _v:
    _origins.append(_v)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def oid(s: str):
    if not ObjectId.is_valid(s):
        raise HTTPException(400, "Invalid ID")
    return ObjectId(s)


# ── Auth ──────────────────────────────────────────────────────

@app.post("/auth/register", status_code=201)
async def register(body: UserRegister):
    # Protect admin registration with a secret code
    if body.role == "admin" and body.admin_code != ADMIN_CODE:
        raise HTTPException(403, "Invalid admin registration code")

    col = await get_users_collection()
    if await col.find_one({"email": body.email}):
        raise HTTPException(409, "Email already registered")

    doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "role": body.role,
        "specialization": body.specialization,
        "phone": body.phone,
        "created_at": datetime.utcnow(),
    }
    r = await col.insert_one(doc)
    token = create_token({"sub": str(r.inserted_id), "email": body.email,
                          "role": body.role, "name": body.name})
    return {"token": token, "role": body.role, "name": body.name, "id": str(r.inserted_id)}


@app.post("/auth/login")
async def login(body: UserLogin):
    col = await get_users_collection()
    u = await col.find_one({"email": body.email.lower().strip()})
    if not u or not verify_password(body.password, u["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token({"sub": str(u["_id"]), "email": u["email"],
                          "role": u["role"], "name": u["name"]})
    return {"token": token, "role": u["role"], "name": u["name"], "id": str(u["_id"])}


@app.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    col = await get_users_collection()
    u = await col.find_one({"_id": ObjectId(user["sub"])})
    if not u:
        raise HTTPException(404, "User not found")
    return {"id": str(u["_id"]), "name": u["name"], "email": u["email"],
            "role": u["role"], "specialization": u.get("specialization", ""),
            "phone": u.get("phone", ""), "created_at": u.get("created_at", "")}


@app.put("/auth/profile")
async def update_profile(body: UserProfileUpdate, user: dict = Depends(get_current_user)):
    col = await get_users_collection()
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(400, "Nothing to update")
    await col.update_one({"_id": ObjectId(user["sub"])}, {"$set": patch})
    # Return fresh token with updated name
    u = await col.find_one({"_id": ObjectId(user["sub"])})
    token = create_token({"sub": user["sub"], "email": u["email"],
                          "role": u["role"], "name": u["name"]})
    return {"ok": True, "token": token, "name": u["name"]}


@app.put("/auth/password")
async def change_password(body: PasswordChange, user: dict = Depends(get_current_user)):
    col = await get_users_collection()
    u = await col.find_one({"_id": ObjectId(user["sub"])})
    if not verify_password(body.current_password, u["password"]):
        raise HTTPException(400, "Current password is incorrect")
    await col.update_one({"_id": ObjectId(user["sub"])},
                         {"$set": {"password": hash_password(body.new_password)}})
    return {"ok": True}


# ── Users ─────────────────────────────────────────────────────

@app.get("/doctors")
async def get_doctors(search: Optional[str] = Query(None)):
    col = await get_users_collection()
    query: dict = {"role": "doctor"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"specialization": {"$regex": search, "$options": "i"}},
        ]
    docs = await col.find(query).to_list(None)
    return [{"id": str(d["_id"]), "name": d["name"],
             "specialization": d.get("specialization", ""),
             "email": d["email"], "phone": d.get("phone", "")} for d in docs]


@app.get("/patients")
async def get_patients(user: dict = Depends(get_current_user),
                       search: Optional[str] = Query(None),
                       skip: int = Query(0, ge=0),
                       limit: int = Query(50, ge=1, le=200)):
    if user["role"] not in ("doctor", "admin"):
        raise HTTPException(403, "Access denied")
    col = await get_users_collection()
    query: dict = {"role": "patient"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    total = await col.count_documents(query)
    docs = await col.find(query).skip(skip).limit(limit).to_list(None)
    return {
        "total": total,
        "patients": [{"id": str(d["_id"]), "name": d["name"],
                      "email": d["email"], "phone": d.get("phone", "")} for d in docs]
    }


# ── Appointments ──────────────────────────────────────────────

@app.post("/appointments", response_model=Appointment, response_model_by_alias=True, status_code=201)
async def create_appointment(body: AppointmentCreate, user: dict = Depends(get_current_user)):
    ucol = await get_users_collection()
    doctor = await ucol.find_one({"_id": oid(body.doctor_id)})
    patient = await ucol.find_one({"_id": oid(body.patient_id)})
    if not doctor or not patient:
        raise HTTPException(404, "Doctor or patient not found")
    col = await get_appointments_collection()
    clash = await col.find_one({
        "doctor_id": body.doctor_id,
        "appointment_date": body.appointment_date,
        "appointment_time": body.appointment_time,
        "status": {"$ne": "cancelled"},
    })
    if clash:
        raise HTTPException(409, "This time slot is already booked for this doctor")
    doc = {
        "doctor_id": body.doctor_id, "doctor_name": doctor["name"],
        "patient_id": body.patient_id, "patient_name": patient["name"],
        "appointment_date": body.appointment_date,
        "appointment_time": body.appointment_time,
        "reason": body.reason, "notes": body.notes,
        "status": "scheduled", "created_at": datetime.utcnow(),
    }
    r = await col.insert_one(doc)
    created = await col.find_one({"_id": r.inserted_id})
    return Appointment(**created)


@app.get("/appointments", response_model=list[Appointment], response_model_by_alias=True)
async def get_appointments(user: dict = Depends(get_current_user),
                           date: Optional[str] = Query(None),
                           status: Optional[str] = Query(None)):
    col = await get_appointments_collection()
    query: dict = {}
    if user["role"] == "doctor":
        query["doctor_id"] = user["sub"]
    elif user["role"] == "patient":
        query["patient_id"] = user["sub"]
    if date:
        query["appointment_date"] = date
    if status:
        query["status"] = status
    docs = await col.find(query).sort([("appointment_date", -1), ("appointment_time", 1)]).to_list(None)
    return [Appointment(**d) for d in docs]


@app.put("/appointments/{appt_id}/status")
async def update_appointment_status(appt_id: str, body: dict,
                                    user: dict = Depends(get_current_user)):
    status = body.get("status")
    if status not in ("scheduled", "completed", "cancelled"):
        raise HTTPException(400, "Invalid status")
    col = await get_appointments_collection()
    result = await col.update_one({"_id": oid(appt_id)}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(404, "Appointment not found")
    return {"ok": True}


@app.delete("/appointments/{appt_id}", status_code=204)
async def delete_appointment(appt_id: str, _=Depends(require_admin)):
    col = await get_appointments_collection()
    await col.delete_one({"_id": oid(appt_id)})


# ── Medical Records ───────────────────────────────────────────

@app.post("/records", response_model=MedicalRecord, response_model_by_alias=True, status_code=201)
async def create_record(body: MedicalRecordCreate, user: dict = Depends(require_doctor_or_admin)):
    ucol = await get_users_collection()
    patient = await ucol.find_one({"_id": oid(body.patient_id)})
    doc = {**body.model_dump(),
           "patient_name": patient["name"] if patient else "",
           "created_at": datetime.utcnow()}
    col = await get_records_collection()
    r = await col.insert_one(doc)
    created = await col.find_one({"_id": r.inserted_id})
    return MedicalRecord(**created)


@app.get("/records/{patient_id}", response_model=list[MedicalRecord], response_model_by_alias=True)
async def get_records(patient_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "patient" and user["sub"] != patient_id:
        raise HTTPException(403, "Access denied")
    col = await get_records_collection()
    docs = await col.find({"patient_id": patient_id}).sort("created_at", -1).to_list(None)
    return [MedicalRecord(**d) for d in docs]


@app.delete("/records/{record_id}", status_code=204)
async def delete_record(record_id: str, _=Depends(require_doctor_or_admin)):
    col = await get_records_collection()
    await col.delete_one({"_id": oid(record_id)})


# ── Prescriptions ─────────────────────────────────────────────

@app.post("/prescriptions", response_model=Prescription, response_model_by_alias=True, status_code=201)
async def create_prescription(body: PrescriptionCreate, user: dict = Depends(require_doctor_or_admin)):
    ucol = await get_users_collection()
    patient = await ucol.find_one({"_id": oid(body.patient_id)})
    doc = {**body.model_dump(),
           "patient_name": patient["name"] if patient else "",
           "doctor_name": user["name"],
           "created_at": datetime.utcnow()}
    col = await get_prescriptions_collection()
    r = await col.insert_one(doc)
    created = await col.find_one({"_id": r.inserted_id})
    return Prescription(**created)


@app.get("/prescriptions/{patient_id}", response_model=list[Prescription], response_model_by_alias=True)
async def get_prescriptions(patient_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "patient" and user["sub"] != patient_id:
        raise HTTPException(403, "Access denied")
    col = await get_prescriptions_collection()
    docs = await col.find({"patient_id": patient_id}).sort("created_at", -1).to_list(None)
    return [Prescription(**d) for d in docs]


@app.delete("/prescriptions/{presc_id}", status_code=204)
async def delete_prescription(presc_id: str, _=Depends(require_doctor_or_admin)):
    col = await get_prescriptions_collection()
    await col.delete_one({"_id": oid(presc_id)})


# ── Beds / Wards ──────────────────────────────────────────────

@app.get("/beds", response_model=list[Bed], response_model_by_alias=True)
async def get_beds(user: dict = Depends(get_current_user)):
    col = await get_beds_collection()
    docs = await col.find().sort("ward", 1).to_list(None)
    return [Bed(**d) for d in docs]


@app.post("/beds", response_model=Bed, response_model_by_alias=True, status_code=201)
async def create_bed(body: BedCreate, _=Depends(require_admin)):
    col = await get_beds_collection()
    # Check duplicate bed number in same ward
    if await col.find_one({"ward": body.ward, "bed_number": body.bed_number}):
        raise HTTPException(409, f"Bed {body.bed_number} already exists in {body.ward}")
    doc = {**body.model_dump(), "status": "available",
           "patient_id": "", "patient_name": "", "admitted_at": None}
    r = await col.insert_one(doc)
    created = await col.find_one({"_id": r.inserted_id})
    return Bed(**created)


@app.put("/beds/{bed_id}/admit")
async def admit_patient(bed_id: str, body: BedAdmit, user: dict = Depends(require_doctor_or_admin)):
    col = await get_beds_collection()
    bed = await col.find_one({"_id": oid(bed_id)})
    if not bed:
        raise HTTPException(404, "Bed not found")
    if bed["status"] == "occupied":
        raise HTTPException(409, "Bed is already occupied")
    await col.update_one({"_id": oid(bed_id)}, {"$set": {
        "status": "occupied", "patient_id": body.patient_id,
        "patient_name": body.patient_name, "admitted_at": datetime.utcnow(),
    }})
    return {"ok": True}


@app.put("/beds/{bed_id}/discharge")
async def discharge_patient(bed_id: str, user: dict = Depends(require_doctor_or_admin)):
    col = await get_beds_collection()
    await col.update_one({"_id": oid(bed_id)}, {"$set": {
        "status": "available", "patient_id": "",
        "patient_name": "", "admitted_at": None,
    }})
    return {"ok": True}


@app.put("/beds/{bed_id}/maintenance")
async def set_maintenance(bed_id: str, _=Depends(require_admin)):
    col = await get_beds_collection()
    await col.update_one({"_id": oid(bed_id)}, {"$set": {"status": "maintenance"}})
    return {"ok": True}


@app.delete("/beds/{bed_id}", status_code=204)
async def delete_bed(bed_id: str, _=Depends(require_admin)):
    col = await get_beds_collection()
    await col.delete_one({"_id": oid(bed_id)})


# ── Billing ───────────────────────────────────────────────────

@app.post("/bills", response_model=Bill, response_model_by_alias=True, status_code=201)
async def create_bill(body: BillCreate, user: dict = Depends(require_doctor_or_admin)):
    subtotal = sum(i.amount for i in body.items)
    tax = round(subtotal * 0.05, 2)
    doc = {
        "bill_number": "HMS-" + uuid.uuid4().hex[:8].upper(),
        **body.model_dump(),
        "subtotal": round(subtotal, 2), "tax": tax,
        "total": round(subtotal + tax, 2),
        "status": "unpaid", "created_at": datetime.utcnow(),
    }
    col = await get_bills_collection()
    r = await col.insert_one(doc)
    created = await col.find_one({"_id": r.inserted_id})
    return Bill(**created)


@app.get("/bills/{patient_id}", response_model=list[Bill], response_model_by_alias=True)
async def get_bills(patient_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "patient" and user["sub"] != patient_id:
        raise HTTPException(403, "Access denied")
    col = await get_bills_collection()
    docs = await col.find({"patient_id": patient_id}).sort("created_at", -1).to_list(None)
    return [Bill(**d) for d in docs]


@app.get("/bill/{bill_id}", response_model=Bill, response_model_by_alias=True)
async def get_bill(bill_id: str, user: dict = Depends(get_current_user)):
    col = await get_bills_collection()
    doc = await col.find_one({"_id": oid(bill_id)})
    if not doc:
        raise HTTPException(404, "Bill not found")
    if user["role"] == "patient" and doc.get("patient_id") != user["sub"]:
        raise HTTPException(403, "Access denied")
    return Bill(**doc)


@app.put("/bills/{bill_id}/pay")
async def pay_bill(bill_id: str, _=Depends(require_admin)):
    col = await get_bills_collection()
    result = await col.update_one({"_id": oid(bill_id)}, {"$set": {"status": "paid"}})
    if result.matched_count == 0:
        raise HTTPException(404, "Bill not found")
    return {"ok": True}


# ── Dashboard stats ───────────────────────────────────────────

@app.get("/stats")
async def get_stats(_=Depends(require_admin)):
    ucol = await get_users_collection()
    acol = await get_appointments_collection()
    bcol = await get_beds_collection()
    bilcol = await get_bills_collection()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return {
        "patients": await ucol.count_documents({"role": "patient"}),
        "doctors": await ucol.count_documents({"role": "doctor"}),
        "appointments_today": await acol.count_documents({"appointment_date": today, "status": "scheduled"}),
        "appointments_total": await acol.count_documents({}),
        "beds_available": await bcol.count_documents({"status": "available"}),
        "beds_occupied": await bcol.count_documents({"status": "occupied"}),
        "beds_total": await bcol.count_documents({}),
        "unpaid_bills": await bilcol.count_documents({"status": "unpaid"}),
        "paid_bills": await bilcol.count_documents({"status": "paid"}),
    }
