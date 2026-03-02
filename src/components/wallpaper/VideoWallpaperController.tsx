"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWallpaper } from "@/lib/WallpaperContext";
import { useSettings } from "@/lib/SettingsContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";

export function VideoWallpaperController() {
    const { wallpaper, isLoaded } = useWallpaper();
    const { reducedMotion, isZenMode, autoDimWallpaper } = useSettings();
    const { mode, isActive } = useFocusTimer(); // Used for Auto-dim
    // Use focus timer hook locally to safely grab mode if needed, but it might cycle renders.
    // Actually, we can just consume it, or rely on activeSrc solely.
    // The prompt says: "Auto switch based on timer state ... Focus Variant, Break Variant".
    // We'll leave that logic for the container/consumer to update the context, or handle it here.

    // For performance, let's keep the global video controller purely logic-driven by the wallpaper context.
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "UNLOADED">("IDLE");

    const activeSrc = wallpaper?.type === "video" ? wallpaper.src : null;

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
                // Ensure we don't play if the system is hidden (e.g., hidden tab while loading)
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

    const { filters, crop } = wallpaper;

    const isFocusActive = mode === "FOCUS" && isActive;
    // Auto-dim reduces brightness by 40% when focus is active
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
            zIndex: isZenMode ? 999998 : 0, // Behind UI but in front of background
            overflow: "hidden",
            pointerEvents: "none",
            borderRadius: isZenMode ? "0" : "1.5rem", // Match PomodoroPanel rounding
        }}>
            {/* Fallback Poster (Always behind video, visible if video is loading or paused/unloaded) */}
            {wallpaper.poster && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${wallpaper.poster})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
                    willChange: "transform",
                    filter: filterString,
                    opacity: (status === "PLAYING" && !reducedMotion) ? 0 : 1, // Fade out when video plays smoothly
                    transition: "opacity 0.8s ease"
                }} />
            )}
            <video
                ref={videoRef}
                loop
                muted
                playsInline
                poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" // Transparent poster to let the div fallback show
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
                    willChange: "transform, filter",
                    filter: filterString,
                    opacity: status === "PLAYING" ? 1 : 0, // Fade video in when playing
                    transition: "opacity 0.5s ease, filter 2s ease" // Smooth transition for auto-dim
                }}
            />
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
