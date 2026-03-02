"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Image as ImageIcon } from "lucide-react";
import { WallpaperGallery } from "./WallpaperGallery";
import { WallpaperEditor } from "./WallpaperEditor";
import { WallpaperState, useWallpaper } from "@/lib/WallpaperContext";

const DUMMY_WALLPAPERS: WallpaperState[] = [
    {
        id: "img_01",
        type: "image",
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000",
        filters: {},
        crop: { scale: 1, x: 0, y: 0 },
        applyTo: ["zen", "timer"]
    },
    {
        id: "img_02",
        type: "image",
        src: "https://images.unsplash.com/photo-1444080748397-f40f0661c01a?auto=format&fit=crop&q=80&w=1000",
        filters: {},
        crop: { scale: 1, x: 0, y: 0 },
        applyTo: ["zen", "timer"]
    },
    {
        id: "vid_01",
        type: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster: "https://images.unsplash.com/photo-1490750967868-88cb44cb2720?auto=format&fit=crop&q=80&w=1000",
        filters: {},
        crop: { scale: 1, x: 0, y: 0 },
        applyTo: ["zen", "timer"]
    }
];

export function WallpaperManagerBtn({ className, children }: { className?: string; children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"gallery" | "editor">("gallery");
    const { setWallpaper, wallpaper: currentWallpaper } = useWallpaper();

    const handleSelectFromGallery = (w: WallpaperState) => {
        setWallpaper(w);
        setView("editor");
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    className={className || "flex items-center justify-center w-12 h-12 max-md:landscape:w-10 max-md:landscape:h-10 sm:w-14 sm:h-14 rounded-full border transition-all hover:scale-110 border-black/10 text-black/40 hover:text-black hover:border-black/30 dark:border-white/10 dark:text-white/40 dark:hover:text-white dark:hover:border-white/30"}
                    title="Wallpapers"
                >
                    {children || (
                        <>
                            <ImageIcon className={className ? "mr-2 w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"} />
                            {className ? "Change Wallpaper" : null}
                        </>
                    )}
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl h-[90vh] bg-background border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl p-6 z-[100000] flex flex-col focus:outline-none overflow-hidden">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <Dialog.Title className="text-2xl font-bold tracking-tight">
                            {view === "gallery" ? "Wallpaper Gallery" : "Edit Wallpaper"}
                        </Dialog.Title>
                        <div className="flex items-center gap-4">
                            {view === "editor" && (
                                <button
                                    onClick={() => setView("gallery")}
                                    className="text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    &larr; Back to Gallery
                                </button>
                            )}
                            <Dialog.Close className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" />
                            </Dialog.Close>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {view === "gallery" && (
                            <WallpaperGallery
                                wallpapers={DUMMY_WALLPAPERS}
                                onSelect={handleSelectFromGallery}
                            />
                        )}
                        {view === "editor" && currentWallpaper && (
                            <WallpaperEditor
                                wallpaper={currentWallpaper}
                                onClose={() => setOpen(false)}
                            />
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
