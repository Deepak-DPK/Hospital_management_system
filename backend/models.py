import re
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field, field_validator

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

_cfg = {"populate_by_name": True, "arbitrary_types_allowed": True}

# ── Auth ──────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "patient"
    specialization: str = ""
    phone: str = ""
    admin_code: str = ""   # required when role == "admin"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def valid_email(cls, v):
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ("patient", "doctor", "admin"):
            return "patient"
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


# ── Appointment ───────────────────────────────────────────────
class AppointmentCreate(BaseModel):
    doctor_id: str
    patient_id: str
    appointment_date: str
    appointment_time: str
    reason: str = ""
    notes: str = ""


class Appointment(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    doctor_id: str
    doctor_name: str
    patient_id: str
    patient_name: str
    appointment_date: str
    appointment_time: str
    reason: str = ""
    notes: str = ""
    status: str = "scheduled"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = _cfg


# ── Medical Record ────────────────────────────────────────────
class MedicalRecordCreate(BaseModel):
    patient_id: str
    appointment_id: str = ""
    diagnosis: str
    symptoms: str = ""
    notes: str = ""
    doctor_id: str
    doctor_name: str


class MedicalRecord(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    patient_id: str
    patient_name: str = ""
    appointment_id: str = ""
    diagnosis: str
    symptoms: str = ""
    notes: str = ""
    doctor_id: str
    doctor_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = _cfg


# ── Prescription ──────────────────────────────────────────────
class PrescriptionItem(BaseModel):
    medicine: str
    dosage: str
    frequency: str
    duration: str


class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: str = ""
    doctor_id: str
    items: List[PrescriptionItem]
    instructions: str = ""


class Prescription(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    patient_id: str
    patient_name: str = ""
    appointment_id: str = ""
    doctor_id: str
    doctor_name: str = ""
    items: List[PrescriptionItem]
    instructions: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = _cfg


# ── Bed / Ward ────────────────────────────────────────────────
class BedCreate(BaseModel):
    ward: str
    bed_number: str
    bed_type: str = "general"


class Bed(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    ward: str
    bed_number: str
    bed_type: str = "general"
    status: str = "available"
    patient_id: str = ""
    patient_name: str = ""
    admitted_at: datetime | None = None
    model_config = _cfg


class BedAdmit(BaseModel):
    patient_id: str
    patient_name: str


# ── Billing ───────────────────────────────────────────────────
class BillItem(BaseModel):
    description: str
    amount: float


class BillCreate(BaseModel):
    patient_id: str
    patient_name: str
    appointment_id: str = ""
    items: List[BillItem]


class Bill(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    bill_number: str
    patient_id: str
    patient_name: str
    appointment_id: str = ""
    items: List[BillItem]
    subtotal: float
    tax: float
    total: float
    status: str = "unpaid"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = _cfg
