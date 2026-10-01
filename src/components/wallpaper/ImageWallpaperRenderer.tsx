"use client";

import React, { useRef, useState, useEffect } from "react";
import { useWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
interface ImageWallpaperRendererProps {
    timerState?: "idle" | "focus" | "break";
}

export function ImageWallpaperRenderer({ timerState = "idle" }: ImageWallpaperRendererProps) {
    const { wallpaper, isLoaded } = useWallpaper();
    const isActive = timerState !== "idle";
    const isFocusActive = timerState === "focus";
    const { autoDimWallpaper } = useSettings();

    const containerRef = useRef<HTMLDivElement>(null);
    const [targetAspect, setTargetAspect] = useState(16 / 9);
    const [mediaAspect, setMediaAspect] = useState(16 / 9);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry && entry.contentRect.height > 0) {
                setTargetAspect(entry.contentRect.width / entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    if (!isLoaded || !wallpaper || wallpaper.type !== "image") return null;

    const filters = wallpaper.timerFilters;
    const crop = wallpaper.timerCrop;
    const { src } = wallpaper;

    const baseBrightness = (filters.brightness ?? 1) * 100;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    let filterString = `brightness(${baseBrightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ""}`;

    if (isFocusActive && autoDimWallpaper) {
        filterString += " brightness(60%)"; // Stack brightness reduction for dimming
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
                pointerEvents: "none",
                borderRadius: "1.5rem",
            }}
        >
            <img
                src={src}
                alt=""
                onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.naturalHeight > 0) {
                        setMediaAspect(img.naturalWidth / img.naturalHeight);
                    }
                }}
                style={{
                    position: "absolute",
                    width: mediaAspect > targetAspect ? "auto" : "100%",
                    height: mediaAspect > targetAspect ? "100%" : "auto",
                    minWidth: "100%",
                    minHeight: "100%",
                    left: `calc(50% + ${crop.x}%)`,
                    top: `calc(50% + ${crop.y}%)`,
                    willChange: "filter, transform",
                    filter: filterString,
                    transform: `translate(-50%, -50%) scale(${crop.scale}) rotate(${crop.rotate ?? 0}deg)`,
                    transition: "filter 2s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                    transformOrigin: "center center",
                    objectFit: "cover",
                }}
            />

            {filters.rgbTint && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: filters.rgbTint,
                        pointerEvents: "none",
                        transition: "background-color 0.8s ease",
                    }}
                />
            )}
        </div>
    );
}
