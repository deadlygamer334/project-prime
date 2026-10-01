"use client";

import React, { useRef, useState, useEffect } from "react";
import { WallpaperState, isLiveWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
import { LiveWallpaperRenderer } from "./LiveWallpaperRenderer";

interface ZenWallpaperRendererProps {
    wallpaper: WallpaperState;
    brightness?: number;
    timerState?: "idle" | "focus" | "break";
}

export function ZenWallpaperRenderer({ wallpaper, brightness = 1, timerState = "idle" }: ZenWallpaperRendererProps) {
    const isFocusActive = timerState === "focus";
    const { autoDimWallpaper } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    // Live canvas wallpapers (Aurora, Rings, Nebula, Lava, Warp, Mesh, Rain)
    if (isLiveWallpaper(wallpaper)) {
        return (
            <div
                data-zen-canvas-container="true"
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <LiveWallpaperRenderer
                    pattern={wallpaper.livePattern || "aurora"}
                    colorTheme={wallpaper.colorTheme || "Violet"}
                    filters={wallpaper.zenFilters}
                    borderRadius="0"
                />
            </div>
        );
    }

    const filters = wallpaper.zenFilters;
    const crop = wallpaper.zenCrop;

    const baseBrightness = (filters.brightness ?? 1) * 100;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    const filterParts: string[] = [];
    if (Math.abs(baseBrightness - 100) > 0.01) filterParts.push(`brightness(${baseBrightness}%)`);
    if (Math.abs(contrast - 100) > 0.01) filterParts.push(`contrast(${contrast}%)`);
    if (Math.abs(saturation - 100) > 0.01) filterParts.push(`saturate(${saturation}%)`);
    if (Math.abs(hueRotate) > 0.01) filterParts.push(`hue-rotate(${hueRotate}deg)`);
    if (blur > 0) filterParts.push(`blur(${blur}px)`);
    if (brightness !== 1) filterParts.push(`brightness(var(--zen-brightness, ${brightness}))`);
    if (isFocusActive && autoDimWallpaper) filterParts.push("brightness(60%)");

    const filterString = filterParts.length > 0 ? filterParts.join(" ") : undefined;

    const poster = wallpaper.poster || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            style={{
                willChange: "opacity",
            }}
        >
            {wallpaper.type === "image" && (
                <img
                    src={wallpaper.src}
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
                        willChange: filterString ? "filter, transform" : "transform",
                        filter: filterString,
                        transform: `translate(-50%, -50%) scale(${crop.scale}) rotate(${crop.rotate ?? 0}deg)`,
                        transformOrigin: "center center",
                        objectFit: "cover",
                    }}
                />
            )}

            {wallpaper.type === "video" && (
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    loop
                    autoPlay
                    poster={poster}
                    onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (video.videoHeight > 0) {
                            setMediaAspect(video.videoWidth / video.videoHeight);
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
                        willChange: filterString ? "filter, transform" : "transform",
                        filter: filterString,
                        transform: `translate(-50%, -50%) scale(${crop.scale}) rotate(${crop.rotate ?? 0}deg)`,
                        transformOrigin: "center center",
                        objectFit: "cover",
                    }}
                >
                    <source src={wallpaper.src} type="video/mp4" />
                </video>
            )}

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
export default ZenWallpaperRenderer;
