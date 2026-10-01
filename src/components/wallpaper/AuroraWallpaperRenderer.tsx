"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";

interface Props {
    filters?: WallpaperFilters;
    borderRadius?: string;
    /** When set, uses a fixed palette from FIXED_PALETTES instead of
     *  the theme-based palette. Pass the wallpaper id (e.g. "aurora-ocean"). */
    paletteKey?: string;
}

// Per-theme aurora palettes — colors match the SettingsContext vibeColors
// orb1/orb2/orb3 for each vibe, at higher opacity for canvas rendering
const PALETTES: Record<string, { dark: string[]; light: string[] }> = {
    midnight: {
        dark:  ["rgba(139,92,246,0.80)", "rgba(236,72,153,0.65)", "rgba(34,197,94,0.55)"],
        light: ["rgba(139,92,246,0.35)", "rgba(236,72,153,0.25)", "rgba(34,197,94,0.20)"],
    },
    oceanic: {
        dark:  ["rgba(59,130,246,0.80)", "rgba(6,182,212,0.70)", "rgba(45,212,191,0.58)"],
        light: ["rgba(59,130,246,0.35)", "rgba(6,182,212,0.28)", "rgba(45,212,191,0.22)"],
    },
    evergreen: {
        dark:  ["rgba(16,185,129,0.80)", "rgba(34,197,94,0.68)", "rgba(132,204,22,0.55)"],
        light: ["rgba(16,185,129,0.35)", "rgba(34,197,94,0.28)", "rgba(132,204,22,0.20)"],
    },
    solar: {
        dark:  ["rgba(249,115,22,0.78)", "rgba(234,179,8,0.70)", "rgba(239,68,68,0.58)"],
        light: ["rgba(249,115,22,0.35)", "rgba(234,179,8,0.28)", "rgba(239,68,68,0.22)"],
    },
    rose: {
        dark:  ["rgba(244,63,94,0.78)", "rgba(219,39,119,0.68)", "rgba(147,51,234,0.58)"],
        light: ["rgba(244,63,94,0.35)", "rgba(219,39,119,0.28)", "rgba(147,51,234,0.22)"],
    },
    minimal: {
        dark:  ["rgba(180,180,210,0.60)", "rgba(140,140,180,0.50)", "rgba(100,100,150,0.38)"],
        light: ["rgba(120,120,160,0.28)", "rgba(100,100,140,0.22)", "rgba(80,80,120,0.16)"],
    },
};

const FIXED_PALETTES: Record<string, string[]> = {
    "aurora-midnight": [
        "rgba(139,92,246,0.85)", "rgba(236,72,153,0.70)", "rgba(34,197,94,0.58)"
    ],
    "aurora-ocean": [
        "rgba(59,130,246,0.85)", "rgba(6,182,212,0.75)", "rgba(45,212,191,0.62)"
    ],
    "aurora-forest": [
        "rgba(16,185,129,0.85)", "rgba(34,197,94,0.72)", "rgba(132,204,22,0.58)"
    ],
    "aurora-solar": [
        "rgba(249,115,22,0.82)", "rgba(234,179,8,0.72)", "rgba(239,68,68,0.60)"
    ],
    "aurora-rose": [
        "rgba(244,63,94,0.82)", "rgba(219,39,119,0.70)", "rgba(147,51,234,0.60)"
    ],
    "aurora-arctic": [
        "rgba(147,197,253,0.75)", "rgba(196,207,235,0.65)", "rgba(226,232,240,0.52)"
    ],
};

// 5 aurora curtain bands — each has independent motion parameters
const BANDS = [
    // baseX, baseY, speedX, speedY, ampX, ampY, phaseX, phaseY, rx, ry, colorIdx
    [0.50, 0.32, 0.14, 0.10, 0.18, 0.07, 0.00, 0.00, 0.85, 0.42, 0],
    [0.28, 0.28, 0.20, 0.14, 0.14, 0.06, 1.20, 2.10, 0.60, 0.32, 1],
    [0.75, 0.22, 0.26, 0.18, 0.12, 0.06, 2.40, 0.80, 0.48, 0.26, 2],
    [0.50, 0.48, 0.09, 0.07, 0.08, 0.04, 3.60, 1.50, 0.95, 0.55, 0],
    [0.68, 0.35, 0.22, 0.16, 0.10, 0.05, 0.70, 3.00, 0.38, 0.22, 1],
];

export function AuroraWallpaperRenderer({
    filters,
    borderRadius = "0",
    paletteKey,
}: Props) {
    const { theme } = useTheme();
    const { themeVibe, reducedMotion } = useSettings();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const tRef      = useRef<number>(0);
    const lastRef   = useRef<number>(0);
    const dprRef    = useRef<number>(1);
    const isDark    = theme === "dark";
    const FPS       = 30;
    const INTERVAL  = 1000 / FPS;

    const getPalette = useCallback(() => {
        // Fixed palette (gallery variant) overrides theme palette
        if (paletteKey && paletteKey in FIXED_PALETTES) {
            return FIXED_PALETTES[paletteKey];
        }
        const key = themeVibe in PALETTES ? themeVibe : "midnight";
        return isDark ? PALETTES[key].dark : PALETTES[key].light;
    }, [paletteKey, themeVibe, isDark]);

    const draw = useCallback((canvas: HTMLCanvasElement, t: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Use logical size (CSS pixels), not physical pixels
        // The canvas CSS size equals parent; we scale context for DPR
        const W = canvas.width;
        const H = canvas.height;
        const palette = getPalette();

        ctx.clearRect(0, 0, W, H);

        // Paint a base background so aurora has something to blend into.
        // Without this, light mode panels (bg-white) wash screen-blended
        // colors to pure white making the aurora invisible.
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = isDark ? "#08090d" : "#e8eaff";
        ctx.fillRect(0, 0, W, H);

        // Aurora bands:
        // dark mode  → "screen" adds light (classic aurora glow on dark sky)
        // light mode → "source-over" layers soft pastels over tinted base
        ctx.globalCompositeOperation = isDark ? "screen" : "source-over";

        BANDS.forEach(([bx, by, sx, sy, ax, ay, px, py, rx, ry, ci]) => {
            const x = (bx + Math.sin(t * sx + px) * ax) * W;
            const y = (by + Math.sin(t * sy + py) * ay) * H;
            const rxi = rx * W;
            const ryi = ry * H;
            const color = palette[ci as number];

            // Draw squashed ellipse via saved transform
            ctx.save();
            ctx.scale(1, ryi / rxi);
            const grad = ctx.createRadialGradient(
                x, y * (rxi / ryi), 0,
                x, y * (rxi / ryi), rxi
            );
            const baseAlpha = parseFloat(color.match(/[\d.]+\)$/)?.[0] ?? "0.4");
            const midAlpha  = (baseAlpha * 0.45).toFixed(3);
            grad.addColorStop(0,   color);
            grad.addColorStop(0.4, color.replace(/[\d.]+\)$/, `${midAlpha})`));
            grad.addColorStop(1,   color.replace(/[\d.]+\)$/, "0)"));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y * (rxi / ryi), rxi, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.globalCompositeOperation = "source-over";

        // Stars — upper 45%, dark mode only, seeded deterministically
        if (isDark) {
            let seed = W * 31337 + H * 1337;
            const rand = () => {
                seed = ((seed * 1664525 + 1013904223) | 0) >>> 0;
                return seed / 0xFFFFFFFF;
            };
            const count = Math.floor(W * H / 5500);
            for (let i = 0; i < count; i++) {
                const sx = rand() * W;
                const sy = rand() * H * 0.45;
                const sr = (rand() * 0.9 + 0.2) * dprRef.current;
                const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + rand()) + rand() * 6.28);
                ctx.globalAlpha = tw * 0.28;
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Ground vignette — fades bottom to near-opaque bg color
        const groundGrad = ctx.createLinearGradient(0, H * 0.70, 0, H);
        if (isDark) {
            groundGrad.addColorStop(0, "rgba(0,0,0,0)");
            groundGrad.addColorStop(1, "rgba(0,0,0,0.88)");
        } else {
            groundGrad.addColorStop(0, "rgba(255,255,255,0)");
            groundGrad.addColorStop(1, "rgba(255,255,255,0.82)");
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 0, W, H);
    }, [getPalette, isDark]);

    // Sync canvas size to its CSS container using ResizeObserver
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        dprRef.current = dpr;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const { width, height } = parent.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            // Set physical canvas size
            canvas.width  = width  * dpr;
            canvas.height = height * dpr;
            // Reset CSS size explicitly
            canvas.style.width  = `${width}px`;
            canvas.style.height = `${height}px`;
            if (reducedMotion) draw(canvas, 0);
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas.parentElement!);
        resize(); // Initial size

        if (reducedMotion) return () => ro.disconnect();

        const animate = (ts: number) => {
            const elapsed = ts - lastRef.current;
            if (elapsed >= INTERVAL) {
                tRef.current  += elapsed / 1000;
                lastRef.current = ts - (elapsed % INTERVAL);
                draw(canvas, tRef.current);
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [draw, reducedMotion, INTERVAL]);

    // Build CSS filter string
    const filterStr = filters ? [
        `brightness(${(filters.brightness ?? 1) * 100}%)`,
        `contrast(${(filters.contrast ?? 1) * 100}%)`,
        `saturate(${(filters.saturation ?? 1) * 100}%)`,
        filters.blur      > 0 ? `blur(${filters.blur}px)`             : "",
        filters.grayscale > 0 ? `grayscale(${filters.grayscale*100}%)` : "",
        filters.sepia     > 0 ? `sepia(${filters.sepia*100}%)`         : "",
        filters.hueRotate != 0 ? `hue-rotate(${filters.hueRotate}deg)` : "",
    ].filter(Boolean).join(" ") : undefined;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                // DO NOT set width/height here — ResizeObserver handles it
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
