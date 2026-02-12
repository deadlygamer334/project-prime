"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings, ClockStyle } from "@/lib/SettingsContext";
import { cn } from "@/lib/utils";

export default function DigitalClock() {
    const [time, setTime] = useState<Date | null>(null);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Prevent hydration mismatch

    const formatTime = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        let ampm = '';

        if (settings.clockFormat === '12h') {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
        }

        const strHours = hours < 10 ? '0' + hours : hours;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        const strSeconds = seconds < 10 ? '0' + seconds : seconds;

        return {
            hours: strHours,
            minutes: strMinutes,
            seconds: strSeconds,
            ampm,
            dateStr: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    };

    const { hours, minutes, seconds, ampm, dateStr } = formatTime(time);
    const showSeconds = settings.showSeconds;

    // --- Style Renderers ---

    // 1. Standard (Glassmorphism Box)
    const StandardClock = () => (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 rounded-[32px] backdrop-blur-xl transition-all duration-500 border shadow-sm",
            isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-white"
        )}>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-7xl font-bold tracking-tighter tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                    {hours}:{minutes}{showSeconds && <span className="text-4xl">:{seconds}</span>}
                </span>
                <span className={cn("text-2xl font-medium", isDark ? "text-white/40" : "text-neutral-500")}>{ampm}</span>
            </div>
            <div className={cn("mt-2 text-sm font-medium tracking-widest uppercase", isDark ? "text-white/30" : "text-neutral-400")}>
                {dateStr}
            </div>
        </div>
    );

    // 2. Minimal (Clean, No Box)
    const MinimalClock = () => (
        <div className="flex flex-col items-center justify-center p-4">
            <div className={cn("text-8xl font-light tracking-tight tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                {hours}:{minutes}
            </div>
            <div className={cn("flex gap-3 text-lg tracking-wide uppercase font-light", isDark ? "text-white/60" : "text-neutral-600")}>
                <span>{dateStr}</span>
                {showSeconds && <span className="opacity-60">{seconds}s</span>}
            </div>
        </div>
    );

    // 3. Bold (Heavy Font, Solid)
    const BoldClock = () => (
        <div className="flex flex-col items-center p-6">
            <h1 className={cn("text-9xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-black")}>
                {hours}:{minutes}
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <span className={cn("text-xl font-bold bg-primary text-white px-2 py-0.5 rounded", { hidden: !ampm })}>{ampm}</span>
                <span className={cn("text-xl font-bold", isDark ? "text-white/50" : "text-black/50")}>{dateStr}</span>
            </div>
        </div>
    );

    // 6. Neon (Glowing)
    const NeonClock = () => (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={cn("text-8xl font-bold transition-all duration-300",
                isDark
                    ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                    : "text-black drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]"
            )}>
                {hours}:{minutes}
            </div>
            <div className={cn("mt-2 text-xl font-medium tracking-widest uppercase",
                isDark ? "text-white/60" : "text-black/40")}>
                {dateStr}
            </div>
        </div>
    );

    // 7. Elegant (Serif)
    const ElegantClock = () => (
        <div className="flex flex-col items-center justify-center p-6">
            <div className={cn("text-8xl font-[family-name:var(--font-merriweather)] italic tracking-tight", isDark ? "text-white" : "text-neutral-900")}>
                {hours}:{minutes}
            </div>
            <div className={cn("mt-[-10px] text-lg font-light tracking-widest italic opacity-60", isDark ? "text-white" : "text-neutral-600")}>
                {dateStr}
            </div>
        </div>
    );



    // 9. Outline (Stroked Text)
    const OutlineClock = () => (
        <div className="flex flex-col items-center justify-center p-6">
            <div className={cn("text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b",
                isDark ? "from-white/10 to-transparent stroke-white" : "from-black/10 to-transparent",
                // Tailwind doesn't have text-stroke utility by default, simulating with drop-shadow or relying on standard rendering with a trick
                "[-webkit-text-stroke:2px_var(--foreground)]"
            )}>
                {hours}:{minutes}
            </div>
        </div>
    );

    // 10. Pill (Contained)
    const PillClock = () => (
        <div className={cn("flex items-center gap-4 px-8 py-4 rounded-full border shadow-lg",
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
            <span className={cn("text-6xl font-bold tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                {hours}:{minutes}
            </span>
            <div className={cn("flex flex-col text-xs font-bold uppercase tracking-wider border-l pl-4", isDark ? "border-neutral-800 text-neutral-500" : "border-neutral-200 text-neutral-400")}>
                <span>{ampm}</span>
                <span>{showSeconds ? seconds : new Date().getFullYear()}</span>
            </div>
        </div>
    );



    // 12. Glitch (Simulated with shift)
    const GlitchClock = () => (
        <div className="relative flex items-center justify-center p-8">
            <div className={cn("text-8xl font-black tracking-tighter mix-blend-difference relative", isDark ? "text-white" : "text-black")}>
                <span className="absolute top-0 left-[-2px] text-red-500 opacity-70 animate-pulse">{hours}:{minutes}</span>
                <span className="absolute top-0 left-[2px] text-cyan-500 opacity-70 animate-pulse delay-75">{hours}:{minutes}</span>
                <span className="relative z-10">{hours}:{minutes}</span>
            </div>
        </div>
    );

    // 13. Vertical (Stacked)
    const VerticalClock = () => (
        <div className="flex flex-col items-center justify-center gap-0 leading-none">
            <span className={cn("text-8xl font-bold", isDark ? "text-white/80" : "text-black/80")}>{hours}</span>
            <span className={cn("text-8xl font-bold", isDark ? "text-white/40" : "text-black/40")}>{minutes}</span>
        </div>
    );



    const renderClock = () => {
        switch (settings.clockStyle) {
            case "minimal": return <MinimalClock />;
            case "bold": return <BoldClock />;
            case "neon": return <NeonClock />;
            case "elegant": return <ElegantClock />;
            case "outline": return <OutlineClock />;
            case "pill": return <PillClock />;
            case "glitch": return <GlitchClock />;
            case "vertical": return <VerticalClock />;
            case "standard":
            default: return <StandardClock />;
        }
    };

    return (
        <div className="w-full flex justify-center mb-8">
            {renderClock()}
        </div>
    );
}
