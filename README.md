# SIKOMJAKES - Sistem Kompetensi Jabatan Kesehatan

Aplikasi web enterprise responsive dengan desain modern government dashboard untuk pengelolaan Uji Kompetensi Jabatan Fungsional Kesehatan.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Charts**: ApexCharts
- **UI**: Glassmorphism, Modern Dashboard Design

## Struktur Project

```
SIKOMJAKES/
├── sikomjakes-backend/     # Backend API
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth & audit middleware
│   ├── routes/            # API routes
│   ├── server.js          # Entry point
│   └── .env               # Environment variables
│
└── sikomjakes-frontend/   # Frontend React
    ├── src/
    │   ├── components/    # Layout components
    │   ├── context/       # React Context
    │   ├── pages/         # Page components
    │   └── services/      # API services
    └── public/            # Static assets
```

## Cara Install & Jalankan

### Prerequisites
- Node.js v18+
- MySQL v8.0+

### Step 1: Setup Database MySQL

1. Buat database baru:
```sql
CREATE DATABASE sikomjakes;
```

2. Konfigurasi koneksi di `sikomjakes-backend/.env`:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sikomjakes
JWT_SECRET=sikomjakes_secret_key_2024
NODE_ENV=development
```

### Step 2: Install & Jalankan Backend

```bash
# Pindah ke folder backend
cd sikomjakes-backend

# Install dependencies
npm install

# Jalankan server (akan otomatis buat tabel)
npm start
```

Server akan berjalan di `http://localhost:3000`

### Step 3: Install & Jalankan Frontend

Buka terminal baru:

```bash
# Pindah ke folder frontend
cd sikomjakes-frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Akun Demo

Setelah aplikasi berjalan, login dengan:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

## Fitur Utama

### 1. Dashboard
- Statistik real-time dengan animated counters
- Grafik Peserta UKOM per Tahun
- Grafik Peserta per Jenis Jabfung
- Grafik Kelulusan
- Grafik Provinsi Peserta

### 2. Menu Utama

#### Formasi Jabfung KemenPAN
- Tabel data formasi
- Search & Filter
- Export Excel & PDF
- Pagination

#### Bazzetting Formasi
- Distribusi kebutuhan SDM
- Grafik kekurangan SDM kesehatan

#### Formulir Pendaftaran
- Form lengkap data peserta
- Validasi NIK unik
- Upload dokumen (SK, STR, Ijazah, Foto)
- Popup peringatan jika NIK duplikat

#### Daftar Peserta UKOM
- Tabel peserta
- Filter by Jabfung, Instansi, Status
- View detail peserta

### 3. Panel Admin (Login Required)

#### CRUD Data
- Data Jabfung
- Data Formasi
- Data Instansi

#### Seleksi Peserta
- Verifikasi administrasi
- Status: Belum Diverifikasi, Lolos, Tidak Lolos
- Catatan admin

#### Manajemen Dokumen
- Preview dokumen
- Validasi dokumen

#### Manajemen Hasil UKOM
- Input nilai teori, praktik, wawancara
- Status kelulusan (LULUS/TIDAK LULUS)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Statistics
- `GET /api/dashboard/chart/tahun` - Chart by year
- `GET /api/dashboard/chart/jabfung` - Chart by jabfung
- `GET /api/dashboard/chart/kelulusan` - Chart kelulusan
- `GET /api/dashboard/chart/provinsi` - Chart by province

### Jabfung
- `GET /api/jabfung` - List all
- `POST /api/jabfung` - Create (admin)
- `PUT /api/jabfung/:id` - Update (admin)
- `DELETE /api/jabfung/:id` - Delete (admin)

### Formasi
- `GET /api/formasi` - List all
- `GET /api/formasi/stats/bazzetting` - Bazzetting data

### Peserta
- `GET /api/peserta` - List all
- `POST /api/peserta` - Register
- `GET /api/peserta/check-nik/:nik` - Check NIK
- `POST /api/peserta/:id/dokumen` - Upload document

### Admin
- `PUT /api/admin/peserta/:id/verify` - Verify participant
- `PUT /api/admin/peserta/:id/hasil` - Input exam results
- `GET /api/admin/audit-logs` - Audit logs

## Desain UI

- **Warna**: Biru kesehatan (#3b82f6), Putih, Teal (#14b8a6)
- **Komponen**: Glassmorphism cards, Modern tables
- **Animasi**: Smooth transitions, Animated counters
- **Responsif**: Desktop, Tablet, Mobile

## Lisensi

Copyright © 2024 SIKOMJAKES. All rights reserved.
