import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "@/lib/SettingsContext";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, deleteDoc, getDoc, runTransaction } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export type TimerMode = "FOCUS" | "BREAK" | "STOPWATCH";
export type Subject = string;

interface UseFocusTimerProps {
    onComplete?: (mode: TimerMode, duration: number, subject: Subject, isLogged?: boolean) => void;
    addSessionTransaction?: (transaction: any, type: "focus" | "break", duration: number, subject?: string, sessionId?: string) => Promise<void>;
    isCompleting?: boolean;
}

export const useFocusTimer = ({ onComplete, addSessionTransaction, isCompleting }: UseFocusTimerProps = {}) => {
    // Auth State
    const [user, setUser] = useState<User | null>(() => auth.currentUser);

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

    // Derived
    const timeLeft = mode === "FOCUS" ? focusTimeLeft : mode === "BREAK" ? breakTimeLeft : stopwatchElapsed;
    const currentBaseline = mode === "FOCUS" ? baselineFocusSecs : mode === "BREAK" ? baselineBreakSecs : 0;
    const progress = currentBaseline > 0 ? ((currentBaseline - timeLeft) / currentBaseline) * 100 : 0;

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null); // For Stopwatch
    const sessionTargetDurationRef = useRef<number | null>(null); // Total intended session length in seconds (e.g. 3000 for 50m)
    const segmentStartBaselineRef = useRef<number | null>(null); // Baseline for current running segment
    const accumulatedTimeSecondsRef = useRef<number>(0); // Total elapsed seconds across prior segments
    const lastRunningModeRef = useRef<TimerMode>(mode);
    // VUL-1: single-flight guard so interval AND snapshot can never both log the same session
    const isCompletingRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            // SECURITY: If user logs out, kill any active timer and clear state
            if (!u) {
                if (timerRef.current) clearInterval(timerRef.current);
                setIsActive(false);
                setIsFocusStarted(false);
                setIsBreakStarted(false);
                setFocusTimeLeft(baselineFocusSecs);
                setBreakTimeLeft(baselineBreakSecs);
                setStopwatchElapsed(0);
                endTimeRef.current = null;
                startTimeRef.current = null;
                accumulatedTimeSecondsRef.current = 0;
                segmentStartBaselineRef.current = null;
                sessionTargetDurationRef.current = null;
                localStorage.removeItem("focusTimerStateV2");
            }
        });
        return () => unsubscribe();
    }, [baselineFocusSecs, baselineBreakSecs]);

    // Load state from localStorage on mount
    const [isLoaded, setIsLoaded] = useState(false);

    // Refs for stable visibility in callbacks/intervals
    const isActiveRef = useRef(isActive);
    const modeRef = useRef(mode);
    const timeLeftRef = useRef(timeLeft);
    const lastLocalStopRef = useRef<number>(0);
    const userRefCurrent = useRef<User | null>(user);

    useEffect(() => {
        isActiveRef.current = isActive;
        modeRef.current = mode;
        timeLeftRef.current = timeLeft;
        userRefCurrent.current = user;
    }, [isActive, mode, timeLeft, user]);

    const handleTimerCompleteInternal = useCallback(async (isAuto: boolean) => {
        // VUL-1: Single-flight guard — prevents the setInterval tick AND the onSnapshot listener
        // from both entering the transaction for the same session simultaneously.
        if (isCompletingRef.current) return;
        isCompletingRef.current = true;

        const currentUser = userRefCurrent.current;

        // VUL-2: Stop the interval immediately so it cannot fire again while the async
        // transaction is in flight. isActive state update is async; this is synchronous.
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        let finalMode: TimerMode = mode;
        let finalDuration = 0;
        let finalSubject = "";
        // VUL-5: Generate a deterministic session ID at completion time.
        // Using this as the Firestore doc ID makes retries idempotent.
        const sessionId = crypto.randomUUID();

        // ─── Guest / unauthenticated user path ───
        if (!currentUser) {
            if (mode === "STOPWATCH") {
                finalDuration = stopwatchElapsed / 60;
            } else if (isAuto) {
                const target = sessionTargetDurationRef.current ?? (mode === "FOCUS" ? baselineFocusSecs : baselineBreakSecs);
                const segmentBase = segmentStartBaselineRef.current ?? target;
                finalDuration = Math.max(target, accumulatedTimeSecondsRef.current + segmentBase) / 60;
            } else {
                const segmentBase = segmentStartBaselineRef.current ?? (sessionTargetDurationRef.current ?? (mode === "FOCUS" ? baselineFocusSecs : baselineBreakSecs));
                const elapsedInSegment = Math.max(0, segmentBase - timeLeftRef.current);
                finalDuration = (accumulatedTimeSecondsRef.current + elapsedInSegment) / 60;
            }
            finalMode = mode;
            finalSubject = selectedSubject;

            // Clean up local state
            setIsActive(false);
            if (mode === "FOCUS") { setIsFocusStarted(false); setFocusTimeLeft(baselineFocusSecs); }
            else if (mode === "BREAK") { setIsBreakStarted(false); setBreakTimeLeft(baselineBreakSecs); }
            else { setStopwatchElapsed(0); }
            endTimeRef.current = null;
            startTimeRef.current = null;
            accumulatedTimeSecondsRef.current = 0;
            segmentStartBaselineRef.current = null;
            sessionTargetDurationRef.current = null;
            setSelectedSubject("");

            // Fire onComplete so alarm + overlay + notification still trigger.
            // isLogged = false so PomodoroPanel calls addSession for guest storage in useFocusProgress.
            if (onComplete) onComplete(finalMode, finalDuration, finalSubject, false);
            isCompletingRef.current = false;
            return;
        }

        try {
            await runTransaction(db, async (transaction) => {
                const timerDocRef = doc(db, "users", currentUser.uid, "activeTimer", "current");
                const docSnap = await transaction.get(timerDocRef);

                if (!docSnap.exists()) {
                    // Doc already deleted — this session was already logged successfully.
                    throw { code: "ALREADY_LOGGED" };
                }

                const data = docSnap.data();
                if (data.isBeingLogged) {
                    // Another transaction is actively logging — bail out, do NOT fallback.
                    throw { code: "ALREADY_LOGGING" };
                }

                const modeFromCloud = data.mode as TimerMode;
                finalMode = modeFromCloud;
                finalSubject = data.selectedSubject || "";

                const cloudTargetDuration = data.targetDuration ?? data.originalBaseline ?? (modeFromCloud === "FOCUS" ? baselineFocusSecs : baselineBreakSecs);
                const cloudAccumulated = data.accumulatedTime ?? 0;
                const cloudSegmentBaseline = data.segmentBaseline ?? data.originalBaseline ?? (modeFromCloud === "FOCUS" ? baselineFocusSecs : baselineBreakSecs);

                if (modeFromCloud === "STOPWATCH") {
                    if (data.isActive) {
                        const startTime = data.startTime || Date.now();
                        finalDuration = Math.max(0, (Date.now() - startTime) / 60000);
                    } else {
                        finalDuration = cloudAccumulated / 60;
                    }
                    if (finalDuration >= (1.5 / 60) && addSessionTransaction) {
                        await addSessionTransaction(transaction, "focus", finalDuration, finalSubject, sessionId);
                    }
                } else {
                    if (isAuto) {
                        // Natural auto-completion at 0:00!
                        // The user completed their planned session (or accumulated segments + final segment).
                        const totalSecs = Math.max(cloudTargetDuration, cloudAccumulated + cloudSegmentBaseline);
                        finalDuration = totalSecs / 60;
                    } else {
                        // Stopped early
                        if (data.isActive) {
                            const elapsedInSegment = Math.max(0, cloudSegmentBaseline - timeLeftRef.current);
                            finalDuration = (cloudAccumulated + elapsedInSegment) / 60;
                        } else {
                            finalDuration = cloudAccumulated / 60;
                        }
                    }
                    if (finalDuration >= (1.5 / 60) && addSessionTransaction) {
                        await addSessionTransaction(transaction, modeFromCloud === "FOCUS" ? "focus" : "break", finalDuration, finalSubject, sessionId);
                    }
                }

                // Mark as being logged then atomically delete so no other caller can race in
                transaction.set(timerDocRef, { isBeingLogged: true }, { merge: true });
                transaction.delete(timerDocRef);
            });

            // Post-transaction UI cleanup
            setIsActive(false);
            const resolvedMode = finalMode as TimerMode;

            switch (resolvedMode) {
                case "FOCUS":
                    setIsFocusStarted(false);
                    setFocusTimeLeft(baselineFocusSecs);
                    break;
                case "BREAK":
                    setIsBreakStarted(false);
                    setBreakTimeLeft(baselineBreakSecs);
                    break;
                case "STOPWATCH":
                    setStopwatchElapsed(0);
                    break;
            }

            endTimeRef.current = null;
            startTimeRef.current = null;
            accumulatedTimeSecondsRef.current = 0;
            segmentStartBaselineRef.current = null;
            sessionTargetDurationRef.current = null;

            if (onComplete && finalDuration >= (1.5 / 60)) {
                onComplete(resolvedMode, finalDuration, finalSubject, true);
            } else if (onComplete) {
                // Still fire for UI (alarm, completion overlay) but mark as not logged
                onComplete(resolvedMode, finalDuration, finalSubject, false);
            }
            setSelectedSubject("");

        } catch (e: any) {
            const errorCode = e?.code;

            const isAlreadyHandled = errorCode === "ALREADY_LOGGED" || errorCode === "ALREADY_LOGGING";

            if (isAlreadyHandled) {
                console.log("Session already logged or in progress — skipping fallback.", errorCode);
                setIsActive(false);
                setIsFocusStarted(false);
                setIsBreakStarted(false);
                setFocusTimeLeft(baselineFocusSecs);
                setBreakTimeLeft(baselineBreakSecs);
                setStopwatchElapsed(0);
                endTimeRef.current = null;
                startTimeRef.current = null;
                accumulatedTimeSecondsRef.current = 0;
                segmentStartBaselineRef.current = null;
                sessionTargetDurationRef.current = null;

                if (onComplete) {
                    const resolvedMode = finalMode as TimerMode;
                    onComplete(resolvedMode, finalDuration, finalSubject, true);
                }
            } else {
                console.warn("Timer completion transaction failed (network). Queuing locally.", e);

                try {
                    if (finalMode !== "BREAK" && finalDuration >= (1.5 / 60)) {
                        const queuedSessions = JSON.parse(localStorage.getItem("queuedFocusSessions") || "[]");
                        const alreadyQueued = queuedSessions.some((s: any) => s.sessionId === sessionId);
                        if (!alreadyQueued) {
                            queuedSessions.push({
                                sessionId,
                                mode: finalMode,
                                duration: finalDuration,
                                subject: finalSubject,
                                timestamp: new Date().toISOString()
                            });
                            localStorage.setItem("queuedFocusSessions", JSON.stringify(queuedSessions));
                        }
                    }

                    // Marked as isLogged = true because queuedFocusSessions will commit it once online
                    if (onComplete) onComplete(finalMode, finalDuration, finalSubject as Subject, true);
                } catch (err) {
                    console.error("Failed to queue session locally:", err);
                }

                setIsActive(false);
                setIsFocusStarted(false);
                setIsBreakStarted(false);
                setFocusTimeLeft(baselineFocusSecs);
                setBreakTimeLeft(baselineBreakSecs);
                setStopwatchElapsed(0);
                endTimeRef.current = null;
                startTimeRef.current = null;
                accumulatedTimeSecondsRef.current = 0;
                segmentStartBaselineRef.current = null;
                sessionTargetDurationRef.current = null;
                lastRunningModeRef.current = finalMode;
            }
        } finally {
            // Always release the single-flight guard
            isCompletingRef.current = false;
        }
    }, [mode, selectedSubject, stopwatchElapsed, db, addSessionTransaction, baselineFocusSecs, baselineBreakSecs, onComplete]);

    // OFFLINE INSURANCE: Process queued sessions when online/mount
    useEffect(() => {
        if (!user || !addSessionTransaction) return;

        const processQueue = async () => {
            const queued: any[] = JSON.parse(localStorage.getItem("queuedFocusSessions") || "[]");
            if (queued.length === 0) return;

            console.log(`Processing ${queued.length} queued sessions...`);
            const remaining: any[] = [];

            for (const session of queued) {
                try {
                    await runTransaction(db, async (transaction) => {
                        const type = session.mode === "BREAK" ? "break" : "focus";
                        await addSessionTransaction(transaction, type, session.duration, session.subject, session.sessionId);
                    });
                } catch (err) {
                    console.error("Failed to process queued session, keeping in queue:", err);
                    remaining.push(session);
                }
            }

            localStorage.setItem("queuedFocusSessions", JSON.stringify(remaining));
        };

        const interval = setInterval(processQueue, 30000);
        processQueue();

        return () => clearInterval(interval);
    }, [user, addSessionTransaction, db]);

    // Stabilize the completion function for the listener
    const stableCompleteRef = useRef(handleTimerCompleteInternal);
    useEffect(() => {
        stableCompleteRef.current = handleTimerCompleteInternal;
    }, [handleTimerCompleteInternal]);

    // 1. Sync FROM Cloud (Multi-device support)
    useEffect(() => {
        if (!user || !isLoaded) return;

        const timerDocRef = doc(db, "users", user.uid, "activeTimer", "current");
        const unsubscribe = onSnapshot(timerDocRef, (docSnap) => {
            const now = Date.now();

            if (!docSnap.exists()) {
                if (isActiveRef.current) {
                    setIsActive(false);
                    endTimeRef.current = null;
                    startTimeRef.current = null;
                    accumulatedTimeSecondsRef.current = 0;
                    segmentStartBaselineRef.current = null;
                    sessionTargetDurationRef.current = null;
                    if (modeRef.current === "FOCUS") setIsFocusStarted(false);
                }
                return;
            }

            const data = docSnap.data();

            // Catch-up: If timer EXPIRED while we were away, complete it
            if (data.isActive && data.endTime <= now && data.mode !== "STOPWATCH") {
                stableCompleteRef.current(true);
                return;
            }

            // Sync accounting fields from cloud whenever present
            if (data.accumulatedTime !== undefined) accumulatedTimeSecondsRef.current = data.accumulatedTime;
            if (data.targetDuration !== undefined) sessionTargetDurationRef.current = data.targetDuration;
            else if (data.originalBaseline !== undefined && !sessionTargetDurationRef.current) {
                sessionTargetDurationRef.current = data.originalBaseline;
            }
            if (data.segmentBaseline !== undefined) segmentStartBaselineRef.current = data.segmentBaseline;

            // Handle ACTIVE state update
            if (data.isActive && (data.mode === "STOPWATCH" || data.endTime > now)) {
                // If we stopped locally less than 2 seconds ago, ignore cloud "active" signal override
                if (Date.now() - lastLocalStopRef.current < 2000) return;

                const remaining = data.mode === "STOPWATCH" ? 0 : Math.ceil((data.endTime - now) / 1000);

                const currentMode = modeRef.current;
                const currentRemaining = currentMode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                const drift = Math.abs(currentRemaining - remaining);

                if (!isActiveRef.current || drift > 2 || currentMode !== data.mode) {
                    setMode(data.mode);
                    setIsActive(true);
                    endTimeRef.current = data.endTime;
                    startTimeRef.current = data.startTime || null;
                    if (data.mode === "FOCUS") setFocusTimeLeft(remaining);
                    else if (data.mode === "BREAK") setBreakTimeLeft(remaining);
                    else if (data.mode === "STOPWATCH" && data.startTime) {
                        setStopwatchElapsed(Math.floor((now - data.startTime) / 1000));
                    }
                    setIsFocusStarted(data.isFocusStarted ?? true);
                    setSelectedSubject(data.selectedSubject || "");
                    lastRunningModeRef.current = data.mode;
                }
            } else if (!data.isActive) {
                if (isActiveRef.current) {
                    setIsActive(false);
                    endTimeRef.current = null;
                    startTimeRef.current = null;
                }

                // Update local time if cloud paused
                if (data.remainingTime !== undefined) {
                    if (data.mode === "FOCUS") setFocusTimeLeft(data.remainingTime);
                    else if (data.mode === "BREAK") setBreakTimeLeft(data.remainingTime);
                    else if (data.mode === "STOPWATCH") setStopwatchElapsed(data.accumulatedTime ?? data.remainingTime ?? 0);
                }
                if (data.mode) setMode(data.mode);
                if (data.selectedSubject) setSelectedSubject(data.selectedSubject);
                if (data.isFocusStarted !== undefined) setIsFocusStarted(data.isFocusStarted);
                if (data.isBreakStarted !== undefined) setIsBreakStarted(data.isBreakStarted);
            }
        });

        return () => unsubscribe();
    }, [user, isLoaded]);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem("focusTimerStateV2");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.mode) setMode(parsed.mode);
                setFocusTimeLeft(parsed.focusTimeLeft ?? baselineFocusSecs);
                setBreakTimeLeft(parsed.breakTimeLeft ?? baselineBreakSecs);
                setStopwatchElapsed(parsed.stopwatchElapsed ?? 0);
                setSelectedSubject(parsed.selectedSubject || "");
                setIsFocusStarted(parsed.isFocusStarted || false);
                setIsBreakStarted(parsed.isBreakStarted || false);

                // RESTORE persistent refs to prevent time loss on refresh
                if (parsed.accumulatedTime !== undefined) accumulatedTimeSecondsRef.current = parsed.accumulatedTime;
                if (parsed.segmentBaseline !== undefined) segmentStartBaselineRef.current = parsed.segmentBaseline;
                if (parsed.targetDuration !== undefined) sessionTargetDurationRef.current = parsed.targetDuration;
                else if (parsed.sessionStartBaseline !== undefined) sessionTargetDurationRef.current = parsed.sessionStartBaseline;
                if (parsed.mode) lastRunningModeRef.current = parsed.mode;

                if (parsed.isActive) {
                    const now = Date.now();

                    if (parsed.mode === "STOPWATCH" && parsed.startTime) {
                        const elapsed = Math.floor((now - parsed.startTime) / 1000);
                        setStopwatchElapsed(elapsed);
                        startTimeRef.current = parsed.startTime;
                        setIsActive(true);
                    } else if (parsed.endTime) {
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
            selectedSubject,
            isActive,
            isFocusStarted,
            isBreakStarted,
            endTime: isActive ? endTimeRef.current : null,
            startTime: isActive ? startTimeRef.current : null,
            accumulatedTime: accumulatedTimeSecondsRef.current,
            segmentBaseline: segmentStartBaselineRef.current,
            targetDuration: sessionTargetDurationRef.current,
            sessionStartBaseline: sessionTargetDurationRef.current
        };
        localStorage.setItem("focusTimerStateV2", JSON.stringify(stateToSave));
    }, [mode, focusTimeLeft, breakTimeLeft, stopwatchElapsed, selectedSubject, isActive, isFocusStarted, isBreakStarted, isLoaded]);

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
                accumulatedTime: accumulatedTimeSecondsRef.current,
                segmentBaseline: segmentStartBaselineRef.current,
                targetDuration: sessionTargetDurationRef.current,
                originalBaseline: sessionTargetDurationRef.current,
                updatedAt: Date.now()
            }, { merge: true }).catch(err => console.error("Cloud sync failed:", err));
        }
    }, [isActive, mode, selectedSubject, user, isLoaded, isFocusStarted, isBreakStarted]);

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
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        handleTimerCompleteInternal(true);
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
    }, [isActive, mode, handleTimerCompleteInternal]);

    const completeSession = useCallback(() => {
        handleTimerCompleteInternal(false);
    }, [handleTimerCompleteInternal]);

    const toggleTimer = useCallback(() => {
        if (isCompleting) return;
        if (isActive) {
            setIsActive(false);

            // On pause, add current interval's elapsed time to accumulator
            if (mode === "STOPWATCH") {
                const elapsed = startTimeRef.current
                    ? Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
                    : stopwatchElapsed;
                accumulatedTimeSecondsRef.current = elapsed;
                setStopwatchElapsed(elapsed);
            } else {
                const loggedBaseline = segmentStartBaselineRef.current ?? (mode === "FOCUS" ? focusTimeLeft : breakTimeLeft);
                const currentRemaining = mode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                const intervalElapsed = Math.max(0, loggedBaseline - currentRemaining);
                accumulatedTimeSecondsRef.current += intervalElapsed;
                segmentStartBaselineRef.current = null;
            }

            endTimeRef.current = null;
            startTimeRef.current = null;
            lastLocalStopRef.current = Date.now();

            // Immediate cloud pause with full snapshot
            if (user) {
                setDoc(doc(db, "users", user.uid, "activeTimer", "current"), {
                    mode,
                    isActive: false,
                    isFocusStarted,
                    isBreakStarted,
                    endTime: null,
                    startTime: null,
                    remainingTime: mode === "FOCUS" ? focusTimeLeft : mode === "BREAK" ? breakTimeLeft : stopwatchElapsed,
                    accumulatedTime: accumulatedTimeSecondsRef.current,
                    segmentBaseline: null,
                    targetDuration: sessionTargetDurationRef.current,
                    originalBaseline: sessionTargetDurationRef.current,
                    selectedSubject,
                    updatedAt: Date.now()
                }, { merge: true }).catch(e => console.error("Failed to sync pause:", e));
            }
        } else {
            // Validate subject before starting focus or stopwatch
            if ((mode === "FOCUS" || mode === "STOPWATCH") && !selectedSubject) {
                return;
            }

            // Prevent cross-mode accumulator leak
            if (lastRunningModeRef.current !== mode) {
                accumulatedTimeSecondsRef.current = 0;
                segmentStartBaselineRef.current = null;
                sessionTargetDurationRef.current = null;
            }
            lastRunningModeRef.current = mode;

            if (mode === "STOPWATCH") {
                startTimeRef.current = Date.now() - (accumulatedTimeSecondsRef.current * 1000);
                endTimeRef.current = null;
            } else {
                const currentLeft = mode === "FOCUS" ? focusTimeLeft : breakTimeLeft;
                if (mode === "FOCUS") setIsFocusStarted(true);
                if (mode === "BREAK") setIsBreakStarted(true);

                if (currentLeft <= 0) {
                    const newTime = mode === "FOCUS" ? baselineFocusSecs : baselineBreakSecs;
                    if (mode === "FOCUS") setFocusTimeLeft(newTime);
                    else setBreakTimeLeft(newTime);
                    endTimeRef.current = Date.now() + newTime * 1000;
                    sessionTargetDurationRef.current = newTime;
                    segmentStartBaselineRef.current = newTime;
                    accumulatedTimeSecondsRef.current = 0;
                } else {
                    endTimeRef.current = Date.now() + currentLeft * 1000;
                    segmentStartBaselineRef.current = currentLeft;
                    // If targetDuration not yet set (fresh start of a non-zero session)
                    if (!sessionTargetDurationRef.current) {
                        sessionTargetDurationRef.current = currentLeft;
                    }
                }
            }
            setIsActive(true);
        }
    }, [isActive, isCompleting, focusTimeLeft, breakTimeLeft, stopwatchElapsed, mode, baselineFocusSecs, baselineBreakSecs, user, selectedSubject, isFocusStarted, isBreakStarted]);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        lastLocalStopRef.current = Date.now();
        if (mode === "FOCUS") setIsFocusStarted(false);
        if (mode === "BREAK") setIsBreakStarted(false);
        endTimeRef.current = null;
        startTimeRef.current = null;
        accumulatedTimeSecondsRef.current = 0;
        segmentStartBaselineRef.current = null;
        sessionTargetDurationRef.current = null;
        if (user) {
            deleteDoc(doc(db, "users", user.uid, "activeTimer", "current"))
                .catch(e => console.error(e));
        }
        if (mode === "FOCUS") setFocusTimeLeft(baselineFocusSecs);
        else if (mode === "BREAK") setBreakTimeLeft(baselineBreakSecs);
        else if (mode === "STOPWATCH") setStopwatchElapsed(0);
        setSelectedSubject("");
    }, [mode, baselineFocusSecs, baselineBreakSecs, user]);

    const adjustTime = useCallback((secondsDelta: number) => {
        if (isActive || (isFocusStarted && mode === "FOCUS")) return;
        if (mode === "STOPWATCH") return;

        sessionTargetDurationRef.current = null;
        segmentStartBaselineRef.current = null;
        accumulatedTimeSecondsRef.current = 0;

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

    const setBaselineWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        sessionTargetDurationRef.current = null;
        segmentStartBaselineRef.current = null;
        accumulatedTimeSecondsRef.current = 0;

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

    const setTimeLeftWrapper = useCallback((seconds: number) => {
        if (isFocusStarted && mode === "FOCUS") return;
        if (mode === "STOPWATCH") return;

        sessionTargetDurationRef.current = null;
        segmentStartBaselineRef.current = null;
        accumulatedTimeSecondsRef.current = 0;

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
