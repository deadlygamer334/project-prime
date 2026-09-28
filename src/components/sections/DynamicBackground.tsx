"use client";

import React from "react";
import { useSettings } from "@/lib/SettingsContext";
import { useTheme } from "@/lib/ThemeContext";

export default function DynamicBackground() {
    const settings = useSettings();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Return simpler background if reduced motion is on
    if (settings.reducedMotion) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{
                // Paint containment: isolates background blur animations from page content,
                // reducing composite layer jank on low-end mobile devices
                contain: "strict",
                isolation: "isolate",
            }}
        >
            {settings.backgroundStyle === "aurora" && (
                <>
                    {/* Orb 1: Top-left, large, slow — primary purple */}
                    <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] rounded-full blur-[120px] opacity-[0.18] bg-[var(--color-orb-purple)] animate-[float_18s_ease-in-out_infinite] will-change-transform" />

                    {/* Orb 2: Top-right, medium, medium speed — pink */}
                    <div className="absolute -top-[10%] -right-[15%] w-[55vw] h-[55vh] rounded-full blur-[100px] opacity-[0.13] bg-[var(--color-orb-pink)] animate-[float_22s_ease-in-out_infinite_-7s] will-change-transform" />

                    {/* Orb 3: Center-bottom, very large, slow — purple again for depth */}
                    <div className="absolute top-[40%] left-[20%] w-[80vw] h-[60vh] rounded-full blur-[140px] opacity-[0.10] bg-[var(--color-orb-purple)] animate-[float_25s_ease-in-out_infinite_-12s] will-change-transform" />

                    {/* Orb 4: Bottom-left — green accent */}
                    <div className="absolute -bottom-[15%] -left-[10%] w-[50vw] h-[50vh] rounded-full blur-[100px] opacity-[0.12] bg-[var(--color-orb-green)] animate-[float_20s_ease-in-out_infinite_-4s] will-change-transform" />

                    {/* Orb 5: Bottom-right, small, faster — pink accent */}
                    <div className="absolute -bottom-[5%] -right-[5%] w-[35vw] h-[35vh] rounded-full blur-[80px] opacity-[0.10] bg-[var(--color-orb-pink)] animate-[float_15s_ease-in-out_infinite_-9s] will-change-transform" />
                </>
            )}

            {settings.backgroundStyle === "mesh" && (
                <div className="absolute inset-0 bg-mesh opacity-70" />
            )}

            {settings.backgroundStyle === "particles" && (
                <div className="absolute inset-0 bg-particles" />
            )}

            {settings.backgroundStyle === "midnight" && (
                <div className="absolute inset-0 bg-midnight opacity-90" />
            )}
        </div>
    );
}
