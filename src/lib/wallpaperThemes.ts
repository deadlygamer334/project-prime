export interface ColorTheme {
    name: string;
    label: string;
    primary: string;
    secondary: string;
    accent: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
    Violet: {
        name: "Violet",
        label: "Violet",
        primary: "rgb(139, 92, 246)",   // deep purple
        secondary: "rgb(236, 72, 153)", // hot pink
        accent: "rgb(34, 197, 94)",     // bright green
    },
    Ocean: {
        name: "Ocean",
        label: "Ocean",
        primary: "rgb(37, 99, 235)",    // royal blue
        secondary: "rgb(6, 182, 212)",  // cyan
        accent: "rgb(20, 184, 166)",    // teal
    },
    Forest: {
        name: "Forest",
        label: "Forest",
        primary: "rgb(5, 150, 105)",    // emerald
        secondary: "rgb(132, 204, 22)", // lime green
        accent: "rgb(163, 230, 53)",    // yellow-green
    },
    Ember: {
        name: "Ember",
        label: "Ember",
        primary: "rgb(249, 115, 22)",   // orange
        secondary: "rgb(245, 158, 11)", // amber
        accent: "rgb(220, 38, 38)",     // deep red
    },
    Rose: {
        name: "Rose",
        label: "Rose",
        primary: "rgb(225, 29, 72)",    // rose red
        secondary: "rgb(217, 70, 239)", // magenta
        accent: "rgb(192, 132, 252)",   // light purple
    },
    Arctic: {
        name: "Arctic",
        label: "Arctic",
        primary: "rgb(56, 189, 248)",   // ice blue
        secondary: "rgb(203, 213, 225)",// pale silver
        accent: "rgb(248, 250, 252)",   // white
    },
    Golden: {
        name: "Golden",
        label: "Golden",
        primary: "rgb(234, 179, 8)",    // gold
        secondary: "rgb(245, 158, 11)", // warm amber
        accent: "rgb(180, 83, 9)",      // bronze
    },
    Mono: {
        name: "Mono",
        label: "Mono",
        primary: "rgb(248, 250, 252)",  // white
        secondary: "rgb(148, 163, 184)",// light grey
        accent: "rgb(100, 116, 139)",   // mid grey
    },
};

export const COLOR_THEME_LIST = Object.values(COLOR_THEMES);

export function getColorThemePalette(name?: string): [string, string, string] {
    if (!name || !(name in COLOR_THEMES)) {
        return [
            COLOR_THEMES.Violet.primary,
            COLOR_THEMES.Violet.secondary,
            COLOR_THEMES.Violet.accent,
        ];
    }
    const theme = COLOR_THEMES[name];
    return [theme.primary, theme.secondary, theme.accent];
}

/**
 * Converts rgb(...) or hex or rgba(...) string to an rgba(r, g, b, alpha) string
 */
export function toRgba(colorStr: string, alpha: number): string {
    const safeAlpha = Math.max(0, Math.min(1, alpha));
    // Match rgb(r, g, b) or rgba(r, g, b, a)
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${safeAlpha.toFixed(3)})`;
    }
    // Match #hex
    if (colorStr.startsWith("#")) {
        let hex = colorStr.replace("#", "");
        if (hex.length === 3) {
            hex = hex.split("").map((c) => c + c).join("");
        }
        const num = parseInt(hex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha.toFixed(3)})`;
    }
    return colorStr;
}

export interface LiveWallpaperPatternInfo {
    id: string;
    label: string;
    desc: string;
}

export const LIVE_PATTERNS: LiveWallpaperPatternInfo[] = [
    { id: "aurora", label: "Aurora Curtains", desc: "Flowing atmospheric curtains" },
    { id: "rings", label: "Pulse Rings", desc: "Expanding glowing halos" },
    { id: "nebula", label: "Nebula Drift", desc: "Rotating cosmic dust clouds" },
    { id: "lava", label: "Lava Flow", desc: "Slow liquid morphing blobs" },
    { id: "warp", label: "Star Warp", desc: "Meditative deep space drift" },
    { id: "mesh", label: "Mesh Wave", desc: "Undulating wireframe surface" },
    { id: "rain", label: "Light Rain", desc: "Falling beams of sunlit mist" },
];

export function getPatternLabel(id: string): string {
    const found = LIVE_PATTERNS.find((p) => p.id === id);
    return found ? found.label : "Aurora Curtains";
}

export function getCanvasBaseBackground(isDark: boolean): string {
    return isDark ? "rgb(8, 9, 13)" : "rgb(232, 234, 255)";
}
