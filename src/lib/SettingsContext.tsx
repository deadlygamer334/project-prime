"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import NotificationEngine from "./NotificationEngine";

export type AccentColor = "purple" | "blue" | "green" | "pink" | "orange";
export type FontFamily = "inter" | "roboto" | "serif" | "mono";
export type TimerFont = "inter" | "mono" | "digital" | "retro";
export type BackgroundStyle = "aurora" | "mesh" | "particles" | "midnight";
export type TickSound = "mechanical" | "digital" | "none";
export type AlarmSound = "bell" | "chime" | "digital";
export type ThemeVibe = "midnight" | "oceanic" | "evergreen" | "solar" | "rose" | "minimal";
export type ClockStyle = "minimal" | "standard" | "bold" | "neon" | "elegant" | "outline" | "pill" | "glitch" | "vertical";

// New Aesthetic Types
export type LineHeight = "compact" | "comfort" | "loose";
export type LetterSpacing = "tight" | "normal" | "wide";
export type PaddingScale = "compact" | "normal" | "spacious";
export type BorderRadius = "sharp" | "smooth";
export type SurfaceTexture = "flat" | "glass" | "paper";

interface Settings {
    userName: string;
    accentColor: AccentColor;
    fontFamily: FontFamily;
    timerFont: TimerFont;
    showClock: boolean;
    showQuotes: boolean;
    showFooter: boolean;
    enableGlassmorphism: boolean; // Keep for backward compat or alias to surfaceTexture
    reducedMotion: boolean;
    // New Pro Settings
    backgroundStyle: BackgroundStyle;
    clockFormat: "12h" | "24h";
    showSeconds: boolean;
    clockStyle: ClockStyle; // New Setting
    soundEnabled: boolean;
    tickSound: TickSound;
    alarmSound: AlarmSound;
    confettiEnabled: boolean;
    notificationsEnabled: boolean;
    notifyAchievements: boolean;
    notifyStreaks: boolean;
    notifyReminders: boolean;
    morningNudgeTime: string;
    timerSubjects: string[];
    leaderboardPublic: boolean;

    // Pro Aesthetic Settings
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
    paddingScale: PaddingScale;
    borderRadius: BorderRadius;
    surfaceTexture: SurfaceTexture;
    themeVibe: ThemeVibe;
    // Cloud Sync Additions
    themeMode: "dark" | "light";
    soundMix: Record<string, number>;
    masterVolume: number;
}

interface SettingsContextType extends Settings {
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    resetSettings: () => void;
    addSubject: (name: string) => Promise<void>;
    removeSubject: (name: string) => Promise<void>;
    isZenMode: boolean;
    setIsZenMode: (v: boolean) => void;
}

const defaultSettings: Settings = {
    userName: "User",
    accentColor: "purple",
    fontFamily: "inter",
    timerFont: "inter",
    showClock: true,
    showQuotes: true,
    showFooter: true,
    enableGlassmorphism: true,
    reducedMotion: false,
    backgroundStyle: "aurora",
    clockFormat: "12h",
    showSeconds: false,
    clockStyle: "standard", // Default
    soundEnabled: true,
    tickSound: "mechanical",
    alarmSound: "bell",
    confettiEnabled: true,
    notificationsEnabled: true,
    notifyAchievements: true,
    notifyStreaks: true,
    notifyReminders: true,
    morningNudgeTime: "09:00",
    timerSubjects: ["Physics", "Chemistry", "Maths"],
    leaderboardPublic: true,

    // Defaults
    lineHeight: "comfort",
    letterSpacing: "normal",
    paddingScale: "normal",
    borderRadius: "smooth",
    surfaceTexture: "glass",
    themeVibe: "midnight",
    themeMode: "dark",
    soundMix: {},
    masterVolume: 100
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [user, setUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);


    // Listen for Auth Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                // Fallback to defaults or local storage if needed (but we strictly went cloud)
                setSettings(defaultSettings);
                setIsLoaded(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Sync from Firestore when User is Authed
    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.settings) {
                    setSettings((prev) => {
                        const newSettings = { ...prev, ...data.settings };
                        // If root displayName exists but settings name is default, sync it
                        if (data.displayName && (!data.settings.userName || data.settings.userName === "User")) {
                            newSettings.userName = data.displayName;
                        }
                        return newSettings;
                    });
                } else if (data.displayName) {
                    // Fallback for cases where settings don't exist yet but displayName does
                    setSettings(prev => ({ ...prev, userName: data.displayName }));
                }
            }
            setIsLoaded(true);
        }, (error) => {
            console.error("SettingsContext: Settings sync error:", error);
            setIsLoaded(true);
        });

        return () => unsubscribe();
    }, [user]);

    // Apply Theme Side Effect
    useEffect(() => {
        applyTheme(settings);
    }, [settings]);

    const applyTheme = (s: Settings) => {

        if (typeof window === 'undefined') return;


        const root = document.documentElement;
        const body = document.body;

        // Apply Colors
        const vibeColors = {
            midnight: {
                dark: {
                    background: "#0a0a0c",
                    foreground: "#ffffff",
                    primary: "#a78bfa",
                    button: "#8b5cf6", // Violet 500
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.05)",
                    border: "rgba(255, 255, 255, 0.1)",
                    muted: "#94a3b8",
                    accent: "rgba(167, 139, 250, 0.2)",
                    orb1: "rgba(167, 139, 250, 0.15)",
                    orb2: "rgba(236, 72, 153, 0.1)",
                    orb3: "rgba(34, 197, 94, 0.1)"
                },
                light: {
                    background: "#fdfbf7",
                    foreground: "#1e1b4b",
                    primary: "#7c3aed",
                    button: "#8b5cf6", // Violet 500 (Softer than primary 600)
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(124, 58, 237, 0.15)",
                    muted: "#64748b",
                    accent: "rgba(124, 58, 237, 0.1)",
                    orb1: "rgba(124, 58, 237, 0.1)",
                    orb2: "rgba(236, 72, 153, 0.1)",
                    orb3: "rgba(16, 185, 129, 0.1)"
                }
            },
            oceanic: {
                dark: {
                    background: "#040d1a",
                    foreground: "#e2e8f0",
                    primary: "#3b82f6",
                    button: "#3b82f6", // Blue 500
                    buttonForeground: "#ffffff",
                    card: "rgba(59, 130, 246, 0.08)",
                    border: "rgba(59, 130, 246, 0.2)",
                    muted: "#64748b",
                    accent: "rgba(59, 130, 246, 0.25)",
                    orb1: "rgba(59, 130, 246, 0.2)",
                    orb2: "rgba(6, 182, 212, 0.15)",
                    orb3: "rgba(45, 212, 191, 0.1)"
                },
                light: {
                    background: "#f0f9ff",
                    foreground: "#0c4a6e",
                    primary: "#0284c7",
                    button: "#0ea5e9", // Sky 500 (Bright & Happy)
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(14, 165, 233, 0.2)",
                    muted: "#475569",
                    accent: "rgba(14, 165, 233, 0.15)",
                    orb1: "rgba(14, 165, 233, 0.15)",
                    orb2: "rgba(6, 182, 212, 0.1)",
                    orb3: "rgba(59, 130, 246, 0.1)"
                }
            },
            evergreen: {
                dark: {
                    background: "#050f0a",
                    foreground: "#ecfdf5",
                    primary: "#10b981",
                    button: "#10b981", // Emerald 500
                    buttonForeground: "#ffffff",
                    card: "rgba(16, 185, 129, 0.06)",
                    border: "rgba(16, 185, 129, 0.15)",
                    muted: "#6b7280",
                    accent: "rgba(16, 185, 129, 0.2)",
                    orb1: "rgba(16, 185, 129, 0.18)",
                    orb2: "rgba(34, 197, 94, 0.12)",
                    orb3: "rgba(132, 204, 22, 0.08)"
                },
                light: {
                    background: "#f0fdf4",
                    foreground: "#064e3b",
                    primary: "#059669",
                    button: "#10b981", // Emerald 500
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(16, 185, 129, 0.2)",
                    muted: "#4b5563",
                    accent: "rgba(16, 185, 129, 0.15)",
                    orb1: "rgba(16, 185, 129, 0.15)",
                    orb2: "rgba(34, 197, 94, 0.1)",
                    orb3: "rgba(132, 204, 22, 0.1)"
                }
            },
            solar: {
                dark: {
                    background: "#120902",
                    foreground: "#fff7ed",
                    primary: "#f97316",
                    button: "#f97316", // Orange 500
                    buttonForeground: "#ffffff",
                    card: "rgba(249, 115, 22, 0.06)",
                    border: "rgba(249, 115, 22, 0.15)",
                    muted: "#78716c",
                    accent: "rgba(249, 115, 22, 0.2)",
                    orb1: "rgba(249, 115, 22, 0.15)",
                    orb2: "rgba(234, 179, 8, 0.12)",
                    orb3: "rgba(239, 68, 68, 0.08)"
                },
                light: {
                    background: "#fff7ed",
                    foreground: "#7c2d12",
                    primary: "#ea580c",
                    button: "#f97316", // Orange 500
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(249, 115, 22, 0.2)",
                    muted: "#57534e",
                    accent: "rgba(249, 115, 22, 0.15)",
                    orb1: "rgba(249, 115, 22, 0.15)",
                    orb2: "rgba(234, 179, 8, 0.1)",
                    orb3: "rgba(239, 68, 68, 0.1)"
                }
            },
            rose: {
                dark: {
                    background: "#11040a",
                    foreground: "#fff1f2",
                    primary: "#f43f5e",
                    button: "#f43f5e", // Rose 500
                    buttonForeground: "#ffffff",
                    card: "rgba(244, 63, 94, 0.06)",
                    border: "rgba(244, 63, 94, 0.15)",
                    muted: "#71717a",
                    accent: "rgba(244, 63, 94, 0.2)",
                    orb1: "rgba(244, 63, 94, 0.15)",
                    orb2: "rgba(219, 39, 119, 0.12)",
                    orb3: "rgba(147, 51, 234, 0.08)"
                },
                light: {
                    background: "#fff1f2",
                    foreground: "#881337",
                    primary: "#e11d48",
                    button: "#f43f5e", // Rose 500
                    buttonForeground: "#ffffff",
                    card: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(244, 63, 94, 0.2)",
                    muted: "#52525b",
                    accent: "rgba(244, 63, 94, 0.15)",
                    orb1: "rgba(244, 63, 94, 0.15)",
                    orb2: "rgba(219, 39, 119, 0.1)",
                    orb3: "rgba(147, 51, 234, 0.1)"
                }
            },
            minimal: {
                dark: {
                    background: "#09090b",
                    foreground: "#fafafa",
                    primary: "#e4e4e7",
                    button: "#fafafa", // White Button
                    buttonForeground: "#000000", // Black Text
                    card: "rgba(255, 255, 255, 0.03)",
                    border: "rgba(255, 255, 255, 0.05)",
                    muted: "#a1a1aa",
                    accent: "rgba(255, 255, 255, 0.05)",
                    orb1: "transparent",
                    orb2: "transparent",
                    orb3: "transparent"
                },
                light: {
                    background: "#ffffff",
                    foreground: "#18181b",
                    primary: "#52525b",
                    button: "#27272a", // Zinc 800 (Dark Grey/Black)
                    buttonForeground: "#ffffff", // White Text
                    card: "rgba(255, 255, 255, 1)",
                    border: "#e4e4e7",
                    muted: "#71717a",
                    accent: "#f4f4f5",
                    orb1: "transparent",
                    orb2: "transparent",
                    orb3: "transparent"
                }
            }
        };

        const currentVibe = (vibeColors as any)[s.themeVibe] || vibeColors.midnight;
        // @ts-ignore
        const vibe = s.themeMode === "dark" ? currentVibe.dark : currentVibe.light;

        // Apply Theme Class
        const themeClasses = ["theme-midnight", "theme-oceanic", "theme-evergreen", "theme-solar", "theme-rose", "theme-minimal"];
        body.classList.remove(...themeClasses);
        body.classList.add(`theme-${s.themeVibe}`);


        // Helper to convert hex to RGB
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };

        [root, body].forEach(el => {
            el.style.setProperty("--background", vibe.background);
            el.style.setProperty("--foreground", vibe.foreground);
            el.style.setProperty("--color-primary", vibe.primary);
            el.style.setProperty("--primary", vibe.primary);
            if (vibe.primary) el.style.setProperty("--primary-rgb", hexToRgb(vibe.primary) || "124, 58, 237");
            if (vibe.accent) el.style.setProperty("--accent-rgb", hexToRgb(vibe.accent as string) || "236, 72, 153");

            el.style.setProperty("--color-card", vibe.card);
            el.style.setProperty("--card", vibe.card);
            el.style.setProperty("--color-border", vibe.border);
            el.style.setProperty("--border", vibe.border);
            el.style.setProperty("--muted-foreground", vibe.muted);
            el.style.setProperty("--color-accent", vibe.accent);
            el.style.setProperty("--accent", vibe.accent);
            el.style.setProperty("--color-orb-purple", vibe.orb1);
            el.style.setProperty("--color-orb-pink", vibe.orb2);
            el.style.setProperty("--color-orb-green", vibe.orb3);
            el.style.setProperty("--ring", vibe.primary);
            // @ts-ignore
            el.style.setProperty("--color-button", vibe.button);
            // @ts-ignore
            el.style.setProperty("--color-button-foreground", vibe.buttonForeground);
        });

        // Apply Fonts
        const fonts: Record<FontFamily, string> = {
            inter: 'var(--font-sans), system-ui, sans-serif',
            roboto: 'var(--font-roboto), sans-serif',
            serif: 'var(--font-merriweather), serif',
            mono: 'var(--font-mono), monospace',
        };
        [root, body].forEach(el => {
            el.style.setProperty("--font-current", fonts[s.fontFamily]);
            el.style.setProperty("--font-sans", fonts[s.fontFamily]);
        });

        // Apply Reduced Motion
        if (s.reducedMotion) {
            [root, body].forEach(el => el.style.setProperty("--animate-duration", "0s"));
        } else {
            [root, body].forEach(el => el.style.removeProperty("--animate-duration"));
        }

        // Apply Line Height (Hidden from UI but still functional for internal scaling)
        const lineHeights: Record<LineHeight, string> = {
            compact: "1.4",
            comfort: "1.6",
            loose: "1.8"
        };
        [root, body].forEach(el => el.style.setProperty("--line-height-base", lineHeights[s.lineHeight]));

        // Apply Letter Spacing
        const letterSpacings: Record<LetterSpacing, string> = {
            tight: "-0.02em",
            normal: "0em",
            wide: "0.02em"
        };
        [root, body].forEach(el => el.style.setProperty("--letter-spacing-base", letterSpacings[s.letterSpacing]));

        // Apply Padding Scale
        const pScale = s.paddingScale === "compact" ? "0.75" : s.paddingScale === "spacious" ? "1.25" : "1";
        [root, body].forEach(el => el.style.setProperty("--padding-scale", pScale));

        // Apply Border Radius
        const radii: Record<BorderRadius, string> = {
            sharp: "0px",
            smooth: "12px"
        };
        [root, body].forEach(el => el.style.setProperty("--radius-base", radii[s.borderRadius]));
    };

    const updateSetting = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => {
            const newSettings = { ...prev, [key]: value };

            // Side effect moved out of state update function for clarity, 
            // though Firestore calls are usually safe.
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const updates: any = { settings: newSettings };

                // Also persist leaderboardPublic at the root for easier querying
                if (key === "leaderboardPublic") {
                    updates.leaderboardPublic = value;
                }

                // Sync userName with root displayName for the leaderboard
                if (key === "userName") {
                    updates.displayName = value;
                }

                setDoc(userRef, updates, { merge: true }).catch(err => {
                    console.error("Failed to save settings to cloud", err);
                });
            }
            return newSettings;
        });
    }, [user]);

    const resetSettings = useCallback(async () => {
        setSettings(defaultSettings);
        if (user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                settings: defaultSettings,
                leaderboardPublic: defaultSettings.leaderboardPublic
            });
        }
    }, [user]);

    const addSubject = useCallback(async (name: string) => {
        if (!name || settings.timerSubjects.includes(name)) return;
        const newSubjects = [...settings.timerSubjects, name];
        await updateSetting("timerSubjects", newSubjects);
    }, [settings.timerSubjects, updateSetting]);

    const removeSubject = useCallback(async (name: string) => {
        const newSubjects = settings.timerSubjects.filter(s => s !== name);
        await updateSetting("timerSubjects", newSubjects);
    }, [settings.timerSubjects, updateSetting]);

    return (
        <SettingsContext.Provider
            value={{
                ...settings,
                updateSetting,
                resetSettings,
                addSubject,
                removeSubject,
                isZenMode,
                setIsZenMode
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
