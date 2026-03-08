const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

// Penyimpanan in-memory sederhana: cocok untuk development/single-instance.
const requestStore = new Map();

function getWindowMs() {
  const value = Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_WINDOW_MS;
}

function getMaxRequests() {
  const value = Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_REQUESTS;
}

function cleanupExpired(now, windowMs) {
  // Hapus entri yang sudah lewat window agar map tidak tumbuh terus.
  for (const [key, value] of requestStore.entries()) {
    if (now - value.windowStart >= windowMs) {
      requestStore.delete(key);
    }
  }
}

export function checkUploadRateLimit(identifier) {
  const now = Date.now();
  const windowMs = getWindowMs();
  const maxRequests = getMaxRequests();
  const key = identifier || "unknown";

  cleanupExpired(now, windowMs);

  const existing = requestStore.get(key);
  // Jika belum ada jejak request pada window saat ini, mulai hitung dari 1.
  if (!existing || now - existing.windowStart >= windowMs) {
    requestStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Jika sudah melewati batas, request ditolak.
  if (existing.count >= maxRequests) {
    const elapsed = now - existing.windowStart;
    const retryAfterMs = Math.max(windowMs - elapsed, 0);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Jika masih dalam batas, tingkatkan counter request.
  existing.count += 1;
  requestStore.set(key, existing);

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    retryAfterSeconds: Math.ceil(windowMs / 1000),
  };
}
