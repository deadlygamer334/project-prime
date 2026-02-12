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
                style={{ borderRadius: isMinimized ? "50%" : "24px" }}
                className={`fixed bottom-8 right-8 z-[100] cursor-move select-none shadow-2xl overflow-hidden ${isMinimized ? "w-14 h-14" : "w-72"
                    } ${isDark
                        ? "bg-[#1a1a1e]/95 border border-white/10 backdrop-blur-xl"
                        : "bg-white/95 border border-black/5 backdrop-blur-xl"
                    }`}
            >
                <div className={`w-full h-full flex flex-col ${isMinimized ? "items-center justify-center" : "p-4"}`}>
                    <div className={`flex items-center justify-between ${isMinimized ? "w-full h-full justify-center relative" : "mb-4"}`}>
                        <div
                            className="flex items-center gap-2"
                            onClick={() => isMinimized && setIsMinimized(false)}
                        >
                            <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/5" : "bg-black/5"
                                } ${isMinimized ? "w-10 h-10 rounded-full" : ""}`}>
                                <Music
                                    size={isMinimized ? 20 : 16}
                                    className={`${isDark ? "text-purple-400" : "text-purple-600"} ${activeSounds.length > 0 ? "animate-pulse" : ""}`}
                                />
                                {isMinimized && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1a1a1e]">
                                        {activeSounds.length}
                                    </div>
                                )}
                            </div>
                            {!isMinimized && (
                                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                                    Focus Ambience
                                </span>
                            )}
                        </div>

                        {!isMinimized && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-black/5 text-black/40"
                                        }`}
                                >
                                    <Minimize2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        stopAll();
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-red-500/20 text-red-500/60" : "hover:bg-red-50 text-red-500"
                                        }`}
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
                                            <span className={`text-[11px] font-medium truncate ${isDark ? "text-white/60" : "text-black/60"}`}>
                                                {sound.icon} {sound.title}
                                            </span>
                                            <span className={`text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>
                                                {sound.volume}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={12} className={isDark ? "text-white/20" : "text-black/20"} />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={sound.volume}
                                                onChange={(e) => updateSoundVolume(sound.id, parseInt(e.target.value))}
                                                className={`w-full h-1 rounded-full cursor-pointer appearance-none ${isDark ? "bg-white/10" : "bg-black/10"
                                                    }`}
                                                style={{ accentColor: isDark ? "#a78bfa" : "#8b5cf6" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={stopAll}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${isDark
                                        ? "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                                        : "bg-black/5 hover:bg-black/10 text-black border border-black/5"
                                    }`}
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
