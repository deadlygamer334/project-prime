import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "@/lib/SettingsContext";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export type TimerMode = "FOCUS" | "BREAK" | "STOPWATCH";
export type Subject = string;

interface UseFocusTimerProps {
    onComplete?: (mode: TimerMode, duration: number, subject: Subject) => void;
}

export const useFocusTimer = ({ onComplete }: UseFocusTimerProps = {}) => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    // Persistent State
    const [mode, setMode] = useState<TimerMode>("FOCUS");
    const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
    const [breakTimeLeft, setBreakTimeLeft] = useState(5 * 60);
    const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isFocusStarted, setIsFocusStarted] = useState(false);
    const [isBreakStarted, setIsBreakStarted] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject>("");

    // Baselines from Settings
    const { timerDurations, updateSetting } = useSettings();
    const baselineFocusSecs = timerDurations.focus * 60;
    const baselineBreakSecs = timerDurations.shortBreak * 60;
    // Note: We might need to distinguish short/long break in the future, 
    // but current hook uses single breakTimeLeft. 
    // For now mapping BREAK to shortBreak. 
    // If we want long break support, we need to map modes better.
    // However, existing hook only has "BREAK". 
    // Let's use shortBreak for now as it's the standard "Break".

    // Derived
    const timeLeft = mode === "FOCUS" ? focusTimeLeft : mode === "BREAK" ? breakTimeLeft : stopwatchElapsed;
    const currentBaseline = mode === "FOCUS" ? baselineFocusSecs : mode === "BREAK" ? baselineBreakSecs : 0;
    const progress = currentBaseline > 0 ? ((currentBaseline - timeLeft) / currentBaseline) * 100 : 0;

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null); // For Stopwatch
    const sessionStartBaselineRef = useRef<number | null>(null);

    // Load state from localStorage on mount
    const [isLoaded, setIsLoaded] = useState(false);

    // Refs for closure access in onSnapshot
    const isActiveRef = useRef(isActive);
    const modeRef = useRef(mode);
    const lastLocalStopRef = useRef<number>(0);

    useEffect(() => {
        isActiveRef.current = isActive;
        modeRef.current = mode;
    }, [isActive, mode]);

    // 1. Sync FROM Cloud (Multi-device support)
    useEffect(() => {
        if (!user || !isLoaded) return;

        const timerRef = doc(db, "users", user.uid, "activeTimer", "current");
        const unsubscribe = onSnapshot(timerRef, (docSnap) => {
            if (!docSnap.exists()) {
                // Remote document deleted (Stop/Reset) - Handle STOP
                // Use REF to check current state, preventing stale closure issues
                if (isActiveRef.current) {
                    setIsActive(false);
                    endTimeRef.current = null;
                }
                return;
            }

            const data = docSnap.data();
            const now = Date.now();

            // Handle ACTIVE state update
            if (data.isActive && data.endTime > now) {
                // If we stopped locally less than 2 seconds ago, ignore cloud "active" signal
                // to prevent race conditions (Zombie Timer)
                if (Date.now() - lastLocalStopRef.current < 2000) {
                    return;
                }

                const remaining = Math.ceil((data.endTime - now) / 1000);

                // Only sync if significant drift or status change
                // Use REF for mode check
                const currentMode = modeRef.current;
                // Note: focusTimeLeft/breakTimeLeft are stale from closure, but since snapshot only fires
                // on significant remote events (not per second), syncing to remote time is desired behavior.
                const currentRemaining = currentMode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                const drift = Math.abs(currentRemaining - remaining);

                if (!isActiveRef.current || drift > 2 || currentMode !== data.mode) {
                    setMode(data.mode);
                    setIsActive(true);
                    endTimeRef.current = data.endTime;
                    startTimeRef.current = data.startTime || null; // For stopwatch sync
                    if (data.mode === "FOCUS") setFocusTimeLeft(remaining);
                    else if (data.mode === "BREAK") setBreakTimeLeft(remaining);
                    else if (data.mode === "STOPWATCH") {
                        // For stopwatch, calculate elapsed based on startTime if active
                        // If we are just syncing state but not active, use data.stopwatchElapsed
                        // But here we are in the 'active' block.
                        if (data.startTime) {
                            const elapsed = Math.floor((now - data.startTime) / 1000);
                            setStopwatchElapsed(elapsed);
                        }
                    }

                    setIsFocusStarted(data.isFocusStarted ?? true);

                    if (data.selectedSubject !== undefined) {
                        setSelectedSubject(data.selectedSubject);
                    }
                }
            } else if (!data.isActive) {
                // Explicitly marked as not active
                if (isActiveRef.current) {
                    setIsActive(false);
                    endTimeRef.current = null;
                }
            }
        });

        return () => unsubscribe();
    }, [user, isLoaded]);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem("focusTimerStateV2"); // Versioning storage
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.mode) setMode(parsed.mode);
                setFocusTimeLeft(parsed.focusTimeLeft ?? baselineFocusSecs);
                // If saved time is 0 (completed), keep it 0. If it's default (was 5*60), use new baseline
                // Actually, ensure we respect saved state primarily
                setBreakTimeLeft(parsed.breakTimeLeft ?? baselineBreakSecs);
                setStopwatchElapsed(parsed.stopwatchElapsed ?? 0);
                setSelectedSubject(parsed.selectedSubject || "");
                setIsFocusStarted(parsed.isFocusStarted || false);
                setIsBreakStarted(parsed.isBreakStarted || false);

                if (parsed.isActive) {
                    const now = Date.now();

                    if (parsed.mode === "STOPWATCH" && parsed.startTime) {
                        // Resume stopwatch
                        const elapsed = Math.floor((now - parsed.startTime) / 1000);
                        setStopwatchElapsed(elapsed);
                        startTimeRef.current = parsed.startTime;
                        setIsActive(true);
                    } else if (parsed.endTime) {
                        // Resume Timer
                        const remaining = Math.ceil((parsed.endTime - now) / 1000);
                        if (remaining > 0) {
                            if (parsed.mode === "FOCUS") setFocusTimeLeft(remaining);
                            else setBreakTimeLeft(remaining);
                            endTimeRef.current = parsed.endTime;
                            setIsActive(true);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load timer state", e);
        } finally {
            setIsLoaded(true);
        }
    }, []); // Only run on mount

    // Save state to localStorage (frequent updates OK)
    useEffect(() => {
        if (!isLoaded) return;

        const stateToSave = {
            mode,
            focusTimeLeft,
            breakTimeLeft,
            stopwatchElapsed,
            // baselineFocusSecs, // No longer saving baselines to local storage
            // baselineBreakSecs,
            selectedSubject,
            isActive,
            isFocusStarted,
            isBreakStarted,
            endTime: isActive ? endTimeRef.current : null,
            startTime: isActive ? startTimeRef.current : null
        };
        localStorage.setItem("focusTimerStateV2", JSON.stringify(stateToSave));
    }, [mode, focusTimeLeft, breakTimeLeft, selectedSubject, isActive, isFocusStarted, isLoaded]);

    // Sync to Cloud ONLY when critical state changes (NOT per-second)
    useEffect(() => {
        if (!isLoaded || !user) return;

        const timerDoc = doc(db, "users", user.uid, "activeTimer", "current");

        if (isActive && (endTimeRef.current || startTimeRef.current)) {
            setDoc(timerDoc, {
                mode,
                endTime: endTimeRef.current,
                startTime: startTimeRef.current,
                isActive,
                isFocusStarted,
                isBreakStarted,
                selectedSubject,
                updatedAt: Date.now()
            }, { merge: true }).catch(err => console.error("Cloud sync failed:", err));
        } else if (!isActive) {
            // Ensure cloud knows it's stopped if it was active
            // We use deleteDoc in toggleTimer/resetTimer for immediate effect, 
            // but this ensures consistency.
        }
    }, [isActive, mode, selectedSubject, user, isLoaded, isFocusStarted]); // Removed per-second time-left dependencies

    const handleTimerComplete = useCallback(() => {
        setIsActive(false);
        if (mode === "FOCUS") setIsFocusStarted(false);
        if (mode === "BREAK") setIsBreakStarted(false);
        endTimeRef.current = null;

        // Cleanup Cloud activeTimer immediately
        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                .catch(err => console.error("Cloud cleanup failed:", err));
        }

        // Use the baseline captured at the START of the session for logging
        const loggedBaseline = sessionStartBaselineRef.current ?? currentBaseline;
        sessionStartBaselineRef.current = null;

        // Reset the mode that just finished
        if (mode === "FOCUS") setFocusTimeLeft(0);
        else if (mode === "BREAK") setBreakTimeLeft(0);
        else if (mode === "STOPWATCH") setStopwatchElapsed(0);

        if (onComplete) {
            // Pass actual duration in minutes (float)
            const durationMinutes = mode === "STOPWATCH" ? 0 : (loggedBaseline / 60);

            if (mode !== "STOPWATCH") {
                onComplete(mode, durationMinutes, selectedSubject);
            }
        }

        // Reset subject after logging
        setSelectedSubject("");
    }, [currentBaseline, mode, selectedSubject, onComplete]);

    const completeSession = useCallback(() => {
        // Manual finish for Stopwatch (or premature timer finish if we allowed it, but mainly for stopwatch)
        setIsActive(false);

        // Use the baseline captured at the START of the session for logging accuracy
        const loggedBaseline = sessionStartBaselineRef.current ?? currentBaseline;
        sessionStartBaselineRef.current = null;

        const durationMinutes = mode === "STOPWATCH" ? (stopwatchElapsed / 60) : (loggedBaseline - timeLeft) / 60;

        if (onComplete) {
            onComplete(mode, durationMinutes, selectedSubject);
        }

        if (mode === "STOPWATCH") setStopwatchElapsed(0);
        else if (mode === "FOCUS") setIsFocusStarted(false);
        else setIsBreakStarted(false);

        if (mode === "STOPWATCH") setStopwatchElapsed(0);
        else if (mode === "FOCUS") setFocusTimeLeft(0);
        else setBreakTimeLeft(0);

        endTimeRef.current = null;
        startTimeRef.current = null;

        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current")).catch(console.error);
        }

        // Reset subject after completion
        setSelectedSubject("");
    }, [mode, stopwatchElapsed, currentBaseline, timeLeft, onComplete, selectedSubject, user]);

    // Timer Interval
    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                const now = Date.now();

                if (mode === "STOPWATCH") {
                    if (startTimeRef.current) {
                        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
                        setStopwatchElapsed(elapsed);
                    }
                } else {
                    const remaining = Math.ceil((endTimeRef.current! - now) / 1000);

                    if (remaining <= 0) {
                        if (mode === "FOCUS") setFocusTimeLeft(0);
                        else setBreakTimeLeft(0);
                        handleTimerComplete();
                    } else {
                        if (mode === "FOCUS") setFocusTimeLeft(remaining);
                        else setBreakTimeLeft(remaining);
                    }
                }
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, mode, handleTimerComplete]);

    const toggleTimer = useCallback(() => {
        if (isActive) {
            setIsActive(false);
            endTimeRef.current = null;
            startTimeRef.current = null;
            lastLocalStopRef.current = Date.now();
            // Immediate cloud stop
            if (user) {
                deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                    .catch(e => console.error(e));
            }
        } else {
            // Validate subject before starting focus or stopwatch
            if ((mode === "FOCUS" || mode === "STOPWATCH") && !selectedSubject) {
                return;
            }

            if (mode === "STOPWATCH") {
                // Start Stopwatch
                // elapsed = (now - start) / 1000 => start = now - (elapsed * 1000)
                startTimeRef.current = Date.now() - (stopwatchElapsed * 1000);
                endTimeRef.current = null;
            } else {
                // Countdown Logic
                const currentLeft = mode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                if (mode === "FOCUS") setIsFocusStarted(true);
                if (mode === "BREAK") setIsBreakStarted(true);

                // If currentLeft is 0 (completed), explicitly reset to baseline
                if (currentLeft <= 0) {
                    const newTime = mode === "FOCUS" ? baselineFocusSecs : baselineBreakSecs;
                    if (mode === "FOCUS") setFocusTimeLeft(newTime);
                    else setBreakTimeLeft(newTime);
                    endTimeRef.current = Date.now() + newTime * 1000;
                    sessionStartBaselineRef.current = newTime;
                } else {
                    endTimeRef.current = Date.now() + currentLeft * 1000;
                    sessionStartBaselineRef.current = currentLeft;
                }
            }
            setIsActive(true);
        }
    }, [isActive, focusTimeLeft, breakTimeLeft, stopwatchElapsed, mode, baselineFocusSecs, baselineBreakSecs, user, selectedSubject]);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        lastLocalStopRef.current = Date.now();
        if (mode === "FOCUS") setIsFocusStarted(false);
        if (mode === "BREAK") setIsBreakStarted(false);
        endTimeRef.current = null;
        startTimeRef.current = null;
        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                .catch(e => console.error(e));
        }
        if (mode === "FOCUS") setFocusTimeLeft(baselineFocusSecs);
        else if (mode === "BREAK") setBreakTimeLeft(baselineBreakSecs);
        else if (mode === "STOPWATCH") setStopwatchElapsed(0);
    }, [mode, baselineFocusSecs, baselineBreakSecs, user]);

    const adjustTime = useCallback((secondsDelta: number) => {
        if (isActive || (isFocusStarted && mode === "FOCUS")) return;
        if (mode === "STOPWATCH") return;

        // Determine if we should update global settings (persistent duration)
        // or just local state (transient adjustment). 
        // Rule: If it's a multiple of 60s, update settings.
        const isMinuteAdjustment = secondsDelta !== 0 && secondsDelta % 60 === 0;

        if (mode === "FOCUS") {
            const currentSeconds = focusTimeLeft + secondsDelta;
            const newSeconds = Math.max(10, Math.min(1440 * 60, currentSeconds));
            setFocusTimeLeft(newSeconds);

            if (isMinuteAdjustment) {
                const newMinutes = Math.round(newSeconds / 60);
                updateSetting("timerDurations", { ...timerDurations, focus: newMinutes });
            }
        } else {
            const currentSeconds = breakTimeLeft + secondsDelta;
            const newSeconds = Math.max(10, Math.min(720 * 60, currentSeconds));
            setBreakTimeLeft(newSeconds);

            if (isMinuteAdjustment) {
                const newMinutes = Math.round(newSeconds / 60);
                updateSetting("timerDurations", { ...timerDurations, shortBreak: newMinutes });
            }
        }
    }, [isActive, isFocusStarted, mode, focusTimeLeft, breakTimeLeft, timerDurations, updateSetting]);

    const setModeWrapper = useCallback((m: TimerMode) => {
        setMode(m);
    }, []);

    // These wrappers are likely used by the UI to set specific times.
    // If they set *Baseline*, we must update Settings.
    // If they just set current timeLeft (e.g. from keypad), we might keep local?
    // Usually standard UI allows adjusting duration.

    // Simplification: Assume setBaseline is main way to set custom duration.
    const setBaselineWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        const minutes = Math.floor(seconds / 60);

        if (mode === "FOCUS") {
            updateSetting("timerDurations", { ...timerDurations, focus: minutes });
            setFocusTimeLeft(seconds);
        }
        else {
            updateSetting("timerDurations", { ...timerDurations, shortBreak: minutes });
            setBreakTimeLeft(seconds);
        }
    }, [isFocusStarted, mode, timerDurations, updateSetting]);

    // setTimeLeftWrapper is often used for drag adjustments or keypad.
    // If we want FULL sync, this should also update settings if it represents the "new normal".
    // But often setTimeLeft is just "temporarily adjust for this session". 
    // Given the requirement "settings synced", let's treat these as transient unless they flow through setBaseline.
    // BUT, wait, checking usage of setTimeLeft in codebase would be ideal.
    // Assuming standard usage: setTimeLeft is likely called by the TimePicker.
    // Let's repurpose it to also sync if it's not active.

    const setTimeLeftWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        if (mode === "FOCUS") setFocusTimeLeft(seconds);
        else setBreakTimeLeft(seconds);
    }, [isFocusStarted, mode]);


    return {
        mode,
        setMode: setModeWrapper,
        timeLeft,
        isActive,
        isFocusStarted,
        isBreakStarted,
        progress,
        toggleTimer,
        resetTimer,
        completeSession,
        selectedSubject,
        setSelectedSubject,
        adjustTime,
        setTimeLeft: setTimeLeftWrapper,
        setBaseline: setBaselineWrapper
    };
};
