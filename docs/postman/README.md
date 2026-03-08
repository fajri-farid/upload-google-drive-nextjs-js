# Postman Guide - Upload Google Drive API

Dokumen ini menjelaskan pengenalan Postman, cara import collection/environment, dan cara menguji endpoint upload secara profesional.

## Tujuan

Folder ini disediakan agar tim bisa:
- melakukan verifikasi endpoint upload tanpa UI,
- menguji skenario sukses dan gagal dengan cepat,
- berbagi standar pengujian API yang konsisten.

## Isi Folder

- `upload-google-drive.postman_collection.json`  
  Kumpulan request utama untuk endpoint upload.
- `upload-google-drive.local.postman_environment.json`  
  Environment local (base URL dan path endpoint).

## Prasyarat

- Aplikasi berjalan lokal (`npm run dev`).
- Konfigurasi OAuth backend sudah valid di `.env.local`.
- Endpoint `POST /api/upload` dapat diakses.

## Pengenalan Singkat Postman

Postman adalah tool untuk mengirim HTTP request dan memeriksa response API.

Untuk kasus project ini, Postman berguna untuk:
- uji upload file langsung ke API,
- validasi struktur response (`success`, `uploaded`, `failed`),
- uji behavior error seperti request tanpa file.

## Langkah Setup Postman

1. Buka Postman.
2. Klik **Import**.
3. Import file collection:
   - `docs/postman/upload-google-drive.postman_collection.json`
4. Import file environment:
   - `docs/postman/upload-google-drive.local.postman_environment.json`
5. Pilih environment **Upload Google Drive - Local** di kanan atas Postman.

## Cara Menjalankan Request

### 1) Upload Files (Multi)

- Buka request `Upload Files (Multi)`.
- Tab **Body** sudah `form-data`.
- Pada key `files`, pilih file dari disk.
- Jika ingin multi-file, tambahkan key `files` lagi (tipe tetap `File`).
- Klik **Send**.

Expected:
- Status biasanya `200` jika ada file yang berhasil.
- Response berisi `uploaded[]` dengan `submissionId` dan link file.

### 2) Upload Single File (Fallback: file)

- Buka request `Upload Single File (Fallback: file)`.
- Pilih satu file pada key `file`.
- Klik **Send**.

Expected:
- Status `200` jika valid.
- Cocok untuk menguji fallback behavior backend.

### 3) Upload Tanpa File (Negative Case)

- Buka request `Upload Tanpa File (Negative Case)`.
- Jangan tambahkan file.
- Klik **Send**.

Expected:
- Status `400`.
- Response `failed[]` menjelaskan file tidak diberikan.

## Struktur Response Singkat

Contoh response sukses:

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

## Troubleshooting Umum

- `401/500` dengan `invalid_grant`:
  - Refresh token OAuth invalid/revoked.
- `429`:
  - Kena rate limit endpoint upload.
- `400` tanpa file:
  - Body form-data belum berisi key file yang benar.
- Upload gagal ke folder:
  - Akun uploader tidak punya akses ke folder target (`GOOGLE_DRIVE_FOLDER_ID`).

## Best Practices Pengujian

- Uji minimal 1 skenario sukses dan 1 skenario gagal setiap perubahan backend.
- Simpan contoh response penting di Postman Examples untuk regresi cepat.
- Jangan commit token rahasia ke collection/environment.
