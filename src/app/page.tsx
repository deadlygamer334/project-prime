"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import AppHeader from "@/components/sections/AppHeader";
import Footer from "@/components/sections/Footer";
import DynamicBackground from "@/components/sections/DynamicBackground";
import DigitalClock from "@/components/sections/DigitalClock";
import TodoPanel from "@/components/sections/TodoPanel";
import PomodoroPanel from "@/components/sections/PomodoroPanel";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

export default function HomePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const settings = useSettings();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
      <DynamicBackground />

      <AppHeader
        title="PRIME"
        activePath="/"
        showSearch={false}
      />

      <main className="container mx-auto flex-grow py-4 px-6 relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 items-start">
          {/* Timer: First on Mobile, Second (Right) on Desktop */}
          <div className="flex flex-col gap-6 md:order-2">
            <GlobalErrorBoundary moduleName="Focus Engine">
              <PomodoroPanel />
            </GlobalErrorBoundary>
          </div>

          {/* Todo & Clock: Second on Mobile, First (Left) on Desktop */}
          {/* On mobile, we reverse this so Todo appears above Clock (Timer -> Todo -> Clock) */}
          <div className="flex flex-col-reverse md:flex-col gap-6 md:order-1">
            {settings.showClock && (
              <GlobalErrorBoundary moduleName="Digital Clock">
                <DigitalClock />
              </GlobalErrorBoundary>
            )}

            <GlobalErrorBoundary moduleName="Task Command Center">
              <TodoPanel />
            </GlobalErrorBoundary>
          </div>
        </div>
      </main>

      {settings.showFooter && <Footer />}
    </div>
  );
}
