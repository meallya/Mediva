# MEDIVA — Project Blueprint

## 1. Project Overview

**MEDIVA** adalah Sistem Informasi Manajemen Rumah Sakit (SIMRS) berbasis web yang dirancang dengan konsep **multi-role dashboard**.

Setiap pengguna masuk ke dashboard sesuai role yang dimiliki, tetapi seluruh role tetap berada dalam satu sistem dan satu database terintegrasi.

### Konsep Utama
- Satu user dapat memiliki lebih dari satu role.
- Setiap role memiliki dashboard, menu, dan hak akses masing-masing.
- User dengan beberapa role dapat berpindah role tanpa login ulang.
- Data antar unit tetap saling terhubung.
- Sistem dibangun modular agar dapat dikembangkan bertahap.
- Fokus awal adalah MVP yang dapat digunakan klinik atau rumah sakit kecil.

---

## 2. Technology Stack

### Frontend
- React JS
- Tailwind CSS
- Vite

### Backend
- Laravel

### Database
- MySQL
- Database name: `mediva`

### Development
- Monorepo
- Laravel dan React berada dalam satu project/folder.
- Frontend dan backend dapat dijalankan dari satu terminal menggunakan `concurrently`.

Contoh:

```json
{
  "scripts": {
    "dev": "concurrently \"php artisan serve\" \"npm run dev:vite\"",
    "dev:vite": "vite"
  }
}
```

---

## 3. Development Team

### Project Manager + Frontend Developer
Tanggung jawab:
- Menentukan scope project.
- Menentukan prioritas fitur.
- Membuat UI/UX.
- Mengembangkan frontend.
- Integrasi frontend dengan API.
- Testing tampilan dan user flow.

### Requirement Analyst + Backend Developer
Tanggung jawab:
- Analisis kebutuhan setiap unit rumah sakit.
- Membuat database.
- Membuat API.
- Authentication.
- Authorization.
- Business logic.
- Integrasi antar modul.
- Testing backend.

---

## 4. Core Architecture

MEDIVA menggunakan konsep:

```text
User
  |
Login
  |
Authentication
  |
User Roles
  |
Role Selector
  |
Dashboard sesuai Role
  |
Modules
  |
Shared Database
```

Dashboard berbeda berdasarkan role, tetapi seluruh modul tetap terintegrasi melalui backend dan database yang sama.

---

## 5. Multi-Role System

Satu pegawai dapat memiliki beberapa role.

Contoh:

```text
Pegawai A
- Dokter
- Direktur Penunjang Medis

Pegawai B
- Manager Pengembangan RS
- IT
```

Setelah login:

### User memiliki satu role

```text
Login
  ↓
Dashboard Role
```

### User memiliki beberapa role

```text
Login
  ↓
Pilih Role
  ↓
Dashboard Role
```

User dapat menggunakan fitur **Switch Role** tanpa logout.

---

## 6. RBAC — Role Based Access Control

Struktur permission:

```text
User
↓
User Role
↓
Role
↓
Role Permission
↓
Permission
```

Contoh permission:

```text
patient.view
patient.create
patient.update

registration.view
registration.create

medical_record.view
medical_record.update

prescription.create
prescription.view

pharmacy.dispense

billing.view
billing.create

report.view
```

Backend tetap wajib melakukan authorization.

Frontend hanya menyembunyikan menu berdasarkan permission.

---

## 7. Initial Role Registry

Role MEDIVA dapat berkembang, tetapi daftar awal mencakup:

### Medical
- Dokter
- Perawat
- Perawat Rawat Jalan
- Perawat Rawat Inap
- Perawat IGD
- Apoteker
- Farmasi
- Rekam Medis
- Casemix

### Patient Service
- Pendaftaran
- Administrasi
- Customer Service
- RS Center

### Management
- Direktur Utama
- Direktur Penunjang Medis
- Manager Pengembangan Rumah Sakit
- Keuangan
- SDM
- Legal
- Sekretaris Rumah Sakit

### Operational
- IT
- MFK
- Gudang
- Pengadaan
- Marketing Komunikasi
- Diklat / Seminar

Role registry tidak harus langsung dibuat seluruhnya pada MVP.

---

## 8. MVP Scope

Alur utama MVP:

```text
Pasien Datang
    ↓
Pendaftaran
    ↓
Pemeriksaan
    ↓
Resep
    ↓
Farmasi
    ↓
Pembayaran
    ↓
Selesai
```

Modul awal:

1. Authentication
2. User & Role Management
3. Master Data
4. Patient
5. Registration
6. Medical Examination
7. Electronic Prescription
8. Pharmacy
9. Cashier / Billing
10. Basic Reports

---

## 9. Module Blueprint

### 9.1 Authentication

Fitur:
- Login.
- Logout.
- Forgot password.
- Current user.
- Role selector.
- Switch role.
- Permission validation.

---

### 9.2 User Management

Data:
- Nama.
- Email.
- Username.
- Password.
- Pegawai.
- Status akun.

Fitur:
- Create user.
- Edit user.
- Disable user.
- Assign role.
- Remove role.
- Assign permission.

---

### 9.3 Master Data

Master data awal:

- Pasien.
- Pegawai.
- Dokter.
- Poli.
- Ruangan.
- Tarif.
- Obat.
- Supplier.
- Metode pembayaran.

---

## 10. Patient Module

Data utama pasien:

```text
Medical Record Number
NIK
Name
Gender
Date of Birth
Address
Phone
Blood Type
Emergency Contact
```

Medical Record Number harus unik.

---

## 11. Registration Module

Jenis layanan:

- Rawat Jalan.
- IGD.
- Rawat Inap (fase berikutnya).

Workflow Rawat Jalan:

```text
Pasien
↓
Pendaftaran
↓
Poli
↓
Dokter
↓
Pemeriksaan
```

Data:

- Patient.
- Visit number.
- Registration date.
- Clinic.
- Doctor.
- Payment method.
- Queue number.
- Registration status.

---

## 12. Doctor Examination

Dokter dapat melihat:

- Identitas pasien.
- Riwayat kunjungan.
- Keluhan.
- Vital signs.
- Riwayat diagnosis.
- Riwayat obat.

SOAP:

```text
S — Subjective
O — Objective
A — Assessment
P — Plan
```

Tambahan:

- ICD-10.
- ICD-9-CM.
- Tindakan.
- Resep.
- Catatan dokter.

---

## 13. Medical Record Module

Rekam medis dapat:

- Melihat kunjungan pasien.
- Validasi diagnosis.
- Input/edit ICD-10.
- Input/edit ICD-9-CM.
- Melakukan coding.
- Melihat riwayat perubahan coding.

Setiap perubahan harus menyimpan:

```text
created_by
updated_by
created_at
updated_at
```

Agar petugas yang melakukan input dapat dilacak.

---

## 14. Electronic Prescription

Dokter membuat resep:

```text
Patient
Visit
Medicine
Dosage
Frequency
Quantity
Instruction
```

Resep kemudian masuk ke dashboard farmasi.

Status:

```text
Draft
Submitted
Processing
Ready
Dispensed
Cancelled
```

---

## 15. Pharmacy

Farmasi dapat:

- Melihat antrean resep.
- Memproses resep.
- Mengurangi stok.
- Melakukan substitusi sesuai aturan.
- Menandai obat selesai.
- Melihat stok minimum.

Inventory:

```text
Medicine
Batch
Expired Date
Stock
Purchase Price
Selling Price
Supplier
```

---

## 16. Billing / Cashier

Tagihan dapat berasal dari:

```text
Registration
Doctor Service
Medical Procedures
Medicine
Laboratory
Radiology
Other Services
```

Kasir dapat:

- Melihat detail tagihan.
- Memilih metode pembayaran.
- Membuat pembayaran.
- Cetak invoice.
- Cetak receipt.

Status:

```text
Unpaid
Partial
Paid
Cancelled
```

---

## 17. Dashboard Concept

Setiap role memiliki dashboard sendiri.

### Dokter
- Pasien hari ini.
- Antrean pasien.
- Pemeriksaan belum selesai.
- Riwayat pasien.
- Resep.

### Farmasi
- Resep masuk.
- Resep diproses.
- Resep selesai.
- Stok minimum.
- Obat hampir expired.

### Pendaftaran
- Pasien hari ini.
- Antrean.
- Registrasi baru.
- Kunjungan aktif.

### Rekam Medis
- Coding belum lengkap.
- Diagnosis belum tervalidasi.
- Kunjungan selesai.
- Statistik rekam medis.

### Manajemen
- Kunjungan pasien.
- Pendapatan.
- Statistik layanan.
- KPI.
- Tren bulanan.

---

## 18. Suggested Database Core

### Authentication

```text
users
employees
roles
permissions
user_roles
role_permissions
```

### Hospital

```text
patients
doctors
clinics
rooms
services
tariffs
```

### Registration

```text
visits
registrations
queues
```

### Medical

```text
medical_records
soap_records
diagnoses
procedures
prescriptions
prescription_items
```

### Pharmacy

```text
medicines
medicine_batches
medicine_stocks
stock_movements
suppliers
```

### Billing

```text
invoices
invoice_items
payments
payment_methods
```

### Audit

```text
activity_logs
```

---

## 19. Suggested Core RBAC Tables

### users

```text
id
employee_id
name
email
username
password
is_active
created_at
updated_at
```

### roles

```text
id
name
slug
description
created_at
updated_at
```

### permissions

```text
id
name
slug
module
created_at
updated_at
```

### user_roles

```text
id
user_id
role_id
is_default
created_at
```

### role_permissions

```text
id
role_id
permission_id
```

---

## 20. Active Role

Saat user memiliki beberapa role, backend menyimpan role aktif.

Contoh session:

```text
authenticated_user
active_role
permissions
```

Endpoint:

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/switch-role
POST /api/auth/logout
```

Response `/api/auth/me` dapat berbentuk:

```json
{
  "user": {
    "id": 1,
    "name": "User"
  },
  "roles": [
    {
      "id": 1,
      "name": "Dokter",
      "slug": "doctor"
    },
    {
      "id": 2,
      "name": "Manager",
      "slug": "manager"
    }
  ],
  "active_role": {
    "id": 1,
    "name": "Dokter",
    "slug": "doctor"
  },
  "permissions": [
    "patient.view",
    "medical_record.view",
    "prescription.create"
  ]
}
```

---

## 21. Frontend Architecture

Frontend MEDIVA menggunakan pendekatan **feature-based / module-based architecture**.

Artinya, setiap domain atau fitur utama MEDIVA ditempatkan di dalam module masing-masing. File yang hanya digunakan oleh satu module disimpan di dalam module tersebut, sedangkan komponen yang digunakan lintas module disimpan di `shared/`.

Pendekatan ini dipilih karena MEDIVA akan memiliki banyak domain dan role. Struktur per-module membuat codebase lebih mudah dikembangkan, dipelihara, dan dibagi antar developer dibandingkan menempatkan seluruh page, component, service, dan hook dalam folder global.

### Struktur Utama

```text
resources/js/
│
├── app.jsx
├── router/
│   └── AppRouter.jsx
│
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── patient/
│   ├── registration/
│   ├── medical/
│   ├── medical-record/
│   ├── pharmacy/
│   ├── inventory/
│   ├── billing/
│   ├── reports/
│   └── user-management/
│
└── shared/
    ├── components/
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   ├── ui/
    │   ├── forms/
    │   └── tables/
    │
    ├── hooks/
    ├── services/
    ├── utils/
    ├── constants/
    └── assets/
```

### Struktur Internal Module

Setiap module dapat memiliki struktur sendiri sesuai kompleksitas fiturnya.

Contoh:

```text
modules/
└── patient/
    ├── pages/
    │   ├── PatientListPage.jsx
    │   ├── PatientCreatePage.jsx
    │   └── PatientDetailPage.jsx
    │
    ├── components/
    │   ├── PatientTable.jsx
    │   ├── PatientForm.jsx
    │   └── PatientSummary.jsx
    │
    ├── services/
    │   └── patientService.js
    │
    ├── hooks/
    │   └── usePatients.js
    │
    └── utils/
        └── patientHelpers.js
```

Tidak semua module wajib memiliki seluruh folder tersebut. Folder dibuat ketika memang dibutuhkan agar struktur tidak menjadi over-engineered.

### Struktur MEDIVA Saat Ini

Pada tahap awal pengembangan UI, struktur frontend yang sudah digunakan adalah:

```text
resources/js/
│
├── app.jsx
├── router/
│   └── AppRouter.jsx
│
├── modules/
│   ├── auth/
│   │   └── pages/
│   │       └── LoginPage.jsx
│   │
│   └── dashboard/
│       ├── pages/
│       │   └── DashboardPage.jsx
│       └── components/
│           ├── StatCard.jsx
│           ├── VisitChart.jsx
│           ├── ServiceItem.jsx
│           ├── ActivityItem.jsx
│           └── SystemItem.jsx
│
└── shared/
    └── components/
        └── layout/
            ├── DashboardLayout.jsx
            ├── Sidebar.jsx
            └── Topbar.jsx
```

### Aturan Penempatan File

```text
Dipakai hanya oleh satu module
→ modules/{module-name}/...

Dipakai oleh banyak module
→ shared/...

Mengatur routing aplikasi
→ router/...

Entry point React
→ app.jsx
```

Contoh:

```text
PatientForm
→ modules/patient/components/PatientForm.jsx

Sidebar
→ shared/components/layout/Sidebar.jsx

Button reusable
→ shared/components/ui/Button.jsx

API client global
→ shared/services/api.js
```

### Prinsip Module MEDIVA

1. **Module mengikuti domain bisnis, bukan role user.**
2. Dashboard tiap role tidak berarti membuat salinan module yang sama.
3. Role dan permission menentukan module, menu, dan fitur yang dapat diakses.
4. Komponen lintas module ditempatkan di `shared/`.
5. Hindari satu folder global `pages/` atau `components/` untuk seluruh aplikasi.
6. Folder dibuat ketika memang diperlukan, bukan dibuat kosong sejak awal.

Contoh hubungan role dengan module:

```text
Dokter
→ patient
→ medical
→ prescription

Farmasi / Apoteker
→ pharmacy
→ inventory
→ prescription

Rekam Medis
→ patient
→ medical-record

Pendaftaran
→ patient
→ registration

Manajemen
→ dashboard
→ reports
```

Dengan demikian, **role mengatur akses terhadap module**, sedangkan struktur frontend dibangun berdasarkan domain atau fitur MEDIVA.

---

## 22. Backend Architecture

Laravel:

```text
app/
│
├── Models/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   ├── Middleware/
│   └── Requests/
│
├── Services/
├── Repositories/
├── Policies/
└── Enums/
```

Pisahkan business logic dari controller jika modul mulai kompleks.

---

## 23. API Convention

Gunakan prefix:

```text
/api
```

Contoh:

```text
GET    /api/patients
POST   /api/patients
GET    /api/patients/{id}
PUT    /api/patients/{id}
DELETE /api/patients/{id}
```

Registration:

```text
GET  /api/registrations
POST /api/registrations
```

Medical Examination:

```text
GET  /api/visits/{id}/medical-record
POST /api/visits/{id}/soap
POST /api/visits/{id}/diagnoses
POST /api/visits/{id}/prescriptions
```

---

## 24. Frontend Tasks

### Phase 1 — Foundation

- Setup React.
- Setup Tailwind.
- Setup React Router.
- Setup Axios/fetch API client.
- Login page.
- Auth context.
- Protected routes.
- Role selector.
- Switch role.
- Dashboard layout.
- Sidebar dinamis berdasarkan role.

### Phase 2 — Master Data

- Patient list.
- Patient form.
- Doctor list.
- Employee list.
- Clinic list.
- Medicine list.

### Phase 3 — Registration

- Registration list.
- Registration form.
- Queue UI.
- Patient search.
- Visit detail.

### Phase 4 — Doctor

- Doctor dashboard.
- Patient queue.
- SOAP form.
- Diagnosis form.
- Procedure form.
- Prescription form.

### Phase 5 — Pharmacy

- Pharmacy dashboard.
- Prescription queue.
- Prescription detail.
- Medicine dispensing.
- Stock management.

### Phase 6 — Billing

- Invoice detail.
- Payment UI.
- Receipt.
- Transaction history.

### Phase 7 — Reports

- Management dashboard.
- Charts.
- Filters.
- Export.

---

## 25. Backend Tasks

### Phase 1 — Foundation

- Setup Laravel.
- Database connection.
- Authentication.
- User model.
- Employee model.
- Role.
- Permission.
- User role.
- Role permission.
- Middleware.
- Authorization.
- Switch role endpoint.
- Audit log.

### Phase 2 — Master Data

- Patient migration/model/API.
- Doctor migration/model/API.
- Employee migration/model/API.
- Clinic migration/model/API.
- Medicine migration/model/API.

### Phase 3 — Registration

- Visit.
- Registration.
- Queue.
- Visit status.
- Patient registration workflow.

### Phase 4 — Medical

- Medical record.
- SOAP.
- Diagnosis.
- ICD-10.
- ICD-9-CM.
- Procedure.
- Prescription.

### Phase 5 — Pharmacy

- Medicine stock.
- Batch.
- Stock movement.
- Dispensing.
- Prescription status.

### Phase 6 — Billing

- Invoice.
- Invoice items.
- Payment.
- Payment method.
- Automatic bill generation.

### Phase 7 — Reports

- Visit statistics.
- Revenue.
- Pharmacy statistics.
- Management metrics.

---

## 26. Development Roadmap

### Sprint 0

Foundation:

```text
Project Setup
Database
Authentication
RBAC
Role Selector
Base Dashboard
```

### Sprint 1

```text
Patient
Employee
Doctor
Clinic
Master Data
```

### Sprint 2

```text
Registration
Visit
Queue
```

### Sprint 3

```text
Doctor Examination
SOAP
Diagnosis
Procedure
```

### Sprint 4

```text
Prescription
Pharmacy
Stock
```

### Sprint 5

```text
Billing
Payment
Receipt
```

### Sprint 6

```text
Reports
Management Dashboard
Audit
Testing
```

---

## 27. Suggested First Development Order

Jangan mulai dari seluruh dashboard role sekaligus.

Urutan paling aman:

```text
1. Database architecture
2. User
3. Employee
4. Role
5. Permission
6. Authentication
7. Role selector
8. Dashboard shell
9. Patient
10. Registration
11. Doctor examination
12. Prescription
13. Pharmacy
14. Billing
15. Reports
```

Dengan urutan ini, fondasi multi-role selesai sebelum modul rumah sakit menjadi besar.

---

## 28. Important Principles

### One Source of Truth

Semua modul menggunakan data yang sama.

Contoh:

```text
Dokter membuat resep
↓
Farmasi menerima resep
↓
Farmasi dispense obat
↓
Stock berkurang
↓
Tagihan pasien bertambah
↓
Kasir menerima tagihan
↓
Manajemen melihat pendapatan
```

Tidak boleh ada data resep terpisah per dashboard.

---

## 29. Audit Trail

Untuk SIMRS, aktivitas penting perlu tercatat.

Contoh:

```text
User
Role aktif
Action
Module
Record
Old value
New value
Timestamp
IP address
```

Contoh:

```text
User: RM001
Role: Rekam Medis
Action: Update Diagnosis
ICD10: J00 → J01
Time: 2026-08-19 09:00
```

---

## 30. Future Modules

Setelah MVP stabil:

- Rawat Inap.
- IGD lengkap.
- Laboratory.
- Radiology.
- Operating Room.
- Bed Management.
- Nutrition.
- Procurement.
- Warehouse.
- Asset Management.
- MFK.
- HRIS.
- Payroll.
- Casemix.
- BPJS.
- SATUSEHAT.
- Mobile patient application.
- Internal AI assistant.
- Executive analytics.

Integrasi eksternal sebaiknya dilakukan setelah core workflow MEDIVA stabil.

---

## 31. Product Goal

Target pengembangan:

```text
Phase 1
Internal Prototype

Phase 2
Usable MVP

Phase 3
Clinic / Small Hospital

Phase 4
Medium Hospital

Phase 5
Commercial SIMRS
```

MEDIVA sebaiknya dikembangkan sebagai **modular hospital platform**, bukan kumpulan dashboard yang berdiri sendiri.

---

## 32. Current Project Status

Saat blueprint ini dibuat:

- UI dashboard sudah mulai didesain.
- Database `mediva` sudah dibuat.
- Tabel database belum dibangun secara penuh.
- Stack sudah ditentukan: React + Tailwind + Laravel.
- Monorepo menjadi struktur project utama.
- Multi-role menjadi core architecture.
- Pengerjaan dibagi antara frontend dan backend developer.

### Next Recommended Task

Mulai dari:

```text
ERD Core
↓
Migration RBAC
↓
Authentication
↓
Multi-role
↓
Dashboard Shell
```

Setelah foundation tersebut stabil, lanjutkan ke modul **Pasien → Pendaftaran → Pemeriksaan → Resep → Farmasi → Billing**.
