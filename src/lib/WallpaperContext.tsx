"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { get, set } from "idb-keyval";

export type WallpaperType = "image" | "video" | "dynamic-aurora" | "dynamic-canvas";

export interface WallpaperFilters {
    blur: number;
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    invert: number;
    saturation: number;
    sepia: number;
    rgbTint?: string;
}

export interface WallpaperCrop {
    x: number;
    y: number;
    scale: number;
    rotate?: number;
}

export interface WallpaperState {
    id: string;
    type: WallpaperType;
    src: string;
    preview?: string;
    poster?: string;
    thumbnail?: string;

    // Live wallpaper configuration
    livePattern?: string;
    colorTheme?: string;

    // Dual Preview Architecture
    timerFilters: WallpaperFilters;
    timerCrop: WallpaperCrop;
    zenFilters: WallpaperFilters;
    zenCrop: WallpaperCrop;

    // Legacy support (to be migrated on load)
    filters?: WallpaperFilters;
    crop?: WallpaperCrop;
}

export function isLiveWallpaper(wallpaper: WallpaperState | null | undefined): boolean {
    if (!wallpaper) return false;
    return (
        wallpaper.type === "dynamic-aurora" ||
        wallpaper.type === "dynamic-canvas" ||
        Boolean(wallpaper.livePattern) ||
        (typeof wallpaper.src === "string" && wallpaper.src.startsWith("dynamic://"))
    );
}

export const DEFAULT_FILTERS: WallpaperFilters = {
    blur: 0,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    saturation: 1,
    sepia: 0,
};

export const DEFAULT_CROP: WallpaperCrop = {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
};

export function createLiveWallpaperState(
    pattern: string = "aurora",
    colorTheme: string = "Violet"
): WallpaperState {
    return {
        id: `live-${pattern}`,
        type: "dynamic-canvas",
        src: `dynamic://${pattern}`,
        livePattern: pattern,
        colorTheme: colorTheme,
        timerFilters: { ...DEFAULT_FILTERS },
        timerCrop: { ...DEFAULT_CROP },
        zenFilters: { ...DEFAULT_FILTERS, brightness: 0.85 },
        zenCrop: { ...DEFAULT_CROP },
    };
}

// Backward-compatible presets
export const AURORA_WALLPAPER: WallpaperState = createLiveWallpaperState("aurora", "Violet");
export const AURORA_OCEAN: WallpaperState = createLiveWallpaperState("aurora", "Ocean");
export const AURORA_FOREST: WallpaperState = createLiveWallpaperState("aurora", "Forest");
export const AURORA_SOLAR: WallpaperState = createLiveWallpaperState("aurora", "Ember");
export const AURORA_ROSE: WallpaperState = createLiveWallpaperState("aurora", "Rose");
export const AURORA_ARCTIC: WallpaperState = createLiveWallpaperState("aurora", "Arctic");

// ─── Split Context: State vs Actions ──────────────────────────────────────
// Components that only call setters (buttons) subscribe to ActionsContext only.
// Only components displaying current wallpaper subscribe to StateContext.
// This prevents setter-only components from re-rendering on every state change.

interface WallpaperStateContextType {
    wallpaper: WallpaperState | null;
    isLoaded: boolean;
}

interface WallpaperActionsContextType {
    setWallpaper: (ws: Partial<WallpaperState> | null) => void;
    setLiveWallpaperPattern: (pattern: string) => void;
    setLiveWallpaperColorTheme: (colorTheme: string) => void;
    updateWallpaperFilters: (mode: "timer" | "zen", filters: Partial<WallpaperFilters>) => void;
    updateWallpaperCrop: (mode: "timer" | "zen", crop: Partial<WallpaperCrop>) => void;
}

// Legacy combined type for backward compat with useWallpaper()
interface WallpaperContextType extends WallpaperStateContextType, WallpaperActionsContextType {}

const WallpaperStateContext = createContext<WallpaperStateContextType | undefined>(undefined);
const WallpaperActionsContext = createContext<WallpaperActionsContextType | undefined>(undefined);

const IDB_KEY = "prime_wallpaper_state_v6_live";

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
    const [wallpaper, setWallpaperState] = useState<WallpaperState | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function initializeWallpaper() {
            try {
                // 1. Try reading the v6 live wallpaper key
                const v6Data = await get<WallpaperState | null>(IDB_KEY);

                // If key exists in v6:
                if (v6Data !== undefined) {
                    if (v6Data === null) {
                        // CASE A: User has no wallpaper set
                        if (isMounted) {
                            setWallpaperState(null);
                            setIsLoaded(true);
                        }
                        return;
                    }
                    // Wallpaper exists in v6
                    const isLive = isLiveWallpaper(v6Data);
                    const state: WallpaperState = {
                        ...v6Data,
                        type: isLive ? "dynamic-canvas" : v6Data.type,
                        livePattern: v6Data.livePattern || "aurora-curtains",
                        colorTheme: v6Data.colorTheme || "Violet",
                    };
                    if (isMounted) {
                        setWallpaperState(state);
                        setIsLoaded(true);
                    }
                    return;
                }

                // 2. Fallback to migrate from v5 key (prime_wallpaper_state_v5_dual)
                const v5Data = await get<WallpaperState | null>("prime_wallpaper_state_v5_dual");

                if (v5Data !== undefined && v5Data !== null) {
                    const isLive = isLiveWallpaper(v5Data);
                    // CASE B: User had an image, video, or live wallpaper set
                    const migrated: WallpaperState = {
                        ...v5Data,
                        type: isLive ? "dynamic-canvas" : v5Data.type,
                        livePattern: v5Data.livePattern || "aurora-curtains",
                        colorTheme: v5Data.colorTheme || "Violet",
                    };
                    // Save to v6 key for future loads
                    await set(IDB_KEY, migrated).catch((err) => {
                        console.warn("Failed to persist migrated wallpaper to v6 key:", err);
                    });
                    if (isMounted) {
                        setWallpaperState(migrated);
                        setIsLoaded(true);
                    }
                    return;
                } else if (v5Data === null) {
                    // CASE A: User had explicitly cleared wallpaper in v5
                    await set(IDB_KEY, null).catch(console.error);
                    if (isMounted) {
                        setWallpaperState(null);
                        setIsLoaded(true);
                    }
                    return;
                }

                // CASE C: Neither v6 nor v5 exists (brand new user or cleared storage)
                // Initialize with wallpaper: null as clean defaults
                if (isMounted) {
                    setWallpaperState(null);
                    setIsLoaded(true);
                }
            } catch (err) {
                // Silently fall back to clean default state without throwing
                console.warn(
                    "Wallpaper IndexedDB migration failed, falling back to clean default state:",
                    err
                );
                if (isMounted) {
                    setWallpaperState(null);
                    setIsLoaded(true);
                }
            }
        }

        initializeWallpaper();

        return () => {
            isMounted = false;
        };
    }, []);

    const setWallpaper = useCallback((ws: Partial<WallpaperState> | null) => {
        setWallpaperState((prev) => {
            if (!ws) {
                set(IDB_KEY, null).catch((err) =>
                    console.error("Failed to clear wallpaper from IDB:", err)
                );
                return null;
            }

            const legacyFilters = ws.filters || { ...DEFAULT_FILTERS };
            const legacyCrop = ws.crop || { ...DEFAULT_CROP };
            const isLive =
                ws.type === "dynamic-aurora" ||
                ws.type === "dynamic-canvas" ||
                Boolean(ws.livePattern) ||
                (typeof ws.src === "string" && ws.src.startsWith("dynamic://"));

            const fullState: WallpaperState = {
                id: ws.id as string,
                type: (isLive ? "dynamic-canvas" : ws.type) as WallpaperType,
                src: ws.src as string,
                preview: ws.preview,
                poster: ws.poster,
                thumbnail: ws.thumbnail,
                livePattern: isLive ? (ws.livePattern || "aurora") : undefined,
                colorTheme: isLive ? (ws.colorTheme || prev?.colorTheme || "Violet") : undefined,
                timerFilters: ws.timerFilters || { ...legacyFilters },
                timerCrop: ws.timerCrop || { ...legacyCrop },
                zenFilters: ws.zenFilters || { ...legacyFilters },
                zenCrop: ws.zenCrop || { ...legacyCrop },
            };

            if (JSON.stringify(prev) === JSON.stringify(fullState)) return prev;

            set(IDB_KEY, fullState).catch((err) =>
                console.error("Failed to save wallpaper to IDB:", err)
            );
            return fullState;
        });
    }, []);

    const setLiveWallpaperPattern = useCallback((pattern: string) => {
        setWallpaperState((prev) => {
            const activeColor = (isLiveWallpaper(prev) && prev?.colorTheme) ? prev.colorTheme : "Violet";
            const nextState = createLiveWallpaperState(pattern, activeColor);
            set(IDB_KEY, nextState).catch(console.error);
            return nextState;
        });
    }, []);

    const setLiveWallpaperColorTheme = useCallback((colorTheme: string) => {
        setWallpaperState((prev) => {
            if (isLiveWallpaper(prev) && prev) {
                const nextState: WallpaperState = {
                    ...prev,
                    colorTheme,
                };
                set(IDB_KEY, nextState).catch(console.error);
                return nextState;
            }
            // If no live wallpaper active, activate Aurora with this color
            const nextState = createLiveWallpaperState("aurora", colorTheme);
            set(IDB_KEY, nextState).catch(console.error);
            return nextState;
        });
    }, []);

    const updateWallpaperFilters = useCallback(
        (mode: "timer" | "zen", filtersUpdates: Partial<WallpaperFilters>) => {
            setWallpaperState((prev) => {
                if (!prev) return prev;
                const targetKey = mode === "zen" ? "zenFilters" : "timerFilters";
                const next = { ...prev, [targetKey]: { ...prev[targetKey], ...filtersUpdates } };
                set(IDB_KEY, next).catch(console.error);
                return next;
            });
        },
        []
    );

    const updateWallpaperCrop = useCallback(
        (mode: "timer" | "zen", cropUpdates: Partial<WallpaperCrop>) => {
            setWallpaperState((prev) => {
                if (!prev) return prev;
                const targetKey = mode === "zen" ? "zenCrop" : "timerCrop";
                const next = { ...prev, [targetKey]: { ...prev[targetKey], ...cropUpdates } };
                set(IDB_KEY, next).catch(console.error);
                return next;
            });
        },
        []
    );

    // Stable actions object — never changes, so ActionsContext consumers never re-render
    const actions = useMemo<WallpaperActionsContextType>(() => ({
        setWallpaper,
        setLiveWallpaperPattern,
        setLiveWallpaperColorTheme,
        updateWallpaperFilters,
        updateWallpaperCrop,
    }), [setWallpaper, setLiveWallpaperPattern, setLiveWallpaperColorTheme, updateWallpaperFilters, updateWallpaperCrop]);

    const stateValue = useMemo<WallpaperStateContextType>(() => ({
        wallpaper,
        isLoaded,
    }), [wallpaper, isLoaded]);

    return (
        <WallpaperStateContext.Provider value={stateValue}>
            <WallpaperActionsContext.Provider value={actions}>
                {children}
            </WallpaperActionsContext.Provider>
        </WallpaperStateContext.Provider>
    );
}

/**
 * Combined hook — backward compatible. Returns both state and actions.
 * Use useWallpaperActions() if you only need setters (avoids re-renders on state changes).
 */
export function useWallpaper(): WallpaperContextType {
    const state = useContext(WallpaperStateContext);
    const actions = useContext(WallpaperActionsContext);
    if (state === undefined || actions === undefined) {
        throw new Error("useWallpaper must be used within a WallpaperProvider");
    }
    return { ...state, ...actions };
}

/**
 * Actions-only hook — components that only call setters (buttons, controls)
 * subscribe here to avoid re-rendering when wallpaper state changes.
 */
export function useWallpaperActions(): WallpaperActionsContextType {
    const actions = useContext(WallpaperActionsContext);
    if (actions === undefined) {
        throw new Error("useWallpaperActions must be used within a WallpaperProvider");
    }
    return actions;
}

/**
 * State-only hook — components that only read wallpaper state.
 */
export function useWallpaperState(): WallpaperStateContextType {
    const state = useContext(WallpaperStateContext);
    if (state === undefined) {
        throw new Error("useWallpaperState must be used within a WallpaperProvider");
    }
    return state;
}
