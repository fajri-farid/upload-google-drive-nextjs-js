"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Key localStorage untuk riwayat submit di browser.
const STORAGE_KEY = "upload_submission_history_v1";
const MAX_HISTORY_ITEMS = 100;
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
];

function readHistory() {
  // Guard SSR: localStorage hanya tersedia di browser.
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  // Simpan riwayat terbaru ke localStorage.
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatFileSize(bytes) {
  // Utility tampilan ukuran file agar mudah dibaca user.
  if (!bytes || Number.isNaN(bytes)) {
    return "0 B";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${bytes} B`;
}

export default function Home() {
  const [history, setHistory] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Muat riwayat submit saat komponen pertama kali dirender di client.
    setHistory(readHistory());
  }, []);

  const acceptValue = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);

  const persistHistory = (nextValue) => {
    // Sinkronkan state React dan localStorage dalam satu jalur.
    setHistory((previous) => {
      const resolved = typeof nextValue === "function" ? nextValue(previous) : nextValue;
      writeHistory(resolved);
      return resolved;
    });
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    const files = inputRef.current?.files;

    if (!files || files.length === 0) {
      setMessage("Pilih minimal satu file sebelum upload.");
      setLastResult(null);
      return;
    }

    setIsUploading(true);
    setMessage("");
    setLastResult(null);

    try {
      const formData = new FormData();
      // Kirim semua file dengan field `files` agar backend memproses multi-upload.
      Array.from(files).forEach((file) => formData.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok && (!payload.uploaded || payload.uploaded.length === 0)) {
        throw new Error(payload?.failed?.[0]?.reason || "Upload gagal.");
      }

      const nowIso = new Date().toISOString();
      const newEntries = (payload.uploaded || []).map((item) => ({
        ...item,
        // localId dipakai untuk key list di sisi client.
        localId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        uploadedAt: item.uploadedAt || nowIso,
        status: item.status || "uploaded",
      }));

      if (newEntries.length > 0) {
        // Simpan paling baru di atas dan batasi jumlah history.
        persistHistory((prev) => [...newEntries, ...prev].slice(0, MAX_HISTORY_ITEMS));
      }

      setLastResult(payload);
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (payload.failed?.length) {
        setMessage("Sebagian file gagal diupload. Cek bagian hasil upload.");
      } else {
        setMessage("Semua file berhasil diupload.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi error saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopySubmission = async (submissionId) => {
    try {
      await navigator.clipboard.writeText(submissionId);
      setMessage("Submission ID berhasil disalin.");
    } catch {
      setMessage("Gagal menyalin Submission ID.");
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Link file berhasil disalin.");
    } catch {
      setMessage("Gagal menyalin link file.");
    }
  };

  const removeHistoryItem = (localId) => {
    // Hapus 1 item riwayat berdasarkan localId.
    persistHistory((previous) => previous.filter((item) => item.localId !== localId));
  };

  const clearHistory = () => {
    // Bersihkan seluruh riwayat pada browser saat ini.
    persistHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">Upload File Peserta (OAuth)</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tanpa login user aplikasi. Backend memakai OAuth refresh token uploader account, file
            akan dibuat bisa diakses via link, dan peserta menerima Submission ID sebagai bukti upload.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleUpload}>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={acceptValue}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex w-fit items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </form>

          {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}

          {lastResult ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-900">Hasil Upload Terakhir</h2>
              <p className="mt-1 text-xs text-slate-600">
                Berhasil: {lastResult.uploaded?.length || 0} | Gagal: {lastResult.failed?.length || 0}
              </p>

              {lastResult.failed?.length ? (
                <ul className="mt-3 space-y-1 text-xs text-red-700">
                  {lastResult.failed.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      {item.name}: {item.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Riwayat Submit (LocalStorage)</h2>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Clear All
            </button>
          </div>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Belum ada riwayat submit di browser ini.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {history.map((item) => (
                <li
                  key={item.localId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
                >
                  <p className="font-medium text-slate-900">{item.fileName}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.mimeType} | {formatFileSize(item.size)} |{" "}
                    {new Date(item.uploadedAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-slate-700">
                    Submission ID: <span className="font-mono">{item.submissionId}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Status: {item.status}</p>
                  {item.webViewLink ? (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-xs text-blue-700 underline"
                    >
                      {item.webViewLink}
                    </a>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopySubmission(item.submissionId)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                    >
                      Copy Submission ID
                    </button>
                    {item.webViewLink ? (
                      <>
                        <a
                          href={item.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white"
                        >
                          Open File
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.webViewLink)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                        >
                          Copy File Link
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeHistoryItem(item.localId)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
