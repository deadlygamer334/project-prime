"use client";

import React, { useState, useCallback, useMemo } from "react";
import GalleryTile from "./GalleryTile";
import { WallpaperState, useWallpaper } from "@/lib/WallpaperContext";
import { Search } from "lucide-react";

interface WallpaperGalleryProps {
    wallpapers: WallpaperState[];
    onSelect: (w: WallpaperState) => void;
}

export function WallpaperGallery({ wallpapers, onSelect }: WallpaperGalleryProps) {
    const { wallpaper: currentWallpaper } = useWallpaper();
    const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // The active video preview logic ensures ONLY ONE video can preview at a time in the gallery
    const handleVideoPreviewRequest = useCallback((id: string | null) => {
        setActivePreviewId(id);
    }, []);

    const filteredWallpapers = useMemo(() => {
        return wallpapers.filter(w => {
            if (filterType !== "all" && w.type !== filterType) return false;
            // Add search filtering if we have tags or names. For now, since schema only has ID, we filter by ID
            if (searchQuery && !w.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [wallpapers, filterType, searchQuery]);

    return (
        <div className="flex flex-col w-full h-full">
            {/* Gallery Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex bg-black/20 dark:bg-white/10 p-1 rounded-full w-full sm:w-auto">
                    {(["all", "image", "video"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`flex-1 sm:flex-none px-6 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${filterType === t ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-foreground/30"
                    />
                </div>
            </div>

            {/* Virtualized Grid Container */}
            <div className="overflow-y-auto w-full h-full pr-2 custom-scrollbar pb-32">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredWallpapers.map(w => (
                        <GalleryTile
                            key={w.id}
                            wallpaper={w}
                            isSelected={currentWallpaper?.id === w.id}
                            onSelect={onSelect}
                            onVideoPreviewRequest={handleVideoPreviewRequest}
                            activePreviewId={activePreviewId}
                        />
                    ))}

                    {filteredWallpapers.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-50">
                            No wallpapers found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

