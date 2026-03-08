import { google } from "googleapis";

// Scope minimum agar aplikasi hanya perlu akses file yang dibuat/diakses lewat app.
export const DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"];

let cachedDriveClient = null;
let cachedOAuthClient = null;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createOAuthClient() {
  // OAuth client dibangun dari env supaya aman di sisi server.
  return new google.auth.OAuth2(
    getRequiredEnv("GOOGLE_OAUTH_CLIENT_ID"),
    getRequiredEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  );
}

function getOAuthClient() {
  // Reuse client agar tidak inisialisasi ulang tiap request.
  if (cachedOAuthClient) {
    return cachedOAuthClient;
  }

  const authClient = createOAuthClient();
  // Refresh token dipakai untuk meminta access token secara otomatis.
  authClient.setCredentials({
    refresh_token: getRequiredEnv("GOOGLE_OAUTH_REFRESH_TOKEN"),
  });

  cachedOAuthClient = authClient;
  return cachedOAuthClient;
}

export function getDriveClient() {
  // Drive client di-cache untuk efisiensi koneksi.
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  cachedDriveClient = google.drive({
    version: "v3",
    auth: getOAuthClient(),
  });

  return cachedDriveClient;
}

export function createOAuthConsentUrl() {
  // URL consent dipakai saat bootstrap awal mendapatkan refresh token.
  const oauthClient = createOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPE,
  });
}

export async function exchangeCodeToTokens(code) {
  // Tukar authorization code menjadi token OAuth.
  const oauthClient = createOAuthClient();
  const { tokens } = await oauthClient.getToken(code);
  return tokens;
}
