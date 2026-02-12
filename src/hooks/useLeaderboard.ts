"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    weeklyFocusMinutes: number;
    rank: number;
}

export const useLeaderboard = (maxEntries: number = 100) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const usersRef = collection(db, "users");
            // Query users with weeklyFocusMinutes > 0, ordered by weeklyFocusMinutes descending
            const q = query(
                usersRef,
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
            }, (err) => {
                console.error("Firestore Leaderboard Error:", err);
                setError(`Leaderboard Error: ${err.message}`);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error setting up leaderboard listener:", err);
            setError("Failed to initialize leaderboard");
            setIsLoading(false);
        }
    }, [maxEntries]);

    return { leaderboard, isLoading, error };
};
