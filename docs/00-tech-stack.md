# Tech Stack Utama (OAuth Upload)

## Core

- **Next.js 16 (App Router)** untuk UI + API route dalam satu project.
- **React 19** untuk state upload, status hasil, dan riwayat submit.

## Integrasi Google

- **googleapis (Node.js client)** untuk OAuth2 dan Google Drive API.
- **Google Drive API v3** untuk `files.create` upload file.
- **OAuth2 Refresh Token (single uploader account)** sebagai model autentikasi backend.

## Data & Keamanan

- **FormData (`multipart/form-data`)** untuk upload multi-file.
- **Rate limit in-memory** (IP-based fixed window) sebagai proteksi abuse baseline.
- **Browser localStorage** untuk riwayat submit mode dummy.

## Styling

- **Tailwind CSS v4** untuk UI halaman upload.
