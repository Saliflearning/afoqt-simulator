import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AFOQTPro - Unofficial Adaptive Exam Simulator",
  description: "Unofficial AFOQT-style practice app with adaptive drilling, spaced repetition, and local-first analytics.",
  keywords: ["AFOQT", "Air Force", "exam prep", "pilot", "adaptive learning", "spaced repetition"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AFOQTPro",
  },
  openGraph: {
    title: "AFOQTPro - Unofficial Adaptive Exam Simulator",
    description: "Unofficial AFOQT-style practice with adaptive drilling, spaced repetition, and progress analytics.",
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
  themeColor: "#020617",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
        <Nav />

        <main className="md:pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 min-h-dvh">
          <div className="border-b border-amber-900/50 bg-amber-950/40">
            <div className="mx-auto max-w-7xl px-4 py-2 text-xs text-amber-100/90">
              Unofficial practice tool. Content is independently authored and should be reviewed before relying on it for real exam preparation.
            </div>
          </div>
          {children}
        </main>

        <BottomNav />

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
