# 🔄 HMS — User Workflows (End-to-End Pipelines)

---

## Table of Contents

- [Admin Workflow](#admin-workflow)
- [Doctor Workflow](#doctor-workflow)
- [Patient Workflow](#patient-workflow)
- [Cross-Role: Full Patient Journey](#cross-role-full-patient-journey)

---

## Admin Workflow

The Admin has full access to everything. Typical end-to-end flow:

```
Register (with HMS_ADMIN_CODE)
        │
        ▼
   Dashboard
   ┌─────────────────────────────────────────┐
   │  Live stats: patients, doctors, beds,   │
   │  today's appointments, unpaid bills     │
   └─────────────────────────────────────────┘
        │
        ├──► Doctors page
        │    └─ View all registered doctors & specializations
        │
        ├──► Patients page
        │    ├─ Search patients by name / email / phone
        │    ├─ View full history (records + prescriptions + bills)
        │    ├─ Add medical record
        │    ├─ Issue prescription
        │    └─ Create bill → opens printable invoice
        │
        ├──► All Appointments
        │    ├─ Filter by status / search by name
        │    ├─ Mark as completed
        │    └─ Cancel appointment
        │
        ├──► Beds & Wards
        │    ├─ Add new bed (ward name, bed number, type)
        │    ├─ Admit patient to available bed
        │    ├─ Discharge patient
        │    ├─ Set bed to maintenance
        │    └─ Delete bed
        │
        ├──► Billing
        │    ├─ Select patient → view their bills
        │    ├─ Create itemized bill → auto-opens invoice
        │    └─ Mark unpaid bills as paid
        │
        └──► My Profile
             ├─ Update name / phone
             └─ Change password
```

---

## Doctor Workflow

Doctors manage their patients day-to-day.

```
Register (no code needed, enter specialization)
        │
        ▼
   Dashboard
   ┌─────────────────────────────────────────┐
   │  Today's scheduled appointments         │
   │  Total completed appointments           │
   │  Quick link to Patients                 │
   └─────────────────────────────────────────┘
        │
        ├──► Appointments
        │    ├─ View all own appointments
        │    ├─ Filter by status / search
        │    ├─ Mark appointment as ✓ Completed
        │    └─ Cancel appointment (with confirmation)
        │
        ├──► Patients
        │    ├─ Search patients
        │    ├─ 📋 View full history
        │    │    ├─ Medical records
        │    │    ├─ Prescriptions
        │    │    └─ Bills
        │    ├─ 📝 Add medical record
        │    │    └─ Diagnosis, symptoms, clinical notes
        │    ├─ 💊 Issue prescription
        │    │    ├─ Add multiple medicines
        │    │    ├─ Dosage, frequency, duration per medicine
        │    │    └─ Special instructions
        │    └─ 🧾 Create bill
        │         └─ Itemized charges → printable invoice
        │
        ├──► Add Records (direct)
        │    └─ Select patient → add diagnosis + notes
        │
        ├──► Prescriptions (direct)
        │    └─ Select patient → issue prescription
        │
        ├──► Beds / Wards
        │    ├─ View all beds and occupancy
        │    ├─ Admit patient to available bed
        │    └─ Discharge patient from occupied bed
        │
        ├──► Billing
        │    ├─ Select patient → view bills
        │    └─ Create new bill
        │
        └──► My Profile
             ├─ Update name / phone / specialization
             └─ Change password
```

---

## Patient Workflow

Patients manage their own health journey.

```
Register (no code needed)
        │
        ▼
   Dashboard
   ┌─────────────────────────────────────────┐
   │  Good morning/afternoon/evening, Name   │
   │  Upcoming appointments count            │
   │  Unpaid bills count                     │
   │  Quick links to all sections            │
   └─────────────────────────────────────────┘
        │
        ├──► My Appointments
        │    ├─ View all appointments (upcoming + past)
        │    ├─ Filter by status / search
        │    └─ Book new appointment
        │         ├─ Select doctor (with specialization shown)
        │         ├─ Pick date (today or future only)
        │         ├─ Pick time slot
        │         └─ Enter reason for visit
        │              └─ Conflict check: slot already booked → error shown
        │
        ├──► Medical Records
        │    └─ View all records added by doctors
        │         ├─ Diagnosis
        │         ├─ Symptoms
        │         ├─ Clinical notes
        │         └─ Doctor name + date
        │
        ├──► Prescriptions
        │    └─ View all prescriptions issued to you
        │         ├─ Medicine name, dosage, frequency, duration
        │         ├─ Special instructions
        │         └─ Issuing doctor + date
        │
        ├──► My Bills
        │    ├─ View all bills (paid and unpaid)
        │    └─ Click "View" → opens printable invoice
        │         ├─ Bill number, date, status
        │         ├─ Itemized charges
        │         ├─ Subtotal + GST (5%) + Total
        │         └─ Print / Save as PDF button
        │
        └──► My Profile
             ├─ Update name / phone
             └─ Change password
```

---

## Cross-Role: Full Patient Journey

This shows how all three roles interact for a complete patient visit from start to finish.

```
STEP 1 — Patient books appointment
─────────────────────────────────
Patient → My Appointments → Book Appointment
  Select: Dr. Smith (Cardiology)
  Date: 2025-05-10 | Time: 10:00
  Reason: Chest pain
  → Appointment created (status: scheduled)


STEP 2 — Doctor sees today's schedule
──────────────────────────────────────
Doctor → Dashboard
  → "Today's Schedule" shows the appointment
  → Sees: Patient Name, Time, Reason


STEP 3 — Doctor completes the appointment
──────────────────────────────────────────
Doctor → Appointments → ✓ Complete
  → Status changes to: completed


STEP 4 — Doctor adds medical record
────────────────────────────────────
Doctor → Patients → [Patient Name] → 📝 Record
  Diagnosis: Hypertension
  Symptoms: Chest pain, dizziness
  Notes: BP 160/100, prescribed medication
  → Record saved


STEP 5 — Doctor issues prescription
────────────────────────────────────
Doctor → Patients → [Patient Name] → 💊 Prescribe
  Medicine 1: Amlodipine 5mg — Once daily — 30 days
  Medicine 2: Aspirin 75mg — Once daily — 30 days
  Instructions: Take after meals
  → Prescription saved


STEP 6 — Doctor admits patient to bed (if needed)
──────────────────────────────────────────────────
Doctor → Beds / Wards → [Available Bed] → Admit
  Select patient → Admit
  → Bed status: occupied


STEP 7 — Doctor creates bill
─────────────────────────────
Doctor → Patients → [Patient Name] → 🧾 Bill
  Consultation fee: ₹500
  ECG: ₹300
  Medicines: ₹450
  → Bill created (status: unpaid)
  → Invoice opens automatically in new tab


STEP 8 — Patient views invoice
────────────────────────────────
Patient → My Bills → View
  → Printable invoice with:
     Bill No: HMS-XXXXXXXX
     Itemized charges
     GST (5%)
     Total amount
  → Print / Save as PDF


STEP 9 — Admin marks bill as paid
───────────────────────────────────
Admin → Billing → [Patient Name] → ✓ Mark Paid
  → Bill status: paid
  → Invoice now shows "paid" badge


STEP 10 — Doctor discharges patient
─────────────────────────────────────
Doctor → Beds / Wards → [Occupied Bed] → Discharge
  → Bed status: available
```

---

> For setup instructions see [INSTALL.md](./INSTALL.md)  
> For error fixes see [ERRORS.md](./ERRORS.md)
