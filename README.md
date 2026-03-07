# SIKOMJAKES - Sistem Kompetensi Jabatan Kesehatan

Aplikasi web enterprise responsive dengan desain modern government dashboard.

## Cara Menggunakan

### 1. Buka Langsung (Mode Demo)
Buka `sikomjakes.html` di browser - tanpa install apapun!

### 2. Menggunakan Google Sheets + Drive (Untuk Produksi)

#### Step 1: Siapkan Google Sheets
1. Buat Google Sheets baru (atau gunakan yang sudah ada)
2. Copy Spreadsheet ID dari URL:
   - Dari: `https://docs.google.com/spreadsheets/d/1Ox0u5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo/edit`
   - ID: `1Ox0u5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo`
3. Rename sheet menjadi "Peserta"
4. Tambahkan header di baris 1 (kolom A-T):
   - A: Timestamp
   - B: Periode
   - C: Nama Lengkap
   - D: NIK
   - E: NIP
   - F: Nomor Telpon
   - G: Email
   - H: Unit Kerja
   - I: Jenis Jabatan
   - J: Jenjang Jabatan
   - K: Pangkat Golongan
   - L: Nilai PAK
   - M: Nomor STR
   - N: Kategori Penjenjangan
   - O: Jabfung Tujuan
   - P: Jenjang Tujuan
   - Q: Foto URL
   - R: Dokumen URL
   - S: Status Verifikasi
   - T: Status Ujian

#### Step 2: Siapkan Google Drive
1. Buat folder untuk upload dokumen
2. Copy Folder ID dari URL:
   - Dari: `https://drive.google.com/drive/folders/1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF`
   - Folder ID: `1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF`

#### Step 3: Setup Google Apps Script
1. Buka https://script.google.com
2. New Project
3. Copy isi file `GoogleAppsScript.gs`
4. Di dalam kode, pastikan:
   ```javascript
   const SPREADSHEET_ID = '1Ox0u5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo';
   const DRIVE_FOLDER_ID = '1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF';
   ```
5. Deploy > New Deployment > Web App
   - Execute as: Me
   - Who has access: Anyone
6. Copy Deployment URL (format: `https://script.google.com/macros/s/XXXXX/exec`)

#### Step 4: Update HTML
Buka `sikomjakes.html`, cari bagian:
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo/exec';
const DRIVE_FOLDER_ID = '1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF';
let useMockData = false;
```

Ganti SCRIPT_URL dengan URL deployment Anda.

#### Step 5: Testing
1. Buka sikomjakes.html di browser
2. Buka Developer Tools (F12) > Console
3. Isi formulir pendaftaran dan submit
4. Periksa console untuk melihat response
5. Cek Google Sheets untuk memastikan data masuk
6. Cek Google Drive untuk memastikan file ter-upload

---

## Fitur

- **Dashboard**: Animated counters, Charts (Peserta per Tahun, Jabfung, Kelulusan, Provinsi)
- **Menu Utama** (tanpa login):
  - Formasi Jabfung KemenPAN
  - Bazzetting Formasi
  - Formulir Pendaftaran (18 kolom)
  - Daftar Peserta UKOM
- **Panel Admin** (login: admin/admin123)

### Kolom Formulir Pendaftaran:
1. Timestamp
2. Periode
3. Nama Lengkap
4. NIK
5. NIP
6. Nomor Telpon/WA
7. Email Aktif
8. Unit Kerja
9. Jenis Jabatan
10. Jenjang Jabatan
11. Pangkat dan Golongan
12. Nilai PAK terakhir
13. Nomor STR
14. Kategori Penjenjangan Jabatan
15. Nama Jabatan Fungsional Yang Dituju
16. Jenjang Jabatan Tujuan
17. Upload Foto Latar Merah
18. Upload Kelengkapan Dokumen

---

## Troubleshooting

### Data tidak masuk ke Google Sheets?
1. Pastikan Google Apps Script sudah di-deploy sebagai Web App
2. Pastikan "Who has access" adalah "Anyone" (bukan "Only myself")
3. Buka Console (F12) untuk melihat error message
4. Cek apakah Spreadsheet ID di Apps Script sudah benar

### File tidak ter-upload ke Google Drive?
1. Pastikan Folder ID sudah benar
2. Cek apakah folder sudah di-share dengan benar
3. Periksa error di Console

### Menggunakan Mode Demo
Jika masih bermasalah, ubah di sikomjakes.html:
```javascript
let useMockData = true; // Gunakan data demo
```

---

## Tech Stack

- **Frontend**: HTML5 + TailwindCSS + ApexCharts
- **Backend Data**: Google Sheets (via Apps Script)
- **Backend Files**: Google Drive

## Lisensi

Copyright © 2024 SIKOMJAKES
