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

export type RenderContext = "gallery-preview" | "panel" | "zen";

export interface LiveWallpaperRendererProps {
    pattern?: string;
    colorTheme?: string;
    palette?: [string, string, string];
    filters?: WallpaperFilters;
    borderRadius?: string;
    reducedMotion?: boolean;
    /** Rendering context — controls DPR cap and default FPS limit */
    context?: RenderContext;
    /** Override maximum frames-per-second (otherwise derived from context) */
    maxFps?: number;
}

/** DPR caps by rendering context */
function getDprCap(context: RenderContext): number {
    switch (context) {
        case "gallery-preview": return 1;
        case "panel": return 1.5;
        case "zen": return 1;
        default: return 1.5;
    }
}

/** Default FPS limits by rendering context */
function getDefaultMaxFps(context: RenderContext): number {
    switch (context) {
        case "gallery-preview": return 15;
        case "panel": return 20;
        case "zen": return 24;
        default: return 20;
    }
}

export function LiveWallpaperRenderer({
    pattern = "aurora-curtains",
    colorTheme = "Violet",
    palette: propPalette,
    filters,
    borderRadius = "0",
    reducedMotion,
    context = "panel",
    maxFps: propMaxFps,
}: LiveWallpaperRendererProps) {
    const palette = useMemo(() => {
        return propPalette ?? getColorThemePalette(colorTheme);
    }, [propPalette, colorTheme]);

    const dprCap = getDprCap(context);
    const maxFps = propMaxFps ?? getDefaultMaxFps(context);

    const normPattern = (pattern || "aurora-curtains").toLowerCase().replace(/^live-/, "");

    const commonProps = {
        palette,
        filters,
        borderRadius,
        reducedMotion,
        dprCap,
        maxFps,
        context,
    } as const;

    switch (normPattern) {
        case "rings":
        case "pulse-rings":
            return <PulseRingsRenderer {...commonProps} />;
        case "nebula":
        case "nebula-drift":
            return <NebulaDriftRenderer {...commonProps} />;
        case "lava":
        case "lava-flow":
            return <LavaFlowRenderer {...commonProps} />;
        case "warp":
        case "star-warp":
            return <StarWarpRenderer {...commonProps} />;
        case "mesh":
        case "mesh-wave":
            return <MeshWaveRenderer {...commonProps} />;
        case "rain":
        case "light-rain":
            return <LightRainRenderer {...commonProps} />;
        case "aurora":
        case "aurora-curtains":
        default:
            return <AuroraWallpaperRenderer {...commonProps} />;
    }
}

export default LiveWallpaperRenderer;
