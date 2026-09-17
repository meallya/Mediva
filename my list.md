# MEDIVA — CURRENT NEXT DEVELOPMENT

Updated: 17 September 2026

Keterangan:
✅ = Sudah dibuat / complete
🚧 = Coding sudah ada, masih runtime / integration / E2E
⬜ = Belum dibuat
🟡 = Optional / Phase 2

==================================================
CLINICAL / MEDICAL
==================================================

✅ Medical Examination
✅ Medical Record
✅ Laboratory
✅ Operating Room

🚧 Keperawatan
✅ Coding
🚧 Runtime / E2E

🚧 Apoteker / Clinical Pharmacy
✅ Database
✅ Backend
✅ Frontend
✅ Permission
✅ Role Apoteker
✅ Test User Apoteker
🚧 Runtime
🚧 Integration Pharmacy
🚧 Medical Record Integration
🚧 E2E

🚧 Radiologi
✅ Database
✅ Backend
✅ Frontend
✅ Permission
✅ Role Radiologi
✅ Master Modality
✅ Order
✅ Scheduling
✅ Study
✅ Result
✅ Verification
✅ Amendment
✅ PACS / DICOM Preparation
✅ Test User Radiologi
🚧 Runtime
🚧 Billing Integration
🚧 Medical Record Integration
🚧 E2E

🚧 IGD
✅ Coding
✅ Database
✅ Frontend
✅ Backend
✅ Nursing Integration
✅ Test User Perawat IGD
🚧 Runtime
🚧 Final Integration
🚧 E2E

🚧 Rawat Jalan
✅ Coding
✅ Database
✅ Frontend
✅ Backend
✅ Nursing Integration
✅ Test User Perawat Rawat Jalan
🚧 Runtime
🚧 Final Integration
🚧 E2E

🚧 Rawat Inap
✅ Coding
✅ Database
✅ Frontend
✅ Backend
✅ Nursing Integration
✅ Test User Perawat Rawat Inap
🚧 Runtime
🚧 Final Integration
🚧 E2E

==================================================
TEST USERS
==================================================

✅ ClinicalTestUserSeeder

✅ dokter@mediva.test
✅ perawat@mediva.test
✅ perawat.igd@mediva.test
✅ perawat.rajal@mediva.test
✅ perawat.ranap@mediva.test
✅ perawat.ok@mediva.test
✅ apoteker@mediva.test
✅ laboratorium@mediva.test
✅ radiologi@mediva.test
✅ farmasi@mediva.test
✅ rekammedis@mediva.test
✅ pendaftaran@mediva.test
✅ kasir@mediva.test

✅ nurse.multi@mediva.test
✅ doctor.multi@mediva.test

Password TEST:
MedivaTest123!

NOTE:
Ini akun TEST / DEVELOPMENT.
Bukan final real user MEDIVA.

⬜ Final User
⬜ Final Unit Assignment
⬜ Final Permission Matrix
⬜ Final Multi-role Assignment

==================================================
NEXT — CLINICAL RUNTIME
==================================================

1. 🚀 Runtime Apoteker

    Login:
    apoteker@mediva.test

    Test:
    ⬜ Dashboard
    ⬜ Review Resep
    ⬜ Allergy Review
    ⬜ Drug Interaction Review
    ⬜ Duplicate Therapy
    ⬜ Dose Review
    ⬜ Pharmacist Intervention
    ⬜ Medication Reconciliation
    ⬜ Counseling
    ⬜ Therapy Monitoring
    ⬜ Pharmaceutical Care
    ⬜ Permission
    ⬜ Pharmacy Integration
    ⬜ Medical Record Integration
    ⬜ E2E

2. 🚀 Runtime Radiologi

    Login:
    radiologi@mediva.test

    Test:
    ⬜ Dashboard
    ⬜ Master Modality
    ⬜ Master Pemeriksaan
    ⬜ Order Radiologi
    ⬜ Schedule
    ⬜ Study
    ⬜ Radiographer
    ⬜ Radiologist
    ⬜ Contrast
    ⬜ Result
    ⬜ Verification
    ⬜ Amendment
    ⬜ Attachment / PACS Reference
    ⬜ Billing Integration
    ⬜ Medical Record Integration
    ⬜ Permission
    ⬜ E2E

3. 🚀 Runtime IGD

    Login:
    perawat.igd@mediva.test

    Test:
    ⬜ Encounter
    ⬜ Triage
    ⬜ Nursing
    ⬜ Doctor
    ⬜ Observation
    ⬜ Lab
    ⬜ Radiologi
    ⬜ Pharmacy
    ⬜ Operating Room
    ⬜ Disposition
    ⬜ Admit Rawat Inap
    ⬜ E2E

4. 🚀 Runtime Rawat Jalan

    Login:
    perawat.rajal@mediva.test

    Test:
    ⬜ Check-In
    ⬜ Queue
    ⬜ Nursing
    ⬜ Doctor
    ⬜ Laboratory
    ⬜ Radiology
    ⬜ Prescription
    ⬜ Apoteker
    ⬜ Pharmacy
    ⬜ Billing
    ⬜ Follow-Up
    ⬜ Referral
    ⬜ Disposition
    ⬜ E2E

5. 🚀 Runtime Rawat Inap

    Login:
    perawat.ranap@mediva.test

    Test:
    ⬜ Admission
    ⬜ Bed Assignment
    ⬜ DPJP
    ⬜ Nursing
    ⬜ Daily Care
    ⬜ Laboratory
    ⬜ Radiology
    ⬜ Prescription
    ⬜ Apoteker
    ⬜ Pharmacy
    ⬜ Operating Room
    ⬜ Billing
    ⬜ Discharge Planning
    ⬜ Discharge
    ⬜ E2E

==================================================
MULTI ROLE TESTING
==================================================

⬜ Login nurse.multi@mediva.test

⬜ Role Switcher
⬜ Perawat
⬜ Perawat Rawat Inap

⬜ Sidebar berubah sesuai role
⬜ Permission berubah sesuai role
⬜ Dashboard berubah sesuai role

⬜ Login doctor.multi@mediva.test

⬜ Dokter
⬜ Management jika role tersedia

⬜ Role Switcher
⬜ Active Role
⬜ Permission
⬜ Navigation

==================================================
FULL CLINICAL E2E
==================================================

⬜ Pasien

↓

⬜ Pendaftaran

↓

⬜ Visit

↓

⬜ Queue

↓

⬜ IGD / Rawat Jalan / Rawat Inap

↓

⬜ Keperawatan

↓

⬜ Dokter

↓

⬜ Laboratory / Radiology

↓

⬜ Prescription

↓

⬜ Apoteker

↓

⬜ Pharmacy

↓

⬜ Operating Room jika dibutuhkan

↓

⬜ Billing

↓

⬜ Medical Record

↓

⬜ Discharge / Pulang

==================================================
SETELAH CLINICAL HIJAU
==================================================

OPERATIONAL HOSPITAL

🚧 General Inventory
→ Runtime

🚧 Asset & Alkes
→ Runtime

🚧 Procurement
→ Migration Final Check
→ Runtime

🚧 MFK
→ Runtime / E2E

MODUL BARU:

⬜ Maintenance
⬜ Housekeeping
⬜ Security

==================================================
SETELAH OPERATIONAL
==================================================

CORPORATE / OFFICE

✅ HR / SDM
✅ Customer Service
✅ Legal
✅ Diklat & Event

🚧 Media / Marketing
→ Runtime / E2E

⬜ Finance
⬜ IT

==================================================
MANAGEMENT
==================================================

✅ Management Dashboard Basic

⬜ Executive Dashboard V2

⬜ Clinical KPI
⬜ Operational KPI
⬜ Finance KPI
⬜ HR KPI
⬜ Inventory KPI
⬜ Procurement KPI
⬜ Patient Service KPI
⬜ Cross Module Analytics
⬜ Executive Alert

==================================================
OPTIONAL / PHASE 2
==================================================

🟡 Administrasi

🟡 Gudang Workspace
→ General Inventory

🟡 Asset Management Advanced
→ Asset & Alkes Phase 2

🟡 Vendor Management Advanced
→ Procurement Phase 2

🟡 PACS / DICOM Direct Integration

🟡 Automated Drug Interaction Database

==================================================
FINAL MEDIVA PHASE
==================================================

⬜ Review Semua Role

⬜ Final Permission Matrix

⬜ Final Unit Assignment

⬜ Final Multi-role Assignment

⬜ Buat Final Employee

⬜ Buat Final User

⬜ Hapus / nonaktifkan akun testing jika production

⬜ Security Hardening

⬜ Full Permission Testing

⬜ Full API Testing

⬜ Full Feature Testing

⬜ Full E2E Testing

⬜ Production Preparation

==================================================
URUTAN KITA SEKARANG
==================================================

1. 🚀 Runtime Apoteker ← SEKARANG

2. Runtime Radiologi

3. Runtime + E2E IGD

4. Runtime + E2E Rawat Jalan

5. Runtime + E2E Rawat Inap

6. Multi-role Testing

7. Full Clinical E2E

8. Runtime General Inventory

9. Runtime Asset & Alkes

10. Runtime Procurement

11. Runtime MFK

12. Maintenance

13. Housekeeping

14. Security

15. Media / Marketing Runtime

16. Finance

17. IT

18. Executive Dashboard V2

19. Final Role + Permission Matrix

20. Final User Creation

21. FULL MEDIVA END-TO-END TESTING

22. PRODUCTION PREPARATION
