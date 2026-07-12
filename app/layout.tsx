import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VibeCoding — Build in Public",
  description: "Dashboard de proyectos VibeCoding · zaerohell · Playa del Carmen",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${spaceMono.variable} bg-black text-[#E8E8E8] min-h-screen antialiased`}
        style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace" }}>
        {children}
      </body>
    </html>
  );
}
