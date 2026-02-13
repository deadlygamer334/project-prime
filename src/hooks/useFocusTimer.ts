import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export type TimerMode = "FOCUS" | "BREAK";
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
    const [isActive, setIsActive] = useState(false);
    const [isFocusStarted, setIsFocusStarted] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject>("");

    // Baselines
    const [baselineFocusSecs, setBaselineFocusSecs] = useState(25 * 60);
    const [baselineBreakSecs, setBaselineBreakSecs] = useState(5 * 60);

    // Derived
    const timeLeft = mode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
    const currentBaseline = mode === "FOCUS" ? baselineFocusSecs : baselineBreakSecs;
    const progress = currentBaseline > 0 ? ((currentBaseline - timeLeft) / currentBaseline) * 100 : 0;

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number | null>(null);
    const sessionStartBaselineRef = useRef<number | null>(null);

    // Load state from localStorage on mount
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Sync FROM Cloud (Multi-device support)
    useEffect(() => {
        if (!user || !isLoaded) return;

        const timerRef = doc(db, "users", user.uid, "activeTimer", "current");
        const unsubscribe = onSnapshot(timerRef, (docSnap) => {
            if (!docSnap.exists()) {
                // Remote document deleted (Stop/Reset) - Handle STOP
                if (isActive) {
                    setIsActive(false);
                    endTimeRef.current = null;
                }
                return;
            }

            const data = docSnap.data();
            const now = Date.now();

            // Handle ACTIVE state update
            if (data.isActive && data.endTime > now) {
                const remaining = Math.ceil((data.endTime - now) / 1000);

                // Only sync if significant drift or status change
                const currentRemaining = mode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                const drift = Math.abs(currentRemaining - remaining);

                if (!isActive || drift > 2 || mode !== data.mode) {
                    setMode(data.mode);
                    setIsActive(true);
                    endTimeRef.current = data.endTime;
                    if (data.mode === "FOCUS") setFocusTimeLeft(remaining);
                    else setBreakTimeLeft(remaining);
                    setIsFocusStarted(data.isFocusStarted ?? true);

                    if (data.selectedSubject !== undefined) {
                        setSelectedSubject(data.selectedSubject);
                    }
                }
            } else if (!data.isActive) {
                // Explicitly marked as not active
                if (isActive) {
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
                setBaselineFocusSecs(parsed.baselineFocusSecs || 25 * 60);
                setBaselineBreakSecs(parsed.baselineBreakSecs || 5 * 60);
                setSelectedSubject(parsed.selectedSubject || "");
                setIsFocusStarted(parsed.isFocusStarted || false);

                if (parsed.isActive && parsed.endTime) {
                    const now = Date.now();
                    const remaining = Math.ceil((parsed.endTime - now) / 1000);
                    if (remaining > 0) {
                        if (parsed.mode === "FOCUS") setFocusTimeLeft(remaining);
                        else setBreakTimeLeft(remaining);
                        endTimeRef.current = parsed.endTime;
                        setIsActive(true);
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
            baselineFocusSecs,
            baselineBreakSecs,
            selectedSubject,
            isActive,
            isFocusStarted,
            endTime: isActive ? endTimeRef.current : null
        };
        localStorage.setItem("focusTimerStateV2", JSON.stringify(stateToSave));
    }, [mode, focusTimeLeft, breakTimeLeft, baselineFocusSecs, baselineBreakSecs, selectedSubject, isActive, isFocusStarted, isLoaded]);

    // Sync to Cloud ONLY when critical state changes (NOT per-second)
    useEffect(() => {
        if (!isLoaded || !user) return;

        const timerDoc = doc(db, "users", user.uid, "activeTimer", "current");

        if (isActive && endTimeRef.current) {
            setDoc(timerDoc, {
                mode,
                endTime: endTimeRef.current,
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
        else setBreakTimeLeft(baselineBreakSecs);

        if (onComplete) {
            // Pass actual duration in minutes (float)
            const durationMinutes = loggedBaseline / 60;
            // Round to 2 decimals for cleaner logging but allow < 1 minute
            const preciseDuration = Math.round(durationMinutes * 100) / 100;
            onComplete(mode, preciseDuration, selectedSubject);
        }
    }, [currentBaseline, mode, selectedSubject, onComplete, baselineFocusSecs, baselineBreakSecs]);

    // Timer Interval
    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((endTimeRef.current! - now) / 1000);

                if (remaining <= 0) {
                    if (mode === "FOCUS") setFocusTimeLeft(0);
                    else setBreakTimeLeft(0);
                    handleTimerComplete();
                } else {
                    if (mode === "FOCUS") setFocusTimeLeft(remaining);
                    else setBreakTimeLeft(remaining);
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
            // Immediate cloud stop
            if (user) {
                deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                    .catch(e => console.error(e));
            }
        } else {
            // Validate subject before starting focus
            if (mode === "FOCUS" && !selectedSubject) {
                return;
            }

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
            setIsActive(true);
        }
    }, [isActive, focusTimeLeft, breakTimeLeft, mode, baselineFocusSecs, baselineBreakSecs, user, selectedSubject]);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        if (mode === "FOCUS") setIsFocusStarted(false);
        endTimeRef.current = null;
        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                .catch(e => console.error(e));
        }
        if (mode === "FOCUS") setFocusTimeLeft(baselineFocusSecs);
        else setBreakTimeLeft(baselineBreakSecs);
    }, [mode, baselineFocusSecs, baselineBreakSecs, user]);

    const adjustTime = useCallback((secondsDelta: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
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
        if (mode === "FOCUS") setFocusTimeLeft(seconds);
        else setBreakTimeLeft(seconds);
    }, [isFocusStarted, mode]);

    const setBaselineWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
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
        selectedSubject,
        setSelectedSubject,
        adjustTime,
        setTimeLeft: setTimeLeftWrapper,
        setBaseline: setBaselineWrapper
    };
};
