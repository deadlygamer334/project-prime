"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";

export function VideoWallpaperController() {
    const { wallpaper, isLoaded } = useWallpaper();
    const { reducedMotion, isZenMode, autoDimWallpaper } = useSettings();
    const { mode, isActive } = useFocusTimer();

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "UNLOADED">("IDLE");

    const [targetAspect, setTargetAspect] = useState(16 / 9);
    const [mediaAspect, setMediaAspect] = useState(16 / 9);

    const activeSrc = wallpaper?.type === "video" ? wallpaper.src : null;

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

    useEffect(() => {
        if (!isLoaded) return;
        const video = videoRef.current;
        if (!video) return;

        if (!activeSrc || reducedMotion) {
            video.pause();
            video.removeAttribute("src");
            video.load();
            setStatus("UNLOADED");
            return;
        }

        if (video.src !== activeSrc) {
            setStatus("LOADING");
            video.pause();
            video.src = activeSrc;

            const handleCanPlay = () => {
                if (!document.hidden && !reducedMotion) {
                    video.play().then(() => setStatus("PLAYING")).catch(() => setStatus("PAUSED"));
                } else {
                    setStatus("PAUSED");
                }
            };

            video.addEventListener("canplay", handleCanPlay, { once: true });
            video.load();
        }

    }, [activeSrc, reducedMotion, isLoaded]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                video.pause();
                setStatus("PAUSED");
            } else if (activeSrc && !reducedMotion) {
                video.play().then(() => setStatus("PLAYING")).catch(console.error);
            }
        };

        const handleBlur = () => {
            video.pause();
            setStatus("PAUSED");
        };

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleVisibilityChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleVisibilityChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activeSrc, reducedMotion]);

    if (!isLoaded || !wallpaper || wallpaper.type !== "video") return null;

    const filters = isZenMode ? wallpaper.zenFilters : wallpaper.timerFilters;
    const crop = isZenMode ? wallpaper.zenCrop : wallpaper.timerCrop;
    const isFocusActive = mode === "FOCUS" && isActive;

    const baseBrightness = (filters.brightness ?? 1) * 100;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    let filterString = `brightness(${baseBrightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ''}`;

    if (isFocusActive && autoDimWallpaper) {
        filterString += ' brightness(60%)';
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: isZenMode ? "fixed" : "absolute",
                inset: 0,
                zIndex: isZenMode ? 999998 : 0,
                overflow: "hidden",
                pointerEvents: "none",
                borderRadius: isZenMode ? "0" : "1.5rem",
            }}
        >
            <video
                ref={videoRef}
                src={activeSrc || ""}
                poster={wallpaper.poster}
                loop
                muted
                playsInline
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
                    transformOrigin: "center center",
                    opacity: status === "PLAYING" ? 1 : 0,
                    transitionProperty: "opacity, filter, transform",
                }}
            />

            {filters.rgbTint && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: filters.rgbTint,
                    pointerEvents: "none",
                    transition: "background-color 0.8s ease",
                    zIndex: 1
                }} />
            )}
        </div>
    );
}
