"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Command, Keyboard, Touchpad, MousePointer2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useKeyboardShortcuts } from "@/lib/KeyboardShortcutsContext";

export default function KeyboardShortcutsModal() {
    const { isShortcutsModalOpen, closeShortcutsModal, deviceType } = useKeyboardShortcuts();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [activeTab, setActiveTab] = useState<"keyboard" | "touch">("keyboard");

    useEffect(() => {
        setActiveTab(deviceType === "mobile" ? "touch" : "keyboard");
    }, [deviceType, isShortcutsModalOpen]);

    const shortcuts = [
        { key: "?", label: "Show Shortcuts", category: "Global" },
        { key: "Esc", label: "Close / Exit", category: "Global" },
        { key: "Shift + H", label: "Home / List View", category: "Navigation" },
        { key: "Shift + C", label: "Calendar View", category: "Navigation" },
        { key: "Shift + M", label: "Matrix View", category: "Navigation" },
        { key: "Shift + T", label: "Habit Tracker", category: "Navigation" },
        { key: "Shift + S", label: "Settings", category: "Navigation" },
        { key: "Shift + L", label: "Leaderboard", category: "Navigation" },
        { key: "Alt + N", label: "New Task (Focus Input)", category: "Tasks" },
        { key: "Space", label: "Start / Pause Timer", category: "Timer" },
        { key: "F", label: "Zen Mode", category: "Timer" },
    ];

    const gestures = [
        { key: "2-Finger Swipe Left", label: "Next Tab (Forward)", category: "Navigation" },
        { key: "2-Finger Swipe Right", label: "Prev Tab (Back)", category: "Navigation" },
        { key: "2-Finger Swipe Down", label: "Toggle Shortcuts", category: "Global" },
        { key: "3-Finger Tap", label: "Toggle Zen Mode (Planned)", category: "Timer" },
    ];

    const currentShortcuts = activeTab === "keyboard" ? shortcuts : gestures;
    const categories = Array.from(new Set(currentShortcuts.map(s => s.category)));

    return (
        <AnimatePresence mode="wait">
            {isShortcutsModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeShortcutsModal}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${isDark
                            ? "bg-[#1c1c1e] border-white/10"
                            : "bg-white border-black/5"
                            }`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/10" : "border-black/5"}`}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab("keyboard")}
                                        className={`p-2 rounded-md transition-all ${activeTab === "keyboard" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <Keyboard size={18} />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("touch")}
                                        className={`p-2 rounded-md transition-all ${activeTab === "touch" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <Touchpad size={18} />
                                    </button>
                                </div>
                                <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-black"}`}>
                                    {activeTab === "keyboard" ? "Keyboard Shortcuts" : "Touch Gestures"}
                                </h2>
                            </div>
                            <button
                                onClick={closeShortcutsModal}
                                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-black/60 hover:text-black"}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 grid gap-6">
                            {categories.map(category => (
                                <div key={category}>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white/40" : "text-black/40"}`}>{category}</h3>
                                    <div className="grid gap-2">
                                        {currentShortcuts.filter(s => s.category === category).map((shortcut) => (
                                            <div key={shortcut.label} className="flex items-center justify-between group">
                                                <span className={`text-sm font-medium ${isDark ? "text-white/80" : "text-black/80"}`}>
                                                    {shortcut.label}
                                                </span>
                                                <div className="flex-shrink-0">
                                                    <kbd className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-mono font-bold rounded-lg border shadow-sm transition-all whitespace-nowrap ${isDark
                                                        ? "bg-white/10 border-white/10 text-white shadow-[0_2px_0_0_rgba(255,255,255,0.1)] group-hover:bg-white/20"
                                                        : "bg-gray-100 border-gray-200 text-gray-700 shadow-[0_2px_0_0_rgba(0,0,0,0.05)] group-hover:bg-gray-200"
                                                        }`}>
                                                        {shortcut.key}
                                                    </kbd>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Hint */}
                        <div className={`px-6 py-4 text-center text-xs ${isDark ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>
                            Press <span className="font-bold">?</span> anywhere to open this guide
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
