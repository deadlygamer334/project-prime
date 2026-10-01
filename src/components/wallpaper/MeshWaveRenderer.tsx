"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette, toRgba, getCanvasBaseBackground } from "@/lib/wallpaperThemes";

export interface MeshWaveRendererProps {
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

const COLS = 13;
const ROWS = 9;
const WAVE_PERIOD = 10; // seconds for full wave traversal

export function MeshWaveRenderer({
    palette: passedPalette,
    filters,
    borderRadius = "0",
    reducedMotion: propReducedMotion,
}: MeshWaveRendererProps) {
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

        // Grid layout calculation
        const padX = W * 0.08;
        const padY = H * 0.12;
        const gridW = W - padX * 2;
        const gridH = H - padY * 2;

        const nodes: { x: number; y: number; waveNorm: number }[][] = [];
        const ampY = H * 0.055;
        const ampX = W * 0.015;
        const speed = (2 * Math.PI) / WAVE_PERIOD;

        for (let r = 0; r < ROWS; r++) {
            const rowNodes: { x: number; y: number; waveNorm: number }[] = [];
            const basePosY = padY + (r / (ROWS - 1)) * gridH;

            for (let c = 0; c < COLS; c++) {
                const basePosX = padX + (c / (COLS - 1)) * gridW;
                const phase = (c * 0.42 + r * 0.38) - t * speed;
                const sinVal = Math.sin(phase);
                const cosVal = Math.cos(phase * 0.85);

                const offsetY = sinVal * ampY;
                const offsetX = cosVal * ampX;
                const waveNorm = (sinVal + 1) / 2; // 0 to 1

                rowNodes.push({
                    x: basePosX + offsetX,
                    y: basePosY + offsetY,
                    waveNorm,
                });
            }
            nodes.push(rowNodes);
        }

        // Draw mesh lines
        ctx.lineWidth = 1.2 * dprRef.current;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const curr = nodes[r][c];

                // Horizontal line to (c + 1, r)
                if (c < COLS - 1) {
                    const right = nodes[r][c + 1];
                    const avgNorm = (curr.waveNorm + right.waveNorm) * 0.5;
                    const lineAlpha = (currentIsDark ? 0.15 : 0.10) + avgNorm * (currentIsDark ? 0.35 : 0.25);
                    ctx.strokeStyle = toRgba(currentPalette[1], lineAlpha);
                    ctx.beginPath();
                    ctx.moveTo(curr.x, curr.y);
                    ctx.lineTo(right.x, right.y);
                    ctx.stroke();
                }

                // Vertical line to (c, r + 1)
                if (r < ROWS - 1) {
                    const down = nodes[r + 1][c];
                    const avgNorm = (curr.waveNorm + down.waveNorm) * 0.5;
                    const lineAlpha = (currentIsDark ? 0.15 : 0.10) + avgNorm * (currentIsDark ? 0.35 : 0.25);
                    ctx.strokeStyle = toRgba(currentPalette[1], lineAlpha);
                    ctx.beginPath();
                    ctx.moveTo(curr.x, curr.y);
                    ctx.lineTo(down.x, down.y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const node = nodes[r][c];
                const isPeak = node.waveNorm > 0.80;

                // Peak flash with accent color, otherwise primary color
                let nodeColor: string;
                if (isPeak) {
                    const peakRatio = (node.waveNorm - 0.80) / 0.20;
                    nodeColor = peakRatio > 0.5 ? currentPalette[2] : currentPalette[0];
                } else {
                    nodeColor = currentPalette[0];
                }

                const nodeAlpha = (currentIsDark ? 0.35 : 0.25) + node.waveNorm * (currentIsDark ? 0.65 : 0.50);
                const radius = (1.8 + node.waveNorm * 2.6) * dprRef.current;

                ctx.fillStyle = toRgba(nodeColor, nodeAlpha);
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Peak glow halo
                if (isPeak && currentIsDark) {
                    ctx.fillStyle = toRgba(currentPalette[2], (node.waveNorm - 0.80) * 0.4);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Ambient vignette
        ctx.globalCompositeOperation = "source-over";
        const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
        vigGrad.addColorStop(0, toRgba(getCanvasBaseBackground(currentIsDark), 0));
        vigGrad.addColorStop(1, toRgba(getCanvasBaseBackground(currentIsDark), currentIsDark ? 0.75 : 0.45));
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

export default MeshWaveRenderer;
