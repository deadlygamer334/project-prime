import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, ChevronDown, Play, Pause, RotateCcw, Maximize2, Minimize2, PictureInPicture2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/lib/SettingsContext";
import useSoundEffects from "@/hooks/useSoundEffects";
import { useFocusTimer, TimerMode, Subject } from "@/hooks/useFocusTimer";
import { CustomSelect } from "@/components/ui/custom-select";
import { CompletionOverlay } from "@/components/ui/completion-overlay";
import { FlipDigit } from "@/components/ui/flip-digit";
import { useNotifications } from "@/hooks/useNotifications";

interface MinimalPomodoroProps {
    onComplete?: (mode: TimerMode, duration: number, subject: Subject) => void;
}

function MinimalPomodoro({ onComplete }: MinimalPomodoroProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();
    const { timerFont } = settings;
    const { sendTimerNotification } = useNotifications();

    const [showCompletion, setShowCompletion] = useState(false);
    const [completionMode, setCompletionMode] = useState<TimerMode>("FOCUS");
    const [lastSessionDuration, setLastSessionDuration] = useState(0);
    const { playTick, playAlarm } = useSoundEffects();

    const handleTimerCompleteWrapper = useCallback(async (m: TimerMode, duration: number, subject: Subject) => {
        playAlarm();
        setLastSessionDuration(duration);
        setCompletionMode(m);
        setShowCompletion(true);
        setTimeout(() => setShowCompletion(false), 4000);

        // Send notification using new notification system
        if (settings.notificationsEnabled) {
            await sendTimerNotification(m, duration, subject);
        }

        if (onComplete) {
            onComplete(m, duration, subject);
        }
    }, [playAlarm, sendTimerNotification, settings.notificationsEnabled, onComplete]);

    const {
        mode, setMode,
        timeLeft, isActive, isFocusStarted, progress,
        toggleTimer, resetTimer, completeSession,
        selectedSubject, setSelectedSubject,
        setTimeLeft, setBaseline, adjustTime
    } = useFocusTimer({ onComplete: handleTimerCompleteWrapper });

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [scale, setScale] = useState(0.8);
    const [brightness, setBrightness] = useState(1);
    const [editingUnit, setEditingUnit] = useState<"H" | "M" | "S" | null>(null);
    const [editValue, setEditValue] = useState("");

    // PiP State
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    // Touch Brightness Interaction
    const touchStartY = useRef<number | null>(null);
    const initialBrightness = useRef<number>(1);
    const initialScale = useRef<number>(0.8);

    const prevTimeLeft = useRef(timeLeft);
    const [currentTime, setCurrentTime] = useState("");

    // Update real-time clock
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);


    // Ensure client-side mounting for Portal
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { setIsZenMode } = settings;

    // Fullscreen Toggle Logic (Windowed Zen Mode only)
    const toggleFullScreen = () => {
        const next = !isFullScreen;
        setIsFullScreen(next);
        setIsZenMode(next);
    };

    // PiP Toggle Logic
    const togglePiP = useCallback(async () => {
        // Close existing PiP if any
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            return;
        }

        // Check availability
        if (!("documentPictureInPicture" in window)) {
            alert("Picture-in-Picture API is not supported in this browser.");
            return;
        }

        try {
            // Open new PiP window
            const pip = await (window as any).documentPictureInPicture.requestWindow({
                width: 300,
                height: 300,
            });

            // Copy styles
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach((styleSheet) => {
                try {
                    if (styleSheet.cssRules) {
                        const newStyle = document.createElement("style");
                        Array.from(styleSheet.cssRules).forEach((rule) => {
                            newStyle.appendChild(document.createTextNode(rule.cssText));
                        });
                        pip.document.head.appendChild(newStyle);
                    } else if (styleSheet.href) {
                        const newLink = document.createElement("link");
                        newLink.rel = "stylesheet";
                        newLink.type = "text/css";
                        newLink.href = styleSheet.href;
                        pip.document.head.appendChild(newLink);
                    }
                } catch (e) {
                    console.warn("Could not copy stylesheet", e);
                }
            });

            // Sync Theme Class
            if (isDark) {
                pip.document.documentElement.classList.add("dark");
            } else {
                pip.document.documentElement.classList.remove("dark");
            }

            // Sync Body Background explicitly to match theme
            pip.document.body.style.backgroundColor = isDark ? "#000" : "#fff";
            pip.document.body.style.display = "flex";
            pip.document.body.style.flexDirection = "column";
            pip.document.body.style.alignItems = "center";
            pip.document.body.style.justifyContent = "center";

            // Listen for close event
            pip.addEventListener("pagehide", () => {
                setPipWindow(null);
            });

            setPipWindow(pip);

        } catch (err) {
            console.error("Failed to open PiP window:", err);
        }
    }, [pipWindow, isDark]);

    // Keep PiP theme in sync if main theme changes while PiP is open
    useEffect(() => {
        if (pipWindow) {
            if (isDark) {
                pipWindow.document.documentElement.classList.add("dark");
            } else {
                pipWindow.document.documentElement.classList.remove("dark");
            }

            // Sync all CSS variables from main window to PiP window
            // This ensures --color-button, --background, etc. are available
            pipWindow.document.documentElement.style.cssText = document.documentElement.style.cssText;
            pipWindow.document.body.style.cssText = document.body.style.cssText;

            // Re-apply layout styles for PiP body using explicit properties to avoid overwriting by cssText if it had conflicting display
            // (Though typically body style on main window is just vars, better safe)
            pipWindow.document.body.style.display = "flex";
            pipWindow.document.body.style.flexDirection = "column";
            pipWindow.document.body.style.alignItems = "center";
            pipWindow.document.body.style.justifyContent = "center";

            // Ensure background color and text color fall back to variables
            pipWindow.document.body.style.backgroundColor = "var(--background)";
            pipWindow.document.body.style.color = "var(--foreground)";
        }
    }, [isDark, pipWindow, settings]); // Added settings dependency

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

            if (e.key === "Escape") {
                if (editingUnit) setEditingUnit(null);
                if (isFullScreen) setIsFullScreen(false);
            }
            // Spacebar to toggle timer
            if (e.key === " ") {
                e.preventDefault();
                toggleTimer();
            }
            // F key for Zen Mode
            if (e.key.toLowerCase() === "f") {
                e.preventDefault();
                toggleFullScreen();
            }
            // P key for PiP
            if (e.key.toLowerCase() === "p") {
                e.preventDefault();
                togglePiP();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullScreen, editingUnit, toggleTimer, togglePiP]);

    // Sound Effects (Tick only)
    useEffect(() => {
        if (isActive && timeLeft < prevTimeLeft.current && timeLeft > 0 && timeLeft <= 5) {
            playTick();
        }
        prevTimeLeft.current = timeLeft;
    }, [timeLeft, isActive, playTick]);

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const handleUnitClick = (unit: "H" | "M" | "S", value: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        setEditingUnit(unit);
        setEditValue(value.toString().padStart(2, "0"));
    };

    const handleEditComplete = () => {
        if (!editingUnit) return;

        const val = parseInt(editValue, 10);
        if (!isNaN(val)) {
            let newTime = timeLeft;
            if (editingUnit === "H") {
                newTime = (val * 3600) + (minutes * 60) + seconds;
            } else if (editingUnit === "M") {
                newTime = (hours * 3600) + (val * 60) + seconds;
            } else if (editingUnit === "S") {
                newTime = (hours * 3600) + (minutes * 60) + val;
            }
            setTimeLeft(newTime);
            setBaseline(newTime);
        }
        setEditingUnit(null);
    };

    const handleAdjust = (unit: "H" | "M" | "S", amount: number) => {
        let delta = 0;
        if (unit === "H") delta = amount * 3600;
        if (unit === "M") delta = amount * 60;
        if (unit === "S") delta = amount;

        adjustTime(delta);
    };

    // Touch Handlers for Zen Mode Interaction
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isFullScreen) return;
        if (e.touches.length === 1) {
            touchStartY.current = e.touches[0].clientY;
            initialBrightness.current = brightness;
        } else if (e.touches.length === 2) {
            // Use average Y of two fingers
            touchStartY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            initialScale.current = scale;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isFullScreen || touchStartY.current === null) return;

        if (e.touches.length === 1) {
            const deltaY = touchStartY.current - e.touches[0].clientY; // Up = positive
            const sensitivity = 300; // 300px for full brightness range
            const brightnessDelta = deltaY / sensitivity;
            const nextBrightness = Math.min(1.5, Math.max(0.3, initialBrightness.current + brightnessDelta));
            setBrightness(nextBrightness);
        } else if (e.touches.length === 2) {
            const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const deltaY = touchStartY.current - currentY; // Up = positive
            const sensitivity = 400; // 400px for full scale range
            const scaleDelta = deltaY / sensitivity;
            const nextScale = Math.min(2, Math.max(0.5, initialScale.current + scaleDelta));
            setScale(nextScale);
        }
    };

    const handleTouchEnd = () => {
        touchStartY.current = null;
    };

    const handleStart = async () => {
        if ((mode === "FOCUS" || mode === "STOPWATCH") && !selectedSubject) {
            alert("Please select a subject first!");
            return;
        }
        toggleTimer();
    };

    const formatTimeDigit = (val: number) => val.toString().padStart(2, "0");

    const { timerSubjects, addSubject, removeSubject } = settings;

    const getFontClass = (f: string) => {
        switch (f) {
            case "mono": return "font-mono";
            case "digital": return "font-mono tracking-widest";
            case "retro": return "font-serif";
            default: return "font-sans";
        }
    };

    const fontClass = getFontClass(timerFont || "inter");

    // The content that goes into either the main window OR the PiP window
    const timerContent = (isPiP: boolean) => (
        <div className={`flex flex-col items-center justify-center ${isPiP ? "w-full h-full p-4" : ""}`}>
            {/* Progress Bar for PiP */}
            {isPiP && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-10">
                    <motion.div
                        className="h-full bg-[var(--color-button)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>
            )}

            <div className={`relative flex items-end gap-2 md:gap-4 ${isPiP ? "" : "p-4 md:p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl"} ${!isPiP && (isDark
                ? "border-white/5 bg-black/20"
                : "border-black/5 bg-white/40"
            )}`}>
                {[
                    { val: hours, unit: "H" },
                    { val: minutes, unit: "M" },
                    { val: seconds, unit: "S" }
                ].map((item, i) => (
                    <div key={item.unit} className="flex items-end gap-2 md:gap-4">
                        {i > 0 && <span className={`text-4xl md:text-6xl ${fontClass} font-light mb-4 ${isDark ? "text-white/10" : "text-black/10"}`}>:</span>}
                        <div className="flex flex-col items-center">
                            {editingUnit === item.unit ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9]/g, "");
                                        if (v.length <= 2) setEditValue(v);
                                    }}
                                    onBlur={handleEditComplete}
                                    onKeyDown={(e) => e.key === "Enter" && handleEditComplete()}
                                    className={`w-[1.5em] bg-transparent text-center ${fontClass} text-6xl md:text-8xl font-bold leading-none outline-none border-b-2 ${isDark ? "text-white" : "text-black"}`}
                                    style={{ borderColor: "var(--color-button)" }}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    {!(isFocusStarted && mode === "FOCUS") && mode !== "STOPWATCH" && (
                                        <button
                                            type="button"
                                            onClick={() => handleAdjust(item.unit as any, 1)}
                                            className={`transition-all hover:-translate-y-1 ${isFocusStarted ? "text-[var(--color-button)]" : ""} ${isDark
                                                ? "text-white/60 lg:text-white/20 lg:hover:text-[var(--color-button)]"
                                                : "text-black/60 lg:text-black/20 lg:hover:text-[var(--color-button)]"
                                                }`}
                                        >
                                            <ChevronUp size={24} />
                                        </button>
                                    )}
                                    <motion.span
                                        onClick={() => mode !== "STOPWATCH" && handleUnitClick(item.unit as any, item.val)}
                                        whileHover={{ scale: ((isFocusStarted && mode === "FOCUS") || mode === "STOPWATCH") ? 1 : 1.1 }}
                                        className={`text-6xl md:text-8xl ${fontClass} font-bold leading-none tabular-nums transition-colors ${((isFocusStarted && mode === "FOCUS") || mode === "STOPWATCH") ? "cursor-default" : "cursor-pointer"} ${isActive
                                            ? "text-transparent bg-clip-text bg-gradient-to-b from-[var(--color-button)] to-[var(--color-ring)]"
                                            : isDark ? "text-white hover:text-[var(--color-button)]" : "text-black hover:text-[var(--color-button)]"
                                            }`}
                                    >
                                        {formatTimeDigit(item.val)}
                                    </motion.span>

                                    {!(isFocusStarted && mode === "FOCUS") && mode !== "STOPWATCH" && (
                                        <button
                                            type="button"
                                            onClick={() => handleAdjust(item.unit as any, -1)}
                                            className={`transition-all hover:translate-y-1 ${isFocusStarted ? "text-[var(--color-button)]" : ""} ${isDark
                                                ? "text-white/60 lg:text-white/20 lg:hover:text-[var(--color-button)]"
                                                : "text-black/60 lg:text-black/20 lg:hover:text-[var(--color-button)]"
                                                }`}
                                        >
                                            <ChevronDown size={24} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <span className="text-xs font-bold tracking-[0.3em] mt-2 opacity-40">{item.unit === 'H' ? 'HRS' : item.unit === 'M' ? 'MIN' : 'SEC'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls in PiP */}
            {isPiP && (
                <div className="flex items-center gap-6 mt-8 z-10">
                    <button
                        onClick={handleStart}
                        className={`group relative flex items-center justify-center w-16 h-16 rounded-full border transition-all ${isActive
                            ? "bg-[var(--color-button)]/10 border-[var(--color-button)] text-[var(--color-button)] hover:scale-105"
                            : "hover:scale-105 hover:brightness-110 shadow-xl"
                            }`}
                        style={!isActive ? {
                            backgroundColor: "var(--color-button)",
                            color: "var(--color-button-foreground)",
                            borderColor: "var(--color-button)",
                            boxShadow: "0 10px 40px -10px var(--color-button)"
                        } : {}}
                    >
                        {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all hover:rotate-180 duration-500 ${isDark
                            ? "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                            : "border-black/10 text-black/40 hover:text-black hover:border-black/30"
                            }`}
                    >
                        <RotateCcw size={16} />
                    </button>

                    <button
                        onClick={togglePiP} // Clicking this in PiP closes PiP
                        className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all hover:scale-110 ${isDark
                            ? "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                            : "border-black/10 text-black/40 hover:text-black hover:border-black/30"
                            }`}
                        title="Exit Picture-in-Picture"
                    >
                        <PictureInPicture2 size={16} />
                    </button>

                    {mode === "STOPWATCH" && timeLeft > 0 && (
                        <button
                            onClick={completeSession}
                            className={`group flex items-center justify-center w-10 h-10 rounded-full border transition-all hover:scale-105 duration-300 ${isDark
                                ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                                : "bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                                }`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-6 px-6 relative">

            {/* Mode Switcher */}
            <div className={`flex gap-1 p-1 mb-6 rounded-full border backdrop-blur-sm ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                {(["FOCUS", "BREAK", "STOPWATCH"] as TimerMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        disabled={isActive && mode !== m}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mode === m
                            ? (isDark ? "bg-white/10 text-white shadow-lg" : "bg-white text-black shadow-md")
                            : (isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70")
                            }`}
                    >
                        {m === "FOCUS" ? "Timer" : m === "BREAK" ? "Break" : "Stopwatch"}
                    </button>
                ))}
            </div>

            {/* Subject Selector */}
            {(mode === "FOCUS" || mode === "STOPWATCH") && (
                <div className="mb-6 w-full max-w-xs relative z-20">
                    <CustomSelect
                        value={selectedSubject}
                        onChange={setSelectedSubject}
                        options={timerSubjects}
                        disabled={isActive}
                        placeholder="Select Subject"
                        onAdd={addSubject}
                        onRemove={removeSubject}
                    />
                </div>
            )}

            <div className="relative mb-8 group w-full flex justify-center">
                <CompletionOverlay show={showCompletion} duration={lastSessionDuration} mode={completionMode} />

                {/* Render Timer: Either in DOM or Placeholder if in PiP */}
                {!pipWindow ? (
                    timerContent(false)
                ) : (
                    <div className={`flex flex-col items-center justify-center p-8 rounded-[3rem] border border-dashed w-full max-w-lg aspect-video ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                        <PictureInPicture2 size={48} className={`mb-4 ${isDark ? "text-white/20" : "text-black/20"}`} />
                        <p className={`font-bold ${isDark ? "text-white/60" : "text-black/60"}`}>Playing in Picture-in-Picture</p>
                        <button
                            onClick={() => pipWindow.close()}
                            className="mt-4 text-sm underline opacity-50 hover:opacity-100"
                        >
                            Bring back
                        </button>
                    </div>
                )}
            </div>

            {/* Controls (Main Window) - Hidden if PiP is active to avoid confusion, or can be kept synced.
                Let's keep them visible but maybe disabled or functioning parallely. 
                Actually, simpler to keep them visible but let PiP handle the main interaction.
            */}
            {!pipWindow && (
                <div className="flex items-center gap-6 z-10">
                    {mode === "STOPWATCH" && timeLeft > 0 && (
                        <button
                            onClick={completeSession}
                            className={`group flex items-center justify-center w-14 h-14 rounded-full border transition-all hover:scale-105 duration-300 ${isDark
                                ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                                : "bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                                }`}
                            title="Finish Session"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={handleStart}
                        className={`group relative flex items-center justify-center w-20 h-20 rounded-full border transition-all ${isActive
                            ? "bg-[var(--color-button)]/10 border-[var(--color-button)] text-[var(--color-button)] hover:scale-105"
                            : "hover:scale-105 hover:brightness-110 shadow-xl"
                            }`}
                        style={!isActive ? {
                            backgroundColor: "var(--color-button)",
                            color: "var(--color-button-foreground)",
                            borderColor: "var(--color-button)",
                            boxShadow: "0 10px 40px -10px var(--color-button)"
                        } : {}}
                    >
                        {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all hover:rotate-180 duration-500 ${isDark
                            ? "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                            : "border-black/10 text-black/40 hover:text-black hover:border-black/30"
                            }`}
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={toggleFullScreen}
                        className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all hover:scale-110 ${isDark
                            ? "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                            : "border-black/10 text-black/40 hover:text-black hover:border-black/30"
                            }`}
                        title="Zen Mode"
                    >
                        <Maximize2 size={20} />
                    </button>

                    <button
                        onClick={togglePiP}
                        className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all hover:scale-110 ${isDark
                            ? "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                            : "border-black/10 text-black/40 hover:text-black hover:border-black/30"
                            }`}
                        title="Picture-in-Picture"
                    >
                        <PictureInPicture2 size={20} />
                    </button>
                </div>
            )}

            {/* Portal for PiP Content */}
            {pipWindow && createPortal(
                timerContent(true),
                pipWindow.document.body
            )}

            {/* Full Screen Zen Mode Portal */}
            {mounted && isFullScreen && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden touch-none`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ height: '100dvh', width: '100vw', zIndex: 999999, position: 'fixed', top: 0, left: 0, filter: `brightness(${brightness})` }}
                >
                    {/* Themed Background Layer */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
                        <div className="absolute inset-0 bg-mesh opacity-40" />
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-orb-purple)] blur-[100px] opacity-20 animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-orb-green)] blur-[100px] opacity-20 animate-pulse" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-[var(--color-orb-pink)] blur-[120px] opacity-10" />
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-white/5 z-10">
                        <motion.div
                            className="h-full bg-[var(--color-button)] shadow-[0_0_20px_var(--color-button)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </div>

                    <CompletionOverlay show={showCompletion} duration={lastSessionDuration} mode={completionMode} />

                    <button
                        onClick={toggleFullScreen}
                        className="absolute top-8 right-8 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-50 hover:rotate-90"
                    >
                        <Minimize2 size={32} />
                    </button>

                    {/* Real-Time Clock */}
                    <div className={`absolute top-8 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.2em] z-40 ${isDark ? "text-white/40" : "text-foreground/40"}`}>
                        {currentTime}
                    </div>

                    {/* Main Content Container with Scale */}
                    <div style={{ transform: `scale(${scale})` }} className="flex flex-col items-center transition-transform duration-200">
                        <div className="mb-12 text-center">
                            {/* Hide Title in Fullscreen for minimalism */}
                            {!isFullScreen && (
                                <>
                                    <h2 className={`text-4xl md:text-6xl font-bold mb-4 tracking-tight ${isDark ? "text-white" : "text-foreground"}`}>
                                        {selectedSubject || "Deep Work"}
                                    </h2>
                                    <p className={`text-xl tracking-widest uppercase ${isDark ? "text-white/40" : "text-foreground/40"}`}>
                                        {isActive ? "Stay Focused" : "Ready?"}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-16">
                            <FlipDigit value={hours} label="Hours" isRetro={timerFont === "retro"} fontClass={fontClass} isDark={isDark} />
                            <span className={`text-6xl md:text-8xl font-light -mt-8 ${isDark ? "text-white/20" : "text-foreground/20"}`}>:</span>
                            <FlipDigit value={minutes} label="Minutes" isRetro={timerFont === "retro"} fontClass={fontClass} isDark={isDark} />
                            <span className={`text-6xl md:text-8xl font-light -mt-8 ${isDark ? "text-white/20" : "text-foreground/20"}`}>:</span>
                            <FlipDigit value={seconds} label="Seconds" isRetro={timerFont === "retro"} fontClass={fontClass} isDark={isDark} />
                        </div>
                    </div>

                    {/* Bottom Controls Container - Absolute Bottom Right for better accessibility */}
                    <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2">
                        {/* Size Controls - Hidden on mobile as gestures are preferred */}
                        <div className={`hidden md:flex items-center gap-4 px-4 py-2 rounded-full backdrop-blur-md ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className={`px-2 font-mono text-xl ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>-</button>
                            <span className={`text-[10px] font-mono tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>SIZE</span>
                            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className={`px-2 font-mono text-xl ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>+</button>
                        </div>
                        {/* Brightness Controls - Hidden on mobile as gestures are preferred */}
                        <div className={`hidden md:flex items-center gap-4 px-4 py-2 rounded-full backdrop-blur-md ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            <button onClick={() => setBrightness(b => Math.max(0.3, b - 0.1))} className={`px-2 font-mono text-xl ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>-</button>
                            <span className={`text-[10px] font-mono tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>BRIGHTNESS</span>
                            <button onClick={() => setBrightness(b => Math.min(1.5, b + 0.1))} className={`px-2 font-mono text-xl ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>+</button>
                        </div>
                    </div>
                </motion.div>,
                document.body
            )}
        </div>
    );
}

export default MinimalPomodoro;
