"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
                setTargetAspect(entry.contentRect.width / entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isZenMode]);

    // Safe playback utility to handle AbortError during portal/visibility transitions
    const safePlay = async (video: HTMLVideoElement) => {
        try {
            await video.play();
            setStatus("PLAYING");
        } catch (err: any) {
            // AbortError (code 20) is expected when the DOM moves or the request is interrupted
            if (err.name !== "AbortError") {
                console.error("Video playback error:", err);
                setStatus("PAUSED");
            }
        }
    };

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
                    safePlay(video);
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
                safePlay(video);
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

    // Force playback trigger when entering Zen Mode or starting Focus
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !activeSrc || reducedMotion) return;

        if (isZenMode || isActive) {
            safePlay(video);
        }
    }, [isZenMode, isActive, activeSrc, reducedMotion]);

    if (!isLoaded || !wallpaper || wallpaper.type !== "video") return null;

    const filters = isZenMode ? wallpaper.zenFilters : wallpaper.timerFilters;
    const crop = isZenMode ? wallpaper.zenCrop : wallpaper.timerCrop;
    const isFocusActive = mode === "FOCUS" && isActive;

    const baseBrightness = (filters.brightness ?? 1) * 100;
    const contrast = (filters.contrast ?? 1) * 100;
    const saturation = (filters.saturation ?? 1) * 100;
    const hueRotate = filters.hueRotate ?? 0;
    const blur = filters.blur ?? 0;

    // Base filter string
    let filterString = `brightness(${baseBrightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ''}`;

    // Sync with Zen Mode Brightness Control
    filterString += ` brightness(var(--zen-brightness, 1))`;

    if (isFocusActive && autoDimWallpaper) {
        filterString += ' brightness(60%)';
    }

    const poster = wallpaper.poster || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    const content = (
        <div
            ref={containerRef}
            style={{
                position: isZenMode ? "fixed" : "absolute",
                inset: 0,
                zIndex: isZenMode ? 999998 : 0,
                overflow: "hidden",
                pointerEvents: "none",
                borderRadius: isZenMode ? "0" : "1.5rem",
                opacity: isZenMode ? 1 : (isActive ? 1 : 0),
                transition: "opacity 1s ease",
            }}
        >
            {activeSrc && (
                <video
                    ref={videoRef}
                    key={activeSrc}
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
                        willChange: "filter, transform",
                        filter: filterString,
                        transform: `translate(-50%, -50%) scale(${crop.scale}) rotate(${crop.rotate ?? 0}deg)`,
                        transition: "filter 2s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                        transformOrigin: "center center",
                        opacity: isLoaded ? 1 : 0,
                        objectFit: "cover",
                    }}
                >
                    <source src={activeSrc} type="video/mp4" />
                </video>
            )}

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

    if (isZenMode && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }

    return content;
}
