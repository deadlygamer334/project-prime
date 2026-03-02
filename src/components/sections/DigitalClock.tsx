"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings, ClockStyle } from "@/lib/SettingsContext";
import { cn } from "@/lib/utils";

interface ClockProps {
    hours: string;
    minutes: string;
    seconds: string;
    ampm: string;
    dateStr: string;
    isDark: boolean;
    showSeconds: boolean;
    time: Date;
}

// All clock sub-components are memoized:
// DigitalClock calls setTime() every second, which re-renders the parent.
// Without memo, every sub-component re-renders even when hours/minutes haven't changed.
// React.memo prevents these no-op re-renders, reducing 1Hz garbage collection pressure.

// 1. Standard (Glassmorphism Box)
const StandardClock = React.memo(({ hours, minutes, seconds, ampm, dateStr, isDark, showSeconds }: ClockProps) => (
    <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-[32px] backdrop-blur-xl border shadow-sm text-center",
        isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-white"
    )}>
        <div className="flex items-baseline gap-2 tabular-nums">
            <span className={cn("text-5xl sm:text-7xl font-bold tracking-tighter", isDark ? "text-white" : "text-neutral-900")}>
                {hours}:{minutes}{showSeconds && <span className="text-3xl sm:text-4xl">:{seconds}</span>}
            </span>
            <span className={cn("text-xl sm:text-2xl font-medium", isDark ? "text-white/40" : "text-neutral-500")}>{ampm}</span>
        </div>
        <div className={cn("mt-2 text-[10px] sm:text-sm font-medium tracking-widest uppercase", isDark ? "text-white/30" : "text-neutral-400")}>
            {dateStr}
        </div>
    </div>
));
StandardClock.displayName = 'StandardClock';

// 2. Minimal (Clean, No Box)
const MinimalClock = React.memo(({ hours, minutes, seconds, dateStr, isDark, showSeconds }: ClockProps) => (
    <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className={cn("text-6xl sm:text-8xl font-light tracking-tight tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
            {hours}:{minutes}
        </div>
        <div className={cn("flex gap-3 text-sm sm:text-lg tracking-wide uppercase font-light", isDark ? "text-white/60" : "text-neutral-600")}>
            <span>{dateStr}</span>
            {showSeconds && <span className="opacity-60 tabular-nums">{seconds}s</span>}
        </div>
    </div>
));
MinimalClock.displayName = 'MinimalClock';

// 3. Bold (Heavy Font, Solid)
const BoldClock = React.memo(({ hours, minutes, ampm, dateStr, isDark }: ClockProps) => (
    <div className="flex flex-col items-center p-6 text-center">
        <h1 className={cn("text-7xl sm:text-9xl font-black tracking-tighter leading-none tabular-nums", isDark ? "text-white" : "text-black")}>
            {hours}:{minutes}
        </h1>
        <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-lg sm:text-xl font-bold bg-primary text-white px-2 py-0.5 rounded", { hidden: !ampm })}>{ampm}</span>
            <span className={cn("text-lg sm:text-xl font-bold", isDark ? "text-white/50" : "text-black/50")}>{dateStr}</span>
        </div>
    </div>
));
BoldClock.displayName = 'BoldClock';

// 4. Neon (Glowing)
const NeonClock = React.memo(({ hours, minutes, dateStr, isDark }: ClockProps) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className={cn("text-6xl sm:text-8xl font-bold tabular-nums",
            isDark
                ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                : "text-black drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        )}>
            {hours}:{minutes}
        </div>
        <div className={cn("mt-2 text-lg sm:text-xl font-medium tracking-widest uppercase",
            isDark ? "text-white/60" : "text-black/40")}>
            {dateStr}
        </div>
    </div>
));
NeonClock.displayName = 'NeonClock';

// 5. Elegant (Serif)
const ElegantClock = React.memo(({ hours, minutes, dateStr, isDark }: ClockProps) => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className={cn("text-6xl sm:text-8xl font-[family-name:var(--font-merriweather)] italic tracking-tight tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
            {hours}:{minutes}
        </div>
        <div className={cn("mt-[-10px] text-sm sm:text-lg font-light tracking-widest italic opacity-60", isDark ? "text-white" : "text-neutral-600")}>
            {dateStr}
        </div>
    </div>
));
ElegantClock.displayName = 'ElegantClock';

// 6. Outline (Stroked Text)
const OutlineClock = React.memo(({ hours, minutes, isDark }: ClockProps) => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className={cn("text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b tabular-nums",
            isDark ? "from-white/10 to-transparent stroke-white" : "from-black/10 to-transparent",
            "[-webkit-text-stroke:2px_var(--foreground)]"
        )}>
            {hours}:{minutes}
        </div>
    </div>
));
OutlineClock.displayName = 'OutlineClock';

// 7. Pill (Contained)
const PillClock = React.memo(({ hours, minutes, seconds, ampm, isDark, showSeconds, time }: ClockProps) => (
    <div className={cn("flex items-center gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-full border shadow-lg text-center",
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
        <span className={cn("text-4xl sm:text-6xl font-bold tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
            {hours}:{minutes}
        </span>
        <div className={cn("flex flex-col text-[10px] sm:text-xs font-bold uppercase tracking-wider border-l pl-4 tabular-nums", isDark ? "border-neutral-800 text-neutral-500" : "border-neutral-200 text-neutral-400")}>
            <span>{ampm}</span>
            <span>{showSeconds ? seconds : time.getFullYear()}</span>
        </div>
    </div>
));
PillClock.displayName = 'PillClock';

// 8. Glitch — FIXED: replaced mix-blend-difference + animate-pulse (forces per-pixel GPU compositing)
// with translate-based chromatic aberration (fully GPU-compositable, no blend mode needed)
const GlitchClock = React.memo(({ hours, minutes, isDark }: ClockProps) => (
    <div className="relative flex items-center justify-center p-8 text-center">
        <div className={cn("text-6xl sm:text-8xl font-black tracking-tighter relative tabular-nums select-none", isDark ? "text-white" : "text-black")}>
            {/* Chromatic aberration via translate \u2014 GPU-compositable, no blend mode required */}
            <span
                className="absolute inset-0 text-red-500 opacity-50"
                style={{ transform: 'translate(-2px, 0)', willChange: 'transform' }}
                aria-hidden="true"
            >{hours}:{minutes}</span>
            <span
                className="absolute inset-0 text-cyan-500 opacity-50"
                style={{ transform: 'translate(2px, 0)', willChange: 'transform' }}
                aria-hidden="true"
            >{hours}:{minutes}</span>
            <span className="relative z-10">{hours}:{minutes}</span>
        </div>
    </div>
));
GlitchClock.displayName = 'GlitchClock';

// 9. Vertical (Stacked)
const VerticalClock = React.memo(({ hours, minutes, isDark }: ClockProps) => (
    <div className="flex flex-col items-center justify-center gap-0 leading-none tabular-nums text-center">
        <span className={cn("text-6xl sm:text-8xl font-bold", isDark ? "text-white/80" : "text-black/80")}>{hours}</span>
        <span className={cn("text-6xl sm:text-8xl font-bold", isDark ? "text-white/40" : "text-black/40")}>{minutes}</span>
    </div>
));
VerticalClock.displayName = 'VerticalClock';



export default function DigitalClock() {
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState<Date>(new Date());
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Prevent hydration mismatch: return empty div of same height or placeholder
    if (!mounted) {
        return <div className="w-full h-[180px] mb-8" aria-hidden="true" />;
    }

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

        const strHours = String(hours < 10 ? '0' + hours : hours);
        const strMinutes = String(minutes < 10 ? '0' + minutes : minutes);
        const strSeconds = String(seconds < 10 ? '0' + seconds : seconds);

        return {
            hours: strHours,
            minutes: strMinutes,
            seconds: strSeconds,
            ampm,
            dateStr: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    };

    const formatted = formatTime(time);
    const clockProps: ClockProps = {
        ...formatted,
        isDark,
        showSeconds: settings.showSeconds,
        time
    };

    const renderClock = () => {
        switch (settings.clockStyle) {
            case "minimal": return <MinimalClock {...clockProps} />;
            case "bold": return <BoldClock {...clockProps} />;
            case "neon": return <NeonClock {...clockProps} />;
            case "elegant": return <ElegantClock {...clockProps} />;
            case "outline": return <OutlineClock {...clockProps} />;
            case "pill": return <PillClock {...clockProps} />;
            case "glitch": return <GlitchClock {...clockProps} />;
            case "vertical": return <VerticalClock {...clockProps} />;
            case "standard":
            default: return <StandardClock {...clockProps} />;
        }
    };

    return (
        <div className="w-full flex justify-center mb-8 select-text min-h-[160px]">
            {renderClock()}
        </div>
    );
}
