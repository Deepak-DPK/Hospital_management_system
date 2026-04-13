
/* ============================================================
   HMS — App Logic
   ============================================================ */
const API = 'http://localhost:8000';
const tok   = () => localStorage.getItem('hms_token');
const role  = () => localStorage.getItem('hms_role');
const uid   = () => localStorage.getItem('hms_id');
const uname = () => localStorage.getItem('hms_name');

function logout() {
  ['hms_token','hms_role','hms_name','hms_id'].forEach(k => localStorage.removeItem(k));
  location.href = 'login.html';
}
function ah() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok()}` };
}

// ── Toast notifications ────────────────────────────────────
function toast(msg, type = 'success') {
  const existing = document.getElementById('hms-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'hms-toast';
  el.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    background:${type==='success'?'#16a34a':type==='error'?'#ef4444':'#2563eb'};
    color:#fff;padding:0.75rem 1.25rem;border-radius:9px;
    font-size:0.875rem;font-weight:600;
    box-shadow:0 4px 16px rgba(0,0,0,0.15);
    display:flex;align-items:center;gap:0.5rem;
    animation:slideIn 0.25s ease;max-width:360px;
  `;
  el.innerHTML = `<span>${type==='success'?'✓':type==='error'?'⚠':'ℹ'}</span><span>${esc(msg)}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Add toast animation to page
const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
document.head.appendChild(toastStyle);

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function statusBadge(s) {
  const map = {
    scheduled:'badge--blue', completed:'badge--green', cancelled:'badge--red',
    available:'badge--green', occupied:'badge--red', maintenance:'badge--yellow',
    paid:'badge--green', unpaid:'badge--yellow',
  };
  return `<span class="badge ${map[s]||'badge--gray'}">${esc(s)}</span>`;
}

// ── Sidebar mobile ─────────────────────────────────────────
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  s.classList.toggle('open');
  o.classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;

// ── Modal ──────────────────────────────────────────────────
function openModal(html, wide) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-box').className = 'modal__box' + (wide ? ' modal__box--wide' : '');
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
window.closeModal = closeModal;

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!tok()) { location.href = 'login.html'; return; }

  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-backdrop').onclick = closeModal;

  const name = uname() || '';
  document.getElementById('sb-name').textContent = name;
  document.getElementById('sb-role').textContent = role() || '';
  document.getElementById('sb-avatar').textContent = name.charAt(0).toUpperCase() || '?';
  document.getElementById('role-badge').textContent = (role() || '').toUpperCase();
  document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  buildNav();
  loadPage('dashboard');
});

// ── Navigation ─────────────────────────────────────────────
const NAV = {
  patient: [
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'appointments',  icon:'📅', label:'My Appointments' },
    { id:'records',       icon:'📋', label:'Medical Records' },
    { id:'prescriptions', icon:'💊', label:'Prescriptions' },
    { id:'bills',         icon:'🧾', label:'My Bills' },
    { id:'profile',       icon:'👤', label:'My Profile' },
  ],
  doctor: [
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'appointments',  icon:'📅', label:'Appointments' },
    { id:'patients',      icon:'👥', label:'Patients' },
    { id:'records',       icon:'📋', label:'Add Records' },
    { id:'prescriptions', icon:'💊', label:'Prescriptions' },
    { id:'beds',          icon:'🛏️', label:'Beds / Wards' },
    { id:'billing',       icon:'🧾', label:'Billing' },
    { id:'profile',       icon:'👤', label:'My Profile' },
  ],
  admin: [
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'appointments',  icon:'📅', label:'All Appointments' },
    { id:'patients',      icon:'👥', label:'Patients' },
    { id:'doctors',       icon:'🩺', label:'Doctors' },
    { id:'records',       icon:'📋', label:'Medical Records' },
    { id:'prescriptions', icon:'💊', label:'Prescriptions' },
    { id:'beds',          icon:'🛏️', label:'Beds / Wards' },
    { id:'billing',       icon:'🧾', label:'Billing' },
    { id:'profile',       icon:'👤', label:'My Profile' },
  ],
};

function buildNav() {
  const items = NAV[role()] || NAV.patient;
  document.getElementById('sidebar-nav').innerHTML =
    `<div class="nav-section-label">Menu</div>` +
    items.map(n =>
      `<a class="nav-item" data-page="${n.id}" href="#" onclick="event.preventDefault();loadPage('${n.id}');closeSidebar()">
        <span class="icon">${n.icon}</span>${n.label}
      </a>`
    ).join('');
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );
}

// ── Router ─────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'Dashboard', appointments:'Appointments', patients:'Patients',
  doctors:'Doctors', records:'Medical Records', prescriptions:'Prescriptions',
  beds:'Beds & Wards', billing:'Billing', bills:'My Bills', profile:'My Profile',
};

async function loadPage(page) {
  setActiveNav(page);
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  const body = document.getElementById('page-body');
  body.innerHTML = `<div style="padding:3rem 0;text-align:center;color:var(--muted2)">
    <div style="font-size:1.5rem;margin-bottom:0.5rem">⏳</div>Loading…</div>`;
  try {
    switch (page) {
      case 'dashboard':     await pageDashboard(body);     break;
      case 'appointments':  await pageAppointments(body);  break;
      case 'patients':      await pagePatients(body);      break;
      case 'doctors':       await pageDoctors(body);       break;
      case 'records':       await pageRecords(body);       break;
      case 'prescriptions': await pagePrescriptions(body); break;
      case 'beds':          await pageBeds(body);          break;
      case 'billing':
      case 'bills':         await pageBilling(body);       break;
      case 'profile':       await pageProfile(body);       break;
      default: body.innerHTML = '<p class="empty-state">Page not found.</p>';
    }
  } catch (err) {
    body.innerHTML = `<div class="card"><div class="card__body"><p class="error">⚠ ${esc(err.message)}</p></div></div>`;
  }
}
window.loadPage = loadPage;
window.logout = logout;

// ── Dashboard ──────────────────────────────────────────────
async function pageDashboard(body) {
  if (role() === 'admin') {
    const res = await fetch(`${API}/stats`, { headers: ah() });
    const s = await res.json();
    body.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">👥</div></div>
          <div class="stat-card__value">${s.patients}</div>
          <div class="stat-card__label">Total Patients</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--green">🩺</div></div>
          <div class="stat-card__value">${s.doctors}</div>
          <div class="stat-card__label">Doctors</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">📅</div></div>
          <div class="stat-card__value">${s.appointments_today}</div>
          <div class="stat-card__label">Today's Appointments</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--green">🛏️</div></div>
          <div class="stat-card__value">${s.beds_available}</div>
          <div class="stat-card__label">Beds Available</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--red">🔴</div></div>
          <div class="stat-card__value">${s.beds_occupied}</div>
          <div class="stat-card__label">Beds Occupied</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--yellow">🧾</div></div>
          <div class="stat-card__value">${s.unpaid_bills}</div>
          <div class="stat-card__label">Unpaid Bills</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card" style="cursor:pointer" onclick="loadPage('appointments')">
          <div class="card__header"><span class="card__title">📅 Recent Appointments</span><span class="badge badge--blue">View all →</span></div>
          <div class="card__body"><p class="text-muted">Click to manage all appointments</p></div>
        </div>
        <div class="card" style="cursor:pointer" onclick="loadPage('billing')">
          <div class="card__header"><span class="card__title">🧾 Billing Overview</span><span class="badge badge--yellow">${s.unpaid_bills} unpaid</span></div>
          <div class="card__body"><p class="text-muted">Click to manage patient bills</p></div>
        </div>
      </div>`;
  } else if (role() === 'doctor') {
    const res = await fetch(`${API}/appointments`, { headers: ah() });
    const appts = await res.json();
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appts.filter(a => a.appointment_date === today && a.status === 'scheduled');
    body.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card stat-card--clickable" onclick="loadPage('appointments')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">📅</div></div>
          <div class="stat-card__value">${todayAppts.length}</div>
          <div class="stat-card__label">Today's Appointments</div>
        </div>
        <div class="stat-card stat-card--clickable" onclick="loadPage('appointments')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--green">✅</div></div>
          <div class="stat-card__value">${appts.filter(a=>a.status==='completed').length}</div>
          <div class="stat-card__label">Completed</div>
        </div>
        <div class="stat-card stat-card--clickable" onclick="loadPage('patients')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">👥</div></div>
          <div class="stat-card__value">→</div>
          <div class="stat-card__label">My Patients</div>
        </div>
      </div>
      ${todayAppts.length ? `
      <div class="card">
        <div class="card__header"><span class="card__title">📅 Today's Schedule</span></div>
        <table class="data-table">
          <thead><tr><th>Time</th><th>Patient</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>${todayAppts.map(a=>`
            <tr>
              <td><strong>${esc(a.appointment_time)}</strong></td>
              <td>${esc(a.patient_name)}</td>
              <td>${esc(a.reason||'—')}</td>
              <td><button class="btn btn--success btn--sm" onclick="updateApptStatus('${a._id}','completed')">✓ Complete</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div class="card"><div class="card__body"><p class="empty-state">No appointments scheduled for today.</p></div></div>'}`;
  } else {
    // Patient dashboard
    const [aRes, bRes] = await Promise.all([
      fetch(`${API}/appointments`, { headers: ah() }),
      fetch(`${API}/bills/${uid()}`, { headers: ah() }),
    ]);
    const appts = await aRes.json();
    const bills = await bRes.json();
    const upcoming = appts.filter(a => a.status === 'scheduled');
    const unpaid = bills.filter(b => b.status === 'unpaid');
    body.innerHTML = `
      <div style="margin-bottom:1.25rem">
        <h2 style="font-size:1.3rem;margin-bottom:0.25rem">Good ${getGreeting()}, ${esc(uname())} 👋</h2>
        <p class="text-muted">Here's your health summary</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card stat-card--clickable" onclick="loadPage('appointments')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">📅</div></div>
          <div class="stat-card__value">${upcoming.length}</div>
          <div class="stat-card__label">Upcoming Appointments</div>
        </div>
        <div class="stat-card stat-card--clickable" onclick="loadPage('records')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--green">📋</div></div>
          <div class="stat-card__value">→</div>
          <div class="stat-card__label">Medical Records</div>
        </div>
        <div class="stat-card stat-card--clickable" onclick="loadPage('prescriptions')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">💊</div></div>
          <div class="stat-card__value">→</div>
          <div class="stat-card__label">Prescriptions</div>
        </div>
        <div class="stat-card stat-card--clickable" onclick="loadPage('bills')">
          <div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--yellow">🧾</div></div>
          <div class="stat-card__value">${unpaid.length}</div>
          <div class="stat-card__label">Unpaid Bills</div>
        </div>
      </div>
      ${upcoming.length ? `
      <div class="card">
        <div class="card__header"><span class="card__title">📅 Upcoming Appointments</span></div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>${upcoming.slice(0,5).map(a=>`
            <tr>
              <td>${esc(a.appointment_date)}</td>
              <td>${esc(a.appointment_time)}</td>
              <td>${esc(a.doctor_name)}</td>
              <td>${esc(a.reason||'—')}</td>
              <td>${statusBadge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}`;
  }
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

// ── Appointments ───────────────────────────────────────────
async function pageAppointments(body) {
  const res = await fetch(`${API}/appointments`, { headers: ah() });
  const appts = await res.json();
  const canBook = role() === 'patient' || role() === 'admin';

  // Filter state
  let filtered = [...appts];

  body.innerHTML = `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Appointments (${appts.length})</span>
        ${canBook ? `<button class="btn btn--primary btn--sm" onclick="openBookAppointment()">+ Book Appointment</button>` : ''}
      </div>
      <div class="card__body" style="padding-bottom:0">
        <div style="display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap">
          <input type="text" id="appt-search" class="form-input" placeholder="🔍 Search patient, doctor, reason…" style="flex:1;min-width:180px" oninput="filterAppts()" />
          <select id="appt-status-filter" class="form-input" style="width:160px" onchange="filterAppts()">
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div id="appts-table-wrap">
        ${renderApptsTable(appts)}
      </div>
    </div>`;

  window._allAppts = appts;
}

function renderApptsTable(appts) {
  if (!appts.length) return '<div style="padding:1.25rem"><p class="empty-state">No appointments found.</p></div>';
  return `<div style="overflow-x:auto">
    <table class="data-table">
      <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${appts.map(a=>`
        <tr>
          <td><strong>${esc(a.appointment_date)}</strong></td>
          <td>${esc(a.appointment_time)}</td>
          <td>${esc(a.patient_name)}</td>
          <td>${esc(a.doctor_name)}</td>
          <td>${esc(a.reason||'—')}</td>
          <td>${statusBadge(a.status)}</td>
          <td>
            ${a.status==='scheduled' ? `
              <div style="display:flex;gap:0.35rem">
                <button class="btn btn--success btn--sm" onclick="updateApptStatus('${a._id}','completed')">✓</button>
                <button class="btn btn--danger btn--sm" onclick="confirmCancel('${a._id}')">✕</button>
              </div>` : '—'}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}

function filterAppts() {
  const q = (document.getElementById('appt-search')?.value || '').toLowerCase();
  const s = document.getElementById('appt-status-filter')?.value || '';
  const all = window._allAppts || [];
  const filtered = all.filter(a =>
    (!q || a.patient_name.toLowerCase().includes(q) || a.doctor_name.toLowerCase().includes(q) || (a.reason||'').toLowerCase().includes(q)) &&
    (!s || a.status === s)
  );
  const wrap = document.getElementById('appts-table-wrap');
  if (wrap) wrap.innerHTML = renderApptsTable(filtered);
}
window.filterAppts = filterAppts;

function confirmCancel(id) {
  if (confirm('Cancel this appointment?')) updateApptStatus(id, 'cancelled');
}
window.confirmCancel = confirmCancel;

async function updateApptStatus(id, status) {
  await fetch(`${API}/appointments/${id}/status`, { method:'PUT', headers:ah(), body:JSON.stringify({status}) });
  toast(status === 'completed' ? 'Appointment marked as completed' : 'Appointment cancelled');
  loadPage('appointments');
}
window.updateApptStatus = updateApptStatus;

async function openBookAppointment() {
  const dRes = await fetch(`${API}/doctors`, { headers: ah() });
  const doctors = await dRes.json();
  if (!doctors.length) { alert('No doctors registered yet. Please register a doctor account first.'); return; }

  let pField = '';
  if (role() === 'admin') {
    const pRes = await fetch(`${API}/patients`, { headers: ah() });
    const patients = (await pRes.json()).patients || [];
    pField = `<label class="form-label form-full">Patient
      <select id="m-patient" class="form-input" required>
        ${patients.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
      </select></label>`;
  }

  openModal(`
    <div class="modal__title">📅 Book Appointment</div>
    <form id="appt-form">
      <div class="form-grid">
        <label class="form-label form-full">Doctor
          <select id="m-doctor" class="form-input" required>
            ${doctors.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}${d.specialization?' — '+esc(d.specialization):''}</option>`).join('')}
          </select>
        </label>
        ${pField}
        <label class="form-label">Date
          <input type="date" id="m-date" class="form-input" required min="${new Date().toISOString().split('T')[0]}" />
        </label>
        <label class="form-label">Time
          <input type="time" id="m-time" class="form-input" required />
        </label>
        <label class="form-label form-full">Reason for Visit
          <input type="text" id="m-reason" class="form-input" placeholder="e.g. Routine checkup, fever…" />
        </label>
      </div>
      <button type="submit" class="btn btn--primary" style="width:100%">Confirm Booking</button>
      <p id="appt-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`, true);

  document.getElementById('appt-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('appt-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Booking…';
    try {
      const patientId = role() === 'admin' ? document.getElementById('m-patient').value : uid();
      const res = await fetch(`${API}/appointments`, {
        method:'POST', headers:ah(),
        body: JSON.stringify({
          doctor_id: document.getElementById('m-doctor').value,
          patient_id: patientId,
          appointment_date: document.getElementById('m-date').value,
          appointment_time: document.getElementById('m-time').value,
          reason: document.getElementById('m-reason').value,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      closeModal(); loadPage('appointments');
    } catch (err) {
      msg.textContent = '⚠ ' + err.message;
      btn.disabled = false; btn.textContent = 'Confirm Booking';
    }
  };
}
window.openBookAppointment = openBookAppointment;

// ── Patients ───────────────────────────────────────────────
async function pagePatients(body) {
  body.innerHTML = `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Patients</span>
      </div>
      <div class="card__body">
        <div style="display:flex;gap:0.75rem;margin-bottom:1.25rem;flex-wrap:wrap">
          <input type="text" id="patient-search" class="form-input" placeholder="🔍 Search by name, email or phone…" style="flex:1;min-width:200px" oninput="searchPatients()" />
        </div>
        <div id="patients-table">Loading…</div>
      </div>
    </div>`;
  await loadPatientsTable('');
}

async function loadPatientsTable(search) {
  const el = document.getElementById('patients-table');
  if (!el) return;
  el.innerHTML = '<p class="text-muted">Loading…</p>';
  const url = `${API}/patients?limit=100${search ? '&search=' + encodeURIComponent(search) : ''}`;
  const res = await fetch(url, { headers: ah() });
  const data = await res.json();
  const patients = data.patients || [];
  el.innerHTML = patients.length ? `
    <p class="text-muted" style="margin-bottom:0.75rem">${data.total} patient${data.total!==1?'s':''} found</p>
    <div style="overflow-x:auto">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
      <tbody>${patients.map(p=>`
        <tr>
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.email)}</td>
          <td>${esc(p.phone||'—')}</td>
          <td>
            <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
              <button class="btn btn--outline btn--sm" onclick="viewPatientHistory('${esc(p.id)}','${esc(p.name)}')">📋 History</button>
              ${role()==='doctor'||role()==='admin' ? `<button class="btn btn--teal btn--sm" onclick="openPrescribeModal('${esc(p.id)}','${esc(p.name)}')">💊 Prescribe</button>` : ''}
              ${role()==='doctor'||role()==='admin' ? `<button class="btn btn--outline btn--sm" onclick="openAddRecordForPatient('${esc(p.id)}','${esc(p.name)}')">📝 Record</button>` : ''}
              ${role()==='admin'||role()==='doctor' ? `<button class="btn btn--primary btn--sm" onclick="openBillModal('${esc(p.id)}','${esc(p.name)}')">🧾 Bill</button>` : ''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>` : '<p class="empty-state">No patients found.</p>';
}

let searchTimer;
function searchPatients() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = document.getElementById('patient-search')?.value || '';
    loadPatientsTable(q);
  }, 350);
}
window.searchPatients = searchPatients;

async function viewPatientHistory(patientId, patientName) {
  const [rRes, pRes, bRes] = await Promise.all([
    fetch(`${API}/records/${patientId}`, { headers: ah() }),
    fetch(`${API}/prescriptions/${patientId}`, { headers: ah() }),
    fetch(`${API}/bills/${patientId}`, { headers: ah() }),
  ]);
  const records = await rRes.json();
  const prescriptions = await pRes.json();
  const bills = await bRes.json();

  openModal(`
    <div class="modal__title">👤 ${esc(patientName)} — Full History</div>

    <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;flex-wrap:wrap">
      <span class="badge badge--blue">📋 ${records.length} Records</span>
      <span class="badge badge--green">💊 ${prescriptions.length} Prescriptions</span>
      <span class="badge badge--yellow">🧾 ${bills.length} Bills</span>
    </div>

    <h3 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:0.75rem">Medical Records</h3>
    ${records.length ? records.map(r=>`
      <div class="record-card">
        <div class="record-card__header">
          <span class="record-card__title">${esc(r.diagnosis)}</span>
          <span class="record-card__meta">${fmtDate(r.created_at)}</span>
        </div>
        ${r.symptoms?`<p class="text-muted">Symptoms: ${esc(r.symptoms)}</p>`:''}
        ${r.notes?`<p class="text-muted">Notes: ${esc(r.notes)}</p>`:''}
        <p class="text-muted mt-1">Dr. ${esc(r.doctor_name)}</p>
      </div>`).join('') : '<p class="text-muted mb-1">No records.</p>'}

    <h3 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin:1.25rem 0 0.75rem">Prescriptions</h3>
    ${prescriptions.length ? prescriptions.map(p=>`
      <div class="record-card">
        <div class="record-card__header">
          <span class="record-card__title">Dr. ${esc(p.doctor_name)}</span>
          <span class="record-card__meta">${fmtDate(p.created_at)}</span>
        </div>
        ${p.items.map(i=>`<p style="font-size:0.85rem;margin-top:0.3rem">💊 <strong>${esc(i.medicine)}</strong> — ${esc(i.dosage)}, ${esc(i.frequency)}, ${esc(i.duration)}</p>`).join('')}
        ${p.instructions?`<p class="text-muted mt-1">📝 ${esc(p.instructions)}</p>`:''}
      </div>`).join('') : '<p class="text-muted">No prescriptions.</p>'}
  `, true);
}
window.viewPatientHistory = viewPatientHistory;

// ── Doctors ────────────────────────────────────────────────
async function pageDoctors(body) {
  const res = await fetch(`${API}/doctors`, { headers: ah() });
  const doctors = await res.json();
  body.innerHTML = `
    <div class="card">
      <div class="card__header"><span class="card__title">Doctors (${doctors.length})</span></div>
      ${doctors.length ? `
      <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>${doctors.map(d=>`
          <tr>
            <td><strong>${esc(d.name)}</strong></td>
            <td>${d.specialization?`<span class="badge badge--blue">${esc(d.specialization)}</span>`:'—'}</td>
            <td>${esc(d.email)}</td>
            <td>${esc(d.phone||'—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>` : '<div class="card__body"><p class="empty-state">No doctors registered.</p></div>'}
    </div>`;
}

// ── Medical Records ────────────────────────────────────────
async function pageRecords(body) {
  if (role() === 'patient') {
    const res = await fetch(`${API}/records/${uid()}`, { headers: ah() });
    const records = await res.json();
    body.innerHTML = `
      <div class="card">
        <div class="card__header"><span class="card__title">My Medical Records</span></div>
        <div class="card__body">
          ${records.length ? records.map(r=>`
            <div class="record-card">
              <div class="record-card__header">
                <span class="record-card__title">${esc(r.diagnosis)}</span>
                <span class="record-card__meta">${fmtDate(r.created_at)}</span>
              </div>
              ${r.symptoms?`<p class="text-muted">Symptoms: ${esc(r.symptoms)}</p>`:''}
              ${r.notes?`<p class="text-muted">Notes: ${esc(r.notes)}</p>`:''}
              <p class="text-muted mt-1">Dr. ${esc(r.doctor_name)}</p>
            </div>`).join('') : '<p class="empty-state">No medical records found.</p>'}
        </div>
      </div>`;
    return;
  }

  // Doctor/Admin — pick a patient
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  body.innerHTML = `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Medical Records</span>
        <button class="btn btn--primary btn--sm" onclick="openAddRecordModal()">+ Add Record</button>
      </div>
      <div class="card__body">
        <p class="text-muted" style="margin-bottom:1rem">Select a patient to view their records:</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem" id="patient-pills">
          ${patients.map(p=>`<button class="btn btn--outline btn--sm" onclick="loadPatientRecords('${esc(p.id)}','${esc(p.name)}')">${esc(p.name)}</button>`).join('')}
        </div>
        <div id="records-result" style="margin-top:1.5rem"></div>
      </div>
    </div>`;
}

async function loadPatientRecords(patientId, patientName) {
  const res = await fetch(`${API}/records/${patientId}`, { headers: ah() });
  const records = await res.json();
  document.getElementById('records-result').innerHTML = `
    <h3 style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--muted)">${esc(patientName)}'s Records</h3>
    ${records.length ? records.map(r=>`
      <div class="record-card">
        <div class="record-card__header">
          <span class="record-card__title">${esc(r.diagnosis)}</span>
          <span class="record-card__meta">${fmtDate(r.created_at)}</span>
        </div>
        ${r.symptoms?`<p class="text-muted">Symptoms: ${esc(r.symptoms)}</p>`:''}
        ${r.notes?`<p class="text-muted">Notes: ${esc(r.notes)}</p>`:''}
        <p class="text-muted mt-1">Dr. ${esc(r.doctor_name)}</p>
      </div>`).join('') : '<p class="empty-state">No records for this patient.</p>'}`;
}
window.loadPatientRecords = loadPatientRecords;

async function openAddRecordModal(prePatientId, prePatientName) {
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  openModal(`
    <div class="modal__title">📋 Add Medical Record</div>
    <form id="record-form">
      <div class="form-grid">
        <label class="form-label form-full">Patient
          <select id="r-patient" class="form-input" required>
            ${patients.map(p=>`<option value="${esc(p.id)}" ${p.id===prePatientId?'selected':''}>${esc(p.name)}</option>`).join('')}
          </select>
        </label>
        <label class="form-label form-full">Diagnosis *
          <input type="text" id="r-diag" class="form-input" required placeholder="e.g. Hypertension, Type 2 Diabetes" />
        </label>
        <label class="form-label form-full">Symptoms
          <input type="text" id="r-symp" class="form-input" placeholder="e.g. Headache, dizziness, fatigue" />
        </label>
        <label class="form-label form-full">Clinical Notes
          <textarea id="r-notes" class="form-input" rows="3" placeholder="Additional observations, treatment plan…"></textarea>
        </label>
      </div>
      <button type="submit" class="btn btn--primary" style="width:100%">Save Record</button>
      <p id="rec-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`);

  document.getElementById('record-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('rec-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/records`, {
        method:'POST', headers:ah(),
        body: JSON.stringify({
          patient_id: document.getElementById('r-patient').value,
          diagnosis: document.getElementById('r-diag').value,
          symptoms: document.getElementById('r-symp').value,
          notes: document.getElementById('r-notes').value,
          doctor_id: uid(), doctor_name: uname(),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      closeModal(); loadPage('records');
    } catch (err) {
      msg.textContent = '⚠ ' + err.message;
      btn.disabled = false;
    }
  };
}
window.openAddRecordModal = openAddRecordModal;

function openAddRecordForPatient(patientId, patientName) {
  openAddRecordModal(patientId, patientName);
}
window.openAddRecordForPatient = openAddRecordForPatient;

// ── Prescriptions ──────────────────────────────────────────
async function pagePrescriptions(body) {
  if (role() === 'patient') {
    const res = await fetch(`${API}/prescriptions/${uid()}`, { headers: ah() });
    const list = await res.json();
    body.innerHTML = `
      <div class="card">
        <div class="card__header"><span class="card__title">My Prescriptions</span></div>
        <div class="card__body">
          ${list.length ? list.map(p=>`
            <div class="record-card">
              <div class="record-card__header">
                <span class="record-card__title">Dr. ${esc(p.doctor_name)}</span>
                <span class="record-card__meta">${fmtDate(p.created_at)}</span>
              </div>
              <div style="overflow-x:auto;margin-top:0.5rem">
              <table class="data-table">
                <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                <tbody>${p.items.map(i=>`<tr><td>${esc(i.medicine)}</td><td>${esc(i.dosage)}</td><td>${esc(i.frequency)}</td><td>${esc(i.duration)}</td></tr>`).join('')}</tbody>
              </table>
              </div>
              ${p.instructions?`<p class="text-muted mt-1">📝 ${esc(p.instructions)}</p>`:''}
            </div>`).join('') : '<p class="empty-state">No prescriptions found.</p>'}
        </div>
      </div>`;
    return;
  }

  // Doctor/Admin
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  body.innerHTML = `
    <div class="card">
      <div class="card__header"><span class="card__title">Prescriptions</span></div>
      <div class="card__body">
        <p class="text-muted" style="margin-bottom:1rem">Select a patient to prescribe or view prescriptions:</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          ${patients.map(p=>`
            <button class="btn btn--outline btn--sm" onclick="openPrescribeModal('${esc(p.id)}','${esc(p.name)}')">${esc(p.name)}</button>`).join('')}
        </div>
      </div>
    </div>`;
}

async function openPrescribeModal(patientId, patientName) {
  openModal(`
    <div class="modal__title">💊 Prescribe — ${esc(patientName)}</div>
    <form id="presc-form">
      <div id="med-rows">
        <div class="med-row form-grid" style="margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
          <label class="form-label">Medicine <input type="text" class="form-input med-name" required placeholder="Paracetamol 500mg" /></label>
          <label class="form-label">Dosage <input type="text" class="form-input med-dose" required placeholder="1 tablet" /></label>
          <label class="form-label">Frequency <input type="text" class="form-input med-freq" required placeholder="Twice daily" /></label>
          <label class="form-label">Duration <input type="text" class="form-input med-dur" required placeholder="5 days" /></label>
        </div>
      </div>
      <button type="button" class="btn btn--outline btn--sm" onclick="addMedRow()" style="margin-bottom:1rem">+ Add Medicine</button>
      <label class="form-label">Special Instructions
        <textarea id="presc-inst" class="form-input" rows="2" placeholder="Take after meals, avoid alcohol…"></textarea>
      </label>
      <button type="submit" class="btn btn--primary" style="width:100%">Save Prescription</button>
      <p id="presc-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`, true);

  document.getElementById('presc-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('presc-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    const rows = document.querySelectorAll('.med-row');
    const items = Array.from(rows).map(r => ({
      medicine: r.querySelector('.med-name').value,
      dosage: r.querySelector('.med-dose').value,
      frequency: r.querySelector('.med-freq').value,
      duration: r.querySelector('.med-dur').value,
    }));
    try {
      const res = await fetch(`${API}/prescriptions`, {
        method:'POST', headers:ah(),
        body: JSON.stringify({ patient_id: patientId, doctor_id: uid(), items, instructions: document.getElementById('presc-inst').value }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      closeModal();
    } catch (err) {
      msg.textContent = '⚠ ' + err.message;
      btn.disabled = false;
    }
  };
}
window.openPrescribeModal = openPrescribeModal;

window.addMedRow = function() {
  const div = document.createElement('div');
  div.className = 'med-row form-grid';
  div.style.cssText = 'margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)';
  div.innerHTML = `
    <label class="form-label">Medicine <input type="text" class="form-input med-name" required placeholder="Medicine name" /></label>
    <label class="form-label">Dosage <input type="text" class="form-input med-dose" required placeholder="Dosage" /></label>
    <label class="form-label">Frequency <input type="text" class="form-input med-freq" required placeholder="Frequency" /></label>
    <label class="form-label">Duration <input type="text" class="form-input med-dur" required placeholder="Duration" /></label>`;
  document.getElementById('med-rows').appendChild(div);
};

// ── Beds ───────────────────────────────────────────────────
async function pageBeds(body) {
  const res = await fetch(`${API}/beds`, { headers: ah() });
  const beds = await res.json();
  const isAdmin = role() === 'admin';
  const wards = [...new Set(beds.map(b => b.ward))].sort();

  const available = beds.filter(b=>b.status==='available').length;
  const occupied  = beds.filter(b=>b.status==='occupied').length;

  body.innerHTML = `
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card"><div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--green">🛏️</div></div><div class="stat-card__value">${available}</div><div class="stat-card__label">Available</div></div>
      <div class="stat-card"><div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--red">🔴</div></div><div class="stat-card__value">${occupied}</div><div class="stat-card__label">Occupied</div></div>
      <div class="stat-card"><div class="stat-card__top"><div class="stat-card__icon-wrap stat-card__icon-wrap--blue">🏥</div></div><div class="stat-card__value">${beds.length}</div><div class="stat-card__label">Total Beds</div></div>
    </div>
    <div class="card">
      <div class="card__header">
        <span class="card__title">Beds & Wards</span>
        ${isAdmin ? `<button class="btn btn--primary btn--sm" onclick="openAddBedModal()">+ Add Bed</button>` : ''}
      </div>
      ${beds.length ? wards.map(ward => `
        <div style="padding:1rem 1.25rem 0">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:0.75rem">${esc(ward)}</div>
        </div>
        <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Bed #</th><th>Type</th><th>Status</th><th>Patient</th><th>Admitted</th><th>Actions</th></tr></thead>
          <tbody>${beds.filter(b=>b.ward===ward).map(b=>`
            <tr>
              <td><strong>${esc(b.bed_number)}</strong></td>
              <td><span class="badge badge--gray">${esc(b.bed_type)}</span></td>
              <td>${statusBadge(b.status)}</td>
              <td>${esc(b.patient_name||'—')}</td>
              <td>${b.admitted_at ? fmtDate(b.admitted_at) : '—'}</td>
              <td>
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
                  ${b.status==='available' ? `<button class="btn btn--teal btn--sm" onclick="openAdmitModal('${esc(b._id)}')">Admit</button>` : ''}
                  ${b.status==='occupied' ? `<button class="btn btn--outline btn--sm" onclick="dischargePatient('${esc(b._id)}')">Discharge</button>` : ''}
                  ${isAdmin ? `<button class="btn btn--danger btn--sm" onclick="deleteBed('${esc(b._id)}')">Delete</button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        </div>`).join('') : '<div class="card__body"><p class="empty-state">No beds configured yet.</p></div>'}
    </div>`;
}

async function openAddBedModal() {
  openModal(`
    <div class="modal__title">🛏️ Add Bed</div>
    <form id="bed-form">
      <div class="form-grid">
        <label class="form-label">Ward Name
          <input type="text" id="b-ward" class="form-input" required placeholder="General Ward A" />
        </label>
        <label class="form-label">Bed Number
          <input type="text" id="b-num" class="form-input" required placeholder="G-101" />
        </label>
        <label class="form-label form-full">Bed Type
          <select id="b-type" class="form-input">
            <option value="general">General</option>
            <option value="icu">ICU</option>
            <option value="private">Private</option>
            <option value="semi-private">Semi-Private</option>
          </select>
        </label>
      </div>
      <button type="submit" class="btn btn--primary" style="width:100%">Add Bed</button>
      <p id="bed-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`);

  document.getElementById('bed-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('bed-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/beds`, {
        method:'POST', headers:ah(),
        body: JSON.stringify({ ward: document.getElementById('b-ward').value, bed_number: document.getElementById('b-num').value, bed_type: document.getElementById('b-type').value }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      closeModal(); loadPage('beds');
    } catch (err) { msg.textContent = '⚠ ' + err.message; btn.disabled = false; }
  };
}
window.openAddBedModal = openAddBedModal;

async function openAdmitModal(bedId) {
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  if (!patients.length) { alert('No patients registered.'); return; }
  openModal(`
    <div class="modal__title">🛏️ Admit Patient</div>
    <form id="admit-form">
      <label class="form-label">Select Patient
        <select id="admit-patient" class="form-input" required>
          ${patients.map(p=>`<option value="${esc(p.id)}" data-name="${esc(p.name)}">${esc(p.name)}</option>`).join('')}
        </select>
      </label>
      <button type="submit" class="btn btn--primary" style="width:100%;margin-top:0.5rem">Admit Patient</button>
      <p id="admit-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`);

  document.getElementById('admit-form').onsubmit = async e => {
    e.preventDefault();
    const sel = document.getElementById('admit-patient');
    const msg = document.getElementById('admit-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/beds/${bedId}/admit`, {
        method:'PUT', headers:ah(),
        body: JSON.stringify({ patient_id: sel.value, patient_name: sel.options[sel.selectedIndex].dataset.name }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      closeModal(); loadPage('beds');
    } catch (err) { msg.textContent = '⚠ ' + err.message; btn.disabled = false; }
  };
}
window.openAdmitModal = openAdmitModal;

async function dischargePatient(bedId) {
  if (!confirm('Discharge patient from this bed?')) return;
  await fetch(`${API}/beds/${bedId}/discharge`, { method:'PUT', headers:ah() });
  toast('Patient discharged successfully');
  loadPage('beds');
}
window.dischargePatient = dischargePatient;

async function deleteBed(bedId) {
  if (!confirm('Delete this bed permanently?')) return;
  await fetch(`${API}/beds/${bedId}`, { method:'DELETE', headers:ah() });
  toast('Bed deleted');
  loadPage('beds');
}
window.deleteBed = deleteBed;

// ── Billing ────────────────────────────────────────────────
async function pageBilling(body) {
  if (role() === 'patient') {
    const res = await fetch(`${API}/bills/${uid()}`, { headers: ah() });
    const bills = await res.json();
    body.innerHTML = `
      <div class="card">
        <div class="card__header"><span class="card__title">My Bills</span></div>
        ${bills.length ? `
        <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Bill #</th><th>Date</th><th>Total</th><th>Status</th><th>Invoice</th></tr></thead>
          <tbody>${bills.map(b=>`
            <tr>
              <td><strong>${esc(b.bill_number)}</strong></td>
              <td>${fmtDate(b.created_at)}</td>
              <td style="color:var(--blue);font-weight:700">${fmt(b.total)}</td>
              <td>${statusBadge(b.status)}</td>
              <td><a href="bill.html?id=${esc(b._id)}" class="btn btn--outline btn--sm" target="_blank">🖨 View</a></td>
            </tr>`).join('')}
          </tbody>
        </table>
        </div>` : '<div class="card__body"><p class="empty-state">No bills found.</p></div>'}
      </div>`;
    return;
  }

  // Doctor / Admin
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  body.innerHTML = `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Billing</span>
        <button class="btn btn--primary btn--sm" onclick="openBillModal()">+ Create Bill</button>
      </div>
      <div class="card__body">
        <p class="text-muted" style="margin-bottom:1rem">Select a patient to view or create bills:</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          ${patients.map(p=>`<button class="btn btn--outline btn--sm" onclick="viewPatientBills('${esc(p.id)}','${esc(p.name)}')">${esc(p.name)}</button>`).join('')}
        </div>
        <div id="bills-result" style="margin-top:1.5rem"></div>
      </div>
    </div>`;
}

async function viewPatientBills(patientId, patientName) {
  const res = await fetch(`${API}/bills/${patientId}`, { headers: ah() });
  const bills = await res.json();
  document.getElementById('bills-result').innerHTML = `
    <h3 style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--muted)">${esc(patientName)}'s Bills</h3>
    ${bills.length ? `
    <div style="overflow-x:auto">
    <table class="data-table">
      <thead><tr><th>Bill #</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${bills.map(b=>`
        <tr>
          <td><strong>${esc(b.bill_number)}</strong></td>
          <td>${fmtDate(b.created_at)}</td>
          <td style="color:var(--blue);font-weight:700">${fmt(b.total)}</td>
          <td>${statusBadge(b.status)}</td>
          <td>
            <div style="display:flex;gap:0.35rem">
              <a href="bill.html?id=${esc(b._id)}" class="btn btn--outline btn--sm" target="_blank">🖨 Invoice</a>
              ${b.status==='unpaid'&&role()==='admin' ? `<button class="btn btn--success btn--sm" onclick="markPaid('${esc(b._id)}')">✓ Mark Paid</button>` : ''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>` : '<p class="empty-state">No bills for this patient.</p>'}`;
}
window.viewPatientBills = viewPatientBills;

async function markPaid(billId) {
  await fetch(`${API}/bills/${billId}/pay`, { method:'PUT', headers:ah() });
  toast('Bill marked as paid');
  loadPage('billing');
}
window.markPaid = markPaid;

async function openBillModal(prePatientId, prePatientName) {
  const pRes = await fetch(`${API}/patients`, { headers: ah() });
  const patients = (await pRes.json()).patients || [];
  if (!patients.length) { alert('No patients registered.'); return; }

  openModal(`
    <div class="modal__title">🧾 Create Bill</div>
    <form id="bill-form">
      <label class="form-label">Patient
        <select id="bill-patient" class="form-input" required>
          ${patients.map(p=>`<option value="${esc(p.id)}" data-name="${esc(p.name)}" ${p.id===prePatientId?'selected':''}>${esc(p.name)}</option>`).join('')}
        </select>
      </label>
      <div id="bill-items">
        <div class="bill-item form-grid" style="margin-bottom:0.75rem">
          <label class="form-label">Description <input type="text" class="form-input bill-desc" required placeholder="Consultation fee" /></label>
          <label class="form-label">Amount (₹) <input type="number" class="form-input bill-amt" required min="0" step="0.01" placeholder="500" /></label>
        </div>
      </div>
      <button type="button" class="btn btn--outline btn--sm" onclick="addBillItem()" style="margin-bottom:1rem">+ Add Item</button>
      <button type="submit" class="btn btn--primary" style="width:100%">Generate Bill</button>
      <p id="bill-msg" style="margin-top:0.5rem;font-size:0.82rem;color:var(--danger)"></p>
    </form>`, true);

  document.getElementById('bill-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('bill-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    const sel = document.getElementById('bill-patient');
    const rows = document.querySelectorAll('.bill-item');
    const items = Array.from(rows).map(r => ({
      description: r.querySelector('.bill-desc').value,
      amount: parseFloat(r.querySelector('.bill-amt').value),
    }));
    try {
      const res = await fetch(`${API}/bills`, {
        method:'POST', headers:ah(),
        body: JSON.stringify({ patient_id: sel.value, patient_name: sel.options[sel.selectedIndex].dataset.name, items }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const bill = await res.json();
      closeModal();
      window.open(`bill.html?id=${bill._id}`, '_blank');
    } catch (err) { msg.textContent = '⚠ ' + err.message; btn.disabled = false; }
  };
}
window.openBillModal = openBillModal;

window.addBillItem = function() {
  const div = document.createElement('div');
  div.className = 'bill-item form-grid';
  div.style.marginBottom = '0.75rem';
  div.innerHTML = `
    <label class="form-label">Description <input type="text" class="form-input bill-desc" required placeholder="Item description" /></label>
    <label class="form-label">Amount (₹) <input type="number" class="form-input bill-amt" required min="0" step="0.01" placeholder="0" /></label>`;
  document.getElementById('bill-items').appendChild(div);
};

// ── Profile Page ───────────────────────────────────────────
async function pageProfile(body) {
  const res = await fetch(`${API}/auth/me`, { headers: ah() });
  const u = await res.json();

  body.innerHTML = `
    <div style="max-width:600px">
      <!-- Profile info -->
      <div class="card">
        <div class="card__header"><span class="card__title">👤 My Profile</span></div>
        <div class="card__body">
          <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1.5rem">
            <div style="width:64px;height:64px;background:var(--blue);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;font-weight:700;flex-shrink:0">
              ${esc(u.name.charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="font-size:1.1rem;font-weight:700">${esc(u.name)}</div>
              <div style="color:var(--muted);font-size:0.85rem">${esc(u.email)}</div>
              <span class="badge badge--blue" style="margin-top:0.35rem">${esc(u.role)}</span>
            </div>
          </div>

          <form id="profile-form">
            <div class="form-grid">
              <label class="form-label">Full Name
                <input type="text" id="p-name" class="form-input" value="${esc(u.name)}" required />
              </label>
              <label class="form-label">Phone
                <input type="tel" id="p-phone" class="form-input" value="${esc(u.phone||'')}" placeholder="+91 98765 43210" />
              </label>
              ${u.role === 'doctor' ? `
              <label class="form-label form-full">Specialization
                <input type="text" id="p-spec" class="form-input" value="${esc(u.specialization||'')}" placeholder="e.g. Cardiology" />
              </label>` : ''}
            </div>
            <button type="submit" class="btn btn--primary">Save Changes</button>
            <p id="profile-msg" style="margin-top:0.5rem;font-size:0.82rem"></p>
          </form>
        </div>
      </div>

      <!-- Change password -->
      <div class="card">
        <div class="card__header"><span class="card__title">🔒 Change Password</span></div>
        <div class="card__body">
          <form id="pw-form">
            <label class="form-label">Current Password
              <input type="password" id="pw-current" class="form-input" required placeholder="Enter current password" />
            </label>
            <label class="form-label">New Password
              <input type="password" id="pw-new" class="form-input" required placeholder="Min 6 characters" />
            </label>
            <label class="form-label">Confirm New Password
              <input type="password" id="pw-confirm" class="form-input" required placeholder="Repeat new password" />
            </label>
            <button type="submit" class="btn btn--primary">Update Password</button>
            <p id="pw-msg" style="margin-top:0.5rem;font-size:0.82rem"></p>
          </form>
        </div>
      </div>

      <!-- Account info -->
      <div class="card">
        <div class="card__header"><span class="card__title">ℹ Account Info</span></div>
        <div class="card__body">
          <table class="data-table">
            <tbody>
              <tr><td style="color:var(--muted);width:140px">Email</td><td>${esc(u.email)}</td></tr>
              <tr><td style="color:var(--muted)">Role</td><td><span class="badge badge--blue">${esc(u.role)}</span></td></tr>
              <tr><td style="color:var(--muted)">Member since</td><td>${fmtDate(u.created_at)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('profile-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('profile-msg');
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const patch = {
        name: document.getElementById('p-name').value.trim(),
        phone: document.getElementById('p-phone').value.trim(),
      };
      if (u.role === 'doctor') patch.specialization = document.getElementById('p-spec').value.trim();
      const res = await fetch(`${API}/auth/profile`, { method:'PUT', headers:ah(), body:JSON.stringify(patch) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const d = await res.json();
      // Update stored name and token
      localStorage.setItem('hms_name', d.name);
      localStorage.setItem('hms_token', d.token);
      document.getElementById('sb-name').textContent = d.name;
      document.getElementById('sb-avatar').textContent = d.name.charAt(0).toUpperCase();
      toast('Profile updated successfully');
      msg.textContent = '';
    } catch (err) {
      msg.textContent = '⚠ ' + err.message;
      msg.style.color = 'var(--danger)';
    } finally { btn.disabled = false; }
  };

  document.getElementById('pw-form').onsubmit = async e => {
    e.preventDefault();
    const msg = document.getElementById('pw-msg');
    const btn = e.target.querySelector('[type=submit]');
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;
    if (newPw !== confirm) {
      msg.textContent = '⚠ Passwords do not match';
      msg.style.color = 'var(--danger)';
      return;
    }
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/auth/password`, {
        method:'PUT', headers:ah(),
        body: JSON.stringify({ current_password: document.getElementById('pw-current').value, new_password: newPw }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast('Password changed successfully');
      e.target.reset();
      msg.textContent = '';
    } catch (err) {
      msg.textContent = '⚠ ' + err.message;
      msg.style.color = 'var(--danger)';
    } finally { btn.disabled = false; }
  };
}
window.toast = toast;
