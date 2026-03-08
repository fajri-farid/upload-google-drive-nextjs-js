# Dummy vs Production Gap

Dokumen ini menjelaskan batasan mode saat ini agar jelas mana yang aman untuk production dan mana yang hanya demo.

## Saat Ini (Dummy-Friendly)

- Tanpa login user aplikasi.
- Metadata submit disimpan di localStorage browser.
- Identitas peserta belum dikelola.
- Rate limit masih in-memory.
- Tidak ada CAPTCHA (sesuai keputusan saat ini).
- File dibagikan `anyone with link` agar peserta dapat membuka file.

## Agar Production-Ready Penuh

1. Simpan metadata submit di database server (bukan localStorage).
2. Tambah identitas peserta (minimal email/ID pendaftaran).
3. Tambah proteksi abuse lanjutan (misal CAPTCHA dan rate limit yang lebih kuat).
4. Gunakan rate limiter yang persistent agar pembatasan request tetap konsisten.
5. Buat admin panel/audit trail untuk verifikasi submission.
6. Tambah kebijakan retensi file dan prosedur incident response.
7. Pertimbangkan private link + akses terkontrol jika file bersifat sensitif.

## Status Keamanan Baseline Saat Ini

- Lebih stabil daripada flow service account quota issue karena pakai OAuth uploader account.
- Sudah ada proteksi dasar endpoint (rate limit).
- Public link meningkatkan usability peserta, tetapi risiko kebocoran link tetap ada.
