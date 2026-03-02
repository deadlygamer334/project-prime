"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { WallpaperState } from "@/lib/WallpaperContext";
import { Play } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface GalleryTileProps {
    wallpaper: WallpaperState;
    isSelected: boolean;
    onSelect: (w: WallpaperState) => void;
    onVideoPreviewRequest: (id: string | null) => void;
    activePreviewId: string | null;
}

const GalleryTile = memo(function GalleryTile({
    wallpaper,
    isSelected,
    onSelect,
    onVideoPreviewRequest,
    activePreviewId
}: GalleryTileProps) {
    const tileRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { reducedMotion } = useSettings();
    const isVideo = wallpaper.type === "video";

    // Lazy Load with IntersectionObserver
    useEffect(() => {
        const el = tileRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    // To aggressively save memory for 1000+ items, we can unload images when far out of view
                    // But for simple lazy loading, we just set true once. The prompt asks for "Virtualization everywhere"
                    setIsVisible(false);
                }
            },
            {
                rootMargin: "400px" // Load items 400px before they appear
            }
        );

        observer.observe(el);
        return () => observer.unobserve(el);
    }, []);

    const isActivePreview = activePreviewId === wallpaper.id;

    const handleMouseEnter = () => {
        if (isVideo && !reducedMotion) {
            onVideoPreviewRequest(wallpaper.id);
        }
    };

    const handleMouseLeave = () => {
        if (isActivePreview) {
            onVideoPreviewRequest(null);
        }
    };

    // Construct optimized Cloudinary URL for thumbnail
    // Assuming src is a direct Cloudinary URL, we can inject transforms if needed.
    // For now, use the provided thumbnail or poster, or fallback to src
    const thumbSrc = wallpaper.thumbnail || wallpaper.poster || wallpaper.src;

    return (
        <div
            ref={tileRef}
            onClick={() => onSelect(wallpaper)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                relative aspect-video rounded-xl overflow-hidden cursor-pointer
                transition-transform duration-300 ease-out will-change-transform group
                ${isSelected ? "ring-2 ring-[var(--color-button)] scale-[0.98]" : "hover:scale-105 hover:shadow-lg hover:z-10"}
                bg-white/5
            `}
        >
            {!isVisible ? (
                <div className="absolute inset-0 animate-pulse bg-white/10" />
            ) : (
                <>
                    <img
                        src={thumbSrc}
                        alt="Wallpaper Thumbnail"
                        loading="lazy"
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActivePreview ? 'opacity-0' : 'opacity-100'}`}
                    />

                    {isVideo && (
                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md">
                            <Play fill="white" className="w-3 h-3 text-white" />
                        </div>
                    )}

                    {isVideo && isActivePreview && !reducedMotion && (
                        <video
                            src={wallpaper.src}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Selection Overlay */}
                    {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                                Active
                            </div>
                        </div>
                    )}

                    {/* Hover Select Action */}
                    {!isSelected && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                Select Wallpaper
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export default GalleryTile;
