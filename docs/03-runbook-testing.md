# Runbook Testing & Troubleshooting (OAuth)

## Prasyarat

- `.env.local` sudah berisi OAuth config valid.
- `GOOGLE_OAUTH_REFRESH_TOKEN` sudah didapat dari `npm run oauth:token`.
- Google Drive API aktif di Google Cloud project.

## Smoke Test Manual

1. Jalankan:

```bash
npm run dev
```

2. Buka `http://localhost:3000`.
3. Upload file valid (misal PDF kecil).
4. Verifikasi:
   - ada pesan sukses
   - muncul `submissionId`
   - tombol `Open File` bisa membuka file
   - item masuk riwayat submit (localStorage)
5. Coba spam request cepat (manual): pastikan akhirnya `429`.

## Skenario Uji Penting

- File >10MB ditolak.
- MIME type di luar whitelist ditolak.
- Multi-file campuran mengembalikan `uploaded` dan `failed` konsisten.
- Response sukses memuat `submissionId` dan `webViewLink`.

## Error Umum

### `invalid_grant`

Penyebab:
- Refresh token invalid/revoked.

Solusi:
- Generate ulang token via `npm run oauth:token`.

### `Missing required environment variable`

Penyebab:
- Env OAuth belum lengkap.

Solusi:
- Lengkapi `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_OAUTH_REFRESH_TOKEN`.

### `Akses Google Drive tidak cukup untuk upload ke folder target`

Penyebab:
- Akun uploader OAuth tidak punya akses write ke folder target.

Solusi:
- Share folder ke akun uploader atau gunakan folder milik akun uploader tersebut.

## Catatan Operasional

- Rate limit in-memory cocok untuk single-instance/basic deployment.
- Untuk skala besar, gunakan rate limiter yang persistent agar limit tetap konsisten.
- localStorage hanya untuk dummy, bukan source of truth production.
- Public link memudahkan peserta, namun menambah risiko kebocoran jika link tersebar.
