"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";

export interface LightRainRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

interface ColumnConfig {
    index: number;
    posRel: number;
    widthRel: number;
    period: number;
    offset: number;
    colorType: 0 | 1 | 2; // 0: primary, 1: secondary, 2: accent
}

const COLUMNS: ColumnConfig[] = [
    { index: 0, posRel: 0.04, widthRel: 0.12, period: 9.2,  offset: 0.0,  colorType: 0 },
    { index: 1, posRel: 0.14, widthRel: 0.10, period: 11.5, offset: 3.1,  colorType: 1 },
    { index: 2, posRel: 0.23, widthRel: 0.13, period: 8.7,  offset: 6.4,  colorType: 2 }, // accent
    { index: 3, posRel: 0.34, widthRel: 0.11, period: 12.1, offset: 1.8,  colorType: 0 },
    { index: 4, posRel: 0.45, widthRel: 0.14, period: 10.3, offset: 7.2,  colorType: 1 },
    { index: 5, posRel: 0.55, widthRel: 0.11, period: 9.8,  offset: 4.5,  colorType: 0 },
    { index: 6, posRel: 0.65, widthRel: 0.13, period: 11.1, offset: 2.3,  colorType: 2 }, // accent
    { index: 7, posRel: 0.75, widthRel: 0.10, period: 8.9,  offset: 8.0,  colorType: 1 },
    { index: 8, posRel: 0.84, widthRel: 0.12, period: 10.7, offset: 5.1,  colorType: 0 },
    { index: 9, posRel: 0.94, widthRel: 0.11, period: 12.4, offset: 0.9,  colorType: 1 },
];

export function LightRainRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
}: LightRainRendererProps) {
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
        const currentPalette = paletteRef.current;
        const currentIsDark = isDarkRef.current;

        ctx.clearRect(0, 0, W, H);

        // Base fill
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = getCanvasBaseBackground(currentIsDark);
        ctx.fillRect(0, 0, W, H);

        // Always source-over blending for soft overlapping curtain bands
        ctx.globalCompositeOperation = "source-over";

        COLUMNS.forEach((col) => {
            const cycleTime = (t + col.offset) % col.period;
            const progress = cycleTime / col.period;

            // Lifecycle envelope:
            // 0.00 -> 0.20 : wait (0 alpha)
            // 0.20 -> 0.45 : fade in (2-3s)
            // 0.45 -> 0.65 : hold at peak
            // 0.65 -> 1.00 : fade out (3-4s)
            let envelope = 0;
            if (progress >= 0.20 && progress < 0.45) {
                envelope = (progress - 0.20) / 0.25;
            } else if (progress >= 0.45 && progress < 0.65) {
                envelope = 1.0;
            } else if (progress >= 0.65) {
                envelope = 1.0 - (progress - 0.65) / 0.35;
            }

            if (envelope <= 0.01) return;

            const colX = col.posRel * W;
            const colWidth = col.widthRel * W;
            const halfW = colWidth * 0.5;
            const colorStr = currentPalette[col.colorType];

            const maxAlpha = (currentIsDark ? 0.45 : 0.22) * envelope;

            // Vertical linear gradient from top to bottom
            const vertGrad = ctx.createLinearGradient(0, 0, 0, H);
            vertGrad.addColorStop(0, toRgba(colorStr, maxAlpha * 0.2));
            vertGrad.addColorStop(0.20, toRgba(colorStr, maxAlpha * 0.8));
            vertGrad.addColorStop(0.45, toRgba(colorStr, maxAlpha));
            vertGrad.addColorStop(0.75, toRgba(colorStr, maxAlpha * 0.4));
            vertGrad.addColorStop(1, toRgba(colorStr, 0));

            // Draw column with horizontal soft falloff
            ctx.save();
            ctx.fillStyle = vertGrad;

            // Use horizontal gradient to feather left and right edges smoothly
            const colGrad = ctx.createRadialGradient(
                colX, H * 0.4, 0,
                colX, H * 0.4, halfW
            );
            colGrad.addColorStop(0, toRgba(colorStr, maxAlpha));
            colGrad.addColorStop(0.5, toRgba(colorStr, maxAlpha * 0.6));
            colGrad.addColorStop(1, toRgba(colorStr, 0));

            // Scaled ellipse for soft beam shape
            ctx.save();
            ctx.scale(1, H / colWidth);
            ctx.beginPath();
            ctx.arc(colX, (H * 0.35) * (colWidth / H), halfW * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = colGrad;
            ctx.fill();
            ctx.restore();

            // Overlay vertical column strip with soft edges
            const stripGrad = ctx.createLinearGradient(colX - halfW, 0, colX + halfW, 0);
            stripGrad.addColorStop(0, toRgba(colorStr, 0));
            stripGrad.addColorStop(0.2, toRgba(colorStr, maxAlpha * 0.5));
            stripGrad.addColorStop(0.5, toRgba(colorStr, maxAlpha));
            stripGrad.addColorStop(0.8, toRgba(colorStr, maxAlpha * 0.5));
            stripGrad.addColorStop(1, toRgba(colorStr, 0));

            ctx.fillStyle = stripGrad;
            ctx.fillRect(colX - halfW, 0, colWidth, H * 0.85);

            ctx.restore();
        });

        // Ambient ground vignette
        const vigGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.70 : 0.45));
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

export default LightRainRenderer;
