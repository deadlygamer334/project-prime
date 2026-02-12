"use client";

import React, { useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useFocusProgress } from "@/hooks/useFocusProgress";
import { useSettings } from "@/lib/SettingsContext";
import MinimalPomodoro from "./MinimalPomodoro";
import QuoteBlock from "./QuoteBlock";

import { TimerMode, Subject } from "@/hooks/useFocusTimer";

export default function PomodoroPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { addSession } = useFocusProgress();
  const settings = useSettings();

  const handleComplete = useCallback((mode: TimerMode, duration: number, subject: Subject) => {
    if (mode === "FOCUS") {
      addSession("focus", duration, subject || undefined);
    }
  }, [addSession]);

  return (
    <section className={`relative overflow-hidden rounded-3xl min-h-[450px] flex flex-col items-center justify-between py-6 transition-all duration-500 border ${isDark
      ? "bg-black border-white/5 shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
      : "bg-white border-black/5 shadow-sm"
      }`}>

      {/* Subtle Background Glow */}
      {isDark && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      )}

      {settings.showQuotes && <QuoteBlock />}
      <MinimalPomodoro onComplete={handleComplete} />
      <div /> {/* Spacer for balance */}
    </section>
  );
}

