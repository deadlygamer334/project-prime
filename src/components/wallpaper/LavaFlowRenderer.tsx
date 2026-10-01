"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";

export interface LavaFlowRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

interface LavaBlob {
    baseX: number;
    baseY: number;
    fx1: number;
    fy1: number;
    fx2: number;
    fy2: number;
    px1: number;
    py1: number;
    px2: number;
    py2: number;
    ampX: number;
    ampY: number;
    radiusRatio: number;
    colorType: "primary" | "secondary" | "accent";
}

const LAVA_BLOBS: LavaBlob[] = [
    // Largest blobs (Primary)
    { baseX: 0.45, baseY: 0.45, fx1: 0.18, fy1: 0.14, fx2: 0.08, fy2: 0.11, px1: 0.0, py1: 0.0, px2: 1.2, py2: 0.5, ampX: 0.22, ampY: 0.20, radiusRatio: 0.38, colorType: "primary" },
    { baseX: 0.58, baseY: 0.52, fx1: 0.15, fy1: 0.19, fx2: 0.10, fy2: 0.07, px1: 2.1, py1: 1.4, px2: 0.3, py2: 2.2, ampX: 0.20, ampY: 0.22, radiusRatio: 0.34, colorType: "primary" },

    // Medium blobs (Secondary)
    { baseX: 0.32, baseY: 0.60, fx1: 0.22, fy1: 0.16, fx2: 0.12, fy2: 0.09, px1: 3.5, py1: 2.8, px2: 1.8, py2: 0.9, ampX: 0.25, ampY: 0.18, radiusRatio: 0.28, colorType: "secondary" },
    { baseX: 0.65, baseY: 0.36, fx1: 0.17, fy1: 0.24, fx2: 0.09, fy2: 0.14, px1: 1.1, py1: 4.1, px2: 2.7, py2: 1.6, ampX: 0.23, ampY: 0.24, radiusRatio: 0.26, colorType: "secondary" },
    { baseX: 0.50, baseY: 0.30, fx1: 0.20, fy1: 0.15, fx2: 0.11, fy2: 0.12, px1: 4.8, py1: 0.7, px2: 3.2, py2: 2.9, ampX: 0.18, ampY: 0.19, radiusRatio: 0.24, colorType: "secondary" },

    // Small blobs (Accent)
    { baseX: 0.40, baseY: 0.50, fx1: 0.26, fy1: 0.21, fx2: 0.14, fy2: 0.17, px1: 0.9, py1: 3.2, px2: 4.1, py2: 1.1, ampX: 0.28, ampY: 0.26, radiusRatio: 0.18, colorType: "accent" },
    { baseX: 0.60, baseY: 0.48, fx1: 0.23, fy1: 0.27, fx2: 0.15, fy2: 0.13, px1: 2.6, py1: 1.9, px2: 0.8, py2: 3.7, ampX: 0.26, ampY: 0.25, radiusRatio: 0.16, colorType: "accent" },
];

export function LavaFlowRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
}: LavaFlowRendererProps) {
    const { theme } = useTheme();
    const { reducedMotion: settingReducedMotion } = useSettings();
    const reducedMotion = propReducedMotion ?? settingReducedMotion;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const tRef = useRef<number>(0);
    const lastRef = useRef<number>(0);
    const dprRef = useRef<number>(1);
    const isDark = theme === "dark";
    const FPS = 30;
    const INTERVAL = 1000 / FPS;

    const palette = passedPalette ?? getColorThemePalette("Violet");
    const paletteRef = useRef(palette);
    const isDarkRef = useRef(isDark);

    useEffect(() => {
        paletteRef.current = palette;
        isDarkRef.current = isDark;
    }, [palette, isDark]);

    const draw = useCallback((canvas: HTMLCanvasElement, t: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const minDim = Math.min(W, H);
        const currentPalette = paletteRef.current;
        const currentIsDark = isDarkRef.current;

        ctx.clearRect(0, 0, W, H);

        // Base background fill
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = getCanvasBaseBackground(currentIsDark);
        ctx.fillRect(0, 0, W, H);

        // Screen blend in dark mode gives luminous metaball-style merges
        ctx.globalCompositeOperation = currentIsDark ? "screen" : "source-over";

        LAVA_BLOBS.forEach((blob) => {
            const x = (blob.baseX + Math.sin(t * blob.fx1 + blob.px1) * blob.ampX + Math.cos(t * blob.fx2 + blob.px2) * (blob.ampX * 0.4)) * W;
            const y = (blob.baseY + Math.cos(t * blob.fy1 + blob.py1) * blob.ampY + Math.sin(t * blob.fy2 + blob.py2) * (blob.ampY * 0.4)) * H;
            const radius = blob.radiusRatio * minDim * 1.35;

            let colorStr: string;
            if (blob.colorType === "primary") colorStr = currentPalette[0];
            else if (blob.colorType === "secondary") colorStr = currentPalette[1];
            else colorStr = currentPalette[2];

            const coreAlpha = currentIsDark ? 0.85 : 0.45;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, toRgba(colorStr, coreAlpha));
            grad.addColorStop(0.35, toRgba(colorStr, coreAlpha * 0.7));
            grad.addColorStop(0.7, toRgba(colorStr, coreAlpha * 0.25));
            grad.addColorStop(1, toRgba(colorStr, 0));

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Ambient center vignette
        ctx.globalCompositeOperation = "source-over";
        const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, minDim * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.72 : 0.48));
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

            if (reducedMotion) draw(canvas, 0);
        };

        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) {
            ro.observe(canvas.parentElement);
        }
        resize();

        if (reducedMotion) {
            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                ro.disconnect();
            };
        }

        const animate = (ts: number) => {
            const elapsed = ts - lastRef.current;
            if (elapsed >= INTERVAL) {
                tRef.current += elapsed / 1000;
                lastRef.current = ts - (elapsed % INTERVAL);
                draw(canvas, tRef.current);
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [draw, reducedMotion, INTERVAL]);

    // Redraw static frame on palette/theme change when in reduced motion
    useEffect(() => {
        if (reducedMotion && canvasRef.current) {
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

export default LavaFlowRenderer;
