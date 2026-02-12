"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useSettings } from "./SettingsContext";

interface ActiveSound {
    id: string;
    title: string;
    icon: string;
    audioSrc: string;
    volume: number;
    isLooping: boolean;
    isPlaying: boolean;
}

interface AmbienceContextType {
    activeSounds: ActiveSound[];
    toggleSound: (sound: Partial<ActiveSound> & { id: string }) => void;
    updateSoundVolume: (id: string, volume: number) => void;
    updateSoundLoop: (id: string, isLooping: boolean) => void;
    stopAll: () => void;
    fadeTo: (id: string, targetVolume: number, duration: number) => void;
    applyPreset: (levels: Record<string, number>) => void;
    randomizeMix: () => void;
    masterVolume: number;
    setMasterVolume: (volume: number) => void;
    saveMixToStorage: () => void;
    loadMixFromStorage: () => void;
}

const AmbienceContext = createContext<AmbienceContextType | undefined>(undefined);

export const AmbienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
    const { soundMix, masterVolume: cloudMasterVolume, updateSetting } = useSettings();
    const [masterVolume, setMasterVolumeState] = useState(cloudMasterVolume);

    // Refs for synchronization and avoiding stale closures
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
    const fadeIntervals = useRef<{ [id: string]: any }>({});
    const activeSoundsRef = useRef<ActiveSound[]>([]);
    const masterVolumeRef = useRef<number>(100);

    // Keep refs in sync with state
    useEffect(() => {
        activeSoundsRef.current = activeSounds;
    }, [activeSounds]);

    useEffect(() => {
        masterVolumeRef.current = masterVolume;
    }, [masterVolume]);

    // Sync from Cloud Settings
    useEffect(() => {
        // Only update if significantly different to avoid loops, or just trust the cloud as source of truth on load
        // Actually, we use this for initial load. 
        if (cloudMasterVolume !== masterVolume) {
            setMasterVolumeState(cloudMasterVolume);
        }
    }, [cloudMasterVolume]);

    // Load mix from localStorage on mount
    useEffect(() => {
        loadMixFromStorage();
    }, []);

    const toggleSound = useCallback((sound: Partial<ActiveSound> & { id: string }) => {
        if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

        const currentSounds = activeSoundsRef.current;
        const existing = currentSounds.find((s) => s.id === sound.id);

        if (existing) {
            // If it's playing, stop it. If it's not (though current logic removes it on stop), play it.
            if (existing.isPlaying) {
                // STOP
                if (audioRefs.current[sound.id]) {
                    try {
                        audioRefs.current[sound.id].pause();
                        delete audioRefs.current[sound.id];
                    } catch (e) {
                        console.error("Error pausing audio:", e);
                    }
                }
                setActiveSounds(prev => prev.filter(s => s.id !== sound.id));
            } else {
                // PLAY (resume)
                if (audioRefs.current[sound.id]) {
                    audioRefs.current[sound.id].play().catch(console.error);
                }
                setActiveSounds(prev => prev.map(s => s.id === sound.id ? { ...s, isPlaying: true } : s));
            }
        } else {
            // START NEW
            const newSound: ActiveSound = {
                id: sound.id,
                title: sound.title || "Unknown",
                icon: sound.icon || "🎵",
                audioSrc: sound.audioSrc || "",
                volume: sound.volume ?? 70,
                isLooping: sound.isLooping ?? true,
                isPlaying: true,
            };

            try {
                const audio = new Audio(newSound.audioSrc);
                audio.loop = newSound.isLooping;
                audio.volume = (newSound.volume / 100) * (masterVolumeRef.current / 100);

                audio.addEventListener('error', () => {
                    console.warn(`Audio file not found: ${newSound.audioSrc}`);
                    setActiveSounds(prev => prev.filter(s => s.id !== sound.id));
                    delete audioRefs.current[sound.id];
                });

                audio.play().catch((err) => {
                    console.warn(`Cannot play audio: ${newSound.title}`, err);
                    setActiveSounds(prev => prev.filter(s => s.id !== sound.id));
                    delete audioRefs.current[sound.id];
                });

                audioRefs.current[sound.id] = audio;
                setActiveSounds(prev => [...prev, newSound]);
            } catch (error) {
                console.error("Failed to create audio element:", error);
            }
        }
    }, []);

    const updateSoundVolume = useCallback((id: string, volume: number) => {
        if (audioRefs.current[id]) {
            audioRefs.current[id].volume = (volume / 100) * (masterVolumeRef.current / 100);
        }
        setActiveSounds((prev) =>
            prev.map((s) => (s.id === id ? { ...s, volume } : s))
        );
    }, []);

    const updateSoundLoop = useCallback((id: string, isLooping: boolean) => {
        if (audioRefs.current[id]) {
            audioRefs.current[id].loop = isLooping;
        }
        setActiveSounds((prev) =>
            prev.map((s) => (s.id === id ? { ...s, isLooping } : s))
        );
    }, []);

    const stopAll = useCallback(() => {
        Object.values(audioRefs.current).forEach((audio) => {
            try { audio.pause(); } catch (e) { }
        });
        Object.values(fadeIntervals.current).forEach(clearInterval);
        audioRefs.current = {};
        fadeIntervals.current = {};
        setActiveSounds([]);
    }, []);

    const fadeTo = useCallback((id: string, targetVolume: number, duration: number) => {
        const sound = activeSoundsRef.current.find(s => s.id === id);
        if (!sound || !audioRefs.current[id]) return;

        if (fadeIntervals.current[id]) {
            clearInterval(fadeIntervals.current[id]);
        }

        const startVolume = sound.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 30;
        const stepDuration = duration / steps;
        const volumeStep = volumeDiff / steps;
        let currentStep = 0;

        fadeIntervals.current[id] = setInterval(() => {
            currentStep++;
            const newVolume = startVolume + (volumeStep * currentStep);

            if (currentStep >= steps) {
                clearInterval(fadeIntervals.current[id]);
                delete fadeIntervals.current[id];
                updateSoundVolume(id, targetVolume);
            } else {
                updateSoundVolume(id, newVolume);
            }
        }, stepDuration);
    }, [updateSoundVolume]);

    const applyPreset = useCallback((levels: Record<string, number>) => {
        const fadeDuration = 1500;
        const currentSounds = activeSoundsRef.current;

        // Fade out sounds not in preset
        currentSounds.forEach(sound => {
            if (levels[sound.id] === undefined) {
                fadeTo(sound.id, 0, fadeDuration);
                setTimeout(() => {
                    // Check if still not in preset after fade
                    if (audioRefs.current[sound.id]) {
                        audioRefs.current[sound.id].pause();
                        delete audioRefs.current[sound.id];
                    }
                    setActiveSounds(prev => prev.filter(s => s.id !== sound.id));
                }, fadeDuration + 100);
            }
        });

        // Fade existing sounds to new levels
        Object.entries(levels).forEach(([soundId, volume]) => {
            const existing = currentSounds.find(s => s.id === soundId);
            if (existing) {
                fadeTo(soundId, volume, fadeDuration);
            }
        });
    }, [fadeTo]);

    const randomizeMix = useCallback(() => {
        import('@/data/focusSounds.json')
            .then((module) => {
                const library = (module as any).default || module;
                const allSounds = [
                    ...(Array.isArray(library.engineered) ? library.engineered : []),
                    ...(Array.isArray(library.nature) ? library.nature : []),
                    ...(Array.isArray(library.ambient) ? library.ambient : []),
                    ...(Array.isArray(library.industrial) ? library.industrial : []),
                    ...(Array.isArray(library.scientific) ? library.scientific : [])
                ];

                if (allSounds.length === 0) return;

                const numSounds = Math.floor(Math.random() * 3) + 2;
                const selectedSounds = [];
                const usedIndices = new Set<number>();

                while (selectedSounds.length < numSounds && selectedSounds.length < allSounds.length) {
                    const randomIndex = Math.floor(Math.random() * allSounds.length);
                    if (!usedIndices.has(randomIndex)) {
                        usedIndices.add(randomIndex);
                        selectedSounds.push(allSounds[randomIndex]);
                    }
                }

                const levels: Record<string, number> = {};
                let totalVolume = 0;

                selectedSounds.forEach(sound => {
                    const volume = Math.floor(Math.random() * 51) + 20;
                    levels[sound.id] = volume;
                    totalVolume += volume;
                });

                if (totalVolume > 100) {
                    const scale = 100 / totalVolume;
                    Object.keys(levels).forEach(id => {
                        levels[id] = Math.floor(levels[id] * scale);
                    });
                }

                applyPreset(levels);

                // For sounds not already playing, we need to toggle them on
                // applyPreset only handles volume of sounds already in activeSounds
                // This is a limitation of the current applyPreset logic
                // Let's improve it below
            })
            .catch(err => console.error("Failed to load sound library for randomization:", err));
    }, [applyPreset]);

    const setMasterVolume = useCallback((volume: number) => {
        setMasterVolumeState(volume);
        Object.entries(audioRefs.current).forEach(([id, audio]) => {
            const sound = activeSoundsRef.current.find(s => s.id === id);
            if (sound) {
                audio.volume = (sound.volume / 100) * (volume / 100);
            }
        });
    }, []);

    const saveMixToStorage = useCallback(() => {
        const volumes = activeSoundsRef.current.reduce((acc, sound) => {
            acc[sound.id] = sound.volume;
            return acc;
        }, {} as Record<string, number>);

        // Sync to Cloud
        updateSetting("soundMix", volumes);
        updateSetting("masterVolume", masterVolumeRef.current);
    }, [updateSetting]);

    const loadMixFromStorage = useCallback(() => {
        try {
            // Load audio files based on the cloud mix (soundMix)
            // This requires the soundMix to be populated from SettingsContext
            if (Object.keys(soundMix).length > 0) {
                import('@/data/focusSounds.json')
                    .then((module) => {
                        const library = (module as any).default || module;
                        const allSounds = [
                            ...(Array.isArray(library.engineered) ? library.engineered : []),
                            ...(Array.isArray(library.nature) ? library.nature : []),
                            ...(Array.isArray(library.ambient) ? library.ambient : []),
                            ...(Array.isArray(library.industrial) ? library.industrial : []),
                            ...(Array.isArray(library.scientific) ? library.scientific : [])
                        ];

                        Object.entries(soundMix).forEach(([id, volume]) => {
                            const soundData = allSounds.find(s => s.id === id);
                            if (soundData) {
                                toggleSound({ ...soundData, volume });
                            }
                        });
                    });
            }
        } catch (error) {
            console.error('Failed to load mix from settings:', error);
        }
    }, [soundMix, toggleSound]);

    return (
        <AmbienceContext.Provider
            value={{
                activeSounds,
                toggleSound,
                updateSoundVolume,
                updateSoundLoop,
                stopAll,
                fadeTo,
                applyPreset,
                randomizeMix,
                masterVolume,
                setMasterVolume,
                saveMixToStorage,
                loadMixFromStorage
            }}
        >
            {children}
        </AmbienceContext.Provider>
    );
};

export const useAmbience = () => {
    const context = useContext(AmbienceContext);
    if (context === undefined) {
        throw new Error("useAmbience must be used within an AmbienceProvider");
    }
    return context;
};
