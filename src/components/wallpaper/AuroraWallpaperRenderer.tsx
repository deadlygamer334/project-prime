"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import { WallpaperFilters } from "@/lib/WallpaperContext";

interface AuroraWallpaperRendererProps {
    filters?: WallpaperFilters;
    /** border-radius to match the container (e.g. "1.5rem" for panel, "0" for zen) */
    borderRadius?: string;
    /** opacity multiplier 0-1 applied on top of filter brightness */
    dimness?: number;
}

// ─── Theme → Aurora Color Mapping ───────────────────────────────────────────
// Colors are derived from the same orb palette already in SettingsContext.
// Each theme gets 3 aurora band colors. Dark mode = deep saturated hues.
// Light mode = same hues but pastelized (higher lightness, lower alpha).

type AuroraPalette = [string, string, string]; // [band1, band2, band3]

const AURORA_PALETTES: Record<string, { dark: AuroraPalette; light: AuroraPalette }> = {
    midnight: {
        dark:  ["rgba(139, 92, 246, 0.55)", "rgba(236, 72, 153, 0.40)", "rgba(34, 197, 94, 0.35)"],
        light: ["rgba(139, 92, 246, 0.30)", "rgba(236, 72, 153, 0.20)", "rgba(34, 197, 94, 0.18)"],
    },
    oceanic: {
        dark:  ["rgba(59, 130, 246, 0.55)", "rgba(6, 182, 212, 0.45)", "rgba(45, 212, 191, 0.35)"],
        light: ["rgba(59, 130, 246, 0.28)", "rgba(6, 182, 212, 0.22)", "rgba(45, 212, 191, 0.18)"],
    },
    evergreen: {
        dark:  ["rgba(16, 185, 129, 0.55)", "rgba(34, 197, 94, 0.40)", "rgba(132, 204, 22, 0.30)"],
        light: ["rgba(16, 185, 129, 0.28)", "rgba(34, 197, 94, 0.20)", "rgba(132, 204, 22, 0.15)"],
    },
    solar: {
        dark:  ["rgba(249, 115, 22, 0.50)", "rgba(234, 179, 8, 0.45)", "rgba(239, 68, 68, 0.35)"],
        light: ["rgba(249, 115, 22, 0.25)", "rgba(234, 179, 8, 0.22)", "rgba(239, 68, 68, 0.18)"],
    },
    rose: {
        dark:  ["rgba(244, 63, 94, 0.50)", "rgba(219, 39, 119, 0.45)", "rgba(147, 51, 234, 0.35)"],
        light: ["rgba(244, 63, 94, 0.25)", "rgba(219, 39, 119, 0.22)", "rgba(147, 51, 234, 0.18)"],
    },
    minimal: {
        dark:  ["rgba(148, 163, 184, 0.40)", "rgba(125, 211, 252, 0.35)", "rgba(167, 243, 208, 0.28)"],
        light: ["rgba(148, 163, 184, 0.22)", "rgba(125, 211, 252, 0.18)", "rgba(167, 243, 208, 0.15)"],
    },
};

// ─── Aurora Band Definitions ─────────────────────────────────────────────────
// Each band is a light curtain with independent oscillation parameters.
// Values are normalized (0–1) relative to canvas dimensions.

interface AuroraBand {
    baseX: number;      // horizontal anchor (0=left, 1=right)
    baseY: number;      // vertical anchor (0=top, 1=bottom)
    speedX: number;     // horizontal oscillation speed (radians/second)
    speedY: number;     // vertical oscillation speed
    amplitudeX: number; // horizontal sway amount (fraction of canvas width)
    amplitudeY: number; // vertical bob amount (fraction of canvas height)
    phaseX: number;     // horizontal phase offset
    phaseY: number;     // vertical phase offset
    width: number;      // band spread (fraction of canvas width)
    height: number;     // band spread (fraction of canvas height)
    colorIndex: 0 | 1 | 2;
}

const AURORA_BANDS: AuroraBand[] = [
    // Large slow dominant band — sits in upper-center
    { baseX: 0.5,  baseY: 0.30, speedX: 0.18, speedY: 0.12,
      amplitudeX: 0.20, amplitudeY: 0.08, phaseX: 0,    phaseY: 0,
      width: 0.90, height: 0.45, colorIndex: 0 },

    // Medium band — upper left, faster
    { baseX: 0.25, baseY: 0.25, speedX: 0.24, speedY: 0.16,
      amplitudeX: 0.15, amplitudeY: 0.06, phaseX: 1.2,  phaseY: 2.1,
      width: 0.65, height: 0.35, colorIndex: 1 },

    // Narrow accent band — upper right
    { baseX: 0.78, baseY: 0.20, speedX: 0.30, speedY: 0.20,
      amplitudeX: 0.12, amplitudeY: 0.07, phaseX: 2.4,  phaseY: 0.8,
      width: 0.50, height: 0.28, colorIndex: 2 },

    // Wide diffuse base — center, very slow
    { baseX: 0.50, baseY: 0.45, speedX: 0.10, speedY: 0.08,
      amplitudeX: 0.08, amplitudeY: 0.05, phaseX: 3.6,  phaseY: 1.5,
      width: 1.00, height: 0.60, colorIndex: 0 },

    // Small bright spot — right-center, medium speed
    { baseX: 0.70, baseY: 0.32, speedX: 0.26, speedY: 0.18,
      amplitudeX: 0.10, amplitudeY: 0.06, phaseX: 0.7,  phaseY: 3.0,
      width: 0.40, height: 0.25, colorIndex: 1 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AuroraWallpaperRenderer({
    filters,
    borderRadius = "1.5rem",
    dimness = 1,
}: AuroraWallpaperRendererProps) {
    const { theme } = useTheme();
    const { themeVibe, reducedMotion } = useSettings();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const lastFrameRef = useRef<number>(0);
    const isDark = theme === "dark";
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    // ── Get palette for current theme+mode ──────────────────────────────────
    const getPalette = useCallback((): AuroraPalette => {
        const vibeKey = themeVibe in AURORA_PALETTES ? themeVibe : "midnight";
        return isDark
            ? AURORA_PALETTES[vibeKey].dark
            : AURORA_PALETTES[vibeKey].light;
    }, [themeVibe, isDark]);

    // ── Draw one frame ────────────────────────────────────────────────────────
    const drawFrame = useCallback((canvas: HTMLCanvasElement, t: number) => {
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const palette = getPalette();

        // Clear with very slight trail (creates soft motion smear like real aurora)
        ctx.clearRect(0, 0, W, H);

        // Fill background with near-transparent version of bg color
        // We use 'source-over' for bands and 'screen' for glow overlap
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = isDark ? "rgba(0,0,0,0.0)" : "rgba(255,255,255,0.0)";
        ctx.fillRect(0, 0, W, H);

        // Use screen blending for all aurora bands — this creates
        // natural brightness where bands overlap, just like real light
        ctx.globalCompositeOperation = "screen";

        // Draw each aurora band
        AURORA_BANDS.forEach((band) => {
            const x = (band.baseX + Math.sin(t * band.speedX + band.phaseX) * band.amplitudeX) * W;
            const y = (band.baseY + Math.sin(t * band.speedY + band.phaseY) * band.amplitudeY) * H;
            const rx = (band.width / 2) * W;
            const ry = (band.height / 2) * H;
            const color = palette[band.colorIndex];

            // Draw an elliptical gradient (wide, short — like a curtain of light)
            // We use a scaled context to draw an ellipse as a circle
            ctx.save();
            ctx.scale(1, ry / rx); // squash vertically to get ellipse
            const grad = ctx.createRadialGradient(
                x, y * (rx / ry),    // center (compensate for scale)
                0,
                x, y * (rx / ry),
                rx
            );
            // Color at center, transparent at edge — pure glow look
            grad.addColorStop(0,   color);
            grad.addColorStop(0.4, color.replace(/[\d.]+\)$/, (match) => {
                // Reduce alpha by 50% at 40% radius
                const alpha = parseFloat(match);
                return `${(alpha * 0.5).toFixed(2)})`;
            }));
            grad.addColorStop(1,   color.replace(/[\d.]+\)$/, "0)"));

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y * (rx / ry), rx, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Restore to normal compositing
        ctx.globalCompositeOperation = "source-over";

        // Add a very subtle star layer (upper 40% of canvas, dark mode only)
        if (isDark) {
            // Stars are seeded deterministically — they don't animate
            // Use canvas width as seed to regenerate only on resize
            ctx.globalAlpha = 0.4;
            const starCount = Math.floor(W * H / 6000); // ~density
            // Use a simple LCG pseudorandom with fixed seed for stable stars
            let seed = W * 31337 + H * 1337;
            const rand = () => {
                seed = (seed * 1664525 + 1013904223) & 0xffffffff;
                return (seed >>> 0) / 0xffffffff;
            };
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            for (let i = 0; i < starCount; i++) {
                const sx = rand() * W;
                const sy = rand() * H * 0.5; // only upper half
                const sr = rand() * 0.8 + 0.2;
                // Subtle twinkle: vary alpha slightly with time
                const twinkle = 0.5 + 0.5 * Math.sin(t * (0.5 + rand() * 1.5) + rand() * 6.28);
                ctx.globalAlpha = twinkle * 0.35;
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Ground fade — very bottom of canvas fades to near-black/near-white
        // This grounds the aurora visually (real northern lights have a dark horizon)
        ctx.globalCompositeOperation = "source-over";
        const groundGrad = ctx.createLinearGradient(0, H * 0.75, 0, H);
        if (isDark) {
            groundGrad.addColorStop(0, "rgba(0,0,0,0)");
            groundGrad.addColorStop(1, "rgba(0,0,0,0.85)");
        } else {
            groundGrad.addColorStop(0, "rgba(255,255,255,0)");
            groundGrad.addColorStop(1, "rgba(255,255,255,0.70)");
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 0, W, H);

    }, [getPalette, isDark]);

    // ── Static snapshot (for reducedMotion) ───────────────────────────────────
    const drawStatic = useCallback((canvas: HTMLCanvasElement) => {
        drawFrame(canvas, 0); // Draw a single frozen frame at t=0
    }, [drawFrame]);

    // ── Animation loop ────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            if (!canvas.parentElement) return;
            const rect = canvas.parentElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width  = rect.width  * Math.min(window.devicePixelRatio, 2);
                canvas.height = rect.height * Math.min(window.devicePixelRatio, 2);
                canvas.style.width  = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                // Rescale context for device pixel ratio
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.scale(
                        Math.min(window.devicePixelRatio, 2),
                        Math.min(window.devicePixelRatio, 2)
                    );
                }
                if (reducedMotion) drawStatic(canvas);
            }
        });

        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

        if (reducedMotion) {
            // One static frame and done
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect && rect.width > 0) {
                canvas.width  = rect.width;
                canvas.height = rect.height;
                drawStatic(canvas);
            }
            return () => resizeObserver.disconnect();
        }

        // Animate
        const animate = (timestamp: number) => {
            const elapsed = timestamp - lastFrameRef.current;
            if (elapsed >= FRAME_INTERVAL) {
                timeRef.current += elapsed / 1000; // time in seconds
                lastFrameRef.current = timestamp - (elapsed % FRAME_INTERVAL);
                drawFrame(canvas, timeRef.current);
            }
            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            resizeObserver.disconnect();
        };
    }, [drawFrame, drawStatic, reducedMotion, FRAME_INTERVAL]);

    // ── Build CSS filter string from WallpaperFilters prop ───────────────────
    const filterString = filters ? [
        `brightness(${(filters.brightness ?? 1) * 100}%)`,
        `contrast(${(filters.contrast ?? 1) * 100}%)`,
        `saturate(${(filters.saturation ?? 1) * 100}%)`,
        filters.blur > 0 ? `blur(${filters.blur}px)` : "",
        filters.grayscale > 0 ? `grayscale(${filters.grayscale * 100}%)` : "",
        filters.sepia > 0 ? `sepia(${filters.sepia * 100}%)` : "",
        filters.hueRotate !== 0 ? `hue-rotate(${filters.hueRotate}deg)` : "",
    ].filter(Boolean).join(" ") : undefined;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                borderRadius,
                pointerEvents: "none",
                zIndex: 0,
                filter: filterString,
                opacity: dimness,
                // GPU composite hint
                willChange: reducedMotion ? "auto" : "transform",
            }}
        />
    );
}
