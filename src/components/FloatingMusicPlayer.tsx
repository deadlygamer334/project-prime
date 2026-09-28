"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, X, Music, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { useAmbience } from "@/lib/AmbienceContext";
import { useTheme } from "@/lib/ThemeContext";

export default function FloatingMusicPlayer() {
    const { activeSounds, stopAll, updateSoundVolume } = useAmbience();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [isMinimized, setIsMinimized] = useState(false);

    if (activeSounds.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                layout
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className={`fixed bottom-8 right-8 z-[100] cursor-move select-none shadow-2xl rounded-2xl overflow-hidden ${isMinimized ? "w-14 h-14" : "w-72"
                    } bg-background/80 backdrop-blur-2xl gradient-border card-premium`}
            >
                <div className={`w-full h-full flex flex-col ${isMinimized ? "items-center justify-center" : "p-4"}`}>
                    <div className={`flex items-center justify-between ${isMinimized ? "w-full h-full justify-center relative" : "mb-4"}`}>
                        <div
                            className="flex items-center gap-2"
                            onClick={() => isMinimized && setIsMinimized(false)}
                        >
                            <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-primary/10 ${isMinimized ? "w-10 h-10 rounded-full" : ""}`}>
                                <Music
                                    size={isMinimized ? 20 : 16}
                                    className={`text-primary ${activeSounds.length > 0 ? "animate-pulse" : ""}`}
                                />
                                {isMinimized && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {activeSounds.length}
                                    </div>
                                )}
                            </div>
                            {!isMinimized && (
                                <span className="text-sm font-bold text-foreground">
                                    Focus Ambience
                                </span>
                            )}
                        </div>

                        {!isMinimized && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                                >
                                    <Minimize2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        stopAll();
                                    }}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-destructive/20 text-destructive/70 hover:text-destructive"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {!isMinimized && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                {activeSounds.map((sound) => (
                                    <div key={sound.id} className="flex flex-col gap-1 mb-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-medium truncate text-foreground/80">
                                                {sound.icon} {sound.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                                                {sound.volume}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={12} className="text-muted-foreground shrink-0" />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={sound.volume}
                                                onChange={(e) => updateSoundVolume(sound.id, parseInt(e.target.value))}
                                                className="w-full h-1 rounded-full cursor-pointer appearance-none accent-primary bg-muted shadow-[0_0_8px_rgba(167,139,250,0.4)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={stopAll}
                                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-muted/60 hover:bg-muted text-foreground border border-border"
                            >
                                Stop All Sounds
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
