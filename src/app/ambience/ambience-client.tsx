"use client";

import AppHeader from "@/components/sections/AppHeader";
import DynamicBackground from "@/components/sections/DynamicBackground";
import FocusMixer from "@/components/sections/FocusMixer";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";

export default function AmbiencePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const settings = useSettings();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-background text-foreground relative overflow-hidden">
      <DynamicBackground />
      <AppHeader title="Acoustic Ambience" activePath="/ambience" />

      <main className="relative z-10 flex-grow py-8 px-6 container mx-auto">
        <FocusMixer />
      </main>

      {settings.showFooter && <Footer />}
    </div>
  );
}
