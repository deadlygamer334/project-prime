"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface ReelModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl?: string;
    reelTitle?: string;
}

export default function ReelModal({
    isOpen,
    onClose,
    videoUrl,
    reelTitle,
}: ReelModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("00:00");
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-play and handle visibility
    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
        } else if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isOpen, videoUrl]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMute = !isMuted;
            videoRef.current.muted = newMute;
            setIsMuted(newMute);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            setProgress((current / duration) * 100);

            const mins = Math.floor(current / 60);
            const secs = Math.floor(current % 60);
            setCurrentTime(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500"
            onClick={onClose}
            onMouseMove={handleMouseMove}
        >
            <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Minimal Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-8 right-8 z-[1010] p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 scale-90'}`}
                >
                    <X size={20} />
                </button>

                <div className="relative aspect-[9/16] w-[90%] md:w-[450px] max-h-[85vh] rounded-[24px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-border">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        src={videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={togglePlay}
                        playsInline
                        loop
                    />

                    {/* Minimal Controls Overlay */}
                    <div className={`absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">Motivation Hub</p>
                                    <h3 className="text-lg font-medium text-white tracking-tight">{reelTitle}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={toggleMute} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all">
                                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                    <button onClick={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-black hover:scale-110 transition-all">
                                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
