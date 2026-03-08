import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Registrasi font utama agar konsisten di seluruh aplikasi.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Registrasi font monospace untuk teks teknis seperti ID/token.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata default halaman.
export const metadata = {
  title: "Upload Google Drive",
  description: "Upload file to Google Drive with OAuth and submission receipts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
