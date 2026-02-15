"use client";

import React from "react";
import { useSettings, ThemeVibe } from "@/lib/SettingsContext";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const VIBE_METADATA: Record<ThemeVibe, { label: string; description: string; colors: string[] }> = {
    midnight: {
        label: "Cosmos",
        description: "Deep dark with neon purple accents.",
        colors: ["#0a0a0c", "#a78bfa"]
    },
    oceanic: {
        label: "Depth",
        description: "Submerged blue with cyan glows.",
        colors: ["#040d1a", "#3b82f6"]
    },
    evergreen: {
        label: "Grove",
        description: "Calm dark emerald atmosphere.",
        colors: ["#050f0a", "#10b981"]
    },
    solar: {
        label: "Ember",
        description: "Warm amber and orange sunset vibes.",
        colors: ["#120902", "#f97316"]
    },
    rose: {
        label: "Pulse",
        description: "Elegant magenta and soft pink.",
        colors: ["#11040a", "#f43f5e"]
    },
    minimal: {
        label: "Clarity",
        description: "Clean, minimalist focused workspace.",
        colors: ["#f8fafc", "#334155"]
    }
};

export default function VibeGallery() {
    const { themeVibe, updateSetting } = useSettings();

    return (
        <div className="vibe-gallery-container w-full">
            <h3 className="text-[14px] font-semibold uppercase tracking-wider mb-6 opacity-60">
                Select Your Vibe
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.entries(VIBE_METADATA) as [ThemeVibe, typeof VIBE_METADATA.midnight][]).map(([key, meta]) => {
                    const isActive = themeVibe === key;

                    return (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateSetting("themeVibe", key)}
                            className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 text-left ${isActive
                                ? "border-[var(--primary)] shadow-[0_0_20px_rgba(0,0,0,0.2)] bg-black/5 dark:bg-white/5"
                                : "border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                                }`}
                        >
                            {/* Preview Orbs */}
                            <div className="flex gap-2 mb-4">
                                {meta.colors.map((c, i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[18px] font-bold">{meta.label}</span>
                                {isActive && (
                                    <div className="bg-[var(--primary)] text-white p-0.5 rounded-full">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            <p className="text-[13px] opacity-60 line-clamp-2">
                                {meta.description}
                            </p>

                            {/* Active Indicator Bar */}
                            {isActive && (
                                <motion.div
                                    layoutId="vibe-active"
                                    className="absolute bottom-0 left-6 right-6 h-1 bg-[var(--primary)] rounded-t-full"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <p className="mt-8 text-[12px] opacity-40 italic">
                * Choosing a vibe will automatically adjust all components, backgrounds, and accents site-wide.
            </p>
        </div>
    );
}
