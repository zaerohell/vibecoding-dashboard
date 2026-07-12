import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono  = Space_Mono({ weight: ["400","700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "VibeCoding — Build in Public",
  description: "Dashboard de proyectos · zaerohell · Playa del Carmen, México",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${mono.variable} min-h-screen antialiased`}
        style={{ background: "#050510", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
