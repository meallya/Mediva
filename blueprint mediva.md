# MEDIVA — MASTER PROJECT BLUEPRINT

> **Dokumen gabungan resmi** dari `mediva blueprint (gpt).md` dan `blueprint mediva (claude).md`.
> Dokumen ini dimaksudkan menjadi **single source of truth** untuk pengembangan MEDIVA.

| Item | Keputusan |
| --- | --- |
| Produk | MEDIVA — Sistem Informasi Manajemen Rumah Sakit |
| Model Sistem | Multi-role dashboard, satu sistem, satu database terintegrasi |
| Tim | 2 orang — Project Manager + Frontend Developer; Requirement Analyst + Backend Developer |
| Frontend | React JS + Tailwind CSS + Vite |
| Backend | Laravel |
| Database | MySQL/MariaDB (`mediva`) |
| Struktur | Monorepo |
| Frontend Architecture | Feature/module-based |
| Track Integrasi Aktif | React SPA/Router + REST API Laravel |
| Core Authorization | RBAC + active role/assignment + unit scoping |
| Status Awal | UI dashboard mulai dibangun; database dibuat; tabel belum lengkap |

### Aturan membaca dokumen
1. Bagian **Keputusan Arsitektur Final** mengalahkan contoh lama yang bertentangan dari salah satu blueprint sumber.
2. Semua detail bisnis dari kedua blueprint tetap dipertahankan selama tidak saling meniadakan.
3. Blueprint adalah dokumen hidup; perubahan besar harus dicatat sebagai ADR baru.
4. Modul dibangun per domain, bukan diduplikasi berdasarkan role.

---


## Daftar Isi Master

1. Project Overview & Ringkasan Eksekutif
2. Technology Stack & Development Team
3. Core Architecture & Product Principles
4. Keputusan Arsitektur Final
5. Multi-Role, RBAC, Unit Scoping & Role Switcher
6. Peta Role → Domain → Modul
7. MVP Scope & Detailed Module Blueprint
8. Frontend Architecture (Per-Module)
9. Dashboard Composition & Dynamic Navigation
10. Styling System & Design Token
11. Backend Architecture & API Convention
12. Database Blueprint
13. Security, Privacy & Audit
14. Red Code IT & Helpdesk
15. SATUSEHAT, BPJS & Insurance Integration
16. Frontend Tasks & Backend Tasks
17. Development Roadmap & Sprint Order
18. Clean Code, Git, Testing & Definition of Done
19. One Source of Truth & Audit Trail
20. Future Modules & Product Goal
21. Risk Register
22. Current Project Status & Next Recommended Tasks
23. Appendices

---


## 1. Project Overview & Ringkasan Eksekutif

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

### Ringkasan Eksekutif Tambahan

### 1.1 Apa itu Mediva

Mediva adalah SIMRS berbasis web dengan **dashboard terpisah per role, tetapi data dan proses tetap satu kesatuan**. Seorang perawat IGD tidak akan melihat menu perpajakan, dan seorang staf keuangan tidak akan melihat form asuhan keperawatan — tapi resep yang ditulis dokter langsung muncul di antrean farmasi, dan tindakan yang diinput perawat langsung terhitung di billing.

### 1.2 Tiga Masalah yang Mediva Selesaikan

| Masalah                                                                                          | Solusi Mediva                                                                         |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| SIMRS umumnya menampilkan semua menu ke semua orang, bikin bingung dan rawan salah klik          | Dashboard per role dengan menu dinamis, satu sumber data                              |
| Satu pegawai RS sering punya lebih dari satu jabatan, tapi sistem cuma kasih satu akun/satu role | Multi-role per user (1–4 role) dengan **role switcher** dan audit "bertindak sebagai" |
| Kalau server atau jaringan bermasalah, tim IT baru tahu setelah ada yang telepon                 | **Red Code IT** — deteksi otomatis, alarm berjenjang, eskalasi WhatsApp               |

### 1.3 Prinsip Desain

1. **Domain-driven, bukan role-driven, di layer data.** Modul disusun berdasarkan proses bisnis (pendaftaran, rekam medis, farmasi), bukan berdasarkan siapa yang memakai. Dashboard role hanya "merakit" modul yang relevan. Ini yang membuat sistem tetap terintegrasi walau tampilannya terpisah.
2. **Server adalah satu-satunya sumber kebenaran otorisasi.** Frontend tidak pernah dipercaya. Menu yang disembunyikan bukan menu yang diamankan.
3. **Rekam medis bersifat append-only.** Tidak ada hard delete. Setiap perubahan tercatat siapa, kapan, dan versi sebelumnya — sesuai Permenkes 24/2022.
4. **Bangun untuk RS Umum dulu, tapi jangan hardcode.** Struktur unit, poliklinik, dan modul dibuat konfigurabel supaya nanti bisa dipakai klinik atau RS khusus tanpa ganti kode.
5. **Dikerjakan berdua, jadi setiap fase harus punya nilai pakai.** Tidak ada fase yang hasilnya "belum bisa dipakai".

---

---

## 2. Technology Stack & Development Team

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

### Package / Library yang Dipertahankan dari Kedua Blueprint

**Backend / Laravel:**
- `spatie/laravel-permission` — basis RBAC/permission bila sesuai implementasi final.
- `spatie/laravel-activitylog` — audit trail.
- `barryvdh/laravel-dompdf` — kebutuhan cetak dokumen seperti resume, resep, dan kuitansi.
- Laravel Queue — job asynchronous; database driver dapat digunakan lebih dulu, lalu Redis bila kebutuhan meningkat.
- `laravel/reverb` — kebutuhan realtime seperti Red Code.
- `maatwebsite/excel` — ekspor laporan.
- `laravel/sanctum` — dipertahankan sebagai opsi autentikasi/akses API ketika memang diperlukan oleh arsitektur API atau bridging.

**Frontend / React:**
- React Router — routing track aktif.
- Axios atau fetch wrapper terpusat — komunikasi dengan API Laravel.
- `@tanstack/react-table` — tabel data kompleks.
- `date-fns` — manipulasi tanggal.
- `laravel-echo` + client WebSocket — realtime Red Code bila digunakan bersama Reverb.
- `recharts` — grafik dashboard manajemen/direksi.

> `@inertiajs/react` tetap tercatat sebagai alternatif dari blueprint sumber, tetapi tidak menjadi dependency wajib pada track aktif React Router + API.


---

## 3. Core Architecture & Product Principles

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

### Prinsip Produk

- Dashboard berbeda berdasarkan role, tetapi data dan business process tetap satu kesatuan.
- Backend adalah sumber kebenaran authorization.
- Rekam medis dan aktivitas sensitif wajib memiliki histori perubahan/audit.
- Struktur unit dan role dibuat konfigurabel.
- Setiap fase harus menghasilkan nilai pakai yang dapat diuji.

---

## 4. Keputusan Arsitektur Final (Hasil Penggabungan)

Bagian ini menjadi keputusan utama ketika dua blueprint memiliki pendekatan yang berbeda. Untuk menjaga kesesuaian dengan struktur MEDIVA yang sudah berjalan (`AppRouter.jsx`, `modules/`, `shared/`, serta integrasi frontend-backend melalui API), **track aktif blueprint gabungan adalah React SPA/module-based + Laravel REST API dalam satu monorepo**.

Pendekatan Inertia.js dari blueprint kedua **tetap dipertahankan sebagai ADR alternatif yang sudah dievaluasi**, karena alasan session security, server-side authorization, dan penyederhanaan tim tetap relevan. Namun Inertia dan React Router tidak dijalankan bersamaan sebagai router utama. Jika suatu hari tim bermigrasi ke Inertia, perubahan tersebut harus dibuat sebagai ADR baru dan frontend routing/API flow diperbarui secara menyeluruh.

### ADR-01 — React SPA + Laravel REST API dalam Monorepo
- React tetap menjadi frontend utama.
- Routing frontend menggunakan React Router / `AppRouter.jsx`.
- Laravel menjadi backend, business logic, authentication, authorization, audit, dan API.
- Prefix endpoint internal menggunakan `/api`.
- Frontend tidak menjadi sumber kebenaran permission; Laravel tetap melakukan authorization pada setiap operasi sensitif.
- Jangan menyimpan data sensitif atau mengandalkan penyembunyian menu sebagai mekanisme keamanan.

### ADR-02 — Role Terpisah dari Unit
- `Dokter`, `Perawat`, `IT`, `Keuangan`, dan jabatan fungsional lain adalah **role**.
- `Rawat Jalan`, `Rawat Inap`, `IGD`, poli, instalasi, atau lokasi kerja adalah **unit**.
- Penugasan ideal dimodelkan sebagai kombinasi `(user, role, unit)`.
- Dengan model ini, `Perawat @ IGD` dan `Perawat @ Rawat Inap` tidak perlu menjadi dua role berbeda.

### ADR-03 — Role Aktif Membatasi Permission
Saat user memiliki 2–4 role, permission yang berlaku hanya milik role/assignment yang sedang aktif. Permission beberapa role **tidak digabung** dalam satu sesi. Setiap aksi audit harus menyimpan role aktif yang dipakai saat aksi dilakukan.

### ADR-04 — Modul Berbasis Domain, Dashboard Berbasis Role
`modules/` mengikuti proses bisnis, bukan role. Dashboard role hanya merakit modul/widget yang relevan. Logika resep, pasien, billing, stok, dan RME tidak boleh diduplikasi per dashboard.

### ADR-05 — Styling Terpusat
Tailwind CSS tetap digunakan. Design token dan class semantik dapat ditempatkan pada CSS terpisah melalui `@apply` untuk komponen yang berulang, sementara struktur frontend tetap modular dan tidak menggunakan inline style untuk logika styling utama.

### ADR-06 — Relational Database + InnoDB
MySQL/MariaDB dengan foreign key dan transaksi digunakan sebagai penyimpanan utama karena alur rumah sakit saling berhubungan dan memerlukan konsistensi transaksi.

### ADR-07 — Queue Sejak Fondasi
Pekerjaan lambat seperti notifikasi, laporan, bridging, health check, dan proses integrasi harus diarahkan ke queue agar tidak memblokir request utama.

### ADR-08 — Watchdog Eksternal untuk Red Code
Monitoring server tidak boleh hanya hidup di server MEDIVA sendiri. Red Code menggunakan monitor internal **dan** watchdog eksternal agar insiden masih dapat terdeteksi ketika server utama mati.

---

## 5. Multi-Role, RBAC, Unit Scoping & Role Switcher

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

### Detail Identitas, Assignment, Role Switcher, Permission & Unit Scoping

Ini adalah bagian paling kritis. Kalau salah di sini, semua modul lain ikut salah.

### 4.1 Model Konseptual

```
                    ┌──────────────┐
                    │    USERS     │  pegawai RS
                    └──────┬───────┘
                           │
                    ┌──────┴────────────┐
                    │ ROLE_ASSIGNMENTS  │  1 user bisa punya 1–4 baris
                    │ (user, role,unit) │
                    └───┬───────────┬───┘
                        │           │
              ┌─────────┴──┐   ┌────┴─────┐
              │   ROLES    │   │  UNITS   │
              │ (jabatan)  │   │(instalasi│
              └─────┬──────┘   │/ bagian) │
                    │          └──────────┘
          ┌─────────┴─────────┐
          │ PERMISSION_ROLE   │
          └─────────┬─────────┘
                    │
            ┌───────┴────────┐
            │  PERMISSIONS   │  contoh: rme.read, resep.create
            └────────────────┘
```

### 4.2 Alur Login dengan Multi-Role

```
[1] User buka /login
        ↓
[2] Input NIP/email + password  →  rate limit 5x per menit per IP
        ↓
[3] Kredensial benar?  ── tidak →  catat login_attempt, tampilkan pesan generik
        ↓ ya
[4] Akun aktif & belum kadaluarsa?  ── tidak →  tolak dengan alasan spesifik
        ↓ ya
[5] Role wajib 2FA (IT / Direksi / Keuangan)?  ── ya →  minta kode TOTP
        ↓
[6] Hitung jumlah penugasan aktif user
        ↓
   ┌────┴─────────────────────────┐
   │                              │
[7a] Hanya 1 penugasan       [7b] 2–4 penugasan
   │                              │
   │                         Tampilkan halaman
   │                         "Pilih Peran"
   │                              │
   └────────────┬─────────────────┘
                ↓
[8] Simpan active_assignment_id ke session (server-side)
        ↓
[9] Muat permission milik role aktif SAJA
        ↓
[10] Bangun menu navigasi dari permission tersebut
        ↓
[11] Redirect ke dashboard sesuai (role, unit)
        ↓
[12] Catat di audit_logs: siapa, kapan, IP, bertindak sebagai role apa
```

### 4.3 Halaman "Pilih Peran"

Ketika user punya lebih dari satu penugasan, tampilkan kartu-kartu peran. Contoh untuk dr. Andi yang juga menjabat Direktur Penunjang Medis:

```
┌───────────────────────────────────────────────────────┐
│  Selamat datang, dr. Andi Wijaya, Sp.PD               │
│  Anda memiliki 2 peran. Pilih peran untuk sesi ini.   │
│                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  🩺                 │  │  🏛️                 │     │
│  │  Dokter             │  │  Direktur           │     │
│  │  Poli Penyakit      │  │  Penunjang Medis    │     │
│  │  Dalam              │  │                     │     │
│  │                     │  │                     │     │
│  │  12 pasien menunggu │  │  4 approval pending │     │
│  │                     │  │                     │     │
│  │  [ Masuk ]          │  │  [ Masuk ]          │     │
│  └─────────────────────┘  └─────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

Angka di kartu (12 pasien menunggu, 4 approval pending) diambil dari query ringan saat halaman dirender. Ini detail kecil yang membuat sistem terasa hidup dan membantu user memilih peran yang paling mendesak.

### 4.4 Role Switcher

Setelah masuk, role switcher tersedia di pojok kanan atas topbar. Menekan tombol ini:

1. Meminta konfirmasi kalau ada form yang belum tersimpan
2. Mengirim `POST /peran/ganti` dengan `assignment_id` tujuan
3. Server memvalidasi bahwa assignment tersebut **memang milik user ini** dan masih aktif
4. Server me-regenerate session ID (mencegah session fixation)
5. Server mencatat pergantian di `audit_logs`
6. Redirect ke dashboard peran baru

**Penting:** validasi di langkah 3 tidak boleh dilewat. Tanpa itu, user bisa mengirim `assignment_id` milik orang lain dan mengambil alih peran apapun.

### 4.5 Konvensi Penamaan Permission

Format: `domain.aksi` atau `domain.subdomain.aksi`.

```
# Rekam Medis
rme.read                    lihat rekam medis
rme.create                  buat entri baru
rme.update                  koreksi entri (dengan revisi tercatat)
rme.sign                    tanda tangan elektronik
rme.export                  cetak / unduh resume medis

# Farmasi
resep.create                tulis resep
resep.read
resep.verify                verifikasi apoteker
resep.dispense              serahkan obat ke pasien
resep.substitute            ganti obat (generik/kosong stok)

# Gudang
stok.read
stok.adjust                 penyesuaian stok
stok.opname                 stok opname
stok.receive                terima barang dari supplier

# IT Operations
redcode.acknowledge         ambil alih insiden
redcode.resolve             tutup insiden
redcode.configure           atur ambang batas & jadwal on-call
helpdesk.assign
system.impersonate          masuk sebagai user lain (IT saja, wajib dicatat)
```

Aturan penting: **jangan pernah mengecek role secara langsung di kode.** Selalu cek permission.

```php
// ❌ SALAH — rapuh, dan salah secara konseptual
if ($user->hasRole('dokter')) {
    // ...
}

// ✅ BENAR — permission bisa dipindah antar role tanpa ubah kode
if ($user->can('resep.create')) {
    // ...
}
```

Kenapa penting? Karena di RS berbeda, yang boleh menulis resep bisa berbeda (dokter saja, atau dokter + dokter gigi + bidan dengan batasan). Kalau kalian mengecek role langsung, setiap RS baru butuh perubahan kode. Kalau mengecek permission, cukup ubah data.

### 4.6 Scoping Berdasarkan Unit

Permission menjawab "boleh melakukan apa". Unit menjawab "atas data siapa".

Contoh: `Perawat @ IGD` punya `rme.read`, tapi hanya boleh membaca RME pasien yang **sedang** berada di IGD. Ini diimplementasikan lewat Policy dan global scope:

```php
// app/Policies/MedicalRecordPolicy.php
public function view(User $user, MedicalRecord $record): bool
{
    if (! $user->can('rme.read')) {
        return false;
    }

    // Role dengan akses lintas unit
    if ($user->can('rme.read.all')) {
        return true;
    }

    // Selain itu: hanya pasien yang encounter aktifnya di unit user
    return $record->encounter->unit_id === $user->activeUnit()->id
        && $record->encounter->isActive();
}
```

Tambahan penting untuk RS: sediakan mekanisme **break-glass**. Dalam kondisi darurat, tenaga medis kadang perlu membaca RME pasien di luar unitnya (misal pasien ranap tiba-tiba drop dan dokter jaga IGD dipanggil). Sistem harus mengizinkan, tapi:

- Meminta alasan tertulis
- Memberi peringatan bahwa akses ini dicatat khusus
- Mengirim notifikasi ke Rekam Medis & IT
- Masuk ke laporan audit bulanan

Ini praktik standar di rumah sakit dan akan ditanyakan saat akreditasi.

---

> **Penyesuaian skema gabungan:** gunakan konsep `role_assignments(user_id, role_id, unit_id)` sebagai evolusi dari `user_roles`. Untuk role yang tidak terikat unit tertentu, `unit_id` dapat nullable sesuai desain database final.

---

## 6. Peta Role → Domain → Modul

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

### Pemetaan Role yang Lebih Detail

### 5.1 Pengelompokan Role

| #   | Kelompok                   | Role                                                                         |
| --- | -------------------------- | ---------------------------------------------------------------------------- |
| A   | **Pelayanan Medis**        | Dokter, Perawat, Operasi (Bedah/OK)                                          |
| B   | **Penunjang Medis**        | Apoteker, Farmasi, Laboratorium, Ahli Gizi, Gudang Obat & Alkes, Rekam Medis |
| C   | **Front Office**           | Pendaftaran Pasien (Umum/Asuransi), Customer Service, Administrasi, Casemix  |
| D   | **Keuangan**               | Keuangan, Perpajakan                                                         |
| E   | **Manajemen**              | Direksi, Manager Pengembangan RS, Manager Per-Unit, Admin RS                 |
| F   | **SDM & Umum**             | HRD/SDM, Diklat, Tata Usaha, Legal, Keamanan & Umum, MFK                     |
| G   | **Teknologi & Komunikasi** | IT, Marketing Komunikasi, Digital Marketing                                  |
| —   | **Unit (bukan role)**      | Rajal, Ranap, IGD → lihat [ADR-02](#adr-02--role-terpisah-dari-unit)         |

### 5.2 Detail Per Role

Kolom **Modul Utama** menentukan menu apa yang muncul. Kolom **Akses RME** menentukan tingkat akses ke rekam medis pasien — ini yang paling sensitif dan paling sering ditanyakan auditor.

#### A. Pelayanan Medis

| Role             | Modul Utama                                                                          | Akses RME                                                          | Widget Dashboard                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Dokter**       | Rawat Jalan, Rawat Inap, IGD, Rekam Medis, Resep, Permintaan Lab/Rad, Jadwal Praktik | Baca-tulis, pasien di bawah asuhannya                              | Antrean pasien hari ini, pasien ranap yang perlu visit, hasil lab baru, resep menunggu, jadwal operasi |
| **Perawat**      | Asuhan Keperawatan, CPPT, Observasi TTV, Serah Terima Shift, Permintaan Obat         | Baca-tulis terbatas (tidak boleh diagnosis medis), scoped per unit | Pasien di ruangannya, jadwal obat, TTV yang jatuh tempo, catatan serah terima                          |
| **Operasi (OK)** | Penjadwalan OK, Checklist Keselamatan, Laporan Operasi, Pemakaian Alkes              | Baca-tulis pada encounter bedah                                    | Jadwal operasi hari ini, kesiapan ruang, checklist yang belum lengkap                                  |

#### B. Penunjang Medis

| Role                    | Modul Utama                                                                          | Akses RME                              | Widget Dashboard                                                             |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| **Apoteker**            | Verifikasi Resep, Telaah Interaksi Obat, Konseling, Substitusi                       | Baca diagnosis & alergi (untuk telaah) | Resep menunggu verifikasi, peringatan interaksi obat, permintaan substitusi  |
| **Farmasi**             | Penyerahan Obat, Antrean Farmasi, Racikan, Retur Obat                                | Baca resep saja                        | Antrean penyerahan, resep racikan, obat menipis, obat mendekati kadaluarsa   |
| **Laboratorium**        | Order Lab, Sampling, Input Hasil, Validasi, Kontrol Mutu                             | Baca order + tulis hasil               | Order masuk, sampel menunggu, hasil kritis yang belum dilaporkan             |
| **Ahli Gizi**           | Skrining Gizi, Asuhan Gizi, Diet Order, Distribusi Makanan                           | Baca-tulis bagian gizi                 | Pasien perlu skrining, diet khusus hari ini, jadwal distribusi               |
| **Gudang Obat & Alkes** | Stok, Batch & Kadaluarsa, Permintaan Unit, Penerimaan, Stok Opname, Supplier         | Tidak ada                              | Stok minimum, barang hampir kadaluarsa, permintaan unit pending, PO berjalan |
| **Rekam Medis**         | Berkas RM, Koding ICD-10/ICD-9CM, Kelengkapan Berkas, Peminjaman, Retensi, Pelaporan | Baca penuh (ini memang tugasnya)       | Berkas belum lengkap, berkas belum dikoding, permintaan resume medis         |

#### C. Front Office

| Role                   | Modul Utama                                                                                        | Akses RME                   | Widget Dashboard                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| **Pendaftaran Pasien** | Registrasi Pasien Baru/Lama, Pencarian Pasien, Verifikasi Penjamin, Cek Eligibilitas BPJS, Antrean | Hanya data demografi        | Antrean pendaftaran, kuota poli, status koneksi BPJS, pasien tanpa NIK |
| **Customer Service**   | Informasi Layanan, Komplain & Saran, Jadwal Dokter, Bantuan Pasien                                 | Tidak ada                   | Komplain terbuka, jadwal dokter hari ini, FAQ tersering                |
| **Administrasi**       | Administrasi Pasien, Surat Keterangan, Kelengkapan Dokumen, Legalisasi Berkas                      | Baca terbatas               | Dokumen menunggu proses, surat keterangan pending                      |
| **Casemix**            | Grouping INA-CBG, Verifikasi Klaim, Berkas Klaim, Pending Klaim, Dispute BPJS                      | Baca untuk keperluan koding | Klaim siap kirim, klaim pending, selisih tarif, deadline pengajuan     |

#### D. Keuangan

| Role           | Modul Utama                                                        | Akses RME                               | Widget Dashboard                                                             |
| -------------- | ------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| **Keuangan**   | Billing, Kasir, Piutang, Utang, Jurnal, Arus Kas, Laporan Keuangan | Tidak ada (hanya kode tindakan & tarif) | Pendapatan hari ini, piutang jatuh tempo, tagihan belum lunas, deposit ranap |
| **Perpajakan** | PPh 21 Tenaga Medis, PPN, e-Faktur, SPT, Rekap Pajak               | Tidak ada                               | Pajak jatuh tempo, faktur belum diterbitkan, rekap bulanan                   |

#### E. Manajemen

| Role                        | Modul Utama                                                                                    | Akses RME                                | Widget Dashboard                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Direksi**                 | Dashboard Eksekutif, BOR/LOS/TOI, Indikator Mutu, Laporan Keuangan Ringkas, Approval Strategis | Agregat saja, **tanpa identitas pasien** | BOR & okupansi, pendapatan vs target, indikator mutu, insiden keselamatan, approval menunggu |
| **Manager Pengembangan RS** | Perencanaan, Analisis Layanan Baru, Studi Kelayakan, Monitoring Proyek, Kerjasama              | Agregat                                  | Proyek berjalan, milestone, analisis tren layanan                                            |
| **Manager Per-Unit**        | Dashboard Unit, SDM Unit, Kinerja Unit, Anggaran Unit, Approval Unit                           | Agregat unit-nya                         | Kinerja unit, absensi staf, permintaan pending, insiden unit                                 |
| **Admin RS**                | Manajemen Master Data, Struktur Organisasi, Konfigurasi Layanan, Tarif                         | Tidak ada                                | Data master perlu update, tarif belum diatur, unit belum lengkap                             |

#### F. SDM & Umum

| Role                | Modul Utama                                                                                    | Akses RME               | Widget Dashboard                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| **HRD/SDM**         | Data Pegawai, Absensi, Jadwal Shift, Cuti, Payroll, Kredensial & STR/SIP                       | Tidak ada               | STR/SIP hampir kadaluarsa, cuti menunggu approval, absensi bermasalah |
| **Diklat**          | Program Pelatihan, Peserta, Sertifikat, Evaluasi, SKP                                          | Tidak ada               | Pelatihan mendatang, sertifikat kadaluarsa, kebutuhan SKP per pegawai |
| **Tata Usaha**      | Surat Masuk/Keluar, Disposisi, Arsip, Notulen, Agenda Pimpinan                                 | Tidak ada               | Surat belum didisposisi, agenda hari ini                              |
| **Legal**           | Kontrak & MoU, Perizinan RS, Regulasi Internal, Kasus Hukum, Informed Consent Register         | Baca dokumen legal saja | Izin hampir kadaluarsa, kontrak perlu perpanjangan, kasus aktif       |
| **Keamanan & Umum** | Patroli, Buku Tamu, Parkir, Kehilangan Barang, Insiden Keamanan, Kebersihan                    | Tidak ada               | Insiden keamanan, tamu aktif, jadwal patroli                          |
| **MFK**             | Aset & Alat Medis, Kalibrasi, Pemeliharaan, K3RS, Limbah B3, Sistem Utilitas, Kesiapan Bencana | Tidak ada               | Kalibrasi jatuh tempo, alat rusak, jadwal maintenance, laporan K3     |

#### G. Teknologi & Komunikasi

| Role                     | Modul Utama                                                                                                                   | Akses RME                                                     | Widget Dashboard                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **IT**                   | **Semua modul** + Command Center, Manajemen User & Role, Red Code, Helpdesk, Backup, Audit Log, Konfigurasi Sistem, Integrasi | Akses teknis dengan pencatatan wajib (lihat catatan di bawah) | Status server & jaringan, insiden aktif, tiket helpdesk, user aktif, kesehatan integrasi, status backup |
| **Marketing Komunikasi** | Publikasi, Media Sosial RS, Event, Hubungan Media, Materi Promosi                                                             | Tidak ada                                                     | Jadwal publikasi, event mendatang, mention media                                                        |
| **Digital Marketing**    | Website RS, SEO, Iklan Digital, Analitik Kunjungan, Landing Page Layanan                                                      | Tidak ada                                                     | Trafik website, konversi pendaftaran online, performa kampanye                                          |

> **Catatan penting soal akses IT ke RME.**
> Kalian menyebut "kendali lengkap akan dikendalikan oleh tim IT". Secara teknis ini benar — IT memang perlu akses penuh ke sistem. Tapi secara medikolegal, "IT bisa membaca rekam medis pasien kapan saja tanpa jejak" adalah temuan audit yang serius dan berpotensi melanggar UU PDP.
>
> Rancangan yang aman: IT punya kendali penuh atas **sistem** (user, role, konfigurasi, server, backup), tapi akses ke **isi rekam medis** melewati mekanisme break-glass — butuh alasan tertulis, otomatis memberi tahu Rekam Medis dan Direksi, dan masuk laporan audit. Ini tidak menghambat pekerjaan IT (debugging biasanya tidak butuh isi RME asli), tapi menyelamatkan kalian saat akreditasi.

### 5.3 Modul Bersama Semua Role

Modul ini muncul di dashboard **semua** role tanpa kecuali:

| Modul                      | Fungsi                                                         |
| -------------------------- | -------------------------------------------------------------- |
| **Profil & Keamanan Akun** | Ubah password, atur 2FA, lihat riwayat login, kelola perangkat |
| **Notifikasi**             | Pusat notifikasi terpadu, pengaturan preferensi                |
| **Bantuan IT**             | Buat tiket helpdesk, tombol panggil IT, status Red Code        |
| **Pengumuman RS**          | Broadcast dari manajemen                                       |
| **Direktori Internal**     | Cari kontak & ekstensi antar unit                              |
| **Role Switcher**          | Muncul hanya bila user punya >1 penugasan                      |

---

---

## 7. MVP Scope & Detailed Module Blueprint

### MVP Scope

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

### Module Blueprint

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

### Patient Module

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

### Registration Module

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

### Doctor Examination

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

### Medical Record Module

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

### Electronic Prescription

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

### Pharmacy

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

### Billing / Cashier

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

### Dashboard Concept

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

---

## 8. Frontend Architecture — Feature/Module Based

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

### Integrasi dengan Konsep Dashboard Role

- `modules/` tetap menjadi pemilik business UI per domain.
- Dashboard role tidak boleh membuat ulang page/form yang sebenarnya sudah dimiliki module.
- Jika dibutuhkan folder komposisi dashboard terpisah, gunakan `modules/dashboard/roles/` atau `dashboards/` **hanya untuk komposisi widget**, bukan tempat business logic.
- Struktur MEDIVA yang sudah ada (`modules/auth`, `modules/dashboard`, `shared/components/layout`) tetap valid dan dikembangkan bertahap.

---

## 9. Dashboard Composition & Dynamic Navigation

### Kenapa Dashboard Hanya "Merakit"

Ini inti dari "terpisah tapi terintegrasi". Dashboard dokter tidak menulis logika apa pun — ia hanya menyusun widget dari berbagai modul:

```jsx
// resources/js/dashboards/dokter/DashboardDokter.jsx
import DashboardShell from "@/shared/layouts/DashboardShell";
import AntreanPasienWidget from "@/modules/rawat-jalan/widgets/AntreanPasienWidget";
import PasienRanapWidget from "@/modules/rawat-inap/widgets/PasienVisitWidget";
import HasilLabBaruWidget from "@/modules/laboratorium/widgets/HasilBaruWidget";
import ResepMenungguWidget from "@/modules/farmasi/widgets/ResepMenungguWidget";
import JadwalOperasiWidget from "@/modules/operasi/widgets/JadwalHariIniWidget";

export default function DashboardDokter({ ringkasan }) {
    return (
        <DashboardShell title="Dashboard Dokter">
            <div className="dashboard-grid">
                <section className="dashboard-grid__main">
                    <AntreanPasienWidget data={ringkasan.antrean} />
                    <PasienRanapWidget data={ringkasan.pasienRanap} />
                </section>

                <aside className="dashboard-grid__side">
                    <HasilLabBaruWidget data={ringkasan.hasilLab} />
                    <ResepMenungguWidget data={ringkasan.resep} />
                    <JadwalOperasiWidget data={ringkasan.operasi} />
                </aside>
            </div>
        </DashboardShell>
    );
}
```

Perhatikan: `ResepMenungguWidget` diimpor dari `modules/farmasi`. Dokter dan apoteker memakai **komponen yang sama persis** dengan data berbeda. Kalau logika resep berubah, cukup ubah di satu tempat.

### Menu Dinamis Berdasarkan Permission

`config/navigation.js` mendefinisikan seluruh kemungkinan menu. Sidebar menyaringnya berdasarkan permission role aktif:

```js
// resources/js/config/navigation.js
export const navigation = [
    {
        group: "Pelayanan",
        items: [
            {
                label: "Antrean Pasien",
                href: "/rawat-jalan/antrean",
                icon: "queue",
                permission: "rajal.read",
            },
            {
                label: "Rekam Medis",
                href: "/rekam-medis",
                icon: "file",
                permission: "rme.read",
            },
            {
                label: "Resep",
                href: "/farmasi/resep",
                icon: "pill",
                permission: "resep.read",
            },
            {
                label: "Permintaan Lab",
                href: "/laboratorium/order",
                icon: "flask",
                permission: "lab.order",
            },
        ],
    },
    {
        group: "Farmasi",
        items: [
            {
                label: "Verifikasi Resep",
                href: "/farmasi/verifikasi",
                icon: "check",
                permission: "resep.verify",
            },
            {
                label: "Penyerahan Obat",
                href: "/farmasi/penyerahan",
                icon: "handover",
                permission: "resep.dispense",
            },
            {
                label: "Stok Obat",
                href: "/logistik/stok",
                icon: "box",
                permission: "stok.read",
            },
        ],
    },
    {
        group: "Sistem",
        items: [
            {
                label: "Command Center",
                href: "/it/command-center",
                icon: "monitor",
                permission: "redcode.read",
            },
            {
                label: "Helpdesk",
                href: "/it/helpdesk",
                icon: "headset",
                permission: "helpdesk.assign",
            },
            {
                label: "Manajemen User",
                href: "/it/users",
                icon: "users",
                permission: "user.manage",
            },
            {
                label: "Audit Log",
                href: "/it/audit",
                icon: "shield",
                permission: "audit.read",
            },
        ],
    },
];
```

```jsx
// resources/js/shared/hooks/useNavigation.js
// permission berasal dari AuthContext / endpoint current-user
import { navigation } from "@/config/navigation";

export function useNavigation() {
    const { permissions } = useAuth();
    const granted = new Set(permissions);

    return navigation
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => granted.has(item.permission)),
        }))
        .filter((group) => group.items.length > 0);
}
```

> **Ini filter tampilan, bukan pengamanan.** Menyembunyikan menu tidak menghalangi siapa pun mengetik URL langsung. Setiap route **wajib** dilindungi middleware permission di sisi Laravel. Frontend menyembunyikan untuk kenyamanan; backend menolak untuk keamanan.

### Aturan Komponen

| Aturan                                                                                   | Alasan                                       |
| ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| Satu komponen = satu file, maksimal ~200 baris                                           | Kalau lebih, hampir pasti bisa dipecah       |
| Komponen `shared/` tidak boleh mengimpor dari `modules/`                                 | Mencegah dependensi melingkar                |
| Modul tidak boleh mengimpor dari modul lain secara langsung — lewat `shared/` atau props | Menjaga batas domain tetap jelas             |
| Semua props divalidasi (PropTypes atau TypeScript)                                       | Menangkap bug integrasi lebih awal           |
| Tidak ada `dangerouslySetInnerHTML`                                                      | Pintu masuk XSS nomor satu                   |
| Fetch data melalui service/API layer yang terpusat                                | Menghindari waterfall & state loading manual |
| Nama file komponen PascalCase, hook camelCase berawalan `use`                            | Konsistensi                                  |

---

---

## 10. Styling System & Design Token

### 7.1 Aturan Dasar

> **JSX hanya membawa class semantik. Semua utility Tailwind hidup di file `.css`.**

```jsx
// ❌ Yang dihindari
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 text-sm font-medium transition">
  Simpan
</button>

// ✅ Yang dipakai
<button className="btn btn--primary">Simpan</button>
```

```css
/* resources/css/components/button.css */
.btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg
         px-4 py-2 text-sm font-medium
         transition-colors duration-150
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
         disabled:cursor-not-allowed disabled:opacity-50;
}

.btn--primary {
    @apply bg-brand-600 text-white
         hover:bg-brand-700
         focus-visible:ring-brand-400;
}

.btn--danger {
    @apply bg-danger-600 text-white
         hover:bg-danger-700
         focus-visible:ring-danger-400;
}

.btn--ghost {
    @apply bg-transparent text-slate-700
         hover:bg-slate-100
         focus-visible:ring-slate-300;
}

.btn--sm {
    @apply px-3 py-1.5 text-xs;
}
.btn--lg {
    @apply px-6 py-3 text-base;
}
```

### 7.2 Struktur Folder CSS

```
resources/css/
├── app.css                  # entry — @import semua yang lain
├── tokens.css               # @theme: warna, spasi, radius, shadow, font
├── base/
│   ├── reset.css
│   ├── typography.css
│   └── scrollbar.css
├── components/
│   ├── button.css
│   ├── card.css
│   ├── form.css
│   ├── table.css
│   ├── modal.css
│   ├── badge.css
│   ├── tabs.css
│   ├── toast.css
│   ├── stat-tile.css
│   ├── empty-state.css
│   └── patient-banner.css
├── layouts/
│   ├── dashboard-shell.css
│   ├── sidebar.css
│   ├── topbar.css
│   ├── auth-layout.css
│   └── dashboard-grid.css
└── modules/
    ├── red-code.css         # gaya khusus banner & command center
    ├── antrean.css
    └── rme.css
```

`app.css`:

```css
@import "tailwindcss";
@import "./tokens.css";

@import "./base/reset.css";
@import "./base/typography.css";
@import "./base/scrollbar.css";

@import "./components/button.css";
@import "./components/card.css";
@import "./components/form.css";
@import "./components/table.css";
@import "./components/modal.css";
@import "./components/badge.css";
@import "./components/tabs.css";
@import "./components/toast.css";
@import "./components/stat-tile.css";
@import "./components/empty-state.css";
@import "./components/patient-banner.css";

@import "./layouts/dashboard-shell.css";
@import "./layouts/sidebar.css";
@import "./layouts/topbar.css";
@import "./layouts/auth-layout.css";
@import "./layouts/dashboard-grid.css";

@import "./modules/red-code.css";
@import "./modules/antrean.css";
@import "./modules/rme.css";
```

> **Catatan teknis Tailwind v4.** Karena semua file di atas di-`@import` ke dalam `app.css`, mereka dikompilasi sebagai satu kesatuan dan `@apply` bekerja langsung tanpa konfigurasi tambahan. Directive `@reference` hanya dibutuhkan kalau kalian memakai CSS Modules atau blok `<style>` yang dikompilasi terpisah — yang tidak kita pakai di sini.

### 7.3 Design Token

Ambil nilai dari Figma dan tuangkan ke `tokens.css`. Ini menjadi satu-satunya sumber kebenaran warna dan spasi:

```css
/* resources/css/tokens.css */
@theme {
    /* ── Brand Mediva ─────────────────────────── */
    --color-brand-50: #eff6ff;
    --color-brand-100: #dbeafe;
    --color-brand-200: #bfdbfe;
    --color-brand-300: #93c5fd;
    --color-brand-400: #60a5fa;
    --color-brand-500: #3b82f6;
    --color-brand-600: #2563eb;
    --color-brand-700: #1d4ed8;
    --color-brand-800: #1e40af;
    --color-brand-900: #1e3a8a;

    /* ── Status Klinis ────────────────────────── */
    --color-triage-merah: #dc2626; /* IGD: resusitasi   */
    --color-triage-kuning: #f59e0b; /* IGD: gawat        */
    --color-triage-hijau: #16a34a; /* IGD: tidak gawat  */
    --color-triage-hitam: #1f2937; /* IGD: meninggal    */

    /* ── Red Code IT ──────────────────────────── */
    --color-status-normal: #16a34a;
    --color-status-warning: #f59e0b;
    --color-status-degraded: #ea580c;
    --color-status-critical: #dc2626;

    /* ── Semantik Umum ────────────────────────── */
    --color-success-600: #16a34a;
    --color-warning-600: #d97706;
    --color-danger-600: #dc2626;
    --color-info-600: #0891b2;

    /* ── Tipografi ────────────────────────────── */
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;

    /* ── Radius & Shadow ──────────────────────── */
    --radius-card: 0.75rem;
    --radius-input: 0.5rem;
    --shadow-card: 0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04);
    --shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.12);

    /* ── Layout ───────────────────────────────── */
    --spacing-sidebar: 16rem;
    --spacing-sidebar-collapsed: 4.5rem;
    --spacing-topbar: 4rem;
}
```

Setelah didefinisikan di `@theme`, token otomatis tersedia sebagai utility: `bg-brand-600`, `text-triage-merah`, `rounded-card`, `shadow-card`.

Warna triase IGD sengaja dijadikan token karena punya makna klinis baku (merah/kuning/hijau/hitam). Jangan pernah mengetik hex-nya langsung di komponen — kalau suatu saat RS mengubah standar warnanya, kalian hanya perlu mengubah satu baris.

### 7.4 Konvensi Penamaan Class

Pola BEM yang disederhanakan:

```
.block                 → .card, .btn, .sidebar, .patient-banner
.block__element        → .card__header, .sidebar__item, .patient-banner__nik
.block--modifier       → .btn--primary, .card--elevated, .badge--triage-merah
.is-state              → .is-active, .is-loading, .is-collapsed, .is-disabled
```

Contoh lengkap untuk komponen banner pasien yang dipakai lintas modul:

```css
/* resources/css/components/patient-banner.css */
.patient-banner {
    @apply flex items-center gap-4 rounded-card bg-white p-4 shadow-card
         border-l-4 border-brand-600;
}

.patient-banner__avatar {
    @apply h-12 w-12 shrink-0 rounded-full bg-slate-100
         flex items-center justify-center text-slate-500;
}

.patient-banner__info {
    @apply min-w-0 flex-1;
}

.patient-banner__name {
    @apply truncate text-base font-semibold text-slate-900;
}

.patient-banner__meta {
    @apply mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1
         text-xs text-slate-500;
}

.patient-banner__alert {
    @apply rounded-md bg-danger-600/10 px-2 py-1
         text-xs font-medium text-danger-600;
}

.patient-banner--emergency {
    @apply border-triage-merah;
}
.patient-banner--inpatient {
    @apply border-info-600;
}
```

### 7.5 Menegakkan Aturan Secara Otomatis

Pasang ESLint:

```js
// eslint.config.js
export default [
    {
        files: ["resources/js/**/*.{js,jsx}"],
        rules: {
            // Larang style inline sepenuhnya
            "react/forbid-dom-props": [
                "error",
                {
                    forbid: [
                        {
                            propName: "style",
                            message:
                                "Style inline dilarang. Gunakan class semantik di resources/css/.",
                        },
                    ],
                },
            ],
            // Larang dangerouslySetInnerHTML
            "react/no-danger": "error",
        },
    },
];
```

Untuk mencegah utility Tailwind bocor ke JSX, tambahkan hook pre-commit yang menolak commit bila menemukan pola utility di `className`:

```bash
# .husky/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -E '\.jsx?$' | xargs grep -lE 'className="[^"]*\b(px|py|mt|mb|bg|text|flex|grid|gap)-[0-9a-z]' 2>/dev/null; then
  echo "❌ Utility Tailwind terdeteksi di JSX."
  echo "   Pindahkan ke file CSS di resources/css/ dan pakai class semantik."
  exit 1
fi
npm run lint
```

### 7.6 Trade-off yang Perlu Kalian Tahu

Pendekatan ini punya konsekuensi yang sebaiknya diketahui sejak awal, bukan ditemukan di tengah jalan:

| Keuntungan                                   | Biaya                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| JSX bersih dan mudah dibaca                  | Bolak-balik antara dua file saat menyusun tampilan                                  |
| Style bisa dipakai ulang dengan mudah        | Perlu disiplin menamai class dengan konsisten                                       |
| Cocok dengan Content Security Policy ketat   | Ukuran CSS sedikit lebih besar daripada Tailwind murni                              |
| Sesuai standar clean code                    | Tim Tailwind sendiri menyarankan `@apply` dipakai secukupnya, bukan untuk segalanya |
| Perubahan desain global cukup di satu tempat | Butuh waktu setup awal ~1 minggu untuk membangun design system                      |

Saran praktis: **investasikan minggu pertama Fase 2 untuk membangun ~20 komponen dasar sampai benar-benar solid.** Setelah itu, sisa proyek akan terasa jauh lebih cepat karena kalian tinggal menyusun.

---

---

## 11. Backend Architecture & API Convention

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

### Struktur Backend Target

```text
app/
├── Models/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   ├── Middleware/
│   └── Requests/
├── Services/
├── Repositories/
├── Policies/
├── Enums/
└── Domain/                  # dibuat bertahap saat domain mulai kompleks
    ├── Identity/
    ├── Registration/
    ├── MedicalRecord/
    ├── Pharmacy/
    ├── Inventory/
    ├── Billing/
    └── ItOperations/
```

### Domain Layer Tambahan
Untuk domain yang mulai besar, backend dapat berkembang dari struktur sederhana `Services/Repositories/Policies` menjadi folder domain seperti `Identity`, `Registration`, `MedicalRecord`, `Pharmacy`, `Inventory`, `Billing`, dan `ItOperations`. Evolusi dilakukan bertahap agar tidak over-engineered sejak awal.

---

## 12. Database Blueprint

### Core Database dari Blueprint MVP

### Authentication

```text
users
employees
roles
units
permissions
role_assignments
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

### role_assignments

```text
id
user_id
role_id
unit_id
is_default
is_active
created_at
updated_at
```

### role_permissions

```text
id
role_id
permission_id
```

---

### Skema Database Lengkap / Target Berkembang

Konvensi umum:

- Nama tabel: `snake_case`, bahasa Indonesia untuk domain klinis (lebih mudah dipahami tim RS)
- Primary key: `id` BIGINT UNSIGNED AUTO_INCREMENT
- Setiap tabel punya `created_at`, `updated_at`
- Tabel klinis punya `deleted_at` (soft delete) — **tidak pernah hard delete**
- Tabel transaksi punya `created_by`, `updated_by` (FK ke `users`)
- Semua tabel InnoDB, charset `utf8mb4_unicode_ci`
- Foreign key aktif dengan `ON DELETE RESTRICT` untuk data klinis

### 9.1 Grup 1 — Identitas & Akses

```sql
-- Pegawai rumah sakit
CREATE TABLE users (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nip                 VARCHAR(30)  NOT NULL UNIQUE,
    nama                VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    no_telepon          VARCHAR(30)  NULL,        -- terenkripsi
    foto_path           VARCHAR(255) NULL,
    two_factor_secret   TEXT         NULL,
    two_factor_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    status              ENUM('aktif','nonaktif','cuti','keluar') NOT NULL DEFAULT 'aktif',
    tgl_masuk           DATE         NULL,
    tgl_keluar          DATE         NULL,
    last_login_at       TIMESTAMP    NULL,
    last_login_ip       VARCHAR(45)  NULL,
    password_changed_at TIMESTAMP    NULL,
    email_verified_at   TIMESTAMP    NULL,
    remember_token      VARCHAR(100) NULL,
    created_at          TIMESTAMP    NULL,
    updated_at          TIMESTAMP    NULL,
    deleted_at          TIMESTAMP    NULL,
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- Unit / instalasi / bagian
CREATE TABLE units (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    parent_id   BIGINT UNSIGNED NULL,
    kode        VARCHAR(20)  NOT NULL UNIQUE,
    nama        VARCHAR(150) NOT NULL,
    tipe        ENUM('instalasi','poliklinik','ruangan','bagian','direktorat') NOT NULL,
    is_pelayanan BOOLEAN     NOT NULL DEFAULT TRUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NULL,
    updated_at  TIMESTAMP    NULL,
    FOREIGN KEY (parent_id) REFERENCES units(id) ON DELETE RESTRICT,
    INDEX idx_units_tipe (tipe)
) ENGINE=InnoDB;

-- Role / jabatan fungsional
CREATE TABLE roles (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kode           VARCHAR(50)  NOT NULL UNIQUE,   -- 'dokter', 'perawat', 'apoteker'
    nama           VARCHAR(100) NOT NULL,
    kelompok       ENUM('medis','penunjang','front_office','keuangan',
                        'manajemen','sdm_umum','teknologi') NOT NULL,
    dashboard_key  VARCHAR(50)  NOT NULL,          -- penentu komponen dashboard
    level          TINYINT      NOT NULL DEFAULT 1,-- untuk hierarki approval
    requires_2fa   BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_str   BOOLEAN      NOT NULL DEFAULT FALSE, -- tenaga medis
    deskripsi      TEXT         NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kode       VARCHAR(100) NOT NULL UNIQUE,       -- 'rme.read'
    nama       VARCHAR(150) NOT NULL,
    domain     VARCHAR(50)  NOT NULL,              -- 'rme', 'resep', 'stok'
    deskripsi  TEXT         NULL,
    is_sensitive BOOLEAN    NOT NULL DEFAULT FALSE,-- butuh pencatatan khusus
    created_at TIMESTAMP    NULL,
    updated_at TIMESTAMP    NULL,
    INDEX idx_perm_domain (domain)
) ENGINE=InnoDB;

CREATE TABLE permission_role (
    role_id       BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- INTI MULTI-ROLE: satu user bisa punya 1–4 baris di sini
CREATE TABLE role_assignments (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT UNSIGNED NOT NULL,
    role_id      BIGINT UNSIGNED NOT NULL,
    unit_id      BIGINT UNSIGNED NULL,             -- NULL = lintas unit
    is_primary   BOOLEAN      NOT NULL DEFAULT FALSE,
    sk_nomor     VARCHAR(100) NULL,                -- nomor SK penugasan
    berlaku_dari DATE         NOT NULL,
    berlaku_sampai DATE       NULL,                -- NULL = tanpa batas
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by   BIGINT UNSIGNED NULL,
    created_at   TIMESTAMP    NULL,
    updated_at   TIMESTAMP    NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_assignment (user_id, role_id, unit_id),
    INDEX idx_assignment_active (user_id, is_active)
) ENGINE=InnoDB;

-- Kredensial tenaga medis (STR/SIP) — dipantau HRD
CREATE TABLE kredensial_medis (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    jenis          ENUM('str','sip','sertifikat','kompetensi') NOT NULL,
    nomor          VARCHAR(100) NOT NULL,
    diterbitkan_oleh VARCHAR(150) NULL,
    berlaku_dari   DATE         NOT NULL,
    berlaku_sampai DATE         NOT NULL,
    berkas_path    VARCHAR(255) NULL,
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_kredensial_expiry (berlaku_sampai)
) ENGINE=InnoDB;

-- Audit trail — APPEND ONLY, tidak ada UPDATE/DELETE
CREATE TABLE audit_logs (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NULL,
    assignment_id BIGINT UNSIGNED NULL,            -- bertindak sebagai role apa
    aksi          VARCHAR(100) NOT NULL,           -- 'rme.viewed', 'role.switched'
    auditable_type VARCHAR(150) NULL,
    auditable_id  BIGINT UNSIGNED NULL,
    pasien_id     BIGINT UNSIGNED NULL,            -- untuk pelacakan akses RME
    nilai_lama    JSON NULL,
    nilai_baru    JSON NULL,
    alasan        TEXT NULL,                       -- wajib untuk break-glass
    ip_address    VARCHAR(45)  NULL,
    user_agent    VARCHAR(255) NULL,
    created_at    TIMESTAMP    NOT NULL,
    INDEX idx_audit_user   (user_id, created_at),
    INDEX idx_audit_pasien (pasien_id, created_at),
    INDEX idx_audit_aksi   (aksi, created_at)
) ENGINE=InnoDB;
```

### 9.2 Grup 2 — Master Data

| Tabel             | Kolom Kunci                                                                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pasien`          | `no_rm` (unik), `nik` (terenkripsi), `nik_hash` (index), `nama`, `tempat_lahir`, `tgl_lahir`, `jenis_kelamin`, `gol_darah`, `agama`, `pendidikan`, `pekerjaan`, `status_kawin`, `alamat_*`, `no_telepon`, `nama_ibu_kandung`, `kontak_darurat_*`, `ihs_number` (SATUSEHAT) |
| `penjamin`        | `kode`, `nama`, `tipe` (umum/bpjs/asuransi/perusahaan), `alamat`, `kontak`, `sistem_klaim`, `is_active`                                                                                                                                                                    |
| `pasien_penjamin` | `pasien_id`, `penjamin_id`, `no_kartu`, `kelas_hak`, `berlaku_sampai`                                                                                                                                                                                                      |
| `dokter`          | `user_id`, `no_str`, `no_sip`, `spesialisasi_id`, `sub_spesialisasi`, `tarif_konsul`, `kuota_harian`                                                                                                                                                                       |
| `spesialisasi`    | `kode`, `nama`                                                                                                                                                                                                                                                             |
| `jadwal_dokter`   | `dokter_id`, `unit_id`, `hari`, `jam_mulai`, `jam_selesai`, `kuota`, `is_active`                                                                                                                                                                                           |
| `ruangan`         | `unit_id`, `kode`, `nama`, `kelas`, `tarif_per_hari`, `jenis`                                                                                                                                                                                                              |
| `bed`             | `ruangan_id`, `kode`, `status` (kosong/terisi/perbaikan/steril), `pasien_id`                                                                                                                                                                                               |
| `tarif`           | `kode`, `nama`, `kategori`, `unit_id`, `harga_umum`, `harga_bpjs`, `berlaku_dari`, `berlaku_sampai`                                                                                                                                                                        |
| `icd10`           | `kode`, `nama_id`, `nama_en`, `kategori` (untuk diagnosis)                                                                                                                                                                                                                 |
| `icd9cm`          | `kode`, `nama_id`, `nama_en` (untuk tindakan/prosedur)                                                                                                                                                                                                                     |
| `obat`            | `kode`, `nama_generik`, `nama_dagang`, `bentuk_sediaan`, `kekuatan`, `satuan`, `golongan` (bebas/keras/psikotropika/narkotika), `is_generik`, `is_fornas`, `harga_beli`, `harga_jual`, `stok_minimum`                                                                      |
| `alkes`           | `kode`, `nama`, `kategori`, `satuan`, `harga_beli`, `harga_jual`, `stok_minimum`                                                                                                                                                                                           |
| `supplier`        | `kode`, `nama`, `alamat`, `npwp`, `kontak_person`, `no_telepon`, `termin_pembayaran`                                                                                                                                                                                       |

### 9.3 Grup 3 — Alur Pasien

```sql
-- Kunjungan / encounter — TABEL PUSAT yang menghubungkan semua modul
CREATE TABLE kunjungan (
    id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    no_kunjungan      VARCHAR(30) NOT NULL UNIQUE,
    pasien_id         BIGINT UNSIGNED NOT NULL,
    jenis             ENUM('rajal','ranap','igd','penunjang') NOT NULL,
    unit_id           BIGINT UNSIGNED NOT NULL,
    dokter_id         BIGINT UNSIGNED NULL,
    penjamin_id       BIGINT UNSIGNED NOT NULL,
    no_kartu_penjamin VARCHAR(50)  NULL,
    no_sep            VARCHAR(50)  NULL,           -- SEP BPJS
    cara_masuk        ENUM('datang_sendiri','rujukan','ambulans','polisi') NULL,
    rujukan_dari      VARCHAR(150) NULL,
    no_rujukan        VARCHAR(50)  NULL,
    waktu_masuk       DATETIME     NOT NULL,
    waktu_keluar      DATETIME     NULL,
    status            ENUM('terdaftar','dilayani','selesai','batal') NOT NULL DEFAULT 'terdaftar',
    cara_keluar       ENUM('sembuh','membaik','rujuk','pulang_paksa','meninggal') NULL,
    kunjungan_induk_id BIGINT UNSIGNED NULL,       -- rajal → ranap
    ihs_encounter_id  VARCHAR(100) NULL,           -- ID SATUSEHAT
    created_by        BIGINT UNSIGNED NULL,
    created_at        TIMESTAMP    NULL,
    updated_at        TIMESTAMP    NULL,
    deleted_at        TIMESTAMP    NULL,
    FOREIGN KEY (pasien_id)   REFERENCES pasien(id)    ON DELETE RESTRICT,
    FOREIGN KEY (unit_id)     REFERENCES units(id)     ON DELETE RESTRICT,
    FOREIGN KEY (penjamin_id) REFERENCES penjamin(id)  ON DELETE RESTRICT,
    INDEX idx_kunjungan_pasien (pasien_id, waktu_masuk),
    INDEX idx_kunjungan_status (status, jenis),
    INDEX idx_kunjungan_tanggal (waktu_masuk)
) ENGINE=InnoDB;

CREATE TABLE antrean (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kunjungan_id   BIGINT UNSIGNED NOT NULL,
    unit_id        BIGINT UNSIGNED NOT NULL,
    jenis_layanan  ENUM('pendaftaran','poli','farmasi','lab','kasir','radiologi') NOT NULL,
    nomor          VARCHAR(10)  NOT NULL,
    prioritas      TINYINT      NOT NULL DEFAULT 5,  -- 1 tertinggi
    status         ENUM('menunggu','dipanggil','dilayani','selesai','lewat') NOT NULL DEFAULT 'menunggu',
    waktu_ambil    DATETIME     NOT NULL,
    waktu_panggil  DATETIME     NULL,
    waktu_selesai  DATETIME     NULL,
    loket          VARCHAR(20)  NULL,
    kode_booking   VARCHAR(50)  NULL,               -- Antrean Online BPJS
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL,
    FOREIGN KEY (kunjungan_id) REFERENCES kunjungan(id) ON DELETE CASCADE,
    INDEX idx_antrean_aktif (unit_id, jenis_layanan, status)
) ENGINE=InnoDB;

CREATE TABLE triase_igd (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kunjungan_id  BIGINT UNSIGNED NOT NULL UNIQUE,
    level         ENUM('merah','kuning','hijau','hitam') NOT NULL,
    keluhan_utama TEXT         NOT NULL,
    kesadaran     VARCHAR(50)  NULL,               -- GCS / AVPU
    tekanan_darah VARCHAR(20)  NULL,
    nadi          SMALLINT     NULL,
    napas         SMALLINT     NULL,
    suhu          DECIMAL(4,1) NULL,
    saturasi      TINYINT      NULL,
    nyeri_skala   TINYINT      NULL,
    petugas_id    BIGINT UNSIGNED NOT NULL,
    waktu_triase  DATETIME     NOT NULL,
    created_at    TIMESTAMP    NULL,
    updated_at    TIMESTAMP    NULL,
    FOREIGN KEY (kunjungan_id) REFERENCES kunjungan(id) ON DELETE CASCADE,
    INDEX idx_triase_level (level, waktu_triase)
) ENGINE=InnoDB;

CREATE TABLE rawat_inap (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kunjungan_id    BIGINT UNSIGNED NOT NULL UNIQUE,
    bed_id          BIGINT UNSIGNED NOT NULL,
    kelas           VARCHAR(20)  NOT NULL,
    dpjp_id         BIGINT UNSIGNED NOT NULL,       -- dokter penanggung jawab
    tgl_masuk       DATETIME     NOT NULL,
    tgl_rencana_pulang DATE      NULL,
    tgl_keluar      DATETIME     NULL,
    diagnosa_masuk  VARCHAR(255) NULL,
    status          ENUM('dirawat','rencana_pulang','pulang') NOT NULL DEFAULT 'dirawat',
    created_at      TIMESTAMP    NULL,
    updated_at      TIMESTAMP    NULL,
    FOREIGN KEY (kunjungan_id) REFERENCES kunjungan(id) ON DELETE RESTRICT,
    FOREIGN KEY (bed_id)       REFERENCES bed(id)       ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mutasi_bed (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    rawat_inap_id BIGINT UNSIGNED NOT NULL,
    bed_asal_id  BIGINT UNSIGNED NULL,
    bed_tujuan_id BIGINT UNSIGNED NOT NULL,
    alasan       VARCHAR(255) NULL,
    waktu        DATETIME     NOT NULL,
    petugas_id   BIGINT UNSIGNED NOT NULL,
    created_at   TIMESTAMP    NULL,
    FOREIGN KEY (rawat_inap_id) REFERENCES rawat_inap(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### 9.4 Grup 4 — Rekam Medis Elektronik

Semua tabel di grup ini **append-only**. Koreksi dilakukan dengan membuat versi baru, bukan menimpa yang lama.

| Tabel                    | Fungsi & Kolom Kunci                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rme_anamnesis`          | `kunjungan_id`, `keluhan_utama`, `riwayat_penyakit_sekarang`, `riwayat_penyakit_dahulu`, `riwayat_keluarga`, `riwayat_alergi`, `riwayat_pengobatan`, `dibuat_oleh`, `versi`, `parent_id` |
| `rme_pemeriksaan_fisik`  | `kunjungan_id`, `keadaan_umum`, `kesadaran`, `tekanan_darah`, `nadi`, `napas`, `suhu`, `saturasi`, `tinggi_badan`, `berat_badan`, `imt`, `pemeriksaan_head_to_toe` (JSON)                |
| `rme_diagnosis`          | `kunjungan_id`, `icd10_kode`, `jenis` (utama/sekunder/komplikasi), `deskripsi`, `onset`, `status` (aktif/sembuh), `ditegakkan_oleh`, `waktu`                                             |
| `rme_tindakan`           | `kunjungan_id`, `icd9cm_kode`, `nama_tindakan`, `tarif_id`, `jumlah`, `pelaksana_id`, `waktu`, `catatan`                                                                                 |
| `rme_cppt`               | `kunjungan_id`, `profesi` (dokter/perawat/apoteker/gizi/fisioterapi), `subjective`, `objective`, `assessment`, `plan`, `instruksi_ppa`, `verifikasi_dpjp_at`, `dibuat_oleh`, `waktu`     |
| `rme_asuhan_keperawatan` | `kunjungan_id`, `diagnosa_keperawatan`, `tujuan`, `intervensi` (JSON), `implementasi` (JSON), `evaluasi`, `perawat_id`, `shift`                                                          |
| `rme_observasi_ttv`      | `kunjungan_id`, `waktu`, `tekanan_darah`, `nadi`, `napas`, `suhu`, `saturasi`, `nyeri_skala`, `kesadaran`, `dicatat_oleh`                                                                |
| `rme_asuhan_gizi`        | `kunjungan_id`, `skrining_mst_skor`, `status_gizi`, `kebutuhan_kalori`, `diet_order`, `bentuk_makanan`, `ahli_gizi_id`                                                                   |
| `rme_alergi`             | `pasien_id`, `jenis` (obat/makanan/lainnya), `zat`, `reaksi`, `tingkat_keparahan`, `dicatat_oleh` — **level pasien, bukan kunjungan**                                                    |
| `rme_informed_consent`   | `kunjungan_id`, `jenis_tindakan`, `isi_penjelasan`, `pemberi_penjelasan_id`, `penerima_nama`, `hubungan`, `ttd_pasien_path`, `ttd_saksi_path`, `waktu`                                   |
| `rme_resume_medis`       | `kunjungan_id`, `diagnosa_akhir`, `ringkasan_perjalanan`, `hasil_penunjang`, `terapi`, `kondisi_pulang`, `anjuran`, `dpjp_id`, `ttd_elektronik`, `signed_at`                             |
| `rme_tanda_tangan`       | `rme_type`, `rme_id`, `user_id`, `assignment_id`, `hash_konten`, `signed_at`, `ip_address` — bukti integritas dokumen                                                                    |
| `rme_revisi`             | `rme_type`, `rme_id`, `versi`, `nilai_lama` (JSON), `alasan_revisi`, `direvisi_oleh`, `waktu`                                                                                            |

Kolom `hash_konten` di `rme_tanda_tangan` menyimpan SHA-256 dari isi dokumen saat ditandatangani. Kalau isi berubah setelah ditandatangani, hash tidak akan cocok — ini bukti integritas yang akan ditanyakan saat akreditasi.

### 9.5 Grup 5 — Farmasi & Logistik

```sql
CREATE TABLE resep (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    no_resep       VARCHAR(30) NOT NULL UNIQUE,
    kunjungan_id   BIGINT UNSIGNED NOT NULL,
    dokter_id      BIGINT UNSIGNED NOT NULL,
    jenis          ENUM('racikan','non_racikan','campuran') NOT NULL,
    status         ENUM('baru','diverifikasi','disiapkan','diserahkan','ditolak','batal')
                   NOT NULL DEFAULT 'baru',
    is_cito        BOOLEAN      NOT NULL DEFAULT FALSE,
    catatan_dokter TEXT         NULL,
    apoteker_id    BIGINT UNSIGNED NULL,
    catatan_apoteker TEXT       NULL,
    waktu_resep    DATETIME     NOT NULL,
    waktu_verifikasi DATETIME   NULL,
    waktu_serah    DATETIME     NULL,
    diserahkan_oleh BIGINT UNSIGNED NULL,
    penerima_nama  VARCHAR(150) NULL,
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL,
    deleted_at     TIMESTAMP    NULL,
    FOREIGN KEY (kunjungan_id) REFERENCES kunjungan(id) ON DELETE RESTRICT,
    INDEX idx_resep_status (status, waktu_resep)
) ENGINE=InnoDB;

CREATE TABLE resep_detail (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    resep_id      BIGINT UNSIGNED NOT NULL,
    obat_id       BIGINT UNSIGNED NOT NULL,
    obat_pengganti_id BIGINT UNSIGNED NULL,        -- substitusi apoteker
    alasan_substitusi VARCHAR(255) NULL,
    jumlah        DECIMAL(10,2) NOT NULL,
    satuan        VARCHAR(20)  NOT NULL,
    dosis         VARCHAR(50)  NOT NULL,
    frekuensi     VARCHAR(50)  NOT NULL,
    rute          VARCHAR(30)  NOT NULL,           -- oral, IV, IM, topikal
    durasi_hari   SMALLINT     NULL,
    aturan_pakai  VARCHAR(255) NULL,
    harga_satuan  DECIMAL(15,2) NOT NULL,
    subtotal      DECIMAL(15,2) NOT NULL,
    created_at    TIMESTAMP    NULL,
    updated_at    TIMESTAMP    NULL,
    FOREIGN KEY (resep_id) REFERENCES resep(id) ON DELETE CASCADE,
    FOREIGN KEY (obat_id)  REFERENCES obat(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Stok per batch — WAJIB per batch karena obat punya kadaluarsa
CREATE TABLE stok_batch (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    obat_id       BIGINT UNSIGNED NULL,
    alkes_id      BIGINT UNSIGNED NULL,
    unit_id       BIGINT UNSIGNED NOT NULL,        -- lokasi: gudang / depo farmasi
    no_batch      VARCHAR(50)  NOT NULL,
    tgl_kadaluarsa DATE        NOT NULL,
    jumlah_awal   DECIMAL(12,2) NOT NULL,
    jumlah_sisa   DECIMAL(12,2) NOT NULL,
    harga_beli    DECIMAL(15,2) NOT NULL,
    supplier_id   BIGINT UNSIGNED NULL,
    penerimaan_id BIGINT UNSIGNED NULL,
    created_at    TIMESTAMP    NULL,
    updated_at    TIMESTAMP    NULL,
    INDEX idx_batch_expiry (tgl_kadaluarsa, jumlah_sisa),
    INDEX idx_batch_lokasi (unit_id, obat_id)
) ENGINE=InnoDB;

-- Kartu stok — setiap pergerakan tercatat
CREATE TABLE stok_mutasi (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    stok_batch_id BIGINT UNSIGNED NOT NULL,
    jenis         ENUM('masuk','keluar','transfer','penyesuaian','retur',
                       'kadaluarsa','rusak') NOT NULL,
    referensi_type VARCHAR(100) NULL,              -- Resep, Penerimaan, StokOpname
    referensi_id  BIGINT UNSIGNED NULL,
    jumlah        DECIMAL(12,2) NOT NULL,          -- positif masuk, negatif keluar
    sisa_setelah  DECIMAL(12,2) NOT NULL,
    unit_asal_id  BIGINT UNSIGNED NULL,
    unit_tujuan_id BIGINT UNSIGNED NULL,
    keterangan    VARCHAR(255) NULL,
    petugas_id    BIGINT UNSIGNED NOT NULL,
    waktu         DATETIME     NOT NULL,
    created_at    TIMESTAMP    NULL,
    FOREIGN KEY (stok_batch_id) REFERENCES stok_batch(id) ON DELETE RESTRICT,
    INDEX idx_mutasi_waktu (waktu),
    INDEX idx_mutasi_ref (referensi_type, referensi_id)
) ENGINE=InnoDB;
```

Tabel pendukung logistik lainnya:

| Tabel                    | Fungsi                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| `permintaan_unit`        | Unit meminta obat/alkes ke gudang — `unit_pemohon_id`, `status`, `disetujui_oleh` |
| `permintaan_unit_detail` | Item dan jumlah yang diminta vs disetujui                                         |
| `pengadaan`              | Purchase order ke supplier — `no_po`, `supplier_id`, `total`, `status`            |
| `penerimaan`             | Barang datang — `no_penerimaan`, `pengadaan_id`, `tgl_terima`, `no_faktur`        |
| `stok_opname`            | Perhitungan fisik — `unit_id`, `periode`, `status`, `selisih_total`               |
| `stok_opname_detail`     | `stok_batch_id`, `jumlah_sistem`, `jumlah_fisik`, `selisih`, `keterangan`         |
| `retur_obat`             | Obat dikembalikan pasien atau ke supplier                                         |

### 9.6 Grup 6 — Billing, Kasir & Klaim

| Tabel            | Kolom Kunci                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `billing`        | `no_billing`, `kunjungan_id`, `total_tagihan`, `total_ditanggung`, `total_bayar_pasien`, `status` (draft/final/lunas/piutang), `finalized_at`, `finalized_by`                                 |
| `billing_detail` | `billing_id`, `tarif_id`, `kategori` (konsul/tindakan/obat/alkes/kamar/penunjang), `deskripsi`, `jumlah`, `harga_satuan`, `subtotal`, `ditanggung_penjamin`, `referensi_type`, `referensi_id` |
| `pembayaran`     | `billing_id`, `metode` (tunai/debit/kredit/transfer/qris), `jumlah`, `no_referensi`, `kasir_id`, `waktu`                                                                                      |
| `deposit`        | `kunjungan_id`, `jumlah`, `sisa`, `jenis` (setor/tarik), `petugas_id` — untuk ranap                                                                                                           |
| `klaim`          | `no_klaim`, `kunjungan_id`, `penjamin_id`, `no_sep`, `tgl_pengajuan`, `nilai_ajuan`, `nilai_disetujui`, `status` (draft/diajukan/pending/disetujui/ditolak/dispute), `alasan_pending`         |
| `klaim_inacbg`   | `klaim_id`, `kode_cbg`, `deskripsi_cbg`, `severity_level`, `tarif_cbg`, `special_cmg`, `los`, `grouper_response` (JSON)                                                                       |
| `klaim_berkas`   | `klaim_id`, `jenis_berkas`, `path`, `status_verifikasi`                                                                                                                                       |
| `piutang`        | `billing_id`, `penjamin_id`, `jumlah`, `jatuh_tempo`, `status`, `tgl_pelunasan`                                                                                                               |

### 9.7 Grup 7 — Red Code IT & Helpdesk

```sql
CREATE TABLE it_assets (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    kode           VARCHAR(50)  NOT NULL UNIQUE,
    nama           VARCHAR(150) NOT NULL,
    jenis          ENUM('server','jaringan','workstation','printer',
                        'layanan','database','integrasi') NOT NULL,
    unit_id        BIGINT UNSIGNED NULL,
    lokasi         VARCHAR(150) NULL,
    alamat_ip      VARCHAR(45)  NULL,
    endpoint_cek   VARCHAR(255) NULL,              -- URL/host untuk health check
    is_critical    BOOLEAN      NOT NULL DEFAULT FALSE,
    interval_cek   SMALLINT     NOT NULL DEFAULT 60, -- detik
    ambang_warning SMALLINT     NULL,              -- ms latency
    ambang_critical SMALLINT    NULL,
    is_monitored   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL
) ENGINE=InnoDB;

CREATE TABLE health_checks (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    asset_id     BIGINT UNSIGNED NOT NULL,
    status       ENUM('normal','warning','degraded','critical','unknown') NOT NULL,
    latency_ms   INT          NULL,
    metrik       JSON         NULL,               -- cpu, ram, disk, queue depth
    pesan_error  TEXT         NULL,
    dicek_pada   TIMESTAMP    NOT NULL,
    sumber       ENUM('internal','watchdog_eksternal','klien') NOT NULL DEFAULT 'internal',
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON DELETE CASCADE,
    INDEX idx_health_asset (asset_id, dicek_pada),
    INDEX idx_health_status (status, dicek_pada)
) ENGINE=InnoDB;

CREATE TABLE insiden (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    no_insiden      VARCHAR(30) NOT NULL UNIQUE,
    asset_id        BIGINT UNSIGNED NULL,
    severity        ENUM('info','warning','degraded','red_code') NOT NULL,
    judul           VARCHAR(255) NOT NULL,
    deskripsi       TEXT         NULL,
    unit_terdampak  JSON         NULL,             -- daftar unit_id
    status          ENUM('terbuka','diakui','ditangani','selesai','false_alarm')
                    NOT NULL DEFAULT 'terbuka',
    sumber          ENUM('otomatis','manual','watchdog','laporan_user') NOT NULL,
    dilaporkan_oleh BIGINT UNSIGNED NULL,
    diakui_oleh     BIGINT UNSIGNED NULL,
    diakui_pada     DATETIME     NULL,
    diselesaikan_oleh BIGINT UNSIGNED NULL,
    diselesaikan_pada DATETIME   NULL,
    akar_masalah    TEXT         NULL,
    tindakan_perbaikan TEXT      NULL,
    durasi_menit    INT          NULL,
    terdeteksi_pada DATETIME     NOT NULL,
    created_at      TIMESTAMP    NULL,
    updated_at      TIMESTAMP    NULL,
    INDEX idx_insiden_status (status, severity),
    INDEX idx_insiden_waktu (terdeteksi_pada)
) ENGINE=InnoDB;

CREATE TABLE insiden_timeline (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    insiden_id  BIGINT UNSIGNED NOT NULL,
    jenis       ENUM('terdeteksi','eskalasi','diakui','catatan',
                     'perubahan_status','notifikasi','selesai') NOT NULL,
    pesan       TEXT         NOT NULL,
    user_id     BIGINT UNSIGNED NULL,
    metadata    JSON         NULL,
    created_at  TIMESTAMP    NOT NULL,
    FOREIGN KEY (insiden_id) REFERENCES insiden(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE helpdesk_tiket (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    no_tiket       VARCHAR(30) NOT NULL UNIQUE,
    pelapor_id     BIGINT UNSIGNED NOT NULL,
    assignment_id  BIGINT UNSIGNED NULL,           -- melapor sebagai role apa
    unit_id        BIGINT UNSIGNED NOT NULL,
    kategori       ENUM('hardware','software','jaringan','akses',
                        'data','printer','lainnya') NOT NULL,
    prioritas      ENUM('rendah','sedang','tinggi','darurat') NOT NULL DEFAULT 'sedang',
    judul          VARCHAR(255) NOT NULL,
    deskripsi      TEXT         NOT NULL,
    lampiran       JSON         NULL,
    status         ENUM('baru','dibaca','ditangani','menunggu_pelapor',
                        'selesai','ditutup') NOT NULL DEFAULT 'baru',
    ditugaskan_ke  BIGINT UNSIGNED NULL,
    sla_menit      SMALLINT     NOT NULL,          -- target respons
    direspons_pada DATETIME     NULL,
    diselesaikan_pada DATETIME  NULL,
    level_eskalasi TINYINT      NOT NULL DEFAULT 0,
    rating_kepuasan TINYINT     NULL,
    created_at     TIMESTAMP    NULL,
    updated_at     TIMESTAMP    NULL,
    INDEX idx_tiket_status (status, prioritas),
    INDEX idx_tiket_sla (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE helpdesk_pesan (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tiket_id    BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    pesan       TEXT         NOT NULL,
    lampiran    JSON         NULL,
    is_internal BOOLEAN      NOT NULL DEFAULT FALSE, -- catatan internal IT
    created_at  TIMESTAMP    NOT NULL,
    FOREIGN KEY (tiket_id) REFERENCES helpdesk_tiket(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE eskalasi (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    escalatable_type VARCHAR(100) NOT NULL,        -- Insiden atau HelpdeskTiket
    escalatable_id BIGINT UNSIGNED NOT NULL,
    level          TINYINT      NOT NULL,          -- 1,2,3
    kanal          ENUM('in_app','websocket','email','whatsapp','sms','telepon') NOT NULL,
    target_user_id BIGINT UNSIGNED NULL,
    target_kontak  VARCHAR(100) NULL,
    dipicu_oleh    ENUM('otomatis_sla','manual_user','otomatis_severity') NOT NULL,
    status         ENUM('antre','terkirim','gagal','diakui') NOT NULL DEFAULT 'antre',
    respons_provider JSON       NULL,
    dikirim_pada   DATETIME     NULL,
    diakui_pada    DATETIME     NULL,
    created_at     TIMESTAMP    NULL,
    INDEX idx_eskalasi_ref (escalatable_type, escalatable_id)
) ENGINE=InnoDB;

CREATE TABLE jadwal_oncall (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    mulai       DATETIME     NOT NULL,
    selesai     DATETIME     NOT NULL,
    level       TINYINT      NOT NULL DEFAULT 1,   -- 1 = garis depan
    no_whatsapp VARCHAR(30)  NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NULL,
    updated_at  TIMESTAMP    NULL,
    INDEX idx_oncall_periode (mulai, selesai)
) ENGINE=InnoDB;
```

### 9.8 Grup 8 — Modul Pendukung

| Domain           | Tabel                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Laboratorium** | `lab_order`, `lab_order_detail`, `lab_sampel`, `lab_hasil`, `lab_parameter`, `lab_nilai_rujukan`, `lab_kontrol_mutu` |
| **Radiologi**    | `rad_order`, `rad_hasil`, `rad_gambar`                                                                               |
| **Operasi**      | `jadwal_operasi`, `laporan_operasi`, `checklist_keselamatan`, `tim_operasi`, `pemakaian_alkes_ok`                    |
| **Gizi**         | `skrining_gizi`, `diet_order`, `menu_harian`, `distribusi_makanan`                                                   |
| **SDM**          | `pegawai_detail`, `absensi`, `jadwal_shift`, `cuti`, `payroll`, `payroll_komponen`                                   |
| **Diklat**       | `program_pelatihan`, `peserta_pelatihan`, `sertifikat`, `evaluasi_pelatihan`                                         |
| **MFK**          | `aset_medis`, `jadwal_kalibrasi`, `riwayat_kalibrasi`, `pemeliharaan`, `insiden_k3`, `limbah_b3`, `sistem_utilitas`  |
| **Legal**        | `kontrak`, `perizinan`, `regulasi_internal`, `kasus_hukum`                                                           |
| **Tata Usaha**   | `surat_masuk`, `surat_keluar`, `disposisi`, `arsip`, `agenda`                                                        |
| **Keamanan**     | `patroli`, `buku_tamu`, `insiden_keamanan`, `kehilangan_barang`                                                      |
| **Marketing**    | `publikasi`, `event`, `kampanye_digital`, `analitik_web`                                                             |
| **Mutu**         | `indikator_mutu`, `capaian_indikator`, `insiden_keselamatan_pasien`, `laporan_sentinel`                              |
| **Sistem**       | `notifikasi`, `pengumuman`, `pengaturan`, `integrasi_log`, `backup_log`                                              |

### 9.9 Diagram Relasi Inti

```
                              ┌──────────┐
                              │  PASIEN  │
                              └────┬─────┘
                                   │ 1
                                   │
                                   │ N
                    ┌──────────────┴──────────────┐
                    │         KUNJUNGAN           │  ← pusat semua modul
                    │  (rajal / ranap / igd)      │
                    └──┬────┬────┬────┬────┬───┬──┘
                       │    │    │    │    │   │
        ┌──────────────┘    │    │    │    │   └────────────────┐
        │                   │    │    │    │                    │
        ▼                   ▼    ▼    ▼    ▼                    ▼
   ┌─────────┐      ┌───────────┐ ┌──────┐ ┌─────────┐   ┌──────────┐
   │ ANTREAN │      │ RME_*     │ │RESEP │ │LAB_ORDER│   │ BILLING  │
   │         │      │ diagnosis │ │      │ │         │   │          │
   │         │      │ cppt      │ └──┬───┘ └────┬────┘   └────┬─────┘
   │         │      │ tindakan  │    │          │             │
   │         │      │ asuhan    │    ▼          ▼             ▼
   └─────────┘      └───────────┘ ┌──────┐ ┌─────────┐   ┌──────────┐
                                  │STOK_ │ │LAB_HASIL│   │  KLAIM   │
                                  │MUTASI│ │         │   │ INA-CBG  │
                                  └──────┘ └─────────┘   └──────────┘

   ─────────────────────────────────────────────────────────────────
   Lapisan akses (berlaku untuk SEMUA tabel di atas)

   USERS ──< ROLE_ASSIGNMENTS >── ROLES ──< PERMISSION_ROLE >── PERMISSIONS
                    │
                    └── UNITS

   Setiap aksi terhadap tabel klinis  →  AUDIT_LOGS (append-only)
```

Kunci pemahaman: **`kunjungan` adalah tabel pusat.** Hampir semua modul menggantung padanya. Kalau desain tabel `kunjungan` benar, integrasi antar modul jadi otomatis. Kalau salah, semua modul ikut berantakan. Luangkan waktu ekstra di sini.

---

> **Keputusan merge untuk RBAC:** bila terdapat `user_roles` di rancangan awal dan `role_assignments` pada rancangan rinci, blueprint final memilih `role_assignments` karena assignment perlu menyimpan konteks unit dan role aktif. Nama tabel final harus konsisten di migration, model, seed, dan dokumentasi.

---

## 13. Security, Privacy & Audit

Bagian ini perlu dibaca hati-hati karena ada satu asumsi di brief kalian yang perlu diluruskan.

### 8.1 Soal "Tidak Mudah Di-inspect"

**Kenyataannya: kode frontend tidak bisa disembunyikan dari browser.** Apa pun yang dikirim ke browser HTML, CSS, JavaScript bisa dibaca oleh siapa pun yang membukanya. Ini bukan kelemahan yang bisa ditutup melainkan cara kerja web.

Yang sering dicoba orang, dan kenapa tidak berhasil:

| Upaya                         | Kenapa tidak efektif                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Menonaktifkan klik kanan      | Dilewati dengan `Ctrl+U` atau `F12`                                                            |
| Mendeteksi & menutup DevTools | Dilewati dengan mematikan JavaScript; juga menyulitkan tim kalian sendiri saat debugging       |
| Obfuscation JavaScript berat  | Menaikkan sedikit kesulitan, tapi memperlambat aplikasi dan menyulitkan pelacakan bug produksi |
| Menyembunyikan API endpoint   | Semua request terlihat di tab Network                                                          |

```js
build: {
  sourcemap: false,   // tanpa ini, kode asli beserta nama variabel bisa dibaca utuh
  minify: 'esbuild',
}
```

### 8.2 Lapisan Keamanan yang Benar-Benar Melindungi

#### Lapisan 1 — Autentikasi

```php
// config/session.php
'driver'         => 'database',
'lifetime'       => 30,          // menit, sesuai kebiasaan RS
'expire_on_close'=> true,
'encrypt'        => true,
'http_only'      => true,        // JavaScript tidak bisa membaca cookie
'same_site'      => 'strict',    // proteksi CSRF lapis kedua
'secure'         => true,        // hanya lewat HTTPS
```

- Session cookie, **bukan** JWT di `localStorage`. JWT di `localStorage` bisa dicuri lewat XSS; cookie HttpOnly tidak bisa.
- Rate limit login: 5 percobaan per menit per IP, 10 per akun per jam.
- Password minimal 12 karakter, dicek terhadap daftar password bocor (Laravel `Password::uncompromised()`).
- 2FA (TOTP) **wajib** untuk role IT, Direksi, dan Keuangan.
- Auto-logout setelah 30 menit idle, dengan peringatan di menit ke-28. Ini penting di RS karena komputer sering ditinggal di nurse station.
- Session di-regenerate saat login dan saat ganti role.

#### Lapisan 2 — Otorisasi

```php
// routes/web.php
Route::middleware(['auth', 'active.role'])->group(function () {

    Route::middleware('permission:rme.read')->group(function () {
        Route::get('/rekam-medis/{pasien}', [RekamMedisController::class, 'show']);
    });

    Route::middleware('permission:resep.create')->group(function () {
        Route::post('/resep', [ResepController::class, 'store']);
    });

    Route::middleware('permission:redcode.acknowledge')->group(function () {
        Route::post('/it/insiden/{insiden}/ack', [InsidenController::class, 'acknowledge']);
    });
});
```

Tiga aturan yang tidak boleh dilanggar:

1. **Setiap route punya middleware permission.** Tanpa kecuali. Route tanpa permission adalah lubang.
2. **Setiap model punya Policy.** Middleware menjawab "boleh akses fitur ini?", Policy menjawab "boleh akses data spesifik ini?".
3. **Jangan pernah mengirim data yang tidak boleh dilihat.** Pakai API Resource untuk memilih field secara eksplisit:

```php
// app/Http/Resources/PasienResource.php
public function toArray($request): array
{
    return [
        'id'        => $this->id,
        'no_rm'     => $this->no_rm,
        'nama'      => $this->nama,
        'tgl_lahir' => $this->tgl_lahir,

        // NIK hanya untuk yang berhak
        'nik' => $this->when(
            $request->user()->can('pasien.read.nik'),
            fn () => $this->nik
        ),

        // Diagnosis hanya untuk tenaga medis
        'diagnosis' => $this->when(
            $request->user()->can('rme.read'),
            fn () => DiagnosisResource::collection($this->whenLoaded('diagnosis'))
        ),
    ];
}
```

#### Lapisan 3 — Content Security Policy

**instinct soal "jangan pakai CSS/style inline" terbayar.** Karena tidak ada `style={{}}` dan tidak ada `<script>` inline, kalian bisa memasang CSP yang sangat ketat. CSP ketat adalah salah satu pertahanan terkuat melawan XSS yaitu serangan "penyisipan kode berbahaya" yang kalian khawatirkan.

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $nonce = $request->attributes->get('csp_nonce');

    $response->headers->add([
        'Content-Security-Policy' => implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self'",                  // ← inline style diblokir total
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self' wss://" . config('app.ws_host'),
            "frame-ancestors 'none'",            // anti clickjacking
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            'upgrade-insecure-requests',
        ]),
        'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options'    => 'nosniff',
        'X-Frame-Options'           => 'DENY',
        'Referrer-Policy'           => 'strict-origin-when-cross-origin',
        'Permissions-Policy'        => 'geolocation=(), microphone=(), camera=(), payment=()',
    ]);

    return $response;
}
```

Kalau kalian memakai `style={{}}` di JSX, header `style-src 'self'` akan mematahkan tampilan. Jadi aturan clean code kalian sekaligus menjadi penegak keamanan — dua hal yang saling mengunci.

#### Lapisan 4 — Perlindungan Input & Output

| Ancaman             | Perlindungan                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **SQL Injection**   | Eloquent & Query Builder selalu memakai parameter binding. Dilarang keras `DB::raw()` dengan input user.   |
| **XSS**             | React meng-escape semua output secara default. `dangerouslySetInnerHTML` dilarang lewat ESLint.            |
| **CSRF**            | Token CSRF Laravel aktif + `SameSite=Strict`.                                                              |
| **Mass assignment** | Semua model memakai `$fillable` eksplisit, bukan `$guarded = []`.                                          |
| **Validasi lemah**  | Setiap request memakai FormRequest class dengan aturan eksplisit. Tidak ada validasi ad-hoc di controller. |

#### Lapisan 5 — Upload File (Inilah Jawaban Nyata untuk "Virus")

Kekhawatiran kalian soal "disisipkan virus" paling realistis terjadi lewat upload file — hasil lab PDF, foto rontgen, scan KTP, berkas klaim.

```php
// app/Http/Requests/UploadBerkasRequest.php
public function rules(): array
{
    return [
        'berkas' => [
            'required',
            'file',
            'max:10240',                                    // 10 MB
            'mimes:pdf,jpg,jpeg,png',                       // cek ekstensi
            'mimetypes:application/pdf,image/jpeg,image/png', // cek MIME asli isi file
        ],
    ];
}
```

Pipeline lengkap setelah validasi:

1. **Ganti nama file** dengan UUID. Nama asli disimpan di database, tidak pernah dipakai di filesystem. Ini mencegah path traversal dan double-extension (`foto.jpg.php`).
2. **Simpan di luar `public/`** — di `storage/app/private/`. File disajikan lewat controller yang mengecek permission, bukan lewat URL langsung.
3. **Pindai dengan ClamAV** lewat queue job. File berstatus `pending` sampai lolos pindaian.
4. **Re-encode gambar** dengan Intervention Image. Ini menghapus metadata dan payload apa pun yang disisipkan di dalam file gambar.
5. **Sajikan dengan header aman**: `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`.

```php
// app/Jobs/PindaiBerkasJob.php
public function handle(ClamAvScanner $scanner): void
{
    $path = Storage::disk('private')->path($this->berkas->path);

    if ($scanner->isInfected($path)) {
        Storage::disk('private')->delete($this->berkas->path);
        $this->berkas->update(['status' => 'infected']);

        RedCodeIncident::raise(
            severity: 'high',
            title:    'Berkas terinfeksi terdeteksi',
            context:  [
                'berkas_id' => $this->berkas->id,
                'user_id'   => $this->berkas->uploaded_by,
            ],
        );
        return;
    }

    $this->berkas->update(['status' => 'clean', 'scanned_at' => now()]);
}
```

#### Lapisan 6 — Audit & Kepatuhan

Wajib untuk akreditasi RS dan UU PDP:

- Setiap akses ke rekam medis dicatat: siapa, kapan, pasien mana, **bertindak sebagai role apa**, dari IP mana.
- Setiap perubahan data klinis menyimpan nilai lama dan nilai baru.
- Audit log **tidak bisa dihapus atau diubah** oleh siapa pun, termasuk IT. Simpan di tabel terpisah tanpa route update/delete.
- Enkripsi at-rest untuk field sensitif:

```php
// app/Models/Pasien.php
protected function casts(): array
{
    return [
        'nik'          => 'encrypted',
        'no_kk'        => 'encrypted',
        'no_telepon'   => 'encrypted',
        'alamat_detail'=> 'encrypted',
    ];
}
```

Catatan praktis: field terenkripsi tidak bisa di-`WHERE` langsung. Untuk pencarian pasien berdasarkan NIK, simpan juga kolom `nik_hash` (SHA-256 dengan salt aplikasi) yang diberi index — cari lewat hash, tampilkan lewat dekripsi.

- Backup terenkripsi harian + uji restore bulanan. Backup yang tidak pernah diuji restore adalah backup yang tidak ada.
- Retensi rekam medis: minimal 5 tahun sejak kunjungan terakhir, sesuai regulasi.

### 8.3 Ringkasan Jujur

| Yang kalian minta              | Yang bisa dilakukan                                                                            | Yang tidak bisa                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| "Tidak mudah di-inspect"       | Matikan source map, minify, jangan kirim data yang tidak berhak dilihat                        | Menyembunyikan kode frontend dari orang yang membuka DevTools                       |
| "Tidak mudah disisipkan virus" | CSP ketat, pindai upload dengan ClamAV, re-encode gambar, validasi MIME asli, dependency audit | Menjamin 100% aman — keamanan adalah proses berkelanjutan, bukan fitur yang selesai |

Yang sesungguhnya melindungi Mediva bukan penyembunyian, tapi **otorisasi server yang ketat, data minimal yang dikirim ke klien, dan audit yang lengkap**.

---

### Audit Trail Dasar

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

---

## 14. Red Code IT & Helpdesk

Ini fitur pembeda Mediva. Bagian ini menjelaskan cara kerjanya beserta satu keterbatasan mendasar yang harus diatasi dengan desain, bukan diabaikan.

### 10.1 Masalah Fundamental yang Harus Diakui Dulu

> **Sistem yang berjalan di server tidak bisa memberi tahu kalian bahwa server itu mati.**

Kalau server Mediva down, kode Red Code yang jalan di server itu juga ikut down. Kalau jaringan RS putus, browser tidak bisa mengirim apa pun ke server — termasuk laporan bahwa jaringan putus.

Karena itu Red Code dirancang **tiga lapis**, dan lapis yang paling penting justru berada **di luar** Mediva.

### 10.2 Arsitektur Tiga Lapis

```
┌──────────────────────────────────────────────────────────────────┐
│  LAPIS 3 — WATCHDOG EKSTERNAL          (di luar server Mediva)   │
│  VPS terpisah atau layanan uptime monitor                        │
│  • Ping /health Mediva tiap 60 detik                             │
│  • Kalau 3x gagal berturut-turut → langsung WhatsApp + SMS ke IT │
│  • Inilah SATU-SATUNYA lapis yang tetap hidup saat server mati   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│  LAPIS 2 — MONITOR INTERNAL            (di dalam server Mediva)  │
│  Laravel Scheduler, jalan tiap 30–60 detik                       │
│  • Latency & koneksi database                                    │
│  • Kedalaman antrean job & job gagal                             │
│  • Kapasitas disk & memori                                       │
│  • Ping layanan internal: LIS, PACS, printer, gateway            │
│  • Status integrasi: BPJS VClaim, SATUSEHAT                      │
│  • Klien yang tiba-tiba berhenti kirim heartbeat                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│  LAPIS 1 — DETEKSI SISI KLIEN                (di browser user)   │
│  • Heartbeat ke server tiap 30 detik                             │
│  • Kalau 3x gagal → banner offline lokal muncul                  │
│  • Input penting di-antre di IndexedDB, dikirim saat online lagi │
│  • Tombol "Panggil IT" beralih ke tel:/wa.me langsung            │
└──────────────────────────────────────────────────────────────────┘
```

Lapis 3 tidak bisa dinegosiasikan. Sebuah VPS termurah (~Rp 50.000/bulan) atau layanan uptime monitor gratis sudah cukup. Tanpa lapis ini, fitur Red Code kalian akan gagal persis di saat paling dibutuhkan.

### 10.3 Tingkat Severity

| Level        | Warna  | Kondisi Pemicu                                                                       | Siapa yang Diberi Tahu                    | Kanal                                      |
| ------------ | ------ | ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------ |
| **NORMAL**   | Hijau  | Semua sehat                                                                          | —                                         | —                                          |
| **WARNING**  | Kuning | Latency > 500ms, disk > 80%, antrean job menumpuk                                    | Dashboard IT saja                         | In-app                                     |
| **DEGRADED** | Oranye | Satu layanan non-kritis mati, integrasi BPJS/SATUSEHAT putus                         | IT + manager unit terdampak               | In-app + email                             |
| **RED CODE** | Merah  | DB tidak terjangkau, jaringan putus, layanan pasien terhenti, server tidak merespons | **Semua user** + seluruh tim IT + on-call | Banner global + WebSocket + WhatsApp + SMS |

### 10.4 Implementasi Monitor Internal

```php
// app/Domain/ItOperations/Monitoring/HealthMonitor.php
namespace App\Domain\ItOperations\Monitoring;

final class HealthMonitor
{
    /** @param iterable<HealthProbe> $probes */
    public function __construct(private readonly iterable $probes) {}

    public function run(): void
    {
        foreach ($this->probes as $probe) {
            $hasil = $probe->check();

            HealthCheck::create([
                'asset_id'    => $hasil->assetId,
                'status'      => $hasil->status,
                'latency_ms'  => $hasil->latencyMs,
                'metrik'      => $hasil->metrik,
                'pesan_error' => $hasil->pesanError,
                'dicek_pada'  => now(),
                'sumber'      => 'internal',
            ]);

            if ($hasil->status === Status::CRITICAL) {
                IncidentManager::raise($hasil);
            }
        }
    }
}
```

```php
// app/Domain/ItOperations/Monitoring/Probes/DatabaseProbe.php
final class DatabaseProbe implements HealthProbe
{
    public function check(): HasilProbe
    {
        $mulai = microtime(true);

        try {
            DB::connection()->getPdo()->query('SELECT 1');
            $latency = (int) ((microtime(true) - $mulai) * 1000);

            return new HasilProbe(
                assetId:   $this->asset->id,
                status:    match (true) {
                    $latency > 2000 => Status::CRITICAL,
                    $latency > 500  => Status::WARNING,
                    default         => Status::NORMAL,
                },
                latencyMs: $latency,
                metrik:    ['koneksi_aktif' => $this->hitungKoneksi()],
            );
        } catch (\Throwable $e) {
            return new HasilProbe(
                assetId:    $this->asset->id,
                status:     Status::CRITICAL,
                pesanError: $e->getMessage(),
            );
        }
    }
}
```

Probe yang perlu dibuat: `DatabaseProbe`, `QueueProbe`, `DiskProbe`, `MemoryProbe`, `NetworkGatewayProbe`, `BpjsIntegrationProbe`, `SatuSehatProbe`, `PrinterProbe`, `ClientHeartbeatProbe`.

Registrasi di scheduler:

```php
// routes/console.php
Schedule::job(new RunHealthChecksJob)->everyThirtySeconds()->withoutOverlapping();
Schedule::job(new CheckSlaBreachesJob)->everyMinute();
Schedule::job(new PruneHealthChecksJob)->daily();   // simpan 30 hari saja
```

### 10.5 Alur Red Code

```
[1] Probe mendeteksi kondisi kritis
        ↓
[2] Cek: sudah ada insiden terbuka untuk aset ini?
        ├── ya  → tambahkan ke timeline insiden yang ada (jangan spam)
        └── tidak → lanjut
        ↓
[3] Buat record insiden, severity = red_code
        ↓
[4] Broadcast WebSocket ke channel 'redcode' (Laravel Reverb)
        ↓
[5] Semua browser yang terhubung menampilkan banner merah:
        ┌────────────────────────────────────────────────────┐
        │ ⛔ RED CODE — Layanan Farmasi Tidak Dapat Diakses  │
        │ Terdeteksi 14:32 · Tim IT sudah diberi tahu        │
        │ [ Lihat Detail ]              [ Hubungi IT ]       │
        └────────────────────────────────────────────────────┘
        ↓
[6] Dashboard IT: alarm suara + kartu insiden menyala
        ↓
[7] Timer eskalasi mulai berjalan
        ↓
   ┌────┴──────────────────────────────────────┐
   │ 0 menit  → WebSocket ke semua IT online   │
   │ 2 menit  → belum diakui? WhatsApp on-call │
   │ 5 menit  → belum diakui? WhatsApp semua IT│
   │            + SMS + notifikasi Manager IT  │
   │ 10 menit → belum diakui? notifikasi Direksi│
   └────┬──────────────────────────────────────┘
        ↓
[8] IT menekan "Ambil Alih" → timer berhenti, tercatat siapa & kapan
        ↓
[9] IT menangani, menulis catatan di timeline
        ↓
[10] IT menutup insiden + isi akar masalah & tindakan perbaikan
        ↓
[11] Banner hilang otomatis dari semua browser
        ↓
[12] Laporan post-mortem otomatis tersimpan untuk evaluasi bulanan
```

### 10.6 Alur Bantuan IT dari Sisi User

Inilah yang kalian minta: user bisa minta bantuan dari dalam Mediva, dan kalau tidak dibalas, bisa langsung membunyikan alarm.

```
[1] User klik "Bantuan IT" (tersedia di semua dashboard)
        ↓
[2] Form ringkas — sengaja dibuat minimal supaya cepat:
        • Kategori (dropdown)
        • Prioritas (rendah / sedang / tinggi / darurat)
        • Deskripsi singkat
        • Lampiran (opsional, otomatis menyertakan screenshot)
        ↓
[3] Sistem otomatis melampirkan konteks teknis tanpa user perlu tahu:
        halaman aktif, role aktif, unit, browser, versi aplikasi,
        error terakhir di console, status jaringan
        ↓
[4] Tiket dibuat, SLA ditetapkan berdasarkan prioritas:
        darurat = 5 menit · tinggi = 15 menit
        sedang  = 60 menit · rendah = 240 menit
        ↓
[5] Notifikasi real-time ke tim IT yang sedang online
        ↓
[6] User melihat status live: "Terkirim → Dibaca → Ditangani"
        ↓
   ┌────┴─────────────────────────────────┐
   │  Dibalas dalam SLA?                  │
   │      ├── ya  → percakapan berlanjut  │
   │      └── tidak → tombol PANGGIL IT   │
   │                  jadi aktif           │
   └────┬─────────────────────────────────┘
        ↓
[7] User menekan "PANGGIL IT SEKARANG"
        ↓
[8] Sistem menampilkan pilihan (dan mencatat semuanya):
        ┌──────────────────────────────────────────────┐
        │  Tiket #4821 belum direspons dalam 15 menit  │
        │                                              │
        │  🔔  Bunyikan alarm di ruang IT              │
        │  💬  Kirim WhatsApp ke IT on-call            │
        │  📞  Telepon langsung: 0812-xxxx-xxxx        │
        │                                              │
        │  Semua tindakan ini tercatat di sistem.      │
        └──────────────────────────────────────────────┘
        ↓
[9] Eskalasi dieksekusi, level tiket naik, tercatat di audit
```

Detail yang penting: **pencatatan eskalasi bukan untuk menyalahkan siapa pun.** Datanya dipakai untuk laporan bulanan — berapa persen tiket direspons dalam SLA, unit mana yang paling sering butuh bantuan, jam berapa beban IT paling tinggi. Ini yang mengubah helpdesk dari sekadar fitur menjadi alat perbaikan.

### 10.7 Integrasi WhatsApp

Ada dua pilihan, dan pilihan ini punya konsekuensi nyata:

| Opsi                                | Kelebihan                                   | Kekurangan                                                                                                                        |
| ----------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **WhatsApp Cloud API** (resmi Meta) | Legal, stabil, tidak akan diblokir, ada SLA | Perlu verifikasi Meta Business, pesan di luar jendela 24 jam **wajib** memakai template yang sudah disetujui, ada biaya per pesan |
| **Gateway tidak resmi**             | Murah, cepat dipasang                       | Melanggar ToS WhatsApp, nomor berisiko diblokir permanen — dan itu artinya alarm mati saat darurat                                |

Rekomendasi: **Cloud API dengan template terdaftar, plus SMS sebagai cadangan.** Untuk sistem yang menyangkut keselamatan pasien, jangan bertaruh pada gateway yang bisa diblokir sewaktu-waktu.

Contoh template yang perlu didaftarkan ke Meta:

```
Nama template : redcode_alert
Kategori      : UTILITY

Isi:
🚨 RED CODE MEDIVA

Insiden : {{1}}
Aset    : {{2}}
Waktu   : {{3}}
Dampak  : {{4}}

Mohon segera ambil alih di:
{{5}}
```

```php
// app/Domain/ItOperations/Notifications/WhatsAppChannel.php
public function send(Eskalasi $eskalasi): void
{
    $response = Http::withToken(config('services.whatsapp.token'))
        ->timeout(10)
        ->retry(2, 500)
        ->post(config('services.whatsapp.endpoint'), [
            'messaging_product' => 'whatsapp',
            'to'   => $eskalasi->target_kontak,
            'type' => 'template',
            'template' => [
                'name'     => 'redcode_alert',
                'language' => ['code' => 'id'],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(
                        fn ($v) => ['type' => 'text', 'text' => $v],
                        $eskalasi->parameterTemplate(),
                    ),
                ]],
            ],
        ]);

    $eskalasi->update([
        'status'           => $response->successful() ? 'terkirim' : 'gagal',
        'respons_provider' => $response->json(),
        'dikirim_pada'     => now(),
    ]);

    // Kalau WhatsApp gagal, jangan diam — jatuhkan ke SMS
    if ($response->failed()) {
        SmsChannel::send($eskalasi);
    }
}
```

### 10.8 Ketahanan Saat Offline

Ini yang membuat Mediva terasa andal, bukan sekadar punya fitur alarm:

1. **Deteksi lokal.** Browser memantau kegagalan request sendiri. Setelah 3 kegagalan berturut-turut, banner offline muncul tanpa perlu bertanya ke server.
2. **Antrean tulis di IndexedDB.** Input kritis — TTV, CPPT, catatan keperawatan — disimpan lokal saat offline dan dikirim otomatis saat koneksi pulih. Perawat tidak kehilangan pekerjaan.
3. **Cache baca terbatas.** Data pasien yang sedang aktif dilayani (maksimal 20 pasien terakhir) di-cache supaya tetap bisa dibaca.
4. **Penanda jelas.** Data hasil cache diberi label "Data terakhir: 14:20 — mungkin sudah berubah". Jangan pernah menampilkan data lama seolah-olah data terkini di lingkungan klinis.
5. **Nomor darurat luring.** Nomor telepon IT ditanam di HTML awal, bukan diambil lewat API — supaya tetap muncul walaupun backend tidak terjangkau sama sekali.

---

---

## 15. SATUSEHAT, BPJS & Insurance Integration

Ini pekerjaan Fase 10, tapi keputusan desainnya harus diambil **sekarang** — karena beberapa kolom database harus sudah ada sejak awal.

### 12.1 Yang Harus Disiapkan Dari Sekarang

| Persiapan                                         | Kenapa Sekarang                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Kolom `ihs_number` di `pasien`                    | Menambah kolom di tabel dengan jutaan baris jauh lebih mahal daripada menyiapkannya sejak awal                         |
| Kolom `ihs_encounter_id` di `kunjungan`           | Sama                                                                                                                   |
| NIK wajib & tervalidasi (16 digit, format benar)  | SATUSEHAT memakai NIK sebagai kunci identitas. Data NIK yang berantakan adalah penyebab kegagalan integrasi nomor satu |
| Semua `datetime` disimpan dengan zona waktu jelas | FHIR mensyaratkan ISO 8601 dengan offset zona waktu                                                                    |
| ICD-10 versi WHO (bukan ICD-10-CM Amerika)        | Kode yang salah versi akan ditolak                                                                                     |
| Kode LOINC untuk parameter lab                    | Dipetakan sejak awal jauh lebih mudah                                                                                  |
| Tabel `integrasi_log`                             | Setiap panggilan keluar harus tercatat untuk penelusuran                                                               |

### 12.2 SATUSEHAT (Kementerian Kesehatan)

| Aspek               | Detail                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Standar**         | HL7 FHIR R4                                                                                                                                                                        |
| **Autentikasi**     | OAuth 2.0 Client Credentials — token berlaku 1 jam, cache dan perbarui otomatis                                                                                                    |
| **Resource utama**  | `Patient`, `Encounter`, `Condition`, `Observation`, `Procedure`, `Practitioner`, `Organization`, `Location`, `MedicationRequest`, `MedicationDispense`, `Specimen`, `ImagingStudy` |
| **Identitas**       | NIK sebagai kunci pencarian, IHS Number sebagai ID resmi SATUSEHAT — simpan pemetaannya lokal                                                                                      |
| **Alur onboarding** | Registrasi → audit kualitas data → pengembangan → uji sandbox → pilot produksi → rollout penuh                                                                                     |
| **Estimasi**        | 12–19 minggu                                                                                                                                                                       |
| **Dasar hukum**     | Permenkes 24/2022 (RME), UU Kesehatan 17/2023, dan berkaitan dengan status akreditasi RS                                                                                           |

**Pola arsitektur yang disarankan: gateway perantara.** Jangan panggil API SATUSEHAT langsung dari controller. Buat lapisan gateway yang menangani:

```
Mediva  →  Gateway SATUSEHAT  →  API Kemenkes
              │
              ├── Transformasi data internal → FHIR resource
              ├── Antrean (kalau SATUSEHAT sedang down, tidak menghambat pelayanan)
              ├── Retry dengan backoff eksponensial
              ├── Pemetaan & penyimpanan IHS Number
              ├── Pencatatan lengkap untuk audit
              └── Metrik keberhasilan (target > 98%)
```

Ini penting: kalau SATUSEHAT sedang gangguan, **pelayanan pasien tidak boleh ikut berhenti.** Data diantre dan dikirim ulang saat pulih.

### 12.3 BPJS Kesehatan

| Layanan               | Fungsi                                                        | Kapan Dipakai                         |
| --------------------- | ------------------------------------------------------------- | ------------------------------------- |
| **VClaim**            | Cek peserta, buat/hapus SEP, rujukan, monitoring klaim        | Fase 10                               |
| **Antrean RS**        | Antrean online, jadwal dokter, kirim status antrean per tahap | Fase 10                               |
| **Aplicare**          | Update ketersediaan tempat tidur real-time                    | Fase 10                               |
| **i-Care**            | Riwayat pelayanan peserta lintas faskes                       | Fase 10                               |
| **INA-CBG / E-Klaim** | Grouping tarif dan pengajuan klaim                            | Fase 8 (offline) → Fase 10 (bridging) |

**Autentikasi BPJS** memakai signature berbasis HMAC:

```
X-cons-id   : Consumer ID dari BPJS
X-timestamp : Unix timestamp UTC saat request
X-signature : Base64( HMAC-SHA256( cons_id + "&" + timestamp, secret_key ) )
user_key    : Key layanan
```

Respons VClaim v2 terenkripsi AES-256 dengan kunci turunan dari `cons_id + secret_key + timestamp` — perlu didekripsi lalu di-LZ-string-decompress. Ini sering jadi titik gagal pertama, jadi alokasikan waktu ekstra di sini.

Untuk Laravel, paket `indravscode/bridging-bpjs` sudah menangani VClaim, PCare, Antrean, Aplicare, dan i-Care sekaligus — hemat banyak waktu dibanding menulis dari nol.

### 12.4 Asuransi Swasta & Bridging Lain

Tidak ada standar tunggal — tiap asuransi punya API sendiri. Rancang dengan pola adapter sejak awal:

```php
interface PenjaminGateway
{
    public function cekEligibilitas(string $noKartu): HasilEligibilitas;
    public function ajukanPenjaminan(Kunjungan $kunjungan): HasilPenjaminan;
    public function kirimKlaim(Klaim $klaim): HasilKlaim;
    public function cekStatusKlaim(string $noKlaim): StatusKlaim;
}
```

Implementasi: `BpjsGateway`, `AdmedikaGateway`, `OwlexaGateway`, `ManualGateway` (untuk asuransi yang masih pakai berkas fisik). Dengan pola ini, menambah asuransi baru berarti menambah satu class — tidak menyentuh kode yang sudah ada.

### 12.5 Kesiapan Regulasi

Karena Mediva akan dipakai di RS sungguhan, ini yang harus terpenuhi:

- **Permenkes 24/2022** — RME wajib, terintegrasi NIK, riwayat klinis terstruktur, tanda tangan elektronik yang sah
- **Permenkes 82/2013** — kewajiban setiap RS menyelenggarakan SIMRS
- **UU Kesehatan 17/2023** — transformasi digital sebagai mandat hukum
- **UU PDP 27/2022** — persetujuan pemrosesan data, hak subjek data, kewajiban notifikasi kebocoran dalam 3×24 jam
- **Retensi rekam medis** — minimal 5 tahun sejak kunjungan terakhir
- **Pelaporan terstruktur** — sentinel event, surveilans penyakit, indikator mutu

Konsekuensi kalau tidak patuh: status akreditasi terdampak, klaim JKN berisiko ditolak, dan potensi sanksi dari Kemenkes.

---

---

## 16. Frontend Tasks & Backend Tasks

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

### Phase 1 — Foundation

- Setup Laravel.
- Database connection.
- Authentication.
- User model.
- Employee model.
- Role.
- Permission.
- Role assignment (user + role + unit).
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

---

## 17. Development Roadmap & Sprint Order

### Sprint-Oriented Roadmap

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

### Phase-Oriented Roadmap dan Definition of Phase Completion

### 11.1 Pembagian Kerja

| Peran                | Orang    | Tanggung Jawab                                                                                   |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| **PM & Frontend**    | Kamu     | Komponen React, design system CSS, dashboard per role, navigasi, UX, prioritas fitur, komunikasi |
| **Analis & Backend** | Pasangan | Analisis kebutuhan, migrasi & model, controller & policy, validasi, queue & job, integrasi       |

**Titik temu yang perlu disepakati sebelum tiap fase dimulai:** kontrak data antara frontend dan backend (endpoint, request payload, response shape, validation error, permission, dan status). Sepakati kontraknya di awal, lalu frontend dan backend dapat bekerja paralel tanpa saling menunggu.

Ritual mingguan yang disarankan:

- **Senin (30 menit)** — sepakati kontrak props untuk pekerjaan minggu ini
- **Rabu (15 menit)** — cek titik temu, selesaikan blocker
- **Jumat (45 menit)** — demo hasil, review kode satu sama lain, tulis catatan fase

### 11.2 Ringkasan Fase

| Fase   | Nama                      | Durasi      | Hasil yang Bisa Dipakai                              |
| ------ | ------------------------- | ----------- | ---------------------------------------------------- |
| **0**  | Fondasi                   | 1–2 minggu  | Repo jalan, `npm run dev` hidup, CI aktif            |
| **1A** | Auth & RBAC               | 3–4 minggu  | Login, multi-role, role switcher, dashboard shell    |
| **1B** | Design System             | 2–3 minggu  | ~20 komponen siap pakai sesuai Figma                 |
| **2**  | Master Data               | 2–3 minggu  | Data pasien, dokter, unit, tarif, obat bisa dikelola |
| **3**  | Pendaftaran & Rawat Jalan | 4–5 minggu  | Pasien bisa didaftarkan sampai dilayani dokter       |
| **4**  | Rekam Medis               | 4–5 minggu  | RME lengkap dengan tanda tangan elektronik           |
| **5**  | Farmasi & Gudang          | 4–5 minggu  | Resep mengalir dari dokter ke penyerahan obat        |
| **6**  | Red Code IT & Helpdesk    | 3–4 minggu  | Monitoring, alarm, eskalasi, tiket bantuan           |
| **7**  | IGD & Rawat Inap          | 4–5 minggu  | Triase, bed management, CPPT ranap                   |
| **8**  | Billing & Casemix         | 5–6 minggu  | Tagihan, kasir, klaim INA-CBG                        |
| **9**  | Penunjang & Manajemen     | 6–8 minggu  | Lab, gizi, OK, SDM, MFK, dashboard direksi           |
| **10** | Integrasi Eksternal       | 8–12 minggu | SATUSEHAT & BPJS bridging                            |
| **11** | Hardening & Pilot         | 4–6 minggu  | Uji beban, audit keamanan, pilot di RS               |

**Total realistis: 12–18 bulan** untuk tim 2 orang yang bekerja konsisten. Kalau part-time, kalikan 1,5–2×.

Ini angka jujur. SIMRS komersial biasanya dikerjakan tim 10–20 orang selama 2–3 tahun. Yang membuat target kalian tetap masuk akal adalah cakupan awal yang fokus (RS Umum) dan pengerjaan bertahap.

### 11.3 Detail Fase Prioritas

#### Fase 0 — Fondasi (1–2 minggu)

| #   | Pekerjaan                                                | Penanggung Jawab |
| --- | -------------------------------------------------------- | ---------------- |
| 0.1 | Inisialisasi/validasi Laravel + React + Vite + React Router | Backend + Frontend |
| 0.2 | Konfigurasi `concurrently` untuk satu terminal           | Backend          |
| 0.3 | Setup Tailwind v4 + struktur folder CSS                  | Frontend         |
| 0.4 | ESLint + Prettier + Husky pre-commit                     | Frontend         |
| 0.5 | Git flow: `main` / `develop` / `feature/*` + template PR | PM               |
| 0.6 | GitHub Actions: lint + test otomatis                     | Backend          |
| 0.7 | `.env.example` lengkap + README setup                    | Bersama          |
| 0.8 | Konversi Figma → `tokens.css`                            | Frontend         |

**Selesai bila:** klon repo baru → `composer install && npm install && npm run dev` → halaman "Mediva siap" muncul, tanpa langkah manual tambahan.

#### Fase 1A — Auth & RBAC (3–4 minggu)

| #     | Pekerjaan                                                                                              | Penanggung Jawab |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------------- |
| 1A.1  | Migrasi: `users`, `roles`, `permissions`, `units`, `role_assignments`, `permission_role`, `audit_logs` | Backend          |
| 1A.2  | Seeder: 28 role + ~150 permission + struktur unit RS Umum                                              | Backend          |
| 1A.3  | Login + rate limit + 2FA untuk role sensitif                                                           | Backend          |
| 1A.4  | Middleware `active.role` + resolusi permission role aktif                                              | Backend          |
| 1A.5  | Endpoint ganti role + validasi kepemilikan + regenerasi session                                        | Backend          |
| 1A.6  | Header keamanan + CSP ketat                                                                            | Backend          |
| 1A.7  | Halaman login sesuai Figma                                                                             | Frontend         |
| 1A.8  | Halaman "Pilih Peran" dengan kartu + ringkasan angka                                                   | Frontend         |
| 1A.9  | `DashboardShell`: sidebar, topbar, breadcrumb, area konten                                             | Frontend         |
| 1A.10 | Sidebar dinamis dari permission + state collapse                                                       | Frontend         |
| 1A.11 | Komponen `RoleSwitcher` + konfirmasi form belum tersimpan                                              | Frontend         |
| 1A.12 | Dashboard kosong untuk 28 role (placeholder terstruktur)                                               | Frontend         |
| 1A.13 | Test: 1 user 3 role → tiap role hanya lihat menunya                                                    | Bersama          |

**Selesai bila:** seorang user dengan 3 penugasan bisa login, memilih peran, melihat menu yang berbeda per peran, berpindah peran tanpa logout, dan semua aktivitasnya tercatat di `audit_logs` beserta peran yang sedang aktif.

#### Fase 1B — Design System (2–3 minggu)

Bangun ~20 komponen ini sampai benar-benar solid. Ini investasi yang akan menghemat berbulan-bulan:

```
Button · Input · Select · Textarea · Checkbox · Radio · Switch
DatePicker · TimePicker · SearchInput · FormField · FormSection
DataTable (sort, filter, paginate, kolom sticky, aksi baris)
Card · StatTile · Badge · Tabs · Modal · Drawer · Toast
ConfirmDialog · EmptyState · Skeleton · Pagination · Breadcrumb
PatientBanner · VitalSignInput · Timeline · FileUpload
```

Setiap komponen harus punya: variasi lengkap, state (normal/hover/focus/disabled/error/loading), dukungan keyboard, dan atribut ARIA yang benar.

Aksesibilitas bukan tambahan opsional. Layar rumah sakit sering dipakai dengan cepat, di bawah tekanan, kadang oleh staf yang lelah di shift malam. Focus ring yang jelas dan navigasi keyboard yang benar mengurangi kesalahan input.

#### Fase 3 — Pendaftaran & Rawat Jalan (4–5 minggu)

Alur yang harus berjalan utuh dari ujung ke ujung:

```
Pasien datang
   → cari pasien (nama / NIK / no. RM)
       ├── ditemukan  → verifikasi & perbarui data
       └── baru       → daftar pasien baru, sistem terbitkan no. RM
   → pilih penjamin (umum / BPJS / asuransi)
   → pilih poli & dokter (cek kuota & jadwal)
   → sistem buat record kunjungan
   → cetak nomor antrean
   → perawat panggil → input TTV & skrining awal
   → dokter panggil → anamnesis, pemeriksaan, diagnosis, tindakan
   → dokter tulis resep (masuk antrean farmasi)
   → dokter tutup kunjungan
   → tagihan otomatis terbentuk
```

**Selesai bila:** satu pasien bisa berjalan dari pintu depan sampai tagihan terbit tanpa perlu menyentuh database secara manual. Ini titik di mana Mediva berubah dari prototipe menjadi sistem yang benar-benar bisa didemokan.

#### Fase 6 — Red Code IT & Helpdesk (3–4 minggu)

| #    | Pekerjaan                                          | Penanggung Jawab |
| ---- | -------------------------------------------------- | ---------------- |
| 6.1  | Migrasi tabel IT ops (7 tabel)                     | Backend          |
| 6.2  | Kerangka `HealthProbe` + 9 probe                   | Backend          |
| 6.3  | `IncidentManager` + mesin eskalasi                 | Backend          |
| 6.4  | Laravel Reverb + channel broadcast                 | Backend          |
| 6.5  | Integrasi WhatsApp Cloud API + fallback SMS        | Backend          |
| 6.6  | Skrip watchdog eksternal + panduan deploy VPS      | Backend          |
| 6.7  | Timer SLA helpdesk + eskalasi otomatis             | Backend          |
| 6.8  | `RedCodeBanner` global + langganan WebSocket       | Frontend         |
| 6.9  | Halaman Command Center IT                          | Frontend         |
| 6.10 | Form tiket + pengumpulan konteks otomatis          | Frontend         |
| 6.11 | Modal "Panggil IT" + pilihan eskalasi              | Frontend         |
| 6.12 | Deteksi offline + antrean IndexedDB                | Frontend         |
| 6.13 | Uji chaos: matikan DB, cabut jaringan, penuhi disk | Bersama          |

**Selesai bila:** kalian mematikan database secara sengaja, dan dalam 60 detik banner merah muncul di semua browser, dashboard IT berbunyi, dan WhatsApp masuk ke ponsel on-call. Lalu kalian matikan seluruh server, dan watchdog eksternal tetap mengirim WhatsApp.

### 11.4 Urutan Ini Bukan Kebetulan

Kalian memilih empat modul sebagai prioritas: Auth+shell, alur pasien, farmasi, dan Red Code. Semuanya masuk roadmap, dengan urutan yang sudah dipertimbangkan:

- **Auth harus paling awal** karena semua modul lain menumpang di atasnya. Membangunnya belakangan berarti merombak semua yang sudah jadi.
- **Design system tepat setelahnya** karena tanpa itu, kalian akan menulis ulang komponen yang sama berkali-kali di setiap modul.
- **Alur pasien sebelum farmasi** karena resep membutuhkan `kunjungan` yang sudah ada. Farmasi tanpa alur pasien tidak punya data untuk diproses.
- **Red Code bisa dikerjakan lebih awal dari posisinya** kalau kalian mau, karena modul ini paling mandiri — tidak bergantung pada data klinis. Kalau butuh sesuatu yang mengesankan untuk didemokan lebih cepat, geser Fase 6 ke depan setelah Fase 1B.

---

> Sprint dan fase adalah dua level planning yang berbeda: **fase** mewakili milestone produk, sedangkan **sprint** memecah fase menjadi urutan pengerjaan yang lebih kecil.

---

## 18. Clean Code, Git, Testing & Definition of Done

### 13.1 Backend (Laravel)

```php
// ❌ Controller gemuk — logika bisnis bercampur dengan HTTP
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $pasien = Pasien::create($validated);
    $kunjungan = Kunjungan::create([...]);
    $antrean = Antrean::create([...]);
    Mail::to(...)->send(...);
    return redirect()->route('...');
}

// ✅ Controller tipis — hanya mengatur alur HTTP
public function store(
    DaftarPasienRequest $request,
    PendaftaranService $service,
): RedirectResponse {
    $kunjungan = $service->daftarkan(
        DaftarPasienData::from($request->validated())
    );

    return to_route('pendaftaran.show', $kunjungan)
        ->with('sukses', "Pendaftaran berhasil. Nomor antrean: {$kunjungan->antrean->nomor}");
}
```

| Aturan                                             | Alasan                                                 |
| -------------------------------------------------- | ------------------------------------------------------ |
| Controller maksimal 15 baris per method            | Kalau lebih, logika bisnisnya bocor ke controller      |
| Logika bisnis di Service atau Action class         | Bisa diuji tanpa HTTP, bisa dipanggil dari command/job |
| Validasi selalu di FormRequest                     | Terpusat, mudah diuji, mudah ditemukan                 |
| Otorisasi selalu di Policy                         | Satu tempat untuk semua aturan akses model             |
| Query kompleks di Repository atau Query class      | Controller tidak perlu tahu struktur query             |
| Selalu `->with()` untuk relasi yang dipakai        | Mencegah N+1 query yang membunuh performa              |
| Transaksi database untuk operasi multi-tabel       | Konsistensi data                                       |
| Enum PHP untuk status, bukan string                | Typo tertangkap saat kompilasi, bukan saat produksi    |
| Nama variabel bahasa Indonesia untuk domain klinis | Tim RS bisa ikut membaca dan memverifikasi             |

### 13.2 Frontend (React)

| Aturan                                              | Alasan                                         |
| --------------------------------------------------- | ---------------------------------------------- |
| Komponen maksimal ~200 baris                        | Kalau lebih, hampir pasti mengerjakan dua hal  |
| Satu komponen, satu tanggung jawab                  | Mudah diuji, mudah dipakai ulang               |
| Logika yang dipakai ulang → custom hook             | Hindari duplikasi                              |
| Tidak ada style inline                              | Ditegakkan ESLint, sekaligus syarat CSP ketat  |
| Tidak ada `dangerouslySetInnerHTML`                 | Ditegakkan ESLint, pencegahan XSS              |
| Props divalidasi                                    | Menangkap salah pakai lebih awal               |
| Nama file PascalCase, hook `useXxx`                 | Konsistensi                                    |
| Data remote diakses melalui service/API client terpusat; hindari fetch tersebar di banyak komponen | Menjaga konsistensi state, error handling, dan kontrak API |
| Semua teks UI bahasa Indonesia                      | Pengguna adalah staf RS Indonesia              |
| Semua form punya state loading & error              | Pengguna harus selalu tahu apa yang terjadi    |

### 13.3 Konvensi Git

```
main        → produksi, dilindungi, hanya lewat PR
develop     → integrasi
feature/*   → fitur baru        contoh: feature/rbac-role-switcher
fix/*       → perbaikan bug     contoh: fix/antrean-nomor-duplikat
docs/*      → dokumentasi
```

Format commit (Conventional Commits):

```
feat(rbac): tambah role switcher dengan validasi kepemilikan
fix(farmasi): perbaiki perhitungan stok saat resep dibatalkan
docs(blueprint): perbarui skema tabel red code
refactor(billing): pindahkan kalkulasi tarif ke service class
test(auth): tambah test multi-role assignment
```

### 13.4 Definition of Done

Sebuah fitur belum selesai sampai **semua** poin berikut terpenuhi:

- [ ] Kode berjalan tanpa error di `npm run dev`
- [ ] `npm run lint` bersih, tanpa warning
- [ ] Route dilindungi middleware permission yang benar
- [ ] Model punya Policy, dan Policy sudah diuji
- [ ] Ada Feature test untuk jalur sukses **dan** jalur gagal
- [ ] Ada test yang memverifikasi role tanpa permission mendapat 403
- [ ] Tampilan responsif di 1366×768 (resolusi komputer RS paling umum)
- [ ] Semua state ditangani: loading, kosong, error, sukses
- [ ] Aksi destruktif punya dialog konfirmasi
- [ ] Aktivitas sensitif tercatat di `audit_logs`
- [ ] Tidak ada style inline, tidak ada utility Tailwind di JSX
- [ ] Sudah direview oleh satu orang lainnya
- [ ] Dokumentasi diperbarui bila ada perubahan kontrak props atau skema

### 13.5 Strategi Pengujian

Tim 2 orang tidak punya waktu menulis test untuk segalanya. Prioritaskan yang risikonya paling tinggi:

| Prioritas    | Yang Diuji                                          | Kenapa                                             |
| ------------ | --------------------------------------------------- | -------------------------------------------------- |
| **Wajib**    | RBAC — setiap role hanya bisa akses yang seharusnya | Salah di sini = kebocoran data pasien              |
| **Wajib**    | Perhitungan stok obat                               | Salah = obat habis tanpa ketahuan, atau stok hantu |
| **Wajib**    | Perhitungan tagihan & klaim                         | Salah = kerugian finansial RS                      |
| **Wajib**    | Integritas rekam medis (append-only, tanda tangan)  | Salah = masalah hukum                              |
| **Penting**  | Alur pendaftaran sampai kunjungan                   | Jalur paling sering dipakai                        |
| **Penting**  | Eskalasi Red Code                                   | Harus bekerja saat paling dibutuhkan               |
| **Opsional** | Tampilan komponen UI                                | Bug di sini terlihat langsung, murah diperbaiki    |

---

---

## 19. One Source of Truth & Audit Trail

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

### Aturan Tambahan
- Tidak ada salinan data resep, pasien, billing, stok, atau rekam medis per dashboard.
- Dashboard hanya merepresentasikan data berdasarkan permission dan unit scope.
- Semua perubahan penting menyimpan actor, active role/assignment, module, record, old/new value bila relevan, waktu, dan konteks request.

---

## 20. Future Modules & Product Goal

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

---

## 21. Risk Register

### 14.1 Risiko Utama

| Risiko                                                  | Dampak              | Mitigasi                                                                                                                                |
| ------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Cakupan terlalu besar untuk 2 orang**                 | Tinggi              | Fase yang ketat. Jangan pindah fase sebelum yang sekarang benar-benar selesai. Lebih baik 5 modul solid daripada 20 modul setengah jadi |
| **Multi-role RBAC salah desain**                        | Sangat tinggi       | Habiskan waktu ekstra di Fase 1A. Ini fondasi. Merombaknya di bulan ke-8 berarti menyentuh semua modul                                  |
| **Tabel `kunjungan` salah desain**                      | Sangat tinggi       | Diskusikan dengan pasangan kamu sampai benar-benar yakin sebelum migrasi pertama. Hampir semua modul menggantung di sini                |
| **Kualitas data NIK buruk**                             | Tinggi (di Fase 10) | Validasi NIK sejak Fase 3. Jangan izinkan pendaftaran dengan NIK asal-asalan                                                            |
| **Integrasi BPJS/SATUSEHAT lebih rumit dari perkiraan** | Sedang              | Alokasikan waktu 2× dari estimasi. Enkripsi respons VClaim v2 sering jadi hambatan pertama                                              |
| **Kelelahan tim**                                       | Tinggi              | Ini maraton 12–18 bulan, bukan sprint. Rayakan setiap fase selesai. Ambil jeda antar fase                                               |
| **Tidak ada validasi dari pengguna nyata**              | Tinggi              | Tunjukkan ke staf RS tempat kamu magang setiap akhir fase. Umpan balik mereka lebih berharga daripada tebakan kalian berdua             |
| **Ketergantungan pada satu orang**                      | Sedang              | Dokumentasikan keputusan. Review kode satu sama lain supaya keduanya paham seluruh sistem                                               |

### 14.2 Tiga Hal yang Perlu Diluruskan dari Brief Awal

**1. "Supaya tidak mudah di-inspect"**

Kode frontend tidak bisa disembunyikan dari browser. Yang bisa dilakukan: matikan source map, minify, dan yang paling penting — jangan pernah mengirim data yang user tidak berhak lihat. Keamanan sesungguhnya ada di server. Detail lengkap di [Bagian 8.1](#81-soal-supaya-tidak-mudah-di-inspect).

**2. "Kendali lengkap oleh tim IT"**

Benar untuk kendali sistem, tapi akses IT ke isi rekam medis pasien harus melewati mekanisme break-glass dengan pencatatan wajib. Bukan untuk mempersulit pekerjaan IT, tapi karena ini akan ditanyakan saat akreditasi dan berkaitan dengan UU PDP. Detail di [catatan Bagian 5.2](#g-teknologi--komunikasi).

**3. Rajal, Ranap, dan IGD bukan role**

Itu unit kerja. Yang bertugas di sana tetap dokter, perawat, atau administrasi. Memodelkannya sebagai unit (bukan role) mencegah ledakan jumlah role dan membuat sistem jauh lebih fleksibel. Detail di [ADR-02](#adr-02--role-terpisah-dari-unit).

### 14.3 Saran Penutup

Tiga hal yang paling berpengaruh pada keberhasilan Mediva:

1. **Habiskan waktu ekstra di Fase 1A dan tabel `kunjungan`.** Dua hal ini adalah fondasi yang menopang semua yang lain. Kalau benar, sisa proyek terasa lancar. Kalau salah, kalian akan terus merombak.

2. **Tunjukkan hasil ke staf RS setiap akhir fase.** Kamu punya pengalaman magang — manfaatkan jaringan itu. Perawat yang bilang "form ini terlalu banyak kliknya" di bulan ke-3 jauh lebih murah daripada menemukannya di bulan ke-12.

3. **Jangan bangun 31 dashboard sekaligus.** Bangun 3 dulu sampai benar-benar bagus: dokter, farmasi, pendaftaran. Setelah pola tampilannya matang, 28 sisanya akan jauh lebih cepat karena tinggal menyusun ulang komponen yang sudah ada.

---

---

## 22. Current Project Status & Next Recommended Tasks

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

### Urutan Kerja Master Setelah Blueprint Digabung

```text
1. Finalisasi ERD Core
2. Putuskan nama final tabel assignment RBAC (`role_assignments`)
3. Migration users / employees / roles / units / permissions / role_assignments
4. Authentication + current user
5. Active role/assignment + role selector + switch role
6. Authorization middleware / policy
7. Dashboard shell + sidebar/topbar dinamis
8. Design system minimum yang dipakai lintas modul
9. Patient
10. Registration + Visit + Queue
11. Doctor Examination + SOAP + Diagnosis + Procedure
12. Electronic Prescription
13. Pharmacy + Stock
14. Billing + Payment
15. Reports
16. Red Code IT / Helpdesk dapat berjalan paralel setelah foundation stabil
17. Modul lanjutan dan integrasi eksternal setelah core workflow stabil
```

---

## 23. Appendices

### Appendix A — Checklist Setup Awal (Track SPA/API)

```text
[ ] Laravel + React + Tailwind + Vite berada dalam satu monorepo
[ ] Database `mediva` terhubung
[ ] `npm run dev` menjalankan proses development yang dibutuhkan
[ ] React Router / AppRouter aktif
[ ] API client global tersedia
[ ] Auth state/current-user tersedia
[ ] Queue tersedia untuk job asynchronous
[ ] Folder `modules/` dan `shared/` sudah menjadi pola utama frontend
[ ] Middleware/Policy authorization disiapkan sebelum modul klinis berkembang
[ ] Audit log disiapkan sejak fondasi
[ ] `.env.example`, linting, formatting, dan Git workflow tersedia
```

> Checklist Inertia pada blueprint sumber dipertahankan sebagai riwayat alternatif arsitektur, tetapi tidak menjadi track implementasi aktif selama MEDIVA memakai `AppRouter.jsx` + API.

### Appendix B — Daftar Role & Kode

| Kode                   | Nama                      | Kelompok     | 2FA | STR |
| ---------------------- | ------------------------- | ------------ | --- | --- |
| `dokter`               | Dokter                    | medis        | —   | ✓   |
| `perawat`              | Perawat                   | medis        | —   | ✓   |
| `operasi`              | Tim Operasi / OK          | medis        | —   | ✓   |
| `apoteker`             | Apoteker                  | penunjang    | —   | ✓   |
| `farmasi`              | Tenaga Teknis Kefarmasian | penunjang    | —   | ✓   |
| `laboratorium`         | Analis Laboratorium       | penunjang    | —   | ✓   |
| `ahli_gizi`            | Ahli Gizi                 | penunjang    | —   | ✓   |
| `gudang_farmasi`       | Gudang Obat & Alkes       | penunjang    | —   | —   |
| `rekam_medis`          | Rekam Medis               | penunjang    | —   | ✓   |
| `pendaftaran`          | Pendaftaran Pasien        | front_office | —   | —   |
| `customer_service`     | Customer Service          | front_office | —   | —   |
| `administrasi`         | Administrasi              | front_office | —   | —   |
| `casemix`              | Casemix                   | front_office | —   | —   |
| `keuangan`             | Keuangan                  | keuangan     | ✓   | —   |
| `perpajakan`           | Perpajakan                | keuangan     | ✓   | —   |
| `direksi`              | Direksi                   | manajemen    | ✓   | —   |
| `manager_pengembangan` | Manager Pengembangan RS   | manajemen    | ✓   | —   |
| `manager_unit`         | Manager Unit              | manajemen    | —   | —   |
| `admin_rs`             | Admin Rumah Sakit         | manajemen    | ✓   | —   |
| `hrd`                  | HRD / SDM                 | sdm_umum     | ✓   | —   |
| `diklat`               | Diklat                    | sdm_umum     | —   | —   |
| `tata_usaha`           | Tata Usaha                | sdm_umum     | —   | —   |
| `legal`                | Legal                     | sdm_umum     | ✓   | —   |
| `keamanan_umum`        | Keamanan & Umum           | sdm_umum     | —   | —   |
| `mfk`                  | MFK                       | sdm_umum     | —   | —   |
| `it`                   | Teknologi Informasi       | teknologi    | ✓   | —   |
| `marketing_komunikasi` | Marketing Komunikasi      | teknologi    | —   | —   |
| `digital_marketing`    | Digital Marketing         | teknologi    | —   | —   |

**28 role.** `Rajal`, `Ranap`, dan `IGD` dimodelkan sebagai **unit**, bukan role — lihat [ADR-02](#adr-02--role-terpisah-dari-unit).

---

### Appendix C — Catatan Evolusi Arsitektur

- Blueprint GPT membawa implementasi frontend per-module yang sudah sesuai kondisi pengembangan saat ini.
- Blueprint Claude membawa pemisahan role vs unit, Red Code, security, design system, database target, dan roadmap yang lebih luas.
- `user_roles` dari rancangan sederhana berevolusi menjadi `role_assignments` untuk menyimpan konteks unit.
- Inertia.js dicatat sebagai alternatif arsitektur yang valid, tetapi blueprint master memilih satu track routing agar implementasi tidak bercabang.
- Integrasi eksternal tidak menjadi syarat MVP core; desain kolom/kode eksternal dapat dipersiapkan dari awal bila memang dibutuhkan.


### Appendix D — Sumber Referensi dari Blueprint Sumber

- [Integrating Indonesian Hospitals with SATUSEHAT: A Developer's Guide to HL7 FHIR](https://dev.to/medminutes/integrating-indonesian-hospitals-with-satusehat-a-developers-guide-to-hl7-fhir-3ig)
- [Regulasi SIMRS 2026: Apa yang Berubah dan Mengapa RS Harus Siap Sekarang](https://www.dhealth.co.id/post/regulasi-simrs-2026-apa-yang-berubah-dan-mengapa-rs-harus-siap-sekarang)
- [SATUSEHAT FHIR R4 Implementation Guide](https://simplifier.net/guide/SATUSEHAT-FHIR-R4-Implementation-Guide/Home/Modul-Pelayanan/ResourceInformation)
- [bridging-bpjs — VClaim, Aplicare, Antrean, PCare & i-Care untuk Laravel](https://github.com/indravscode/bridging-bpjs)
- [Tailwind CSS — Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Regulasi Digital Health untuk Rumah Sakit Indonesia 2026: Compliance Map](https://medminutes.io/blog/regulasi-digital-health-rumah-sakit-2026-compliance-map/)
---

_Dokumen ini adalah dokumen hidup. Setiap keputusan arsitektur besar harus memperbarui blueprint ini agar MEDIVA tetap memiliki satu sumber kebenaran._
