import nextEnv from "@next/env";
import { google } from "googleapis";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Scope minimum sesuai kebutuhan upload file.
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const { loadEnvConfig } = nextEnv;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  // Memuat variabel dari .env.local agar script bisa dipakai langsung.
  loadEnvConfig(process.cwd());

  // OAuth client untuk proses consent manual dan pertukaran code.
  const oauth2Client = new google.auth.OAuth2(
    getRequiredEnv("GOOGLE_OAUTH_CLIENT_ID"),
    getRequiredEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("1) Buka URL ini dan login pakai akun uploader:");
  console.log(authUrl);
  console.log("");
  console.log("2) Setelah redirect, copy parameter `code` dari URL callback.");
  console.log("");

  const rl = readline.createInterface({ input, output });
  const code = await rl.question("Paste OAuth code di sini: ");
  rl.close();

  // Code dari callback ditukar menjadi access/refresh token.
  const { tokens } = await oauth2Client.getToken(code.trim());

  if (!tokens.refresh_token) {
    throw new Error(
      "Refresh token tidak keluar. Pastikan pakai prompt=consent dan revoke grant lama jika perlu.",
    );
  }

  console.log("");
  console.log("Set env berikut di .env.local:");
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
}

// Error handler tunggal agar pesan gagal tetap jelas.
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
