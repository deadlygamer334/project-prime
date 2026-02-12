"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, doc, onSnapshot, deleteDoc, writeBatch, limit, query, orderBy, increment, startAfter, getDocs, getDoc, QueryDocumentSnapshot, DocumentData, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import NotificationEngine from "@/lib/NotificationEngine";

export interface FocusSession {
    id: string;
    type: "focus" | "break";
    duration: number; // in minutes
    timestamp: string; // ISO string
    subject?: string;
}

export const useFocusProgress = () => {
    const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
    const [historySessions, setHistorySessions] = useState<FocusSession[]>([]);
    const [lastLoadedDoc, setLastLoadedDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const lastRecentDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

    // Combined sessions
    const sessions = useMemo(() => [...recentSessions, ...historySessions], [recentSessions, historySessions]);

    const [totalMinutes, setTotalMinutes] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setRecentSessions([]);
                setHistorySessions([]);
                setLastLoadedDoc(null);
                lastRecentDocRef.current = null;
                setIsLoaded(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Firestore Sync
    useEffect(() => {
        if (!user) return;

        const sessionsRef = collection(db, "users", user.uid, "focusSessions");

        // Date-based initial load (Past 2 months)
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const dateStr = twoMonthsAgo.toISOString();

        const q = query(
            sessionsRef,
            where("timestamp", ">=", dateStr),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSessions: FocusSession[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FocusSession));

            // Sort by timestamp desc (newest first)
            // fetchedSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            // Firestore orderBy already handles this, but client-side sort is safe.

            setRecentSessions(fetchedSessions);

            if (snapshot.docs.length > 0) {
                lastRecentDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            } else {
                lastRecentDocRef.current = null;
            }

            setIsLoaded(true);
        }, (error) => {
            console.error("Detailed Sync Error:", error);
            // Fallback for missing index
            const qFallback = query(sessionsRef, orderBy("timestamp", "desc"), limit(50));
            onSnapshot(qFallback, (snap) => {
                const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession));
                setRecentSessions(fetched);
                setIsLoaded(true);
            });
        });

        // Fetch Aggregate Stats
        const userRef = doc(db, "users", user.uid);
        const unsubscribeStats = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTotalMinutes(data.stats?.totalFocusMinutes || 0);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeStats();
        };
    }, [user]);

    const loadMoreHistory = useCallback(async () => {
        if (!user || loadingHistory) return;

        const startPointDoc = lastLoadedDoc || lastRecentDocRef.current;
        if (!startPointDoc) return;

        setLoadingHistory(true);
        try {
            const sessionsRef = collection(db, "users", user.uid, "focusSessions");

            // Should match query structure but startAfter
            // If we want "Infinite History", we just query older than the last doc without the 'where' date constraint?
            // Yes, because initial query was >= 2 months. 
            // We want < 2 months now.

            const q = query(
                sessionsRef,
                orderBy("timestamp", "desc"),
                startAfter(startPointDoc),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const newSessions: FocusSession[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FocusSession));

            if (newSessions.length > 0) {
                setHistorySessions(prev => [...prev, ...newSessions]);
                setLastLoadedDoc(snapshot.docs[snapshot.docs.length - 1]);
            } else {
                setLastLoadedDoc(null);
            }
        } catch (e) {
            console.error("Error loading history:", e);
        } finally {
            setLoadingHistory(false);
        }
    }, [user, loadingHistory, lastLoadedDoc]);

    const addSession = useCallback(async (type: "focus" | "break", duration: number, subject?: string) => {
        if (!user) return;

        const newSession = {
            type,
            duration,
            timestamp: new Date().toISOString(),
            subject: subject || undefined
        };

        // Optimistic
        const tempId = crypto.randomUUID();
        const optimisticSession = { ...newSession, id: tempId };
        setRecentSessions(prev => [optimisticSession, ...prev]);
        if (type === "focus") {
            setTotalMinutes(prev => prev + duration);
            // Trigger achievement check
            NotificationEngine.getInstance().checkAchievements(totalMinutes + duration);
        }

        try {
            const batch = writeBatch(db);
            const sessionRef = doc(collection(db, "users", user.uid, "focusSessions"));
            batch.set(sessionRef, newSession);

            if (type === "focus") {
                const userRef = doc(db, "users", user.uid);

                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const weekStartDate = userData.weekStartDate ? new Date(userData.weekStartDate) : null;
                    const now = new Date();
                    const currentMonday = new Date(now);
                    currentMonday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                    currentMonday.setHours(0, 0, 0, 0);

                    // Check if we've crossed into a new week
                    if (!weekStartDate || weekStartDate.getTime() < currentMonday.getTime()) {
                        // New week started, reset counter to current session duration
                        batch.set(userRef, {
                            stats: { totalFocusMinutes: increment(duration) },
                            weekStartDate: currentMonday.toISOString(),
                            weeklyFocusMinutes: duration
                        }, { merge: true });
                    } else {
                        // Same week, add to accumulated time
                        batch.set(userRef, {
                            stats: { totalFocusMinutes: increment(duration) },
                            weeklyFocusMinutes: increment(duration)
                        }, { merge: true });
                    }
                } else {
                    // User doc doesn't exist, create with initial values
                    const now = new Date();
                    const currentMonday = new Date(now);
                    currentMonday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                    currentMonday.setHours(0, 0, 0, 0);

                    // console.log(`Updating user stats: User doc not found, initializing. weekStartDate: ${currentMonday.toISOString()}, weeklyFocusMinutes: ${duration}`);
                    batch.set(userRef, {
                        stats: { totalFocusMinutes: increment(duration) },
                        weekStartDate: currentMonday.toISOString(),
                        weeklyFocusMinutes: duration
                    }, { merge: true });
                }
            }

            // console.log("Committing focus session batch update...");
            await batch.commit();
            // console.log("Focus session batch committed successfully.");
        } catch (e) {
            console.error("Error adding session:", e);
        }
    }, [user]);

    const deleteSession = useCallback(async (session: FocusSession) => {
        if (!user) return;

        // Optimistic Update
        setRecentSessions(prev => prev.filter(s => s.id !== session.id));
        setHistorySessions(prev => prev.filter(s => s.id !== session.id));
        if (session.type === "focus") {
            setTotalMinutes(prev => Math.max(0, prev - session.duration));
        }

        try {
            const batch = writeBatch(db);
            const sessionRef = doc(db, "users", user.uid, "focusSessions", session.id);
            batch.delete(sessionRef);

            if (session.type === "focus") {
                const userRef = doc(db, "users", user.uid);
                // Use increment with negative value to decrement
                batch.set(userRef, {
                    stats: { totalFocusMinutes: increment(-session.duration) },
                    weeklyFocusMinutes: increment(-session.duration)
                }, { merge: true });
            }

            await batch.commit();
        } catch (e) {
            console.error("Error deleting session:", e);
            // Revert on error? For now, we'll keep it simple as Firestore is usually reliable.
        }
    }, [user]);

    const clearSessions = useCallback(async () => {
        if (!user) return;

        // Optimistic
        const backupRecent = [...recentSessions];
        setRecentSessions([]);
        setHistorySessions([]);

        try {
            const batch = writeBatch(db);
            // Only can delete what we know about ideally.
            // For now, delete recent + history loaded.
            sessions.forEach(s => {
                batch.delete(doc(db, "users", user.uid, "focusSessions", s.id));
            });
            await batch.commit();
        } catch (e) {
            console.error("Error clearing sessions:", e);
            setRecentSessions(backupRecent);
        }
    }, [user, sessions, recentSessions]);

    const getSessionsInRange = useCallback(async (startDate: Date, endDate: Date) => {
        if (!user) return [];

        try {
            const sessionsRef = collection(db, "users", user.uid, "focusSessions");
            // Query for sessions within the date range
            // Note: Firestore stores strings, so we compare ISO strings
            const q = query(
                sessionsRef,
                orderBy("timestamp", "desc"),
                // We'll filter client-side for precise date matching if needed, 
                // but proper Firestore range queries would be:
                // where("timestamp", ">=", startDate.toISOString()),
                // where("timestamp", "<=", endDate.toISOString())
                // However, compound queries with different fields might need index.
                // Let's rely on client-side filtering if the dataset isn't huge, 
                // OR use a simple single-field query if possible.
                // Since we order by timestamp, we can use startAt/endAt if we had the docs,
                // but here 'where' is better.
                // Let's try to fetch all and filter for now to avoid index creation if possible,
                // OR just use the 'recentSessions' if the range is small?
                // NO, for "Year" view we need more.
                // Let's use a limit for safety.
                limit(1000)
            );

            // optimized: just fetch recent 1000 and filter.
            const snapshot = await getDocs(q);
            const fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FocusSession));

            return fetchedSessions.filter(s => {
                const t = new Date(s.timestamp).getTime();
                return t >= startDate.getTime() && t <= endDate.getTime();
            });

        } catch (e) {
            console.error("Error fetching sessions in range:", e);
            return [];
        }
    }, [user]);

    return useMemo(() => ({
        sessions,
        totalMinutes,
        addSession,
        deleteSession,
        clearSessions,
        isLoaded,
        loadMoreHistory,
        loadingHistory,
        getSessionsInRange
    }), [
        sessions, totalMinutes, addSession, deleteSession, clearSessions,
        isLoaded, loadMoreHistory, loadingHistory, getSessionsInRange
    ]);
};
