"use client";

import React, { useRef, useEffect, useState } from "react";
import { WallpaperState, WallpaperFilters, WallpaperCrop, useWallpaper } from "@/lib/WallpaperContext";
import { SlidersHorizontal, Settings2, RotateCcw, Image as ImageIcon, Video, BoxSelect, Maximize, MousePointer2 } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface WallpaperEditorProps {
    wallpaper: WallpaperState;
    onClose: () => void;
}

export function WallpaperEditor({ wallpaper: initialWallpaper, onClose }: WallpaperEditorProps) {
    const { updateWallpaperFilters, updateWallpaperCrop, setWallpaper } = useWallpaper();
    const { isZenMode } = useSettings();
    const [activeTab, setActiveTab] = useState<"crop" | "filters">("filters");

    // Local state for UI inputs (debounced to context)
    const [localFilters, setLocalFilters] = useState<WallpaperFilters>(initialWallpaper.filters);
    const [localCrop, setLocalCrop] = useState<WallpaperCrop>(initialWallpaper.crop);

    const previewRef = useRef<HTMLDivElement>(null);
    const mediaRef = useRef<HTMLElement>(null);

    // Sync local to global on change (debounced to avoid stuttering)
    useEffect(() => {
        const hasChanged = JSON.stringify(localFilters) !== JSON.stringify(initialWallpaper.filters);
        if (!hasChanged) return;

        const timer = setTimeout(() => {
            updateWallpaperFilters(localFilters);
        }, 300); // 300ms debounce for persistence

        return () => clearTimeout(timer);
    }, [localFilters, initialWallpaper.id, updateWallpaperFilters]);

    useEffect(() => {
        const hasChanged = JSON.stringify(localCrop) !== JSON.stringify(initialWallpaper.crop);
        if (!hasChanged) return;

        const timer = setTimeout(() => {
            updateWallpaperCrop(localCrop);
        }, 300);

        return () => clearTimeout(timer);
    }, [localCrop, initialWallpaper.id, updateWallpaperCrop]);


    // -- Drag & Zoom Logic (No React State Re-renders for performance) --
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const currentTransform = useRef({ x: localCrop.x, y: localCrop.y, scale: localCrop.scale, rotate: localCrop.rotate ?? 0 });

    // Ensure our local values match context IF we swap wallpapers entirely
    useEffect(() => {
        setLocalFilters(initialWallpaper.filters);
        setLocalCrop(initialWallpaper.crop);
        currentTransform.current = { x: initialWallpaper.crop.x, y: initialWallpaper.crop.y, scale: initialWallpaper.crop.scale, rotate: initialWallpaper.crop.rotate ?? 0 };
    }, [initialWallpaper.id]); // ONLY when ID changes, not when props change due to our own edits


    const updateMediaTransform = () => {
        if (!mediaRef.current) return;
        requestAnimationFrame(() => {
            if (!mediaRef.current) return;
            mediaRef.current.style.transform = `translate(${currentTransform.current.x}px, ${currentTransform.current.y}px) scale(${currentTransform.current.scale}) rotate(${currentTransform.current.rotate}deg)`;
        });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (activeTab !== "crop") return;
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };

        if (previewRef.current) {
            previewRef.current.setPointerCapture(e.pointerId);
            previewRef.current.style.cursor = "grabbing";
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || activeTab !== "crop") return;

        const deltaX = (e.clientX - lastPos.current.x) / currentTransform.current.scale;
        const deltaY = (e.clientY - lastPos.current.y) / currentTransform.current.scale;

        // Apply
        currentTransform.current.x += deltaX;
        currentTransform.current.y += deltaY;

        // Visual update only
        updateMediaTransform();

        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (previewRef.current) {
            previewRef.current.releasePointerCapture(e.pointerId);
            previewRef.current.style.cursor = "grab";
        }

        // Persist final position to react state / idb once drag ends
        setLocalCrop({ ...localCrop, x: currentTransform.current.x, y: currentTransform.current.y, rotate: currentTransform.current.rotate });
    };

    // Construct filter string for Local Preview
    const brightness = (localFilters.brightness ?? 1) * 100;
    const contrast = (localFilters.contrast ?? 1) * 100;
    const saturation = (localFilters.saturation ?? 1) * 100;
    const hueRotate = localFilters.hueRotate ?? 0;
    const blur = localFilters.blur ?? 0;
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) ${blur > 0 ? `blur(${blur}px)` : ''}`;

    const handleReset = () => {
        setLocalFilters({
            brightness: 1, contrast: 1, saturation: 1, hueRotate: 0, blur: 0, rgbTint: undefined
        });
        setLocalCrop({ scale: 1, x: 0, y: 0, rotate: 0 });
        currentTransform.current = { scale: 1, x: 0, y: 0, rotate: 0 };
        updateMediaTransform();
    };


    const FilterSlider = React.memo(({ label, min, max, step, value, onChange }: any) => (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between text-xs text-foreground/60 font-medium">
                <span>{label}</span>
                <span>{value.toFixed(2)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-black/20 dark:bg-white/10 rounded-full appearance-none outline-none accent-primary border border-black/5 dark:border-white/5 shadow-inner"
            />
        </div>
    ));

    FilterSlider.displayName = "FilterSlider";

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row bg-background rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden h-[80vh] md:h-[600px]">

            {/* Left: Preview Area */}
            <div className="relative flex-1 bg-black/5 dark:bg-black/50 overflow-hidden flex items-center justify-center p-4">
                {/* 
                  Safe Area Frame simulating Zen/Timer aspect logic depending on context.
                  We use a 16:9 container inside standard view.
                */}
                <div
                    ref={previewRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`
                        w-full h-full max-w-3xl aspect-video rounded-xl overflow-hidden relative border border-white/10
                        ${activeTab === "crop" ? "cursor-grab" : "cursor-default"}
                        shadow-[0_0_50px_rgba(0,0,0,0.5)]
                    `}
                    style={{ touchAction: "none" }}
                >
                    {/* Media Layer */}
                    {initialWallpaper.type === "video" ? (
                        <video
                            ref={mediaRef as any}
                            src={initialWallpaper.src}
                            poster={initialWallpaper.poster}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover will-change-transform"
                            style={{
                                filter: filterString,
                                transform: `scale(${localCrop.scale}) translate(${localCrop.x}px, ${localCrop.y}px)`,
                                transition: "filter 0.15s ease-out"
                            }}
                        />
                    ) : (
                        <img
                            ref={mediaRef as any}
                            src={initialWallpaper.src}
                            alt="Wallpaper Preview"
                            className="absolute inset-0 w-full h-full object-cover will-change-transform"
                            style={{
                                filter: filterString,
                                transform: `scale(${localCrop.scale}) translate(${localCrop.x}px, ${localCrop.y}px)`,
                                transition: "filter 0.15s ease-out"
                            }}
                        />
                    )}

                    {localFilters.rgbTint && (
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: localFilters.rgbTint }} />
                    )}

                    {/* HUD / Guides */}
                    {activeTab === "crop" && (
                        <div className="absolute inset-0 pointer-events-none border-[rgba(255,255,255,0.2)] border-x-[15%] border-y-[10%] grid grid-cols-2 grid-rows-2">
                            <div className="border-r border-b border-[rgba(255,255,255,0.2)]" />
                            <div className="border-b border-[rgba(255,255,255,0.2)]" />
                            <div className="border-r border-[rgba(255,255,255,0.2)]" />
                        </div>
                    )}

                    {/* Mode Indic */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                            {initialWallpaper.type}
                        </span>
                        {isZenMode && (
                            <span className="px-3 py-1 bg-primary rounded-full text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                Zen Mode Preview
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Controls Area */}
            <div className="w-full md:w-80 flex flex-col bg-card/50 backdrop-blur-2xl border-l border-black/5 dark:border-white/5">
                {/* Header */}
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-primary" /> Editor
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/70 hover:text-foreground transition-colors border border-transparent hover:border-black/10 dark:hover:border-white/10" title="Reset All">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold hover:brightness-110 shadow-lg shadow-primary/25 transition-all active:scale-95"
                        >
                            Apply Changes
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full p-2 border-b border-black/5 dark:border-white/5">
                    <button
                        className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase rounded-md transition-all ${activeTab === "filters" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5"}`}
                        onClick={() => setActiveTab("filters")}
                    >
                        Filters
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase rounded-md transition-all ${activeTab === "crop" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5"}`}
                        onClick={() => setActiveTab("crop")}
                    >
                        Layout
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {activeTab === "filters" && (
                        <>
                            {/* Zen Presets */}
                            <div className="mt-2 mb-4">
                                <span className="text-xs text-foreground/60 font-medium mb-3 block">Zen Presets</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Deep Focus', filters: { brightness: 0.6, contrast: 1.2, saturation: 0.8, hueRotate: 0, blur: 2, rgbTint: 'rgba(0,0,0,0.5)' } },
                                        { label: 'Night Calm', filters: { brightness: 0.5, contrast: 1.0, saturation: 0.5, hueRotate: 0, blur: 0, rgbTint: 'rgba(2, 132, 199, 0.4)' } },
                                        { label: 'Soft Morning', filters: { brightness: 1.1, contrast: 0.9, saturation: 1.2, hueRotate: 0, blur: 0, rgbTint: 'rgba(234, 88, 12, 0.2)' } },
                                        { label: 'Minimal Dark', filters: { brightness: 0.4, contrast: 1.5, saturation: 0, hueRotate: 0, blur: 5, rgbTint: 'rgba(0,0,0,0.7)' } }
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setLocalFilters(preset.filters)}
                                            className="px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs rounded-lg transition-colors border border-black/5 dark:border-white/5 flex items-center justify-center font-medium"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <FilterSlider label="Brightness" min={0} max={2} step={0.05} value={localFilters.brightness ?? 1} onChange={(v: number) => setLocalFilters({ ...localFilters, brightness: v })} />
                            <FilterSlider label="Contrast" min={0} max={2} step={0.05} value={localFilters.contrast ?? 1} onChange={(v: number) => setLocalFilters({ ...localFilters, contrast: v })} />
                            <FilterSlider label="Saturation" min={0} max={3} step={0.1} value={localFilters.saturation ?? 1} onChange={(v: number) => setLocalFilters({ ...localFilters, saturation: v })} />
                            <FilterSlider label="Hue Rotate" min={0} max={360} step={1} value={localFilters.hueRotate ?? 0} onChange={(v: number) => setLocalFilters({ ...localFilters, hueRotate: v })} />
                            <FilterSlider label="Soften (Blur)" min={0} max={20} step={1} value={localFilters.blur ?? 0} onChange={(v: number) => setLocalFilters({ ...localFilters, blur: v })} />

                            {/* Color Tints */}
                            <div className="mt-2">
                                <span className="text-xs text-foreground/60 font-medium mb-3 block">Color Overlay Tint</span>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'None', val: undefined },
                                        { label: 'Dark', val: 'rgba(0,0,0,0.5)' },
                                        { label: 'Warm', val: 'rgba(234, 88, 12, 0.2)' },
                                        { label: 'Cool', val: 'rgba(2, 132, 199, 0.2)' },
                                        { label: 'Forest', val: 'rgba(5, 150, 105, 0.2)' },
                                    ].map(t => (
                                        <button
                                            key={t.label}
                                            onClick={() => setLocalFilters({ ...localFilters, rgbTint: t.val })}
                                            className={`px-3 py-1 rounded-full text-[11px] border transition-all font-bold ${localFilters.rgbTint === t.val ? 'border-primary bg-primary/10 text-primary' : 'border-black/10 dark:border-white/10 text-foreground/50 hover:border-black/30 dark:hover:border-white/30'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "crop" && (
                        <>
                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex items-center gap-3 text-sm text-foreground/70 border border-black/5 dark:border-white/5">
                                <MousePointer2 className="w-5 h-5 opacity-50 shrink-0" />
                                <p>Drag the preview on the left to reposition safely.</p>
                            </div>

                            <FilterSlider
                                label="Zoom"
                                min={1}
                                max={3}
                                step={0.05}
                                value={localCrop.scale}
                                onChange={(v: number) => {
                                    setLocalCrop({ ...localCrop, scale: v });
                                    currentTransform.current.scale = v;
                                    updateMediaTransform();
                                }}
                            />

                            <div className="mt-4">
                                <span className="text-xs text-foreground/60 font-medium mb-3 block">Quick Position Presets</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Center Focus', id: 'center', x: 0, y: 0 },
                                        { label: 'Top Align', id: 'top', x: 0, y: 150 },
                                        { label: 'Bottom Align', id: 'bottom', x: 0, y: -150 }
                                    ].map(preset => (
                                        <button
                                            key={preset.id}
                                            onClick={() => {
                                                const newCrop = { scale: 1.2, x: preset.x, y: preset.y, rotate: 0 };
                                                setLocalCrop(newCrop);
                                                currentTransform.current = newCrop;
                                                updateMediaTransform();
                                            }}
                                            className="px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs rounded-lg transition-colors border border-black/5 dark:border-white/5 flex items-center justify-center font-medium"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <FilterSlider
                                    label="Rotation (Degrees)"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={localCrop.rotate ?? 0}
                                    onChange={(v: number) => {
                                        setLocalCrop({ ...localCrop, rotate: v });
                                        currentTransform.current.rotate = v;
                                        updateMediaTransform();
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
