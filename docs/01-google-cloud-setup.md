# Google OAuth Setup untuk Upload ke Drive

Panduan ini untuk setup dari nol sampai aplikasi bisa upload file ke Google Drive via OAuth refresh token.

## Prasyarat

1. Punya akun Google (Gmail biasa juga bisa).
2. Sudah install Node.js dan `npm`.
3. Project ini sudah bisa dijalankan lokal.

## Kondisi Project Saat Ini (Penting)

- Project ini **tidak memakai Google Workspace**.
- Kamu bisa pakai akun Google personal (`@gmail.com`) untuk OAuth uploader.
- Jadi untuk mengikuti panduan ini, Workspace **tidak wajib**.
- Workspace baru relevan kalau kamu butuh akses internal organisasi/domain perusahaan.

## Checklist Cepat Sebelum Mulai

- Pakai browser yang login ke akun Google yang memang mau dijadikan uploader.
- Pastikan project Google Cloud yang aktif benar (bukan project lain).
- Siapkan `.env.local` dari `.env.example`.
- Jangan share `code` OAuth atau `refresh token` ke orang lain.

## 1. Buat Project di Google Cloud

1. Buka `https://console.cloud.google.com/`.
2. Klik dropdown project di bagian atas.
3. Klik **New Project**.
4. Isi nama project, contoh: `upload-drive-oauth`.
5. Klik **Create**.
6. Pastikan project yang aktif adalah project baru itu.

## 2. Enable Google Drive API

1. Di sidebar, buka **APIs & Services > Library**.
2. Cari `Google Drive API`.
3. Klik hasilnya.
4. Klik **Enable**.

## 3. Setup OAuth Consent Screen

1. Buka **APIs & Services > OAuth consent screen**.
2. Pilih Audience:
   - `External` jika dipakai akun dari luar organisasi (termasuk `@gmail.com`).
   - `Internal` jika hanya untuk akun satu organisasi Google Workspace.
3. Isi informasi aplikasi:
   - App name
   - User support email
   - Developer contact email
4. Simpan sampai selesai.
5. Tambahkan scope `https://www.googleapis.com/auth/drive.file`.

### Jika menu `User type` tidak terlihat

Di UI Google terbaru, kadang label `User type` tidak muncul seperti tutorial lama.

Langkah cek yang benar:
1. Buka **Google Auth Platform > Audience** (di sidebar Google Cloud).
2. Cek tipe audience di sana (`External` atau `Internal`).
3. Jika status app masih **Testing**, tambahkan email kamu di **Test users**.
4. Simpan, tunggu 1-5 menit, lalu coba login OAuth lagi.

Catatan:
- Kalau kamu pakai akun Gmail personal, umumnya gunakan `External`.
- Kalau pilih `Internal`, akun luar domain Workspace tidak bisa akses.

### Penjelasan cepat: Internal vs External

- `Internal`: hanya akun di 1 organisasi Workspace yang sama.
- `External`: akun mana pun (lintas domain, termasuk Gmail personal).

### Apa itu domain?

- Domain adalah bagian belakang email, contoh:
  - `@kampus.ac.id`
  - `@perusahaan.com`
- Jika semua user satu domain organisasi: biasanya `Internal`.
- Jika user campuran domain: pilih `External`.

## 4. Buat OAuth Client ID

1. Buka **APIs & Services > Credentials**.
2. Klik **Create Credentials > OAuth client ID**.
3. Pilih **Application type: Web application**.
4. Isi nama client, contoh: `upload-drive-web`.
5. Pada **Authorized redirect URIs**, tambahkan:
   - `http://localhost:3000/oauth2callback`
6. Klik **Create**.
7. Simpan nilai:
   - `Client ID`
   - `Client Secret`

### Redirect URI: pakai yang mana?

Untuk **lokal**, pakai ini saja:
- `http://localhost:3000/oauth2callback`

Artinya:
- Kalau kamu jalankan app di port `3000`, ini sudah benar.
- Kalau kamu jalankan app di port lain (misal `3001`), URI harus ikut diganti jadi `http://localhost:3001/oauth2callback`.

Untuk **production**, wajib tambah URI domain production juga, contoh:
- `https://app.kamu.com/oauth2callback`

Catatan penting:
- Redirect URI harus **persis sama** antara Google Cloud dan `.env.local`.
- Beda kecil seperti port, `http` vs `https`, trailing slash (`/`) bisa bikin error `redirect_uri_mismatch`.
- Boleh isi lebih dari satu redirect URI di Google Cloud (lokal + production).

## 5. Isi File `.env.local`

1. Copy `.env.example` jadi `.env.local`.
2. Isi nilainya:

```env
GOOGLE_OAUTH_CLIENT_ID=isi-dengan-client-id
GOOGLE_OAUTH_CLIENT_SECRET=isi-dengan-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
UPLOAD_RATE_LIMIT_WINDOW_MS=60000
UPLOAD_RATE_LIMIT_MAX_REQUESTS=20
```

Keterangan:
- `GOOGLE_OAUTH_REFRESH_TOKEN` dikosongkan dulu, nanti diisi dari langkah 6.
- `GOOGLE_DRIVE_FOLDER_ID`:
  - kosong = upload ke root Drive akun uploader
  - isi ID/URL folder = upload ke folder tertentu

## 6. Generate Refresh Token (Sekali Saja)

1. Jalankan:

```bash
npm run oauth:token
```

2. Script akan menampilkan URL consent, buka URL itu di browser.
3. Login dengan akun Google yang akan jadi uploader.
4. Setelah approve, browser redirect ke URL semacam:
   - `http://localhost:3000/oauth2callback?iss=https://accounts.google.com&code=...&scope=...`
5. Copy nilai parameter `code` saja.
6. Paste `code` ke terminal.
7. Script akan mengeluarkan:
   - `GOOGLE_OAUTH_REFRESH_TOKEN=...`
8. Copy nilai itu ke `.env.local`.

Penting:
- Akun Google yang login di langkah ini akan jadi **akun uploader utama**.
- Jadi semua file upload aplikasi akan masuk ke Drive akun itu.
- Tidak perlu menjalankan `npm run dev` saat generate token ini.
- Jika halaman `localhost` terlihat error/blank setelah redirect, itu normal selama URL callback sudah memuat parameter `code`.

## 7. (Opsional) Atur Folder Target Upload

Jika ingin upload ke folder tertentu:
1. Buka folder di Google Drive.
2. Ambil ID folder dari URL:
   - `https://drive.google.com/drive/folders/<FOLDER_ID>`
3. Isi `.env.local`:
   - `GOOGLE_DRIVE_FOLDER_ID=<FOLDER_ID>`

## 8. Jalankan Aplikasi dan Cek

1. Jalankan:

```bash
npm run dev
```

2. Buka `http://localhost:3000`.
3. Upload file kecil (misal PDF).
4. Pastikan:
   - Upload sukses.
   - `Submission ID` muncul.
   - Tombol `Open File` bisa membuka file.

## Troubleshooting Singkat

- Error `invalid_grant`:
  - Refresh token salah/expired/revoked.
  - Solusi: generate ulang via `npm run oauth:token`.
- Error `access_denied` (403) saat login OAuth:
  - App masih mode **Testing** dan akunmu belum masuk **Test users**.
  - Solusi: buka **Google Auth Platform > Audience**, lalu tambahkan email akunmu ke daftar tester.
- Error `redirect_uri_mismatch`:
  - Redirect URI di Google Cloud tidak sama dengan `GOOGLE_OAUTH_REDIRECT_URI`.
  - Solusi: samakan persis nilainya (protocol, host, port, path).
- Error env variable missing:
  - Ada variable OAuth yang belum terisi.
- Upload gagal ke folder:
  - Akun uploader tidak punya akses ke folder target.

## Biaya: Gratis atau Berbayar?

Ringkasnya: **bisa mulai gratis**, tetapi **bisa jadi berbayar** tergantung storage akun dan setup production kamu.

### Case project saat ini (tanpa Workspace)

- Kondisi kamu sekarang: OAuth uploader pakai akun Google personal (`@gmail.com`), bukan Workspace.
- Untuk setup dan testing awal: **umumnya gratis**.
- Biaya baru muncul kalau storage akun Google personal kamu penuh.
- Jadi untuk case ini, komponen biaya utama adalah **kapasitas Google Drive akun uploader**.

### Yang umumnya gratis

- Setup OAuth Consent Screen, OAuth Client ID, dan proses login OAuth.
- Pemakaian Google Drive API sendiri tidak dikenakan biaya tambahan per request.
- Jika quota request habis, biasanya kena limit (`403/429`), bukan langsung ditagih biaya API.

### Yang bisa jadi berbayar

- **Storage Google Drive akun uploader**:
  - Akun Google personal punya storage gratis terbatas (umumnya 15 GB, gabung dengan Gmail + Photos).
  - Jika storage habis, kamu perlu upgrade (misal Google One).
- **Google Workspace** (kalau pakai domain organisasi):
  - Berlangganan per user/plan, dengan kuota storage sesuai paket.

### Contoh cepat (biar kebayang)

- Jika total file peserta masih muat di kuota gratis akun uploader: biaya `Rp 0` dari sisi storage Google.
- Jika kuota storage akun uploader habis: upload baru akan gagal sampai kamu kosongkan storage atau upgrade plan storage.

### Cara cek harga terbaru (resmi)

- Google Drive API usage limits + pricing note:  
  `https://developers.google.com/drive/api/guides/limits`
- Google One plans (akun personal):  
  `https://one.google.com/plans`
- Google Workspace pricing (organisasi/domain):  
  `https://workspace.google.com/pricing`

Catatan: harga bisa berubah per waktu, negara, mata uang, dan promo.

## FAQ Singkat (Hal yang Sering Ambigu)

- **Q: Di lokal cukup pakai `http://localhost:3000/oauth2callback`?**  
  A: Iya, kalau app kamu jalan di port 3000.

- **Q: Harus pakai `https` di lokal?**  
  A: Tidak. `http` untuk localhost normal.

- **Q: Kenapa dapat `access_denied` waktu consent?**  
  A: Biasanya karena app masih mode testing dan akunmu belum masuk daftar test user di OAuth consent screen.

- **Q: Saya tidak lihat menu `User type`, normal?**  
  A: Normal. Cek di **Google Auth Platform > Audience**. Di sana juga tempat tambah `Test users`.

- **Q: Refresh token perlu generate tiap hari?**  
  A: Tidak. Biasanya cukup sekali, kecuali token dicabut/revoke atau invalid.

- **Q: Setelah approve, halaman localhost error. Gimana?**  
  A: Tidak masalah. Yang penting URL redirect mengandung parameter `code`, lalu copy `code` itu ke terminal.

- **Q: Dari URL callback, yang di-copy apa?**  
  A: Hanya nilai `code` saja. Jangan copy seluruh URL, jangan ikut `iss` atau `scope`.
