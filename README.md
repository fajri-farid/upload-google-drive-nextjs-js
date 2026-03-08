# Aplikasi Upload Google Drive (Next.js + OAuth2)

Aplikasi Next.js untuk upload file peserta ke Google Drive menggunakan OAuth2 refresh token (single uploader account), tanpa login Google di sisi pengguna akhir.

## Kenapa Project Ini

Repository ini ditujukan untuk tim yang butuh alur upload sederhana, dokumentasi setup yang jelas, dan jalur peningkatan menuju production.

Perilaku saat ini:
- pengguna dapat upload satu atau beberapa file,
- backend menyimpan file ke Google Drive,
- aplikasi mengembalikan `submissionId` sebagai bukti upload,
- aplikasi juga mengembalikan link file agar dapat dibuka oleh peserta.

## Fitur Utama

- Integrasi OAuth2 ke Google Drive API (menghindari kendala kuota service account untuk Drive personal).
- Upload multi-file dengan validasi tipe MIME dan batas ukuran file.
- Rate limit dasar pada endpoint upload (proteksi awal anti-abuse).
- Riwayat submit di localStorage browser (mode dummy/demo).
- Script bootstrap OAuth untuk generate refresh token dengan cepat.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Google Drive API v3 melalui `googleapis`
- Tailwind CSS v4

## Mulai Cepat

### 1. Install dependency

```bash
npm install
```

### 2. Buat file environment lokal

```bash
cp .env.example .env.local
```

Alternatif PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 3. Isi konfigurasi OAuth di `.env.local`

Nilai wajib:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

### 4. Generate refresh token

```bash
npm run oauth:token
```

Simpan nilai hasil script ke:
- `GOOGLE_OAUTH_REFRESH_TOKEN`

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka: `http://localhost:3000`

## Environment Variables

Variabel utama yang dipakai:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID` (opsional, bisa ID atau URL folder)
- `UPLOAD_RATE_LIMIT_WINDOW_MS`
- `UPLOAD_RATE_LIMIT_MAX_REQUESTS`

Lihat `.env.example` dan `docs/01-google-cloud-setup.md` untuk panduan lengkap.

## Ringkasan API

### `POST /api/upload`

- Content type: `multipart/form-data`
- Field utama: `files` (multi-file), fallback `file`

Respons sukses berisi:
- `success`
- `uploaded[]` dengan `submissionId`, metadata file, dan link file
- `failed[]` untuk item yang ditolak/gagal

Kontrak detail: `docs/02-implementation-guide.md`

## Struktur Project

```text
.
|-- docs/                        # Kumpulan dokumentasi project
|-- scripts/
|   `-- oauth-bootstrap.mjs      # Helper consent OAuth untuk mendapatkan refresh token
|-- src/
|   |-- app/
|   |   |-- api/upload/route.js  # Endpoint API upload
|   |   |-- layout.js            # Root layout aplikasi
|   |   `-- page.js              # UI upload + riwayat submit
|   `-- lib/
|       |-- google-drive.js      # Inisialisasi OAuth + Drive client
|       `-- rate-limit.js        # Rate limiter in-memory
|-- .env.example                 # Template environment variables
`-- README.md
```

## Peta Dokumentasi

- `docs/00-tech-stack.md`: ringkasan stack teknis fitur upload.
- `docs/01-google-cloud-setup.md`: panduan setup Google Cloud dan OAuth (pemula friendly).
- `docs/02-implementation-guide.md`: arsitektur dan perilaku API.
- `docs/03-runbook-testing.md`: checklist testing dan troubleshooting.
- `docs/04-dummy-vs-production-gap.md`: batasan saat ini dan jalur peningkatan ke production.

## Script Tersedia

- `npm run dev`: jalankan development server.
- `npm run build`: build aplikasi untuk production.
- `npm run start`: jalankan hasil build production.
- `npm run lint`: jalankan ESLint.
- `npm run oauth:token`: generate OAuth refresh token.

## Catatan Keamanan

Baseline saat ini:
- file di-share sebagai `anyone with link` agar peserta bisa membuka file,
- endpoint upload memiliki rate limit dasar,
- `submissionId` dikembalikan sebagai bukti submit.

Untuk data sensitif di production, sangat disarankan:
- model akses file private,
- penyimpanan metadata di database server-side,
- proteksi abuse yang lebih kuat.
