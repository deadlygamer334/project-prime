"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useAmbience } from "@/lib/AmbienceContext";
import SoundCard from "./SoundCard";
import { FOCUS_PRESETS } from "@/data/focusPresets";
import { Shuffle, Volume2, Filter } from "lucide-react";
import soundLibrary from "@/data/focusSounds.json";

interface Sound {
    id: string;
    name: string;
    icon: string;
    audioSrc: string;
    description: string;
    tooltip?: string;
    focusType?: string;
}

export default function FocusMixer() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const {
        activeSounds,
        toggleSound,
        updateSoundVolume,
        applyPreset,
        randomizeMix,
        masterVolume,
        setMasterVolume,
        saveMixToStorage,
        loadMixFromStorage
    } = useAmbience();

    const [sounds, setSounds] = useState<Sound[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    useEffect(() => {
        try {
            // Handle different JSON import structures (can vary with bundlers)
            const library = (soundLibrary as any).default || soundLibrary;

            // Flatten sound library safely
            const categories = ['engineered', 'nature', 'ambient', 'industrial', 'scientific'];
            const allSounds: Sound[] = [];

            categories.forEach(cat => {
                const catSounds = library[cat];
                if (Array.isArray(catSounds)) {
                    allSounds.push(...catSounds);
                }
            });

            setSounds(allSounds);
            // Load saved mix
            loadMixFromStorage();
        } catch (error) {
            console.error("Error initializing FocusMixer:", error);
        }
    }, []);

    // Save mix whenever it changes
    useEffect(() => {
        if (activeSounds.length > 0) {
            saveMixToStorage();
        }
    }, [activeSounds, masterVolume]);

    const handlePresetClick = (presetKey: string) => {
        const preset = FOCUS_PRESETS[presetKey];
        setSelectedPreset(presetKey);

        // Apply preset levels
        applyPreset(preset.levels);

        // Start sounds that aren't already playing
        Object.entries(preset.levels).forEach(([soundId, volume]) => {
            const sound = sounds.find(s => s.id === soundId);
            const isActive = activeSounds.some(s => s.id === soundId);

            if (sound && !isActive) {
                toggleSound({
                    id: sound.id,
                    title: sound.name,
                    icon: sound.icon,
                    audioSrc: sound.audioSrc,
                    volume,
                    isLooping: true
                });
            }
        });
    };

    const handleRandomize = () => {
        setSelectedPreset(null);
        randomizeMix();
    };

    const handleSoundVolumeChange = (soundId: string, volume: number) => {
        setSelectedPreset(null);
        updateSoundVolume(soundId, volume);
    };

    const handleSoundToggle = (sound: Sound) => {
        setSelectedPreset(null);
        const isActive = activeSounds.some(s => s.id === sound.id);

        if (isActive) {
            toggleSound({ id: sound.id });
        } else {
            toggleSound({
                id: sound.id,
                title: sound.name,
                icon: sound.icon,
                audioSrc: sound.audioSrc,
                volume: 50,
                isLooping: true
            });
        }
    };

    const getSoundVolume = (soundId: string): number => {
        const activeSound = activeSounds.find(s => s.id === soundId);
        return activeSound?.volume ?? 0;
    };

    const isSoundActive = (soundId: string): boolean => {
        return activeSounds.some(s => s.id === soundId && s.isPlaying);
    };

    const categories = [
        { id: "all", name: "All Sounds", icon: "🎵" },
        { id: "engineered", name: "Engineered", icon: "📻" },
        { id: "nature", name: "Nature", icon: "🌿" },
        { id: "ambient", name: "Ambient", icon: "🏙️" },
        { id: "industrial", name: "Industrial", icon: "🌀" },
        { id: "scientific", name: "Scientific", icon: "🧠" }
    ];

    const categoryNames = {
        engineered: "Engineered Sounds",
        nature: "Nature Sounds",
        ambient: "Ambient Sounds",
        industrial: "Industrial Sounds",
        scientific: "Scientific Frequencies"
    };

    const visibleCategories = selectedCategory === "all"
        ? ["engineered", "nature", "ambient", "industrial", "scientific"]
        : [selectedCategory];

    return (
        <section className="w-full max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="header mb-8">
                <h2 className="text-[32px] md:text-[40px] font-bold mb-2 tracking-tight text-foreground">
                    Focus Mixer
                </h2>
                <p className="text-lg text-muted-foreground">
                    Layer 21 scientifically-curated sounds for optimal focus
                </p>
            </div>

            {/* Category Filter */}
            <div className="category-filter mb-8 p-6 rounded-3xl border bg-card border-border">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={18} className="text-muted-foreground" />
                    <h3 className="text-sm font-bold text-foreground">
                        Filter by Category
                    </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                        >
                            <span className="mr-2">{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preset Bar */}
            <div className="preset-bar mb-8 p-6 rounded-3xl border bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">
                        Quick Presets
                    </h3>
                    <button
                        onClick={handleRandomize}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all bg-primary/10 text-primary hover:bg-primary/20"
                    >
                        <Shuffle size={16} />
                        Randomize
                    </button>
                </div>

                <div className="flex flex-wrap gap-3">
                    {Object.entries(FOCUS_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => handlePresetClick(key)}
                            className={`preset-btn flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${selectedPreset === key
                                ? "border-primary bg-primary/20 text-foreground"
                                : "border-border bg-card text-foreground hover:border-primary/50"
                                }`}
                        >
                            <span className="text-xl">{preset.icon}</span>
                            <div className="text-left">
                                <div className="text-sm font-bold">{preset.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                    {preset.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Master Volume */}
            <div className="master-volume mb-8 p-6 rounded-3xl border bg-card border-border">
                <div className="flex items-center gap-4">
                    <Volume2 size={20} className="text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">
                        Master Volume
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                        className="flex-1 h-2 rounded-full cursor-pointer bg-muted accent-primary"
                    />
                    <span className="text-sm font-bold min-w-[45px] text-muted-foreground">
                        {masterVolume}%
                    </span>
                </div>
            </div>

            {/* Sound Categories */}
            {visibleCategories.map((category) => {
                const library = (soundLibrary as any).default || soundLibrary;
                const categorySounds = library[category as keyof typeof library];

                if (!Array.isArray(categorySounds)) return null;

                return (
                    <div key={category} className="mb-10">
                        <h3 className="text-xl font-bold mb-4 text-foreground">
                            {categoryNames[category as keyof typeof categoryNames]}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {categorySounds.map((sound: any) => (
                                <SoundCard
                                    key={sound.id}
                                    id={sound.id}
                                    name={sound.name}
                                    icon={sound.icon}
                                    description={sound.description}
                                    tooltip={sound.tooltip}
                                    focusType={sound.focusType}
                                    volume={getSoundVolume(sound.id)}
                                    isActive={isSoundActive(sound.id)}
                                    onVolumeChange={(volume) => handleSoundVolumeChange(sound.id, volume)}
                                    onToggle={() => handleSoundToggle(sound)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
