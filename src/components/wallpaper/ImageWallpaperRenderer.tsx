"use client";

import React, { useRef, useState, useEffect } from "react";
import { useWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";

export function ImageWallpaperRenderer() {
    const { wallpaper, isLoaded } = useWallpaper();
    const { mode, isActive } = useFocusTimer();
    const { isZenMode, autoDimWallpaper } = useSettings();

    const containerRef = useRef<HTMLDivElement>(null);
    const [targetAspect, setTargetAspect] = useState(16 / 9);
    const [mediaAspect, setMediaAspect] = useState(16 / 9);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry && entry.contentRect.height > 0) {
                const aspect = entry.contentRect.width / entry.contentRect.height;
                setTargetAspect(aspect);
                if (!isZenMode) {
                    localStorage.setItem('dashboard-aspect', aspect.toString());
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isZenMode]);

    if (!isLoaded || !wallpaper || wallpaper.type !== "image") return null;

    const filters = isZenMode ? wallpaper.zenFilters : wallpaper.timerFilters;
    const crop = isZenMode ? wallpaper.zenCrop : wallpaper.timerCrop;
    const { src } = wallpaper;
    const isFocusActive = mode === "FOCUS" && isActive;

    const baseBrightness = (filters.brightness ?? 1) * 100;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    let filterString = `brightness(${baseBrightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ''}`;

    if (isFocusActive && autoDimWallpaper) {
        filterString += ' brightness(60%)'; // Stack brightness reduction for dimming
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: isZenMode ? "fixed" : "absolute",
                inset: 0,
                zIndex: isZenMode ? 999998 : 0, // Restore high z-index to act as a curtain over dashboard in Zen Mode
                overflow: "hidden",
                pointerEvents: "none",
                borderRadius: isZenMode ? "0" : "1.5rem", // Match PomodoroPanel rounding
            }}
        >
            <img
                src={src}
                alt=""
                style={{
                    position: "absolute",
                    // 1:1 Alignment with Editor: Robust CSS-based cover fit
                    width: "auto",
                    height: "auto",
                    minWidth: "100%",
                    minHeight: "100%",
                    left: `calc(50% + ${crop.x}%)`,
                    top: `calc(50% + ${crop.y}%)`,
                    willChange: "filter, transform",
                    filter: filterString,
                    transform: `translate(-50%, -50%) scale(${crop.scale}) rotate(${crop.rotate ?? 0}deg)`,
                    transition: "filter 2s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                    transformOrigin: "center center"
                }}
            />

            {filters.rgbTint && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: filters.rgbTint,
                    pointerEvents: "none",
                    transition: "background-color 0.8s ease"
                }} />
            )}
        </div>
    );
}
