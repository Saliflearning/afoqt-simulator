import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AFOQTPro — Adaptive Exam Simulator",
  description: "Science-backed adaptive AFOQT prep with spaced repetition, stress conditioning, and growth analytics.",
  keywords: ["AFOQT", "Air Force", "exam prep", "pilot", "adaptive learning", "spaced repetition"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AFOQTPro",
  },
  openGraph: {
    title: "AFOQTPro — Adaptive Exam Simulator",
    description: "Outperform on exam day with stress-conditioned, adaptive AFOQT drilling.",
    type: "website",
  },
  icons: {
    icon: "/icons/icon-512.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never disable zoom — accessibility requirement
  // themeColor handled here so Chrome/Android picks it up for address bar
  themeColor: "#020617",
  // Viewport fit=cover lets us use safe-area-inset-* for notch/gesture bar
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA splash / standalone chrome color for iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
        {/* Desktop top nav */}
        <Nav />

        {/*
          On mobile:  pt-0 (no top nav) + pb for bottom nav height + safe area
          On desktop: pt-14 (top nav offset) + pb-0
          pb-[calc(4rem+env(safe-area-inset-bottom))] covers:
            - 4rem (64px) = BottomNav height
            - env(safe-area-inset-bottom) = iPhone home bar / Android gesture bar
        */}
        <main className="md:pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 min-h-dvh">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <BottomNav />

        {/* Register service worker for PWA / offline support */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .catch(function(err) { console.warn('SW registration failed:', err); });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
