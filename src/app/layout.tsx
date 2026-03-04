import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Merriweather, Roboto } from "next/font/google";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import Script from "next/script";
import { ThemeProvider } from "@/lib/ThemeContext";
import { HabitProvider } from "@/lib/HabitContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import { AmbienceProvider } from "@/lib/AmbienceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingMusicPlayer from "@/components/FloatingMusicPlayer";
import SecurityGatekeeper from "@/components/security/SecurityGatekeeper";
import DynamicBackground from "@/components/sections/DynamicBackground";
import LayoutHandlers from "@/components/LayoutHandlers";
import { KeyboardShortcutsProvider } from "@/lib/KeyboardShortcutsContext";
import Link from "next/link";
import ClientKeyboardShortcuts from "@/components/ClientKeyboardShortcuts";
import QueryProvider from "@/components/QueryProvider";
import OfflineStatus from "@/components/OfflineStatus";
import { GoalProvider } from "@/lib/GoalContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import PomodoroLayoutWrapper from "@/components/PomodoroLayoutWrapper";
import { WallpaperProvider } from "@/lib/WallpaperContext";


// Inter is the primary UI font — always preloaded
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// Non-primary fonts: preload:false → lazy-loaded after page paint, saving 200-400ms on 4G
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", preload: false });
const merriweather = Merriweather({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-merriweather", display: "swap", preload: false });
const robotoFont = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto", display: "swap", preload: false });

import { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Prime | Master Your Focus. Track Your Progress.",
    template: "%s | Prime"
  },
  description: "Advanced focus and productivity tracking system. Master your time with Pomodoro timers, habit tracking, goal management, and comprehensive analytics. Built for serious achievers.",
  keywords: ["productivity", "focus timer", "pomodoro", "habit tracker", "goal tracking", "time management", "analytics"],
  authors: [{ name: "Prime Team" }],
  creator: "Prime",
  publisher: "Prime",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://paarangat.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Prime | Master Your Focus. Track Your Progress.",
    description: "Advanced focus and productivity tracking system. Master your time with Pomodoro timers, habit tracking, goal management, and comprehensive analytics.",
    siteName: "Prime",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prime - Master Your Focus. Track Your Progress."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime | Master Your Focus. Track Your Progress.",
    description: "Advanced focus and productivity tracking system for serious achievers.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${inter.variable} ${mono.variable} ${merriweather.variable} ${robotoFont.variable}`}>
        <GlobalErrorBoundary>
          <QueryProvider>
            <SettingsProvider>
              <LayoutHandlers>
                <ThemeProvider>
                  <NotificationProvider>
                    <KeyboardShortcutsProvider>
                      <HabitProvider>
                        <GoalProvider>
                          <a
                            href="#main-content"
                            className="absolute left-0 top-[-9999px] z-[9999] bg-white text-black p-4 transition-all focus:top-0 focus:left-0"
                          >
                            Skip to main content
                          </a>
                          {/* Dev-only scripts: never load in production — these are visual editor / logging tools */}
                          {process.env.NODE_ENV !== 'production' && (
                            <>
                              <Script
                                id="prime-browser-logs"
                                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
                                strategy="lazyOnload"
                                data-visual-project-id="af7ac36f-acf0-497f-baa0-ffab1e811bf8"
                              />
                              <Script
                                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
                                strategy="lazyOnload"
                                data-target-origin="*"
                                data-message-type="ROUTE_CHANGE"
                                data-include-search-params="true"
                                data-only-in-iframe="true"
                                data-debug="true"
                                data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
                              />
                            </>
                          )}
                          <ErrorReporter />
                          <AmbienceProvider>
                            <WallpaperProvider>
                              <SecurityGatekeeper />
                              <DynamicBackground />
                              <PomodoroLayoutWrapper />
                              <ProtectedRoute>
                                <div className="max-md:landscape:pl-28 transition-all duration-500">
                                  {children}
                                  {/* Mobile Bottom Dock Spacer */}
                                  <div className="lg:hidden h-32" aria-hidden="true" />
                                </div>
                              </ProtectedRoute>
                              <FloatingMusicPlayer />
                            </WallpaperProvider>
                          </AmbienceProvider>
                          <ClientKeyboardShortcuts />
                          {/* VisualEditsMessenger is a dev-only tool — never run in production */}
                          {process.env.NODE_ENV !== 'production' && <VisualEditsMessenger />}
                          <OfflineStatus />
                          {/* Speed Insights: production only — no-op in dev */}
                          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
                          {/* Analytics: production only — no-op in dev */}
                          {process.env.NODE_ENV === 'production' && <Analytics />}
                        </GoalProvider>
                      </HabitProvider>
                    </KeyboardShortcutsProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </LayoutHandlers>
            </SettingsProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
