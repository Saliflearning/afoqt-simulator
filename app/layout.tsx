import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AFOQTPro — Adaptive Exam Simulator",
  description: "Science-backed adaptive AFOQT prep with spaced repetition, stress conditioning, and growth analytics.",
  keywords: ["AFOQT", "Air Force", "exam prep", "pilot", "adaptive learning", "spaced repetition"],
  openGraph: {
    title: "AFOQTPro — Adaptive Exam Simulator",
    description: "Outperform on exam day with stress-conditioned, adaptive AFOQT drilling.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Nav />
        <main className="pt-14 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
