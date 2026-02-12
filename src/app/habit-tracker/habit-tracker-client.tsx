"use client";

import AppHeader from "@/components/sections/AppHeader";
import HabitTrackerMain from "@/components/sections/habit-tracker-main";
import OverviewStats from "@/components/sections/overview-stats";
import WeeklyCards from "@/components/sections/weekly-cards";
import ProgressGraph from "@/components/sections/progress-graph";
import AnalysisFooter from "@/components/sections/analysis-footer";
import { useTheme } from "@/lib/ThemeContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

export default function HabitTracker() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
      {/* Background Glow - Handled by global CSS now */}

      <AppHeader title="Habit Tracker" activePath="/habit-tracker" />

      <main className="container mx-auto flex-grow py-8 px-6 relative z-10">
        <GlobalErrorBoundary>
          <HabitTrackerMain />
        </GlobalErrorBoundary>
        <OverviewStats />
        <WeeklyCards />
        <ProgressGraph />
        <AnalysisFooter />
      </main>
    </div>
  );
}
