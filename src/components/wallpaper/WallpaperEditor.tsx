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
    const [editorMode, setEditorMode] = useState<"timer" | "zen">(isZenMode ? "zen" : "timer");

    // Local state for UI inputs (debounced to context)
    const [localFilters, setLocalFilters] = useState<WallpaperFilters>(editorMode === "zen" ? initialWallpaper.zenFilters : initialWallpaper.timerFilters);
    const [localCrop, setLocalCrop] = useState<WallpaperCrop>(editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop);

    const previewRef = useRef<HTMLDivElement>(null);
    const mediaRef = useRef<HTMLElement>(null);

    // Dynamic Aspect Sizing State
    const [previewSpace, setPreviewSpace] = useState({ width: 0, height: 0 });
    const [targetAspect, setTargetAspect] = useState(16 / 9);
    const [mediaAspect, setMediaAspect] = useState(16 / 9);

    // High-performance refs to bypass React state during scrubbing 
    const currentFilters = useRef({ ...(editorMode === "zen" ? initialWallpaper.zenFilters : initialWallpaper.timerFilters) });
    const currentTransform = useRef({
        x: (editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop).x,
        y: (editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop).y,
        scale: (editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop).scale,
        rotate: (editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop).rotate ?? 0
    });

    // Sync local to global on change (debounced to avoid stuttering)
    useEffect(() => {
        const sourceFilters = editorMode === "zen" ? initialWallpaper.zenFilters : initialWallpaper.timerFilters;
        const hasChanged = JSON.stringify(localFilters) !== JSON.stringify(sourceFilters);
        if (!hasChanged) return;

        const timer = setTimeout(() => {
            updateWallpaperFilters(editorMode, localFilters);
        }, 300); // 300ms debounce for persistence

        return () => clearTimeout(timer);
    }, [localFilters, initialWallpaper.id, updateWallpaperFilters, editorMode]);

    useEffect(() => {
        const sourceCrop = editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop;
        const hasChanged = JSON.stringify(localCrop) !== JSON.stringify(sourceCrop);
        if (!hasChanged) return;

        const timer = setTimeout(() => {
            updateWallpaperCrop(editorMode, localCrop);
        }, 300);

        return () => clearTimeout(timer);
    }, [localCrop, initialWallpaper.id, updateWallpaperCrop, editorMode]);


    // -- Drag & Zoom Logic (No React State Re-renders for performance) --
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Ensure our local values match context IF we swap wallpapers entirely OR toggle modes
    useEffect(() => {
        const sourceFilters = editorMode === "zen" ? initialWallpaper.zenFilters : initialWallpaper.timerFilters;
        const sourceCrop = editorMode === "zen" ? initialWallpaper.zenCrop : initialWallpaper.timerCrop;

        setLocalFilters(sourceFilters);
        setLocalCrop(sourceCrop);
        currentFilters.current = { ...sourceFilters };
        currentTransform.current = { x: sourceCrop.x, y: sourceCrop.y, scale: sourceCrop.scale, rotate: sourceCrop.rotate ?? 0 };

        updateMediaTransform();
        updateMediaFilter();
    }, [initialWallpaper.id, editorMode]); // Update when ID or Mode changes


    const updateMediaTransform = () => {
        if (!mediaRef.current) return;
        requestAnimationFrame(() => {
            if (!mediaRef.current) return;
            // translate(-50%, -50%) centers it. 
            // translate(x%, y%) shifts it by percentages of the VIEWPORT size if we use left/top for the anchor
            mediaRef.current.style.left = `calc(50% + ${currentTransform.current.x}%)`;
            mediaRef.current.style.top = `calc(50% + ${currentTransform.current.y}%)`;
            mediaRef.current.style.transform = `translate(-50%, -50%) scale(${currentTransform.current.scale}) rotate(${currentTransform.current.rotate}deg)`;
        });
    };

    const updateMediaFilter = () => {
        if (!mediaRef.current) return;
        requestAnimationFrame(() => {
            if (!mediaRef.current) return;
            const bf = currentFilters.current;
            const b = (bf.brightness ?? 1) * 100;
            const c = (bf.contrast ?? 1) * 100;
            const s = (bf.saturation ?? 1) * 100;
            const hr = bf.hueRotate ?? 0;
            const bl = bf.blur ?? 0;
            mediaRef.current.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${hr}deg) ${bl > 0 ? `blur(${bl}px)` : ''}`;
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
        if (!mediaRef.current || !previewRef.current) return;

        // Viewfinder Dimensions (The highlighted box)
        const vw = Number(renderedDimensions.width);
        const vh = Number(renderedDimensions.height);

        if (!vw || !vh || isNaN(vw) || isNaN(vh)) return;

        const moveX = (e.clientX - lastPos.current.x);
        const moveY = (e.clientY - lastPos.current.y);

        // Convert to percentages of the viewfinder
        const deltaX = (moveX / vw) * 100;
        const deltaY = (moveY / vh) * 100;

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

    const handleReset = () => {
        const defaultFilters = {
            brightness: 1, contrast: 1, saturation: 1, hueRotate: 0, blur: 0, rgbTint: undefined, grayscale: 0, invert: 0, sepia: 0
        };
        const defaultCrop = { scale: 1, x: 0, y: 0, rotate: 0 };

        setLocalFilters(defaultFilters);
        setLocalCrop(defaultCrop);
        currentFilters.current = defaultFilters;
        currentTransform.current = defaultCrop;

        updateMediaTransform();
        updateMediaFilter();
    };

    // Advanced High-Performance Slider Component
    const FilterSlider = React.memo(({ label, min, max, step, value, onInput, onPointerUp }: any) => {
        const [localVal, setLocalVal] = useState(value);

        // Sync internal value with prop (e.g. for Reset or external updates)
        useEffect(() => {
            setLocalVal(value);
        }, [value]);

        return (
            <div className="flex flex-col gap-2 w-full group">
                <div className="flex justify-between text-xs text-white/80 font-medium tracking-wide">
                    <span>{label}</span>
                    <span className="font-mono bg-black/30 px-2 py-0.5 rounded-md">{localVal.toFixed(2)}</span>
                </div>
                <div className="relative h-6 flex items-center">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={localVal}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setLocalVal(val);
                            onInput(val);
                        }}
                        onPointerUp={(e) => {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            onPointerUp && onPointerUp(val);
                        }}
                        className="w-full h-1.5 bg-black/40 rounded-full appearance-none outline-none accent-white hover:accent-primary focus:accent-primary transition-all cursor-pointer shadow-inner relative z-10"
                    />
                </div>
            </div>
        );
    });

    FilterSlider.displayName = "FilterSlider";

    // -- Dynamic Aspect Ratio Logic --
    useEffect(() => {
        const updateTargetAspect = () => {
            if (editorMode === "zen") {
                // Zen mode is always horizontal (fullscreen landscape)
                setTargetAspect(Math.max(window.innerWidth, window.innerHeight) / Math.min(window.innerWidth, window.innerHeight));
            } else {
                // Dashboard mode is always vertical (mobile portrait approximation)
                setTargetAspect(Math.min(window.innerWidth, window.innerHeight) / Math.max(window.innerWidth, window.innerHeight));
            }
        };
        updateTargetAspect();
        window.addEventListener("resize", updateTargetAspect);
        return () => window.removeEventListener("resize", updateTargetAspect);
    }, [editorMode]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!wrapperRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setPreviewSpace({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(wrapperRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Calculate exact rendered dimensions based on target aspect & available space
    const getPreviewDimensions = () => {
        if (!previewSpace.width || !previewSpace.height) return { width: 0, height: 0 };

        const spaceAspect = previewSpace.width / previewSpace.height;

        if (targetAspect > spaceAspect) {
            // Target is wider than available space: constrain by width
            return {
                width: previewSpace.width,
                height: previewSpace.width / targetAspect
            };
        } else {
            // Target is taller than available space: constrain by height
            return {
                width: previewSpace.height * targetAspect,
                height: previewSpace.height
            };
        }
    };

    const renderedDimensions = getPreviewDimensions();

    return (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-black/95 overflow-hidden animate-in fade-in duration-300">
            {/* Left/Main Area: Preview Wrapper */}
            <div ref={wrapperRef} className="flex-1 flex items-center justify-center p-4 md:p-8 bg-black/40 overflow-hidden relative">
                {/* 
                  Pixel-perfect calculated preview frame reproducing the exact screen target.
                */}
                <div
                    ref={previewRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                        touchAction: "none",
                    }}
                    className={`
                        w-full h-full relative flex items-center justify-center overflow-hidden
                        ${activeTab === "crop" ? "cursor-grab" : "cursor-default"}
                    `}
                >
                    {/* 1. Media Layer: Rendered first so it sits behind the overlay's mask */}
                    <div
                        className="pointer-events-none absolute z-10 flex items-center justify-center overflow-visible"
                        style={{
                            width: renderedDimensions.width,
                            height: renderedDimensions.height,
                        }}
                    >
                        {initialWallpaper.type === "video" ? (
                            <video
                                ref={mediaRef as any}
                                src={initialWallpaper.preview || initialWallpaper.src}
                                poster={initialWallpaper.poster}
                                autoPlay
                                loop
                                muted
                                playsInline
                                onLoadedMetadata={(e) => {
                                    const video = e.target as HTMLVideoElement;
                                    setMediaAspect(video.videoWidth / video.videoHeight);
                                }}
                                className="max-w-none max-h-none will-change-transform absolute"
                                style={{
                                    // Base sizing: Ensure the image "covers" the viewfinder at scale 1
                                    width: mediaAspect > targetAspect ? "auto" : "100%",
                                    height: mediaAspect > targetAspect ? "100%" : "auto",
                                    minWidth: "100%",
                                    minHeight: "100%",

                                    left: `calc(50% + ${localCrop.x}%)`,
                                    top: `calc(50% + ${localCrop.y}%)`,
                                    filter: `brightness(${(localFilters.brightness ?? 1) * 100}%) contrast(${(localFilters.contrast ?? 1) * 100}%) saturate(${(localFilters.saturation ?? 1) * 100}%) hue-rotate(${localFilters.hueRotate ?? 0}deg) ${(localFilters.blur ?? 0) > 0 ? `blur(${localFilters.blur}px)` : ''}`,
                                    transform: `translate(-50%, -50%) scale(${localCrop.scale}) rotate(${localCrop.rotate ?? 0}deg)`,
                                    transition: "filter 0.15s ease-out"
                                }}
                            />
                        ) : (
                            <img
                                ref={mediaRef as any}
                                src={initialWallpaper.preview || initialWallpaper.src}
                                alt="Wallpaper Preview"
                                onLoad={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    setMediaAspect(img.naturalWidth / img.naturalHeight);
                                }}
                                className="max-w-none max-h-none will-change-transform absolute"
                                style={{
                                    // Base sizing: Ensure the image "covers" the viewfinder at scale 1
                                    width: mediaAspect > targetAspect ? "auto" : "100%",
                                    height: mediaAspect > targetAspect ? "100%" : "auto",
                                    minWidth: "100%",
                                    minHeight: "100%",

                                    left: `calc(50% + ${localCrop.x}%)`,
                                    top: `calc(50% + ${localCrop.y}%)`,
                                    filter: `brightness(${(localFilters.brightness ?? 1) * 100}%) contrast(${(localFilters.contrast ?? 1) * 100}%) saturate(${(localFilters.saturation ?? 1) * 100}%) hue-rotate(${localFilters.hueRotate ?? 0}deg) ${(localFilters.blur ?? 0) > 0 ? `blur(${localFilters.blur}px)` : ''}`,
                                    transform: `translate(-50%, -50%) scale(${localCrop.scale}) rotate(${localCrop.rotate ?? 0}deg)`,
                                    transition: "filter 0.15s ease-out"
                                }}
                            />
                        )}

                        {localFilters.rgbTint && (
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: localFilters.rgbTint }} />
                        )}
                    </div>

                    {/* 2. Bounds Overlay: Rendered after media layer so the box-shadow darkens the overgrown image */}
                    <div
                        className="pointer-events-none absolute z-20 border border-white/30 rounded-2xl transition-all duration-300 ease-out flex items-center justify-center overflow-visible"
                        style={{
                            width: renderedDimensions.width,
                            height: renderedDimensions.height,
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)" // Darken surrounding area
                        }}
                    >
                        {/* HUD / Guides inside focal area */}
                        {activeTab === "crop" && (
                            <div className="absolute inset-0 border-[rgba(255,255,255,0.2)] border-x-[15%] border-y-[10%] grid grid-cols-2 grid-rows-2">
                                <div className="border-r border-b border-[rgba(255,255,255,0.2)]" />
                                <div className="border-b border-[rgba(255,255,255,0.2)]" />
                                <div className="border-r border-[rgba(255,255,255,0.2)]" />
                            </div>
                        )}
                    </div>

                    {/* Mode Indic */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                            {initialWallpaper.type}
                        </span>
                        {editorMode === "zen" && (
                            <span className="px-3 py-1 bg-primary rounded-full text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-sm animate-in fade-in">
                                Zen Profile
                            </span>
                        )}
                        {editorMode === "timer" && (
                            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm animate-in fade-in">
                                Dashboard Profile
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Layer: Static Control Sidebar */}
            <div className="w-full h-[50vh] md:h-full md:w-[400px] flex flex-col bg-black/60 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 shadow-2xl z-10 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex flex-col gap-4 bg-white/5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-white text-lg tracking-wide">
                            <Settings2 className="w-5 h-5 text-primary" /> Editor
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={handleReset} className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-transparent" title="Reset Current Mode">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* Dual Mode Toggle */}
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 relative">
                        {/* Animated background pill */}
                        <div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-transform duration-300 ease-out z-0 border border-white/10"
                            style={{ transform: `translateX(${editorMode === "zen" ? "100%" : "0"})`, left: "4px" }}
                        />
                        <button
                            onClick={() => setEditorMode("timer")}
                            className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase rounded-lg transition-colors z-10 ${editorMode === "timer" ? "text-white" : "text-white/50 hover:text-white/80"}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setEditorMode("zen")}
                            className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase rounded-lg transition-colors z-10 ${editorMode === "zen" ? "text-primary border-primary/20" : "text-white/50 hover:text-white/80"}`}
                        >
                            Zen Mode
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full p-2 border-b border-white/5 bg-black/20">
                    <button
                        className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${activeTab === "filters" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
                        onClick={() => setActiveTab("filters")}
                    >
                        Filters
                    </button>
                    <button
                        className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${activeTab === "crop" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
                        onClick={() => setActiveTab("crop")}
                    >
                        Layout
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7 custom-scrollbar pb-10">
                    {activeTab === "filters" && (
                        <>
                            {/* Zen Presets */}
                            <div className="mb-2">
                                <span className="text-xs text-white/50 font-bold uppercase tracking-wider mb-3 block">Zen Presets</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Deep Focus', filters: { brightness: 0.6, contrast: 1.2, saturation: 0.8, hueRotate: 0, blur: 2, rgbTint: 'rgba(0,0,0,0.5)', grayscale: 0, invert: 0, sepia: 0 } },
                                        { label: 'Night Calm', filters: { brightness: 0.5, contrast: 1.0, saturation: 0.5, hueRotate: 0, blur: 0, rgbTint: 'rgba(2, 132, 199, 0.4)', grayscale: 0, invert: 0, sepia: 0 } },
                                        { label: 'Soft Morning', filters: { brightness: 1.1, contrast: 0.9, saturation: 1.2, hueRotate: 0, blur: 0, rgbTint: 'rgba(234, 88, 12, 0.2)', grayscale: 0, invert: 0, sepia: 0 } },
                                        { label: 'Minimal Dark', filters: { brightness: 0.4, contrast: 1.5, saturation: 0, hueRotate: 0, blur: 5, rgbTint: 'rgba(0,0,0,0.7)', grayscale: 0, invert: 0, sepia: 0 } }
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => {
                                                setLocalFilters(preset.filters);
                                                currentFilters.current = preset.filters;
                                                updateMediaFilter();
                                            }}
                                            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold tracking-wide uppercase rounded-xl transition-colors border border-white/5 flex items-center justify-center backdrop-blur-md"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <FilterSlider label="Brightness" min={0} max={2} step={0.05} value={localFilters.brightness ?? 1}
                                onInput={(v: number) => { currentFilters.current.brightness = v; updateMediaFilter(); }}
                                onPointerUp={(v: number) => setLocalFilters({ ...localFilters, brightness: v })}
                            />
                            <FilterSlider label="Contrast" min={0} max={2} step={0.05} value={localFilters.contrast ?? 1}
                                onInput={(v: number) => { currentFilters.current.contrast = v; updateMediaFilter(); }}
                                onPointerUp={(v: number) => setLocalFilters({ ...localFilters, contrast: v })}
                            />
                            <FilterSlider label="Saturation" min={0} max={3} step={0.1} value={localFilters.saturation ?? 1}
                                onInput={(v: number) => { currentFilters.current.saturation = v; updateMediaFilter(); }}
                                onPointerUp={(v: number) => setLocalFilters({ ...localFilters, saturation: v })}
                            />
                            <FilterSlider label="Hue Rotate" min={0} max={360} step={1} value={localFilters.hueRotate ?? 0}
                                onInput={(v: number) => { currentFilters.current.hueRotate = v; updateMediaFilter(); }}
                                onPointerUp={(v: number) => setLocalFilters({ ...localFilters, hueRotate: v })}
                            />
                            <FilterSlider label="Soften (Blur)" min={0} max={20} step={1} value={localFilters.blur ?? 0}
                                onInput={(v: number) => { currentFilters.current.blur = v; updateMediaFilter(); }}
                                onPointerUp={(v: number) => setLocalFilters({ ...localFilters, blur: v })}
                            />

                            {/* Color Tints */}
                            <div className="mt-2">
                                <span className="text-xs text-white/50 font-bold uppercase tracking-wider mb-3 block">Color Overlay Tint</span>
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
                                            onClick={() => {
                                                const copy = { ...localFilters, rgbTint: t.val };
                                                setLocalFilters(copy);
                                                currentFilters.current = copy;
                                                // note rgbTint doesn't use the DOM CSS filter, it's a div overlay, which is ok to be react-driven since it's just tapping a button instead of scrubbing a slider.
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[11px] border transition-all font-bold tracking-wide uppercase ${localFilters.rgbTint === t.val ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "crop" && (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 text-xs text-white/70 border border-white/5 backdrop-blur-sm">
                                <div className="p-2 bg-white/10 rounded-full shrink-0">
                                    <MousePointer2 className="w-4 h-4 opacity-80" />
                                </div>
                                <p className="leading-relaxed">Drag anywhere on the preview to reposition. Scroll/Pinch to zoom.</p>
                            </div>

                            <FilterSlider
                                label="Zoom Layer"
                                min={1}
                                max={4}
                                step={0.05}
                                value={localCrop.scale}
                                onInput={(v: number) => {
                                    currentTransform.current.scale = v;
                                    updateMediaTransform();
                                }}
                                onPointerUp={(v: number) => setLocalCrop({ ...localCrop, scale: v })}
                            />

                            {/* Scale Shortcuts */}
                            <div className="flex gap-2">
                                {[1, 1.5, 2, 3].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            currentTransform.current.scale = s;
                                            setLocalCrop({ ...localCrop, scale: s });
                                            updateMediaTransform();
                                        }}
                                        className={`flex-1 py-2 text-xs rounded-xl transition-all border font-bold tracking-widest uppercase ${localCrop.scale === s ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4">
                                <span className="text-xs text-white/80 font-medium tracking-wide mb-3 block">Quick Position</span>
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
                                            className="px-3 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase rounded-xl transition-colors border border-white/5 flex items-center justify-center backdrop-blur-md"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <FilterSlider
                                    label="Rotation Degree"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={localCrop.rotate ?? 0}
                                    onInput={(v: number) => {
                                        currentTransform.current.rotate = v;
                                        updateMediaTransform();
                                    }}
                                    onPointerUp={(v: number) => setLocalCrop({ ...localCrop, rotate: v })}
                                />

                                {/* Rotate Shortcuts */}
                                <div className="flex gap-2 mt-2">
                                    {[0, 90, 180, 270].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => {
                                                currentTransform.current.rotate = r;
                                                setLocalCrop({ ...localCrop, rotate: r });
                                                updateMediaTransform();
                                            }}
                                            className={`flex-1 py-2 text-xs rounded-xl transition-all border font-bold tracking-widest uppercase ${(localCrop.rotate ?? 0) === r ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                                        >
                                            {r}°
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
