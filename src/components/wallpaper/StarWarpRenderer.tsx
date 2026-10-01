"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";

export interface StarWarpRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

interface StarParticle {
    angle: number;
    depth: number;
    speed: number;
    colorType: 0 | 1;
    seed: number;
}

const STAR_COUNT = 200;

export function StarWarpRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
}: StarWarpRendererProps) {
    const { theme } = useTheme();
    const { reducedMotion: settingReducedMotion } = useSettings();
    const reducedMotion = propReducedMotion ?? settingReducedMotion;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const tRef = useRef<number>(0);
    const lastRef = useRef<number>(0);
    const dprRef = useRef<number>(1);
    const starsRef = useRef<StarParticle[]>([]);
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

    // Initialize stars with deterministic random spread
    useEffect(() => {
        let seed = 42819;
        const rand = () => {
            seed = ((seed * 1664525 + 1013904223) | 0) >>> 0;
            return seed / 0xffffffff;
        };

        const stars: StarParticle[] = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                angle: rand() * Math.PI * 2,
                depth: rand() * 0.98 + 0.02,
                speed: 0.018 + rand() * 0.012, // 35 to 55 seconds to travel full length
                colorType: rand() > 0.5 ? 1 : 0,
                seed: rand(),
            });
        }
        starsRef.current = stars;
    }, []);

    const draw = useCallback((canvas: HTMLCanvasElement, deltaSec: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W * 0.5;
        const cy = H * 0.5;
        const maxDist = Math.sqrt(cx * cx + cy * cy) * 1.05;
        const currentPalette = paletteRef.current;
        const currentIsDark = isDarkRef.current;

        ctx.clearRect(0, 0, W, H);

        // Base fill
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = getCanvasBaseBackground(currentIsDark);
        ctx.fillRect(0, 0, W, H);

        // Center deep-space radial gradient glow using primary color at 8% opacity
        const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist * 0.6);
        centerGlow.addColorStop(0, toRgba(currentPalette[0], currentIsDark ? 0.12 : 0.06));
        centerGlow.addColorStop(0.5, toRgba(currentPalette[1], currentIsDark ? 0.05 : 0.02));
        centerGlow.addColorStop(1, toRgba(currentPalette[0], 0));
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, W, H);

        // Stars rendering with additive blending in dark mode
        ctx.globalCompositeOperation = currentIsDark ? "lighter" : "source-over";

        const stars = starsRef.current;
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];

            if (!reducedMotion) {
                star.depth += star.speed * deltaSec;
                if (star.depth >= 1.0) {
                    star.depth = 0.01 + (star.seed * 0.04);
                    star.angle = (star.angle + 0.618) % (Math.PI * 2);
                }
            }

            // Exponential perspective depth mapping
            const dist = Math.pow(star.depth, 1.85) * maxDist;
            const sx = cx + Math.cos(star.angle) * dist;
            const sy = cy + Math.sin(star.angle) * dist;

            // Size: small near center, larger near edge
            const size = (0.5 + Math.pow(star.depth, 1.6) * 3.2) * dprRef.current;

            // Color & Alpha:
            // near center: accent color at low opacity
            // mid/far: mix of primary and secondary, brighter towards edge
            let colorStr: string;
            let alpha: number;

            if (star.depth < 0.25) {
                colorStr = currentPalette[2];
                alpha = currentIsDark ? (star.depth * 1.2 + 0.12) : (star.depth * 0.6 + 0.08);
            } else {
                colorStr = star.colorType === 0 ? currentPalette[0] : currentPalette[1];
                const edgeFade = star.depth > 0.88 ? (1.0 - star.depth) / 0.12 : 1.0;
                alpha = (currentIsDark ? 0.85 : 0.45) * Math.min(1, star.depth * 1.1) * edgeFade;
            }

            if (alpha <= 0.01) continue;

            ctx.fillStyle = toRgba(colorStr, alpha);
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
            ctx.fill();
        }

        // Ambient edge vignette
        ctx.globalCompositeOperation = "source-over";
        const vigGrad = ctx.createRadialGradient(cx, cy, maxDist * 0.35, cx, cy, maxDist);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.70 : 0.40));
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);
    }, [reducedMotion]);

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
                const deltaSec = elapsed / 1000;
                tRef.current += deltaSec;
                lastRef.current = ts - (elapsed % INTERVAL);
                draw(canvas, deltaSec);
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
            draw(canvasRef.current, 0);
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

export default StarWarpRenderer;
