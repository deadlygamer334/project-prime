"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import AppHeader from "@/components/sections/AppHeader";
import Footer from "@/components/sections/Footer";
import DynamicBackground from "@/components/sections/DynamicBackground";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import PremiumSkeleton from "@/components/ui/PremiumSkeleton";
import dynamic from "next/dynamic";

const DigitalClock = dynamic(() => import("@/components/sections/DigitalClock"), {
  ssr: false,
});

const TodoPanel = dynamic(() => import("@/components/sections/TodoPanel"), {
  ssr: false,
  loading: () => (
    <section className="todo-panel flex flex-col relative w-full lg:max-w-[912px] rounded-3xl p-4 md:p-8 border min-h-[500px] bg-white/5 border-white/10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <PremiumSkeleton height="32px" width="120px" borderRadius="8px" />
        <div className="flex gap-2">
          <PremiumSkeleton height="40px" width="100px" borderRadius="12px" />
          <PremiumSkeleton height="40px" width="140px" borderRadius="12px" />
        </div>
      </div>
      <PremiumSkeleton height="12px" width="100%" borderRadius="6px" className="mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <PremiumSkeleton key={i} height="72px" width="100%" borderRadius="16px" />
        ))}
      </div>
    </section>
  )
});

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

      <main className="container mx-auto flex-grow py-4 max-md:landscape:py-2 px-6 relative z-10 flex flex-col justify-center pb-24 md:pb-4">
        <div className="grid grid-cols-1 gap-6 max-md:landscape:gap-4 md:gap-8 max-md:landscape:grid-cols-2 md:grid-cols-2 items-start">
          {/* Timer: First on Mobile, Left in Landscape */}
          <div className={`flex flex-col gap-6 ${settings.dashboardLayout === "reversed" ? "" : "md:order-2"}`}>
            <GlobalErrorBoundary moduleName="Focus Engine">
              {/* PomodoroPanel is now hoisted to layout.tsx and portaled into this div */}
              <div id="pomodoro-panel-portal-target" className="min-h-[450px]"></div>
            </GlobalErrorBoundary>
          </div>

          {/* Todo & Clock: Second on Mobile, Right in Landscape */}
          <div className={`flex flex-col-reverse md:flex-col gap-6 ${settings.dashboardLayout === "reversed" ? "" : "md:order-1"}`}>
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
