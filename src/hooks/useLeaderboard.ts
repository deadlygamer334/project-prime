"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDocs, getCountFromServer } from "firebase/firestore";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    weeklyFocusMinutes: number;
    rank: number;
}

const getWeekStartUTC = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // 0 is Sunday, so 6 days ago is Monday
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
};

export const useLeaderboard = (maxEntries: number = 100) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weekStart, setWeekStart] = useState(getWeekStartUTC().toISOString());

    // Midnight Refresh: Check for week rollover every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const current = getWeekStartUTC().toISOString();
            if (current !== weekStart) {
                setWeekStart(current);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [weekStart]);

    useEffect(() => {
        try {
            const usersRef = collection(db, "users");

            // GHOST FILTER: Only users who have updated their score THIS week
            const q = query(
                usersRef,
                where("weekStartDate", "==", weekStart),
                where("weeklyFocusMinutes", ">", 0),
                where("leaderboardPublic", "==", true),
                orderBy("weeklyFocusMinutes", "desc"),
                limit(maxEntries)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        userId: doc.id,
                        displayName: data.displayName || "Anonymous",
                        weeklyFocusMinutes: data.weeklyFocusMinutes || 0,
                        rank: index + 1,
                    };
                });

                setLeaderboard(entries);
                setIsLoading(false);
            }, (err: any) => {
                console.error("Firestore Leaderboard Error:", err);
                if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                    setError("Leaderboard setup required: A new index is building. Please check the console link if it appeared previously.");
                } else {
                    setError(`Leaderboard Error: ${err.message}`);
                }
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error setting up leaderboard listener:", err);
            setError("Failed to initialize leaderboard");
            setIsLoading(false);
        }
    }, [maxEntries, weekStart]);

    // Independent effect to fetch current user's rank/stats if they are logged in
    useEffect(() => {
        const authUser = auth.currentUser;
        if (!authUser) {
            setCurrentUserEntry(null);
            return;
        }

        const userRef = doc(db, "users", authUser.uid);
        const unsubscribe = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // If user's data is older than this week, their rank card should show 0 minutes
                if (data.weekStartDate !== weekStart) {
                    setCurrentUserEntry({
                        userId: authUser.uid,
                        displayName: data.displayName || "Anonymous",
                        weeklyFocusMinutes: 0,
                        rank: 0
                    });
                    return;
                }

                const entryInList = leaderboard.find(e => e.userId === authUser.uid);

                if (entryInList) {
                    setCurrentUserEntry(entryInList);
                } else {
                    try {
                        const usersRef = collection(db, "users");
                        const rankQuery = query(
                            usersRef,
                            where("weekStartDate", "==", weekStart),
                            where("weeklyFocusMinutes", ">", data.weeklyFocusMinutes || 0),
                            where("leaderboardPublic", "==", true)
                        );

                        // QUOTA-SAFE optimization: Get count instead of fetching all docs
                        const snapshot = await getCountFromServer(rankQuery);
                        const count = snapshot.data().count;

                        setCurrentUserEntry({
                            userId: authUser.uid,
                            displayName: data.displayName || "Anonymous",
                            weeklyFocusMinutes: data.weeklyFocusMinutes || 0,
                            rank: count + 1
                        });
                    } catch (e) {
                        console.error("Error calculating user rank:", e);
                        setCurrentUserEntry({
                            userId: authUser.uid,
                            displayName: data.displayName || "Anonymous",
                            weeklyFocusMinutes: data.weeklyFocusMinutes || 0,
                            rank: 0
                        });
                    }
                }
            } else {
                setCurrentUserEntry(null);
            }
        });

        return () => unsubscribe();
    }, [leaderboard, weekStart]);

    return { leaderboard, currentUserEntry, isLoading, error };
};
