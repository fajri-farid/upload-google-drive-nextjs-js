import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { getDriveClient } from "@/lib/google-drive";
import { checkUploadRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Batas validasi file untuk endpoint upload.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
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
]);

function getClientIdentifier(request) {
  // Prioritaskan IP dari proxy header agar rate limit lebih akurat di deployment.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function resolveTargetFolderId() {
  // Support dua format env: ID folder langsung atau URL folder Google Drive.
  const rawValue = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

  if (!rawValue) {
    return null;
  }

  if (!rawValue.includes("http")) {
    return rawValue;
  }

  try {
    const parsed = new URL(rawValue);
    const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return folderMatch?.[1] || null;
  } catch {
    return null;
  }
}

function collectFiles(formData) {
  // Support field `files` (multi) dan fallback `file` (single).
  const fromFilesField = formData.getAll("files");
  const candidates = fromFilesField.length > 0 ? fromFilesField : [formData.get("file")];

  return candidates.filter((entry) => entry instanceof File);
}

function validateFile(file) {
  // Validasi dasar: kosong, ukuran, dan MIME type.
  if (file.size === 0) {
    return "File is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds 10MB limit (${file.name}).`;
  }

  if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported MIME type: ${file.type || "unknown"}.`;
  }

  return null;
}

function mapUploadError(error) {
  // Mapping error agar pesan yang keluar lebih user-friendly.
  const message = error instanceof Error ? error.message : "Upload failed.";
  if (message.includes("invalid_grant")) {
    return "OAuth refresh token invalid atau sudah dicabut.";
  }

  if (message.includes("insufficient") || message.includes("permission")) {
    return "Akses Google Drive tidak cukup untuk upload ke folder target.";
  }

  return message;
}

async function uploadSingleFile(drive, file) {
  // Konversi File API ke stream supaya kompatibel dengan Google Drive SDK.
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const targetFolderId = resolveTargetFolderId();

  const uploadResult = await drive.files.create({
    requestBody: {
      name: file.name,
      mimeType: file.type,
      ...(targetFolderId ? { parents: [targetFolderId] } : {}),
    },
    media: {
      mimeType: file.type,
      body: Readable.from(fileBuffer),
    },
    supportsAllDrives: true,
    fields: "id,name,mimeType,size,createdTime",
  });

  const fileId = uploadResult.data.id;
  if (!fileId) {
    throw new Error("Drive API tidak mengembalikan id file.");
  }

  // File diset public-read agar peserta bisa membuka link hasil upload.
  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const metadata = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "webViewLink,webContentLink",
  });

  return {
    // submissionId dipakai sebagai resi submit di sisi aplikasi.
    submissionId: randomUUID(),
    fileName: uploadResult.data.name || file.name || "unnamed",
    mimeType: uploadResult.data.mimeType || file.type,
    size: Number(uploadResult.data.size || file.size || 0),
    uploadedAt: uploadResult.data.createdTime || new Date().toISOString(),
    status: "uploaded",
    webViewLink: metadata.data.webViewLink || "",
    webContentLink: metadata.data.webContentLink || "",
  };
}

export async function POST(request) {
  try {
    // Rate limit dievaluasi sebelum parsing form agar endpoint tahan spam dasar.
    const rateLimit = checkUploadRateLimit(getClientIdentifier(request));

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          uploaded: [],
          failed: [{ name: "rate-limit", reason: "Terlalu banyak request. Coba lagi nanti." }],
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        },
      );
    }

    const formData = await request.formData();
    const files = collectFiles(formData);

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          uploaded: [],
          failed: [{ name: "unknown", reason: "No files provided." }],
        },
        { status: 400 },
      );
    }

    const drive = getDriveClient();
    const uploaded = [];
    const failed = [];

    // Proses per file agar partial success tetap bisa dikembalikan.
    for (const file of files) {
      const validationError = validateFile(file);

      if (validationError) {
        failed.push({ name: file.name || "unnamed", reason: validationError });
        continue;
      }

      try {
        const result = await uploadSingleFile(drive, file);
        uploaded.push(result);
      } catch (error) {
        failed.push({
          name: file.name || "unnamed",
          reason: mapUploadError(error),
        });
      }
    }

    const success = uploaded.length > 0;
    const statusCode = success ? 200 : 400;

    return NextResponse.json(
      {
        success,
        uploaded,
        failed,
      },
      {
        status: statusCode,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        uploaded: [],
        failed: [
          {
            name: "unknown",
            reason: error instanceof Error ? error.message : "Unexpected error.",
          },
        ],
      },
      { status: 500 },
    );
  }
}
