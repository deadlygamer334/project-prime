"use client";

import React from "react";
import { useWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";

export function ImageWallpaperRenderer() {
    const { wallpaper, isLoaded } = useWallpaper();
    const { mode, isActive } = useFocusTimer();
    const { isZenMode, autoDimWallpaper } = useSettings();

    if (!isLoaded || !wallpaper || wallpaper.type !== "image") return null;

    const { filters, crop, src } = wallpaper;

    const isFocusActive = mode === "FOCUS" && isActive;
    const dimMultiplier = (isFocusActive && autoDimWallpaper) ? 0.6 : 1;

    const brightness = (filters.brightness ?? 1) * 100 * dimMultiplier;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ''}`;

    const scale = crop?.scale ?? 1;
    const x = crop?.x ?? 0;
    const y = crop?.y ?? 0;
    const rotate = crop?.rotate ?? 0;

    return (
        <div style={{
            position: isZenMode ? "fixed" : "absolute",
            inset: 0,
            zIndex: isZenMode ? 999998 : 0,
            overflow: "hidden",
            pointerEvents: "none",
            borderRadius: isZenMode ? "0" : "1.5rem", // Match PomodoroPanel rounding
        }}>
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
                willChange: "transform, filter",
                filter: filterString,
                transition: "filter 2s ease, transform 0.2s ease" // Smooth auto-dim transition
            }} />
            {filters.rgbTint && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: filters.rgbTint,
                    pointerEvents: "none"
                }} />
            )}
        </div>
    );
}
