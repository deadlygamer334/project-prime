"use client";

import React, { useRef, useEffect, useCallback, useId } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";
import { registerCallback, unregisterCallback } from "./canvasScheduler";
import type { RenderContext } from "./LiveWallpaperRenderer";

export interface AuroraWallpaperRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
    /** Backward compatibility */
    paletteKey?: string;
    dprCap?: number;
    maxFps?: number;
    context?: RenderContext;
}

// 5 aurora curtain bands — each has independent motion parameters
const BANDS = [
    // baseX, baseY, speedX, speedY, ampX, ampY, phaseX, phaseY, rx, ry, colorIdx
    [0.50, 0.32, 0.14, 0.10, 0.18, 0.07, 0.00, 0.00, 0.85, 0.42, 0],
    [0.28, 0.28, 0.20, 0.14, 0.14, 0.06, 1.20, 2.10, 0.60, 0.32, 1],
    [0.75, 0.22, 0.26, 0.18, 0.12, 0.06, 2.40, 0.80, 0.48, 0.26, 2],
    [0.50, 0.48, 0.09, 0.07, 0.08, 0.04, 3.60, 1.50, 0.95, 0.55, 0],
    [0.68, 0.35, 0.22, 0.16, 0.10, 0.05, 0.70, 3.00, 0.38, 0.22, 1],
];

interface CachedStar {
    x: number; // normalised 0–1
    y: number; // normalised 0–0.45
    radius: number; // base radius multiplier
    twinkleSpeed: number;
    twinklePhase: number;
}

export function AuroraWallpaperRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
    dprCap = 2,
    maxFps = 30,
    context = "panel",
}: AuroraWallpaperRendererProps) {
    const { theme } = useTheme();
    const { reducedMotion: settingReducedMotion } = useSettings();
    const reducedMotion = propReducedMotion ?? settingReducedMotion;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tRef = useRef<number>(0);
    const lastFrameRef = useRef<number>(0);
    const dprRef = useRef<number>(1);
    const isDark = theme === "dark";

    const palette = passedPalette ?? getColorThemePalette("Violet");
    const paletteRef = useRef(palette);
    const isDarkRef = useRef(isDark);

    // Pre-computed star positions (Root Cause 4)
    const starsRef = useRef<CachedStar[]>([]);
    const starsCountRef = useRef<number>(0);
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isVisibleRef = useRef(true);
    const schedulerId = useId();

    useEffect(() => {
        paletteRef.current = palette;
        isDarkRef.current = isDark;
    }, [palette, isDark]);

    // Rebuild star cache when canvas size changes
    const rebuildStars = useCallback((W: number, H: number, dpr: number) => {
        let seed = W * 31337 + H * 1337;
        const rand = () => {
            seed = ((seed * 1664525 + 1013904223) | 0) >>> 0;
            return seed / 0xFFFFFFFF;
        };
        const count = Math.floor((W * H) / 5500);
        const stars: CachedStar[] = new Array(count);
        for (let i = 0; i < count; i++) {
            stars[i] = {
                x: rand(),
                y: rand() * 0.45,
                radius: (rand() * 0.9 + 0.2) * dpr,
                twinkleSpeed: 0.6 + rand(),
                twinklePhase: rand() * 6.28,
            };
        }
        starsRef.current = stars;
        starsCountRef.current = count;
    }, []);

    const draw = useCallback((canvas: HTMLCanvasElement, t: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const currentPalette = paletteRef.current;
        const currentIsDark = isDarkRef.current;

        ctx.clearRect(0, 0, W, H);

        // Paint a base background using offscreen 1×1 canvas
        ctx.globalCompositeOperation = "source-over";
        if (bgCanvasRef.current) {
            ctx.drawImage(bgCanvasRef.current, 0, 0, W, H);
        } else {
            ctx.fillStyle = getCanvasBaseBackground(currentIsDark);
            ctx.fillRect(0, 0, W, H);
        }

        // Aurora bands:
        // dark mode  → "screen" adds light glow (kept — essential for aurora effect)
        // light mode → "source-over" layers soft pastels
        ctx.globalCompositeOperation = currentIsDark ? "screen" : "source-over";

        BANDS.forEach(([bx, by, sx, sy, ax, ay, px, py, rx, ry, ci]) => {
            const x = (bx + Math.sin(t * sx + px) * ax) * W;
            const y = (by + Math.sin(t * sy + py) * ay) * H;
            const rxi = rx * W;
            const ryi = ry * H;
            const rawColor = currentPalette[ci as number] || currentPalette[0];
            const bandColor = toRgba(rawColor, currentIsDark ? 0.75 : 0.35);

            ctx.save();
            ctx.scale(1, ryi / rxi);
            const grad = ctx.createRadialGradient(
                x, y * (rxi / ryi), 0,
                x, y * (rxi / ryi), rxi
            );

            grad.addColorStop(0, bandColor);
            grad.addColorStop(0.4, toRgba(rawColor, currentIsDark ? 0.32 : 0.16));
            grad.addColorStop(1, toRgba(rawColor, 0));

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y * (rxi / ryi), rxi, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.globalCompositeOperation = "source-over";

        // Stars — upper 45%, dark mode only, read from pre-computed cache
        if (currentIsDark) {
            const stars = starsRef.current;
            const count = starsCountRef.current;
            for (let i = 0; i < count; i++) {
                const star = stars[i];
                const tw = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
                ctx.globalAlpha = tw * 0.28;
                ctx.fillStyle = toRgba(currentPalette[2], 0.9); // accent tinted stars
                ctx.beginPath();
                ctx.arc(star.x * W, star.y * H, star.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Ground vignette — fades bottom to near-opaque bg color
        const groundGrad = ctx.createLinearGradient(0, H * 0.70, 0, H);
        if (currentIsDark) {
            groundGrad.addColorStop(0, toRgba(getCanvasBaseBackground(true), 0));
            groundGrad.addColorStop(1, toRgba(getCanvasBaseBackground(true), 0.88));
        } else {
            groundGrad.addColorStop(0, toRgba(getCanvasBaseBackground(false), 0));
            groundGrad.addColorStop(1, toRgba(getCanvasBaseBackground(false), 0.82));
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 0, W, H);
    }, []);

    // Sync canvas size to its CSS container using ResizeObserver with safety fallback
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        dprRef.current = dpr;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            let width = rect.width;
            let height = rect.height;

            const isFullscreenTarget =
                parent.getAttribute("data-zen-canvas-container") === "true" ||
                parent.style.position === "fixed" ||
                parent.classList.contains("fixed") ||
                (rect.width >= window.innerWidth - 60 && rect.height >= window.innerHeight - 60);

            if (isFullscreenTarget) {
                if (window.innerWidth > width) width = window.innerWidth;
                if (window.innerHeight > height) height = window.innerHeight;
            }

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            // Rebuild star cache on resize
            rebuildStars(canvas.width, canvas.height, dpr);

            // Rebuild offscreen background canvas
            const bg = document.createElement("canvas");
            bg.width = 1;
            bg.height = 1;
            const bgCtx = bg.getContext("2d");
            if (bgCtx) {
                bgCtx.fillStyle = getCanvasBaseBackground(isDarkRef.current);
                bgCtx.fillRect(0, 0, 1, 1);
            }
            bgCanvasRef.current = bg;

            if (reducedMotion) draw(canvas, 0);
        };

        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) {
            ro.observe(canvas.parentElement);
        }
        resize();

        if (reducedMotion) {
            return () => { ro.disconnect(); };
        }

        // Frame-rate limited callback for the shared scheduler
        const INTERVAL = 1000 / maxFps;
        const animateCallback = (ts: number) => {
            if (!isVisibleRef.current) return;
            const elapsed = ts - lastFrameRef.current;
            if (elapsed >= INTERVAL) {
                tRef.current += elapsed / 1000;
                lastFrameRef.current = ts - (elapsed % INTERVAL);
                draw(canvas, tRef.current);
            }
        };

        registerCallback(schedulerId, animateCallback);

        return () => {
            unregisterCallback(schedulerId);
            ro.disconnect();
        };
    }, [draw, reducedMotion, dprCap, maxFps, schedulerId, rebuildStars]);

    // IntersectionObserver pause for gallery previews (Root Cause 6)
    useEffect(() => {
        if (context !== "gallery-preview" || reducedMotion) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    isVisibleRef.current = true;
                } else {
                    isVisibleRef.current = false;
                }
            },
            { threshold: 0 }
        );
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [context, reducedMotion]);

    // Redraw static frame on palette/theme change when in reduced motion
    useEffect(() => {
        if (reducedMotion && canvasRef.current) {
            // Refresh offscreen bg for theme change
            const bg = document.createElement("canvas");
            bg.width = 1;
            bg.height = 1;
            const bgCtx = bg.getContext("2d");
            if (bgCtx) {
                bgCtx.fillStyle = getCanvasBaseBackground(isDark);
                bgCtx.fillRect(0, 0, 1, 1);
            }
            bgCanvasRef.current = bg;
            draw(canvasRef.current, tRef.current);
        }
    }, [palette, isDark, reducedMotion, draw]);

    // Build CSS filter string
    const filterStr = filters
        ? [
              `brightness(${(filters.brightness ?? 1) * 100}%)`,
              `contrast(${(filters.contrast ?? 1) * 100}%)`,
              `saturate(${(filters.saturation ?? 1) * 100}%)`,
              filters.blur > 0 ? `blur(${filters.blur}px)` : "",
              filters.grayscale > 0 ? `grayscale(${filters.grayscale * 100}%)` : "",
              filters.sepia > 0 ? `sepia(${filters.sepia * 100}%)` : "",
              filters.hueRotate !== 0 ? `hue-rotate(${filters.hueRotate}deg)` : "",
          ]
              .filter(Boolean)
              .join(" ")
        : undefined;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius,
                pointerEvents: "none",
                zIndex: 0,
                filter: filterStr,
                willChange: reducedMotion ? "auto" : "transform",
                display: "block",
            }}
        />
    );
}

export default AuroraWallpaperRenderer;
