"use client";

import React, { useRef, useEffect, useCallback, useId } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";
import { registerCallback, unregisterCallback } from "./canvasScheduler";
import type { RenderContext } from "./LiveWallpaperRenderer";

export interface NebulaDriftRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
    dprCap?: number;
    maxFps?: number;
    context?: RenderContext;
}

interface BlobConfig {
    baseX: number;
    baseY: number;
    driftSpeedX: number;
    driftSpeedY: number;
    ampX: number;
    ampY: number;
    phaseX: number;
    phaseY: number;
    rx: number;
    ry: number;
    rotSpeed: number;
    colorIndex: number;
    alphaScale: number;
}

const BLOBS: BlobConfig[] = [
    { baseX: 0.48, baseY: 0.48, driftSpeedX: 0.08, driftSpeedY: 0.06, ampX: 0.12, ampY: 0.09, phaseX: 0.0, phaseY: 0.0, rx: 0.48, ry: 0.38, rotSpeed: 0.04, colorIndex: 0, alphaScale: 0.75 },
    { baseX: 0.55, baseY: 0.44, driftSpeedX: 0.07, driftSpeedY: 0.09, ampX: 0.14, ampY: 0.10, phaseX: 1.8, phaseY: 1.2, rx: 0.44, ry: 0.42, rotSpeed: -0.05, colorIndex: 1, alphaScale: 0.70 },
    { baseX: 0.45, baseY: 0.56, driftSpeedX: 0.09, driftSpeedY: 0.07, ampX: 0.10, ampY: 0.12, phaseX: 3.1, phaseY: 2.5, rx: 0.40, ry: 0.34, rotSpeed: 0.06, colorIndex: 2, alphaScale: 0.65 },
    { baseX: 0.58, baseY: 0.52, driftSpeedX: 0.06, driftSpeedY: 0.08, ampX: 0.15, ampY: 0.11, phaseX: 4.4, phaseY: 0.8, rx: 0.36, ry: 0.30, rotSpeed: -0.03, colorIndex: 0, alphaScale: 0.45 },
    { baseX: 0.40, baseY: 0.40, driftSpeedX: 0.08, driftSpeedY: 0.05, ampX: 0.11, ampY: 0.13, phaseX: 2.2, phaseY: 3.8, rx: 0.38, ry: 0.32, rotSpeed: 0.05, colorIndex: 1, alphaScale: 0.40 },
];

interface CachedStar {
    x: number;
    y: number;
    radius: number;
    twinkleSpeed: number;
    twinklePhase: number;
    colorIdx: number;
}

export function NebulaDriftRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
    dprCap = 2,
    maxFps = 30,
    context = "panel",
}: NebulaDriftRendererProps) {
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
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const starsRef = useRef<CachedStar[]>([]);
    const starsCountRef = useRef<number>(0);
    const isVisibleRef = useRef(true);
    const schedulerId = useId();

    useEffect(() => {
        paletteRef.current = palette;
        isDarkRef.current = isDark;
    }, [palette, isDark]);

    // Pre-compute star positions (Root Cause 4)
    const rebuildStars = useCallback((W: number, H: number, dpr: number) => {
        let seed = W * 45123 + H * 17921;
        const rand = () => {
            seed = ((seed * 1664525 + 1013904223) | 0) >>> 0;
            return seed / 0xFFFFFFFF;
        };
        const count = Math.floor((W * H) / 4800);
        const stars: CachedStar[] = new Array(count);
        for (let i = 0; i < count; i++) {
            stars[i] = {
                x: rand(),
                y: rand(),
                radius: (rand() * 1.1 + 0.3) * dpr,
                twinkleSpeed: 0.8 + rand() * 0.5,
                twinklePhase: rand() * 6.28,
                colorIdx: i % 3,
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

        // Base fill using offscreen canvas
        ctx.globalCompositeOperation = "source-over";
        if (bgCanvasRef.current) {
            ctx.drawImage(bgCanvasRef.current, 0, 0, W, H);
        } else {
            ctx.fillStyle = getCanvasBaseBackground(currentIsDark);
            ctx.fillRect(0, 0, W, H);
        }

        // Galaxy Core Blobs
        ctx.save();
        // Slow global rotation around canvas center
        const cx = W * 0.5;
        const cy = H * 0.5;
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.012);
        ctx.translate(-cx, -cy);

        // Keep screen blending — essential for galaxy-core brightness effect (Root Cause 5)
        ctx.globalCompositeOperation = currentIsDark ? "screen" : "source-over";

        BLOBS.forEach((blob) => {
            const bx = (blob.baseX + Math.sin(t * blob.driftSpeedX + blob.phaseX) * blob.ampX) * W;
            const by = (blob.baseY + Math.cos(t * blob.driftSpeedY + blob.phaseY) * blob.ampY) * H;
            const rxi = blob.rx * W;
            const ryi = blob.ry * H;
            const color = currentPalette[blob.colorIndex % 3];
            const maxAlpha = (currentIsDark ? 0.70 : 0.35) * blob.alphaScale;

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(t * blob.rotSpeed);
            ctx.scale(1, ryi / rxi);

            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rxi);
            grad.addColorStop(0, toRgba(color, maxAlpha));
            grad.addColorStop(0.45, toRgba(color, maxAlpha * 0.4));
            grad.addColorStop(1, toRgba(color, 0));

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, rxi, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        ctx.restore(); // restore global rotation

        // Star Layer — read from pre-computed cache
        ctx.globalCompositeOperation = "source-over";
        if (currentIsDark) {
            const stars = starsRef.current;
            const count = starsCountRef.current;
            for (let i = 0; i < count; i++) {
                const star = stars[i];
                const tw = 0.4 + 0.6 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
                ctx.globalAlpha = tw * 0.32;
                ctx.fillStyle = toRgba(currentPalette[star.colorIdx], 0.95);
                ctx.beginPath();
                ctx.arc(star.x * W, star.y * H, star.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Soft outer ambient vignette
        const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.75 : 0.45));
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);
    }, []);

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

    // IntersectionObserver pause for gallery previews
    useEffect(() => {
        if (context !== "gallery-preview" || reducedMotion) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new IntersectionObserver(
            ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
            { threshold: 0 }
        );
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [context, reducedMotion]);

    // Redraw static frame on palette/theme change when in reduced motion
    useEffect(() => {
        if (reducedMotion && canvasRef.current) {
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

export default NebulaDriftRenderer;
