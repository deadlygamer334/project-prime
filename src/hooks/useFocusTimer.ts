import { useState, useEffect, useRef, useCallback } from "react";
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
    const [selectedSubject, setSelectedSubject] = useState<Subject>("");

    // Baselines
    const [baselineFocusSecs, setBaselineFocusSecs] = useState(25 * 60);
    const [baselineBreakSecs, setBaselineBreakSecs] = useState(5 * 60);

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
                setFocusTimeLeft(parsed.focusTimeLeft ?? 25 * 60);
                setBreakTimeLeft(parsed.breakTimeLeft ?? 5 * 60);
                setStopwatchElapsed(parsed.stopwatchElapsed ?? 0);
                setBaselineFocusSecs(parsed.baselineFocusSecs || 25 * 60);
                setBaselineBreakSecs(parsed.baselineBreakSecs || 5 * 60);
                setSelectedSubject(parsed.selectedSubject || "");
                setIsFocusStarted(parsed.isFocusStarted || false);

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
    }, []);

    // Save state to localStorage (frequent updates OK)
    useEffect(() => {
        if (!isLoaded) return;

        const stateToSave = {
            mode,
            focusTimeLeft,
            breakTimeLeft,
            stopwatchElapsed,
            baselineFocusSecs,
            baselineBreakSecs,
            selectedSubject,
            isActive,
            isFocusStarted,
            endTime: isActive ? endTimeRef.current : null,
            startTime: isActive ? startTimeRef.current : null
        };
        localStorage.setItem("focusTimerStateV2", JSON.stringify(stateToSave));
    }, [mode, focusTimeLeft, breakTimeLeft, baselineFocusSecs, baselineBreakSecs, selectedSubject, isActive, isFocusStarted, isLoaded]);

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
        if (mode === "FOCUS") setFocusTimeLeft(baselineFocusSecs);
        else if (mode === "BREAK") setBreakTimeLeft(baselineBreakSecs);
        else if (mode === "STOPWATCH") setStopwatchElapsed(0);

        if (onComplete) {
            // Pass actual duration in minutes (float)
            const durationMinutes = mode === "STOPWATCH" ? 0 : (loggedBaseline / 60); // Stopwatch handled manually usually? 
            // Actually, handleTimerComplete is for AUTO completion (timer runs out). 
            // Stopwatch never runs out automatically. 
            // But if called manually, we should pass elapsed.
            // If manual completion (Stopwatch), loggedBaseline isn't useful.
            // We'll update completeSession to handle this.

            if (mode !== "STOPWATCH") {
                onComplete(mode, durationMinutes, selectedSubject);
            }
        }
    }, [currentBaseline, mode, selectedSubject, onComplete, baselineFocusSecs, baselineBreakSecs]);

    const completeSession = useCallback(() => {
        // Manual finish for Stopwatch (or premature timer finish if we allowed it, but mainly for stopwatch)
        setIsActive(false);
        const durationMinutes = mode === "STOPWATCH" ? (stopwatchElapsed / 60) : (currentBaseline - timeLeft) / 60;

        if (onComplete) {
            onComplete(mode, durationMinutes, selectedSubject);
        }

        // Reset after completion
        if (mode === "STOPWATCH") setStopwatchElapsed(0);
        else if (mode === "FOCUS") setFocusTimeLeft(baselineFocusSecs);
        else setBreakTimeLeft(baselineBreakSecs);

        endTimeRef.current = null;
        startTimeRef.current = null;

        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current")).catch(console.error);
        }
    }, [mode, stopwatchElapsed, currentBaseline, timeLeft, onComplete, selectedSubject, baselineFocusSecs, baselineBreakSecs, user]);

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
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return; // No adjusting stopwatch

        if (mode === "FOCUS") {
            setFocusTimeLeft(prev => Math.max(0, Math.min(359999, prev + secondsDelta)));
            setBaselineFocusSecs(prev => Math.max(0, Math.min(359999, prev + secondsDelta)));
        } else {
            setBreakTimeLeft(prev => Math.max(0, Math.min(359999, prev + secondsDelta)));
            setBaselineBreakSecs(prev => Math.max(0, Math.min(359999, prev + secondsDelta)));
        }
    }, [isFocusStarted, mode]);

    const setModeWrapper = useCallback((m: TimerMode) => {
        setMode(m);
    }, []);

    const setTimeLeftWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        if (mode === "FOCUS") setFocusTimeLeft(seconds);
        else setBreakTimeLeft(seconds);
    }, [isFocusStarted, mode]);

    const setBaselineWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        if (mode === "FOCUS") setBaselineFocusSecs(seconds);
        else setBaselineBreakSecs(seconds);
    }, [isFocusStarted, mode]);

    return {
        mode,
        setMode: setModeWrapper,
        timeLeft,
        isActive,
        isFocusStarted,
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
