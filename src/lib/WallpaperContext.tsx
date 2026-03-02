"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { get, set } from "idb-keyval";

export type WallpaperType = "image" | "video";

export interface WallpaperFilters {
    brightness?: number; // e.g., 0.5 - 1.5
    contrast?: number;
    saturation?: number;
    hueRotate?: number; // 0-360
    rgbTint?: string; // e.g., rgba(0,0,0,0.5)
    vignette?: number;
    blur?: number;
}

export interface WallpaperCrop {
    scale: number;
    x: number;
    y: number;
    rotate?: number;
}

export interface WallpaperState {
    id: string;
    type: WallpaperType;
    src: string; // URL
    poster?: string; // For videos
    thumbnail?: string; // Small preview
    filters: WallpaperFilters;
    crop: WallpaperCrop;
    applyTo: Array<"zen" | "timer">;
    focusVariant?: { filters?: WallpaperFilters };
    breakVariant?: { filters?: WallpaperFilters };
}

interface WallpaperContextType {
    wallpaper: WallpaperState | null;
    setWallpaper: (ws: WallpaperState | null) => void;
    updateWallpaperFilters: (filters: Partial<WallpaperFilters>) => void;
    updateWallpaperCrop: (crop: Partial<WallpaperCrop>) => void;
    isLoaded: boolean;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

const IDB_KEY = "prime_wallpaper_state";

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

    const setWallpaper = useCallback((ws: WallpaperState | null) => {
        setWallpaperState(prev => {
            // Avoid redundant sets
            if (JSON.stringify(prev) === JSON.stringify(ws)) return prev;

            if (ws) {
                set(IDB_KEY, ws).catch(err => console.error("Failed to save wallpaper to IDB:", err));
            } else {
                set(IDB_KEY, null).catch(err => console.error("Failed to clear wallpaper from IDB:", err));
            }
            return ws;
        });
    }, []);

    const updateWallpaperFilters = useCallback((filters: Partial<WallpaperFilters>) => {
        setWallpaperState(prev => {
            if (!prev) return prev;
            // Guard against redundant identity changes if filters are same
            const newFilters = { ...prev.filters, ...filters };
            if (JSON.stringify(prev.filters) === JSON.stringify(newFilters)) return prev;

            const updated = { ...prev, filters: newFilters };
            set(IDB_KEY, updated).catch(console.error);
            return updated;
        });
    }, []);

    const updateWallpaperCrop = useCallback((crop: Partial<WallpaperCrop>) => {
        setWallpaperState(prev => {
            if (!prev) return prev;
            const newCrop = { ...prev.crop, ...crop };
            if (JSON.stringify(prev.crop) === JSON.stringify(newCrop)) return prev;

            const updated = { ...prev, crop: newCrop };
            set(IDB_KEY, updated).catch(console.error);
            return updated;
        });
    }, []);

    const value = React.useMemo(() => ({
        wallpaper,
        setWallpaper,
        updateWallpaperFilters,
        updateWallpaperCrop,
        isLoaded
    }), [wallpaper, setWallpaper, updateWallpaperFilters, updateWallpaperCrop, isLoaded]);

    return (
        <WallpaperContext.Provider value={value}>
            {children}
        </WallpaperContext.Provider>
    );
}

export function useWallpaper() {
    const context = useContext(WallpaperContext);
    if (!context) {
        throw new Error("useWallpaper must be used within WallpaperProvider");
    }
    return context;
}
