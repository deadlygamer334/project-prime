"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Check, Search, Settings2, X } from "lucide-react";
import { useInView } from "react-intersection-observer";
import wallpapersDataRaw from "@/../data/wallpapers.json";
import {
    WallpaperState,
    useWallpaper,
    isLiveWallpaper,
} from "@/lib/WallpaperContext";
import { LIVE_PATTERNS, COLOR_THEME_LIST } from "@/lib/wallpaperThemes";
import { WallpaperEditor } from "./WallpaperEditor";
import { LiveWallpaperRenderer } from "./LiveWallpaperRenderer";

const fallbackImage =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2ZmZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+PC9zdmc+";

const BATCH_SIZE = 40;

interface NumberedWallpaper extends WallpaperState {
    number: number;
}

export function WallpaperGallery() {
    const {
        wallpaper: currentWallpaper,
        setWallpaper,
        setLiveWallpaperPattern,
        setLiveWallpaperColorTheme,
    } = useWallpaper();

    const [filter, setFilter] = useState<"all" | "image" | "video">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [galleryColorTheme, setGalleryColorTheme] = useState<string>(
        currentWallpaper?.colorTheme || "Violet"
    );

    const { ref, inView } = useInView({
        rootMargin: "400px",
        triggerOnce: false,
    });

    const isCurrentLive = isLiveWallpaper(currentWallpaper);
    const activePatternId = isCurrentLive ? (currentWallpaper?.livePattern || "aurora") : null;
    const effectiveColorTheme = currentWallpaper?.colorTheme || galleryColorTheme || "Violet";

    // Keep galleryColorTheme synced if current live wallpaper has a colorTheme
    useEffect(() => {
        if (currentWallpaper?.colorTheme) {
            setGalleryColorTheme(currentWallpaper.colorTheme);
        }
    }, [currentWallpaper?.colorTheme]);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [filter, searchQuery]);

    // Ensure wallpapers match the local state schema and have a sequence number
    const wallpapers = useMemo(() => {
        return (wallpapersDataRaw as any[]).map((w, index) => ({
            id: w.id,
            type: w.type as "image" | "video",
            src: w.full,
            preview: w.preview,
            poster: w.poster,
            thumbnail: w.thumb,
            number: index + 1,
        })) as NumberedWallpaper[];
    }, []);

    const filtered = useMemo(() => {
        const baseFiltered = wallpapers.filter((w) => {
            const matchesType = filter === "all" || w.type === filter;
            const matchesSearch =
                searchQuery.trim() === "" ||
                w.number.toString() === searchQuery.trim() ||
                w.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });

        if (!currentWallpaper) return baseFiltered;

        // Move current wallpaper to top if it's in the filtered list
        const currentIndex = baseFiltered.findIndex((w) => w.id === currentWallpaper.id);
        if (currentIndex > -1) {
            const result = [...baseFiltered];
            const [current] = result.splice(currentIndex, 1);
            result.unshift(current);
            return result;
        }

        return baseFiltered;
    }, [wallpapers, filter, searchQuery, currentWallpaper?.id]);

    const visibleWallpapers = filtered.slice(0, visibleCount);

    useEffect(() => {
        if (inView && visibleCount < filtered.length) {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length));
        }
    }, [inView, filtered.length, visibleCount]);

    // If editor was opened for a live wallpaper somehow, prevent it
    if (isEditing && currentWallpaper && !isLiveWallpaper(currentWallpaper)) {
        return (
            <WallpaperEditor
                wallpaper={currentWallpaper}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {/* ── Live Backgrounds ─────────────────── */}
            <div className="mb-6 shrink-0 bg-muted/20 border border-border/60 rounded-3xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        Live Backgrounds
                    </p>
                    {isCurrentLive && (
                        <button
                            type="button"
                            onClick={() => setWallpaper(null)}
                            className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors"
                        >
                            Clear Wallpaper
                        </button>
                    )}
                </div>

                {/* ROW 1: Pattern selection cards */}
                <div className="flex gap-3 overflow-x-auto pb-3 pt-1 hide-scrollbar">
                    {LIVE_PATTERNS.map((p) => {
                        const isActive = isCurrentLive && activePatternId === p.id;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    if (isActive) {
                                        setWallpaper(null);
                                    } else {
                                        setLiveWallpaperPattern(p.id);
                                    }
                                }}
                                className={`
                                    relative w-[180px] shrink-0 overflow-hidden rounded-2xl
                                    border-2 transition-all duration-200 aspect-video
                                    hover:scale-[1.03] active:scale-[0.98]
                                    focus:outline-none focus:ring-2 focus:ring-primary/50 text-left
                                    ${isActive
                                        ? "border-primary shadow-[0_0_18px_rgba(167,139,250,0.35)] ring-1 ring-primary"
                                        : "border-border hover:border-primary/40"}
                                `}
                                title={`${p.label} — Live Background`}
                            >
                                {/* Live mini-preview using current effective color theme */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <LiveWallpaperRenderer
                                        pattern={p.id}
                                        colorTheme={effectiveColorTheme}
                                        borderRadius="0"
                                        context="gallery-preview"
                                    />
                                </div>

                                {/* Label overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
                                    <p className="text-white text-[11px] font-black tracking-wide leading-tight">
                                        {p.label}
                                    </p>
                                    <p className="text-white/60 text-[9px] mt-0.5 font-medium leading-none truncate">
                                        {p.desc}
                                    </p>
                                </div>

                                {/* Active checkmark */}
                                {isActive && (
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-lg">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ROW 2: Color theme selection swatches */}
                <div className="mt-2 pt-3 border-t border-border/50 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {COLOR_THEME_LIST.map((th) => {
                            const isSelectedTheme = effectiveColorTheme.toLowerCase() === th.name.toLowerCase();
                            return (
                                <button
                                    key={th.name}
                                    type="button"
                                    onClick={() => {
                                        setGalleryColorTheme(th.name);
                                        setLiveWallpaperColorTheme(th.name);
                                    }}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold
                                        transition-all duration-150 shrink-0
                                        ${isSelectedTheme
                                            ? "border-primary ring-2 ring-primary/40 bg-primary/10 text-foreground scale-105"
                                            : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30"}
                                    `}
                                    title={`Color theme: ${th.name}`}
                                >
                                    <span
                                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                        style={{
                                            background: `linear-gradient(135deg, ${th.primary} 0%, ${th.secondary} 100%)`,
                                        }}
                                    />
                                    <span>{th.label}</span>
                                    {isSelectedTheme && <Check className="w-3 h-3 text-primary ml-0.5" />}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium pl-0.5">
                        Color applies to the selected live background
                    </p>
                </div>
            </div>
            {/* ── / Live Backgrounds ─────────────────── */}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                {/* Filter Toolbar */}
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full w-max">
                    {(["all", "image", "video"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-6 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${
                                filter === t
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                        type="text"
                        placeholder="Search number or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-full text-sm outline-none transition-all placeholder:text-foreground/30"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-foreground/40" />
                        </button>
                    )}
                </div>

                <div className="flex items-center px-2 text-xs font-semibold text-foreground/50">
                    {filtered.length} items
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar content-start">
                {visibleWallpapers.map((w) => {
                    const isSelected = currentWallpaper?.id === w.id;
                    return (
                        <div
                            key={w.id}
                            className="w-full aspect-video min-h-[100px] relative rounded-xl overflow-hidden shadow-sm group border-2 bg-black/5 dark:bg-white/5 transition-all hover:scale-105"
                            style={{
                                borderColor: isSelected ? "hsl(var(--primary))" : "transparent",
                            }}
                        >
                            <div
                                onClick={() => setWallpaper(w)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setWallpaper(w);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                className="absolute inset-0 w-full h-full text-left outline-none cursor-pointer focus:ring-2 focus:ring-primary/50"
                            >
                                <img
                                    src={w.thumbnail}
                                    alt={`Wallpaper ${w.number}`}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = fallbackImage;
                                    }}
                                    className="w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                                />

                                {/* Overlay UI */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />

                                {/* Number Badge */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md border border-white/10 pointer-events-none uppercase tracking-wider flex items-center gap-1.5">
                                    {isSelected && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                                    #{w.number} {isSelected && <span className="text-[8px] opacity-70 ml-1">Current</span>}
                                </div>

                                {/* Type Badge */}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium pointer-events-none">
                                    {w.type}
                                </div>

                                {isSelected && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 pointer-events-none">
                                        <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        {/* "Adjust" button is ONLY shown for image and video wallpapers */}
                                        {(w.type === "image" || w.type === "video") && (
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditing(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setIsEditing(true);
                                                    }
                                                }}
                                                className="pointer-events-auto flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                            >
                                                <Settings2 className="w-3.5 h-3.5" /> Adjust
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Infinite Scroll Trigger */}
                {visibleCount < filtered.length && (
                    <div ref={ref} className="col-span-full h-20 flex items-center justify-center opacity-50">
                        <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-2">
                        <Search className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-lg font-medium">No wallpapers found</p>
                        <p className="text-sm">Try searching for a different number or filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WallpaperGallery;
