# MEDIVA — Runtime Testing Laboratorium

## A. Persiapan

Pastikan migration selesai dan dua seeder laboratorium sudah dijalankan.

```powershell
php artisan migrate:status
php artisan test --filter=LaboratoryServiceTest
```

Login sebagai role **IT** untuk pengujian penuh.

Seeder menyediakan data awal:

- Jenis Sampel: Darah EDTA, Serum, Urine
- Pemeriksaan: Darah Lengkap
- Tarif Darah Lengkap: Rp75.000
- Parameter: Hemoglobin, Leukosit, Trombosit
- Nilai rujukan laki-laki dan perempuan

Pastikan sudah ada minimal satu **kunjungan pasien** yang tidak dibatalkan.

---

## B. Dashboard Laboratorium

Buka menu **Pelayanan → Laboratorium**.

Target:

- halaman terbuka tanpa error
- kartu Permintaan Hari Ini muncul
- Menunggu Sampel muncul
- Sedang Diproses muncul
- Menunggu Verifikasi muncul
- Selesai Hari Ini muncul
- Hasil Kritis muncul

Status: `⬜`

---

## C. Master Laboratorium

### 1. Jenis Sampel

Buat data test:

```text
Kode  : CITRATE
Nama  : Darah Sitrat
Wadah : Tabung Biru
```

Target:

- data tersimpan
- muncul di daftar
- muncul pada pilihan jenis sampel pemeriksaan

Status: `⬜`

### 2. Jenis Pemeriksaan

Buat:

```text
Kode            : LAB-GDS
Nama            : Gula Darah Sewaktu
Kategori        : Kimia Klinik
Jenis Sampel    : Serum
Tarif           : 50000
Target Selesai  : 60 menit
```

Target:

- tersimpan
- searchable
- tarif tampil Rp50.000

Status: `⬜`

### 3. Parameter

Pilih `LAB-GDS`, lalu tambah:

```text
Kode      : GLU
Nama      : Glukosa
Tipe Data : Angka
Satuan    : mg/dL
```

Status: `⬜`

### 4. Nilai Rujukan

Tambah:

```text
Jenis Kelamin : Semua
Nilai Min     : 70
Nilai Maks    : 140
Kritis Min    : 40
Kritis Maks   : 400
```

Target:

- nilai rujukan tampil pada parameter
- dapat dipakai saat input hasil

Status: `⬜`

---

## D. Permintaan Pemeriksaan

Pilih satu kunjungan pasien.

Pilih:

```text
Darah Lengkap
```

Catatan:

```text
Demam 3 hari, evaluasi hematologi.
```

### Test Draf

Klik **Simpan Draf**.

Target:

```text
Status = Draf
No. Lab otomatis = LAB-YYYYMMDD-XXXX
```

Klik **Ajukan**.

Target:

```text
Draf → Diajukan
```

Status: `⬜`

### Test langsung diajukan

Buat permintaan kedua dan klik **Ajukan Permintaan**.

Target:

```text
Status langsung = Diajukan
```

Status: `⬜`

---

## E. Sampel

Pada permintaan berstatus **Diajukan** klik **Ambil Sampel**.

Target:

```text
Order        : Sampel Diambil
No. Sampel   : SPC-YYYYMMDD-XXXX
Jenis Sampel : Darah EDTA
Status Sampel: Diambil
```

Klik **Terima Sampel**.

Target:

```text
Status Sampel = Diterima
```

Status: `⬜`

### Test Penolakan Sampel

Pada permintaan test lain, ambil sampel lalu klik **Tolak Sampel**.

Alasan:

```text
Sampel hemolisis.
```

Target:

- sampel = Ditolak
- item pemeriksaan terkait = Dibatalkan
- jika seluruh sampel ditolak, order = Dibatalkan

Status: `⬜`

---

## F. Proses Pemeriksaan

Untuk order dengan seluruh sampel aktif sudah **Diterima**, klik **Mulai Proses**.

Target:

```text
Sampel Diambil → Diproses
```

Status: `⬜`

---

## G. Input Hasil & Flag Abnormal

Masuk tab **Hasil Laboratorium** dan pilih order yang Diproses.

Untuk pasien perempuan contoh nilai normal:

```text
Hemoglobin : 13.2
Leukosit   : 7500
Trombosit  : 250000
```

Klik **Simpan Hasil**.

Target seluruh flag:

```text
Normal
```

Status: `⬜`

### Test nilai rendah

Ubah Hemoglobin menjadi:

```text
10
```

Target:

```text
Flag = Rendah
```

Status: `⬜`

### Test nilai kritis

Ubah Hemoglobin menjadi:

```text
6.5
```

Target:

```text
Flag = Kritis
```

Status: `⬜`

Kembalikan nilai ke nilai yang diinginkan sebelum finalisasi.

---

## H. Validasi Hasil Tidak Lengkap

Kosongkan salah satu parameter lalu klik **Ajukan Verifikasi**.

Target:

```text
422 / alert:
Hasil <nama pemeriksaan> belum lengkap.
```

Status order harus tetap:

```text
Diproses
```

Status: `⬜`

---

## I. Verifikasi Hasil

Lengkapi seluruh parameter.

Klik:

```text
Ajukan Verifikasi
```

Target:

```text
Diproses → Menunggu Verifikasi
```

Klik:

```text
Verifikasi Hasil
```

Target:

```text
Menunggu Verifikasi → Selesai
verified_at terisi
verified_by terisi
hasil tidak bisa diedit melalui flow normal
```

Status: `⬜`

---

## J. Integrasi Rekam Medis

Setelah hasil selesai, buka **Rekam Medis** pasien yang sama.

Target pada kunjungan tersebut muncul section:

```text
Hasil Laboratorium
├── No. Lab
├── Darah Lengkap
├── Hemoglobin
├── Leukosit
├── Trombosit
├── Nilai
├── Satuan
├── Nilai Rujukan
└── Flag
```

Status: `⬜`

---

## K. Integrasi Billing

Syarat:

- hasil laboratorium sudah Selesai
- kunjungan sudah Selesai
- invoice belum memiliki pembayaran posted

Buka Billing dan **buat/sinkronkan tagihan** untuk kunjungan tersebut.

Target:

```text
Kategori  : laboratory
Deskripsi : Darah Lengkap
Jumlah    : 1
Harga     : Rp75.000
```

Jika invoice sudah dibayar, MEDIVA memang harus menolak sinkronisasi sesuai proteksi Billing yang sudah ada.

Status: `⬜`

---

## L. Search / Filter / Pagination

Buat lebih dari satu permintaan kemudian test:

- cari berdasarkan No. Lab
- cari berdasarkan nama pasien
- cari berdasarkan No. RM
- filter Draf
- filter Diajukan
- filter Diproses
- filter Menunggu Verifikasi
- filter Selesai
- pindah halaman jika data > 10

Status: `⬜`

---

## M. Permission

### IT

Target:

```text
Semua fitur Laboratorium dapat diuji.
```

### Dokter

Target permission:

```text
laboratory.view
laboratory.create
```

Dokter tidak seharusnya dapat:

- mengelola master
- mengambil sampel
- memproses
- input hasil
- verifikasi hasil

### Role Laboratorium

Seeder membuat role slug:

```text
laboratory
```

Setelah role tersebut diberi assignment ke user/unit Laboratorium, targetnya memiliki seluruh permission laboratorium.

Status: `⬜`

---

## N. Audit Log

Cek activity log setelah menjalankan workflow.

Minimal harus ada action:

```text
laboratory.order.create
laboratory.order.submit
laboratory.sample.collect
laboratory.sample.receive
laboratory.process.start
laboratory.result.save
laboratory.result.submit_verification
laboratory.result.verify
laboratory.order.cancel
```

Status: `⬜`

---

# Target Akhir

Jika seluruh runtime test lolos:

```text
✅ Database Laboratorium
✅ Model Laboratorium
✅ Relasi Pasien
✅ Relasi Visit / Kunjungan
✅ Relasi Dokter
✅ Relasi Unit
✅ Master Jenis Pemeriksaan
✅ Parameter Pemeriksaan
✅ Nilai Rujukan
✅ Jenis Sampel
✅ Permintaan Pemeriksaan
✅ Nomor Laboratorium Otomatis
✅ Pengambilan Sampel
✅ Status Sampel
✅ Proses Pemeriksaan
✅ Input Hasil
✅ Flag Hasil Abnormal
✅ Verifikasi Hasil
✅ Riwayat Hasil
✅ Integrasi Medical Record
✅ Integrasi Billing
✅ Audit Log
✅ Permission
✅ Search
✅ Filter
✅ Pagination
✅ Dashboard Laboratorium
✅ Frontend
✅ Backend API
✅ Runtime Testing

🎉 LABORATORIUM COMPLETE
```
