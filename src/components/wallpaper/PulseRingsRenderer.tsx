"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";

export interface PulseRingsRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

interface OriginConfig {
    baseX: number;
    baseY: number;
    driftSpeedX: number;
    driftSpeedY: number;
    driftAmpX: number;
    driftAmpY: number;
    phase: number;
    ringCount: number;
}

const ORIGINS: OriginConfig[] = [
    { baseX: 0.36, baseY: 0.44, driftSpeedX: 0.15, driftSpeedY: 0.12, driftAmpX: 0.05, driftAmpY: 0.04, phase: 0.0, ringCount: 5 },
    { baseX: 0.68, baseY: 0.58, driftSpeedX: 0.13, driftSpeedY: 0.17, driftAmpX: 0.06, driftAmpY: 0.05, phase: 0.45, ringCount: 5 },
    { baseX: 0.52, baseY: 0.28, driftSpeedX: 0.11, driftSpeedY: 0.14, driftAmpX: 0.04, driftAmpY: 0.04, phase: 0.8, ringCount: 4 },
];

export function PulseRingsRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
}: PulseRingsRendererProps) {
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

        // Dark mode: screen for vibrant halos; Light mode: source-over
        ctx.globalCompositeOperation = currentIsDark ? "screen" : "source-over";

        const maxRadius = Math.max(W, H) * 0.70;
        const ringPeriod = 12; // seconds for one ring to expand fully

        ORIGINS.forEach((orig, oIndex) => {
            const ox = (orig.baseX + Math.sin(t * orig.driftSpeedX + orig.phase) * orig.driftAmpX) * W;
            const oy = (orig.baseY + Math.cos(t * orig.driftSpeedY + orig.phase * 1.5) * orig.driftAmpY) * H;

            // Subtle center glow
            const centerColor = toRgba(currentPalette[oIndex % 3], currentIsDark ? 0.25 : 0.12);
            const centerGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * 0.15);
            centerGrad.addColorStop(0, centerColor);
            centerGrad.addColorStop(1, toRgba(currentPalette[oIndex % 3], 0));
            ctx.fillStyle = centerGrad;
            ctx.beginPath();
            ctx.arc(ox, oy, W * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Concentric rings
            for (let r = 0; r < orig.ringCount; r++) {
                const ringOffset = (r / orig.ringCount) + (orig.phase * 0.3);
                const progress = ((t / ringPeriod) + ringOffset) % 1.0;
                const currentRadius = progress * maxRadius;

                // Opacity curve: 0 at center -> max at 0.35 -> 0 at 1.0
                let alphaMultiplier: number;
                if (progress < 0.35) {
                    alphaMultiplier = progress / 0.35;
                } else {
                    alphaMultiplier = 1 - (progress - 0.35) / 0.65;
                }
                const maxAlpha = currentIsDark ? 0.65 : 0.35;
                const alpha = Math.max(0, Math.min(1, alphaMultiplier * maxAlpha));

                if (alpha <= 0.01 || currentRadius <= 2) continue;

                // Alternating primary and secondary color
                const colorHex = (r + oIndex) % 2 === 0 ? currentPalette[0] : currentPalette[1];
                const strokeWidth = (4 + progress * 24) * dprRef.current;

                // Glowing halo ring with soft gradient stroke
                ctx.save();
                ctx.lineWidth = strokeWidth;

                // Draw soft ring
                ctx.strokeStyle = toRgba(colorHex, alpha);
                ctx.beginPath();
                ctx.arc(ox, oy, currentRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Inner glow halo
                ctx.lineWidth = strokeWidth * 0.4;
                ctx.strokeStyle = toRgba(currentPalette[2], alpha * 0.5);
                ctx.beginPath();
                ctx.arc(ox, oy, Math.max(1, currentRadius - strokeWidth * 0.3), 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        });

        // Ambient vignette
        ctx.globalCompositeOperation = "source-over";
        const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.3, W * 0.5, H * 0.5, W * 0.75);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.65 : 0.45));
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

export default PulseRingsRenderer;
