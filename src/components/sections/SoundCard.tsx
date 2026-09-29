"use client";

import React from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Volume2, VolumeX } from "lucide-react";

interface SoundCardProps {
    id: string;
    name: string;
    icon: string;
    description: string;
    tooltip?: string;
    focusType?: string;
    volume: number;
    isActive: boolean;
    onVolumeChange: (volume: number) => void;
    onToggle: () => void;
}

export default function SoundCard({
    id,
    name,
    icon,
    description,
    tooltip,
    focusType,
    volume,
    isActive,
    onVolumeChange,
    onToggle
}: SoundCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const focusTypeConfig: Record<string, { label: string; color: string }> = {
        masking: { label: "Masking", color: "bg-blue-500/20 text-blue-400" },
        grounding: { label: "Grounding", color: "bg-green-500/20 text-green-400" },
        stimulating: { label: "Stimulating", color: "bg-orange-500/20 text-orange-400" }
    };

    const focusTypeBadge = focusType ? focusTypeConfig[focusType.toLowerCase()] : null;

    return (
        <div
            className={`sound-card card-premium relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 group ${isActive
                ? "border-primary/60 bg-primary/10 timer-active-glow gradient-border"
                : "border-border bg-card hover:border-primary/30 shimmer-hover transition-colors duration-300"
                }`}
        >
            {/* Focus Type Badge */}
            {focusTypeBadge && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[9px] font-bold ${focusTypeBadge.color}`}>
                    {focusTypeBadge.label}
                </div>
            )}

            {/* Tooltip on Hover */}
            {tooltip && (
                <div className={`absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-40 text-center z-10 shadow-xl bg-popover text-popover-foreground border border-border`}>
                    {tooltip}
                </div>
            )}

            {/* Icon and Name */}
            <div className="flex flex-col items-center mb-3">
                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 ${isActive
                        ? "bg-primary/10 border border-primary/20 scale-110"
                        : "bg-muted/50 border border-border scale-100"
                        }`}
                >
                    <span className="text-3xl">{icon}</span>
                </div>
                <h3
                    className={`text-sm font-bold text-center text-foreground`}
                >
                    {name}
                </h3>
                <p
                    className={`text-[10px] text-center mt-1 h-8 line-clamp-2 text-muted-foreground`}
                >
                    {description}
                </p>
            </div>

            {/* Vertical Slider */}
            <div className="relative flex flex-col items-center w-full mb-3 px-4">
                <div className="relative h-32 w-full flex justify-center items-center">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="vertical-slider appearance-none bg-transparent cursor-pointer z-10"
                        style={{
                            width: "128px", // Matches h-32
                            height: "20px",
                            transform: "rotate(-90deg)",
                            background: "transparent"
                        }}
                    />
                    {/* Slider track background */}
                    <div
                        className={`absolute w-1.5 h-full rounded-full bg-muted`}
                    />
                    {/* Slider fill */}
                    <div
                        className={`absolute w-1.5 rounded-full bottom-0 transition-all ${isActive
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                            }`}
                        style={{ height: `${volume}%` }}
                    />
                </div>

                {/* Volume Percentage */}
                <span
                    className={`text-xs font-bold mt-2 text-muted-foreground`}
                >
                    {volume}%
                </span>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
                    }`}
            >
                {isActive ? (
                    <span className="flex items-center justify-center gap-1.5">
                        <Volume2 size={14} /> Stop
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-1.5">
                        <VolumeX size={14} /> Play
                    </span>
                )}
            </button>
        </div>
    );
}
