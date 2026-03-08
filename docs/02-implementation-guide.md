# Implementation Guide (OAuth + Submission + Public Link)

## Arsitektur Ringkas

1. User memilih file di frontend.
2. Frontend kirim `multipart/form-data` ke `POST /api/upload`.
3. Backend cek rate limit per IP.
4. Backend validasi file (MIME + max 10MB).
5. Backend upload file ke Google Drive via OAuth refresh token.
6. Backend set permission `anyone with link` (read).
7. Backend return `submissionId` + `webViewLink`.
8. Frontend simpan metadata submit ke localStorage (mode dummy).

## Kontrak API

### `POST /api/upload`

Request:
- Content-Type: `multipart/form-data`
- Field: `files` (multi-file) atau fallback `file`

Success response:

```json
{
  "success": true,
  "uploaded": [
    {
      "submissionId": "uuid",
      "fileName": "example.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "uploadedAt": "2026-03-09T08:00:00.000Z",
      "status": "uploaded",
      "webViewLink": "https://drive.google.com/file/d/...",
      "webContentLink": "https://drive.google.com/uc?id=..."
    }
  ],
  "failed": []
}
```

Rate limit response (`429`):

```json
{
  "success": false,
  "uploaded": [],
  "failed": [{ "name": "rate-limit", "reason": "Terlalu banyak request. Coba lagi nanti." }]
}
```

## Kebijakan Keamanan Saat Ini

- File dibagikan `anyone with link` agar peserta bisa membuka file sendiri.
- `submissionId` tetap dipakai sebagai bukti submit.
- `driveFileId` tidak diekspos ke frontend.
- Baseline abuse protection: rate limit saja (tanpa CAPTCHA).

## Storage Dummy

- Key localStorage: `upload_submission_history_v1`
- Isi: metadata submit + link file.

## File Teknis Utama

- `src/lib/google-drive.js` untuk OAuth client + Drive client.
- `src/app/api/upload/route.js` untuk upload flow + validation + rate limit.
- `src/lib/rate-limit.js` untuk fixed-window limit in-memory.
- `src/app/page.js` untuk UI submit + receipt history + open/copy link.
