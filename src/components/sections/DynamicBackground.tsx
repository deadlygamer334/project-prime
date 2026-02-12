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
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {settings.backgroundStyle === "aurora" && (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-aurora blur-[80px] opacity-40 animate-float" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-aurora blur-[80px] opacity-40 animate-float" style={{ animationDelay: "-3s" }} />
                    {/* Fallback/Base Glow */}
                    <div className={`absolute inset-0 bg-aurora opacity-20`} />
                </>
            )}

            {settings.backgroundStyle === "mesh" && (
                <div className="absolute inset-0 bg-mesh" />
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
