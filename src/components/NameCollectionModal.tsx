"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, User } from "lucide-react";

interface NameCollectionModalProps {
    userId: string;
    onComplete: () => void;
}

export default function NameCollectionModal({ userId, onComplete }: NameCollectionModalProps) {
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = displayName.trim();

        if (!trimmedName) {
            setError("Please enter your name");
            return;
        }

        if (trimmedName.length > 50) {
            setError("Name must be 50 characters or less");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, {
                displayName: trimmedName,
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
            }, { merge: true });
            onComplete();
        } catch (err) {
            console.error("Failed to save display name:", err);
            setError("Failed to save name. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 m-4">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Welcome! 👋
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-center">
                        What should we call you?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Display Name
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={50}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            autoFocus
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-zinc-400">
                            This name will be visible on the leaderboard
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !displayName.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Continue</span>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-xs text-center text-zinc-400">
                    You can change your display name anytime in settings
                </p>
            </div>
        </div>
    );
}
