"use client";

import React, { useMemo } from "react";
import type { WallpaperFilters } from "@/lib/WallpaperContext";
import { getColorThemePalette } from "@/lib/wallpaperThemes";
import { AuroraWallpaperRenderer } from "./AuroraWallpaperRenderer";
import { PulseRingsRenderer } from "./PulseRingsRenderer";
import { NebulaDriftRenderer } from "./NebulaDriftRenderer";
import { LavaFlowRenderer } from "./LavaFlowRenderer";
import { StarWarpRenderer } from "./StarWarpRenderer";
import { MeshWaveRenderer } from "./MeshWaveRenderer";
import { LightRainRenderer } from "./LightRainRenderer";

export interface LiveWallpaperRendererProps {
    pattern?: string;
    colorTheme?: string;
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
}

export function LiveWallpaperRenderer({
    pattern = "aurora-curtains",
    colorTheme = "Violet",
    palette: propPalette,
    filters,
    borderRadius = "0",
    reducedMotion,
}: LiveWallpaperRendererProps) {
    const palette = useMemo(() => {
        return propPalette ?? getColorThemePalette(colorTheme);
    }, [propPalette, colorTheme]);

    const normPattern = (pattern || "aurora-curtains").toLowerCase().replace(/^live-/, "");

    switch (normPattern) {
        case "rings":
        case "pulse-rings":
            return (
                <PulseRingsRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "nebula":
        case "nebula-drift":
            return (
                <NebulaDriftRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "lava":
        case "lava-flow":
            return (
                <LavaFlowRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "warp":
        case "star-warp":
            return (
                <StarWarpRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "mesh":
        case "mesh-wave":
            return (
                <MeshWaveRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "rain":
        case "light-rain":
            return (
                <LightRainRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
        case "aurora":
        case "aurora-curtains":
        default:
            return (
                <AuroraWallpaperRenderer
                    palette={palette}
                    filters={filters}
                    borderRadius={borderRadius}
                    reducedMotion={reducedMotion}
                />
            );
    }
}

export default LiveWallpaperRenderer;
