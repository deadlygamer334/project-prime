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

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const merriweather = Merriweather({ weight: ["300", "400", "700", "900"], subsets: ["latin"], variable: "--font-merriweather", display: "swap" });
const robotoFont = Roboto({ weight: ["300", "400", "500", "700"], subsets: ["latin"], variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Nano Banana | Master Your Focus. Track Your Progress.",
    template: "%s | Nano Banana"
  },
  description: "Advanced focus and productivity tracking system. Master your time with Pomodoro timers, habit tracking, goal management, and comprehensive analytics. Built for serious achievers.",
  keywords: ["productivity", "focus timer", "pomodoro", "habit tracker", "goal tracking", "time management", "analytics"],
  authors: [{ name: "Nano Banana Team" }],
  creator: "Nano Banana",
  publisher: "Nano Banana",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://paarangat.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Nano Banana | Master Your Focus. Track Your Progress.",
    description: "Advanced focus and productivity tracking system. Master your time with Pomodoro timers, habit tracking, goal management, and comprehensive analytics.",
    siteName: "Nano Banana",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nano Banana - Master Your Focus. Track Your Progress."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Nano Banana | Master Your Focus. Track Your Progress.",
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest"
};

import { KeyboardShortcutsProvider } from "@/lib/KeyboardShortcutsContext";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";

import QueryProvider from "@/components/QueryProvider";
import OfflineStatus from "@/components/OfflineStatus";
import { GoalProvider } from "@/lib/GoalContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${inter.variable} ${mono.variable} ${merriweather.variable} ${robotoFont.variable}`}>
        <a
          href="#main-content"
          className="absolute left-0 top-[-9999px] z-[9999] bg-white text-black p-4 transition-all focus:top-0 focus:left-0"
        >
          Skip to main content
        </a>
        <GlobalErrorBoundary>
          <QueryProvider>
            <SettingsProvider>
              <ThemeProvider>
                <KeyboardShortcutsProvider>
                  <HabitProvider>
                    <GoalProvider>
                      <Script
                        id="orchids-browser-logs"
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
                        strategy="afterInteractive"
                        data-orchids-project-id="af7ac36f-acf0-497f-baa0-ffab1e811bf8"
                      />
                      <ErrorReporter />
                      <Script
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
                        strategy="afterInteractive"
                        data-target-origin="*"
                        data-message-type="ROUTE_CHANGE"
                        data-include-search-params="true"
                        data-only-in-iframe="true"
                        data-debug="true"
                        data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
                      />
                      <AmbienceProvider>
                        <SecurityGatekeeper />
                        <DynamicBackground />
                        <ProtectedRoute>
                          {children}
                        </ProtectedRoute>
                        <FloatingMusicPlayer />
                      </AmbienceProvider>
                      <KeyboardShortcutsModal />
                      <VisualEditsMessenger />
                      <OfflineStatus />
                    </GoalProvider>
                  </HabitProvider>
                </KeyboardShortcutsProvider>
              </ThemeProvider>
            </SettingsProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
