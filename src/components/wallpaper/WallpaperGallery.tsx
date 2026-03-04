"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { useInView } from "react-intersection-observer";
import wallpapersDataRaw from "@/../data/wallpapers.json";
import { WallpaperState, useWallpaper } from "@/lib/WallpaperContext";
import { WallpaperEditor } from "./WallpaperEditor";
import { Settings2 } from "lucide-react";

const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2ZmZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+PC9zdmc+";

const BATCH_SIZE = 40;

export function WallpaperGallery() {
    const { wallpaper: currentWallpaper, setWallpaper } = useWallpaper();
    const [filter, setFilter] = useState<"all" | "image" | "video">("all");
    const [isEditing, setIsEditing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const { ref, inView } = useInView({
        rootMargin: "400px",
        triggerOnce: false,
    });

    // Reset pagination when filter changes
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [filter]);

    // Ensure wallpapers match the local state schema
    const wallpapers = useMemo(() => {
        return (wallpapersDataRaw as any[]).map(w => ({
            id: w.id,
            type: w.type as "image" | "video",
            src: w.full,
            preview: w.preview,
            poster: w.poster,
            thumbnail: w.thumb
        })) as WallpaperState[];
    }, []);

    const filtered = useMemo(() => {
        return wallpapers.filter(w => filter === "all" || w.type === filter);
    }, [wallpapers, filter]);

    const visibleWallpapers = filtered.slice(0, visibleCount);

    useEffect(() => {
        if (inView && visibleCount < filtered.length) {
            setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filtered.length));
        }
    }, [inView, filtered.length, visibleCount]);

    if (isEditing && currentWallpaper) {
        return (
            <WallpaperEditor
                wallpaper={currentWallpaper}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            {/* Filter Toolbar */}
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full w-max mb-6">
                {(["all", "image", "video"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-6 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${filter === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                    >
                        {t}
                    </button>
                ))}
                <div className="flex items-center ml-4 px-2 text-xs font-semibold text-foreground/50">
                    {filtered.length} items
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar content-start">
                {visibleWallpapers.map((w) => {
                    const isSelected = currentWallpaper?.id === w.id;
                    return (
                        <div key={w.id} className="w-full aspect-video min-h-[100px] relative rounded-xl overflow-hidden shadow-sm group border-2 bg-black/5 dark:bg-white/5 transition-all hover:scale-105"
                            style={{ borderColor: isSelected ? 'hsl(var(--primary))' : 'transparent' }}>
                            <div
                                onClick={() => setWallpaper(w)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
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
                                    alt={`Wallpaper ${w.id}`}
                                    loading="lazy"
                                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                    className="w-full h-full object-cover pointer-events-none"
                                />

                                {/* Type Badge */}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium pointer-events-none">
                                    {w.type}
                                </div>

                                {isSelected && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 pointer-events-none">
                                        <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditing(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setIsEditing(true);
                                                }
                                            }}
                                            className="pointer-events-auto flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                        >
                                            <Settings2 className="w-3.5 h-3.5" /> Adjust
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Infinite Scroll Trigger */}
                {visibleCount < filtered.length && (
                    <div ref={ref} className="col-span-full h-20 flex items-center justify-center opacity-50">
                        <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-50">
                        No wallpapers found.
                    </div>
                )}
            </div>
        </div>
    );
}
