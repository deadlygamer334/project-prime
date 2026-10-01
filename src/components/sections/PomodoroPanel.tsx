"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import { useFocusProgress } from "@/hooks/useFocusProgress";
import { useSettings } from "@/lib/SettingsContext";
import MinimalPomodoro from "./MinimalPomodoro";
import QuoteBlock from "./QuoteBlock";
import { VideoWallpaperController } from "@/components/wallpaper/VideoWallpaperController";
import { ImageWallpaperRenderer } from "@/components/wallpaper/ImageWallpaperRenderer";
import { LiveWallpaperRenderer } from "@/components/wallpaper/LiveWallpaperRenderer";
import { useWallpaper, isLiveWallpaper } from "@/lib/WallpaperContext";

import { TimerMode, Subject } from "@/hooks/useFocusTimer";

export default function PomodoroPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { addSession, addSessionTransaction } = useFocusProgress();
  const settings = useSettings();
  const { wallpaper } = useWallpaper();
  const isLive = isLiveWallpaper(wallpaper);
  const [timerState, setTimerState] = useState<"idle" | "focus" | "break">("idle");
  const [showFlash, setShowFlash] = useState(false);

  const prevTimerState = useRef(timerState);
  useEffect(() => {
    if (prevTimerState.current === "focus" && timerState === "idle") {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 750);
    }
    prevTimerState.current = timerState;
  }, [timerState]);

  const handleComplete = useCallback((mode: TimerMode, duration: number, subject: Subject, isLogged?: boolean) => {
    if (isLogged) return; // Already logged by useFocusTimer transaction

    if (mode === "FOCUS" || mode === "STOPWATCH") {
      addSession("focus", duration, subject || "");
    }
  }, [addSession]);

  return (
    <section className={`relative overflow-hidden rounded-3xl min-h-[450px] max-md:landscape:min-h-0 flex flex-col items-center justify-between py-6 transition-all duration-700 border gradient-border card-premium ${isDark
      ? "bg-black border-transparent"
      : "bg-white border-transparent"
      } ${timerState === "focus" ? "timer-active-glow" : ""} ${timerState === "break" ? "break-active-glow" : ""}`}>

      {/* Subtle Background Glow */}
      {isDark && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      )}

      {/* Scoped Wallpapers */}
      <VideoWallpaperController timerState={timerState} />
      <ImageWallpaperRenderer timerState={timerState} />
      {isLive && (
        <LiveWallpaperRenderer
          pattern={wallpaper?.livePattern || "aurora"}
          colorTheme={wallpaper?.colorTheme || "Violet"}
          filters={wallpaper?.timerFilters}
          borderRadius="1.5rem"
        />
      )}

      {settings.showQuotes && <QuoteBlock />}
      <MinimalPomodoro onComplete={handleComplete} addSessionTransaction={addSessionTransaction} onTimerStateChange={setTimerState} />
      <div /> {/* Spacer for balance */}

      <AnimatePresence>
        {showFlash && (
          <div className="panel-flash-ring" key="flash" />
        )}
      </AnimatePresence>
    </section>
  );
}

