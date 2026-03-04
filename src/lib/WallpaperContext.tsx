"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { get, set } from "idb-keyval";

export type WallpaperType = "image" | "video";

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

    // Dual Preview Architecture
    timerFilters: WallpaperFilters;
    timerCrop: WallpaperCrop;
    zenFilters: WallpaperFilters;
    zenCrop: WallpaperCrop;

    // Legacy support (to be migrated on load)
    filters?: WallpaperFilters;
    crop?: WallpaperCrop;
}

interface WallpaperContextType {
    wallpaper: WallpaperState | null;
    setWallpaper: (ws: WallpaperState | null) => void;
    updateWallpaperFilters: (mode: "timer" | "zen", filters: Partial<WallpaperFilters>) => void;
    updateWallpaperCrop: (mode: "timer" | "zen", crop: Partial<WallpaperCrop>) => void;
    isLoaded: boolean;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

const IDB_KEY = "prime_wallpaper_state_v5_dual"; // Force refresh for dual preview schema

const DEFAULT_FILTERS: WallpaperFilters = {
    blur: 0,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    saturation: 1,
    sepia: 0,
};

const DEFAULT_CROP: WallpaperCrop = {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0
};

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
    const [wallpaper, setWallpaperState] = useState<WallpaperState | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        get<WallpaperState>(IDB_KEY).then((data) => {
            if (data) {
                setWallpaperState(data);
            }
            setIsLoaded(true);
        }).catch((err) => {
            console.error("Failed to load wallpaper state from IndexedDB", err);
            setIsLoaded(true);
        });
    }, []);

    const setWallpaper = useCallback((ws: Partial<WallpaperState> | null) => {
        setWallpaperState(prev => {
            if (!ws) {
                set(IDB_KEY, null).catch(err => console.error("Failed to clear wallpaper from IDB:", err));
                return null;
            }

            // Migration & Default Population for Dual Preview
            const legacyFilters = ws.filters || { ...DEFAULT_FILTERS };
            const legacyCrop = ws.crop || { ...DEFAULT_CROP };

            const fullState: WallpaperState = {
                id: ws.id as string,
                type: ws.type as WallpaperType,
                src: ws.src as string,
                preview: ws.preview,
                poster: ws.poster,
                thumbnail: ws.thumbnail,
                timerFilters: ws.timerFilters || { ...legacyFilters },
                timerCrop: ws.timerCrop || { ...legacyCrop },
                zenFilters: ws.zenFilters || { ...legacyFilters },
                zenCrop: ws.zenCrop || { ...legacyCrop },
            };

            if (JSON.stringify(prev) === JSON.stringify(fullState)) return prev;

            set(IDB_KEY, fullState).catch(err => console.error("Failed to save wallpaper to IDB:", err));
            return fullState;
        });
    }, []);

    const updateWallpaperFilters = useCallback((mode: "timer" | "zen", filtersUpdates: Partial<WallpaperFilters>) => {
        setWallpaperState(prev => {
            if (!prev) return prev;
            const targetKey = mode === "zen" ? "zenFilters" : "timerFilters";
            const next = { ...prev, [targetKey]: { ...prev[targetKey], ...filtersUpdates } };
            set(IDB_KEY, next).catch(console.error);
            return next;
        });
    }, []);

    const updateWallpaperCrop = useCallback((mode: "timer" | "zen", cropUpdates: Partial<WallpaperCrop>) => {
        setWallpaperState(prev => {
            if (!prev) return prev;
            const targetKey = mode === "zen" ? "zenCrop" : "timerCrop";
            const next = { ...prev, [targetKey]: { ...prev[targetKey], ...cropUpdates } };
            set(IDB_KEY, next).catch(console.error);
            return next;
        });
    }, []);

    return (
        <WallpaperContext.Provider value={{
            wallpaper,
            setWallpaper,
            updateWallpaperFilters,
            updateWallpaperCrop,
            isLoaded
        }}>
            {children}
        </WallpaperContext.Provider>
    );
}

export function useWallpaper() {
    const context = useContext(WallpaperContext);
    if (context === undefined) {
        throw new Error("useWallpaper must be used within a WallpaperProvider");
    }
    return context;
}
