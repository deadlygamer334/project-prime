"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import AppHeader from "@/components/sections/AppHeader";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import { Trophy, Medal, Award, TrendingUp, Loader2, ArrowLeft, Flame } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();
    const router = useRouter();
    const { leaderboard, isLoading, error } = useLeaderboard(5);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setCurrentUserId(user.uid);
        }
    }, []);

    const currentUserRank = leaderboard.find(entry => entry.userId === currentUserId);

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes.toFixed(2)}m`;
        return `${(minutes / 60).toFixed(2)}h`;
    };

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
            <AppHeader title="Leaderboard" activePath="/leaderboard" />

            <main className="container mx-auto flex-grow py-8 px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Trophy className="w-12 h-12 text-yellow-500" />
                            <h1 className="text-4xl font-bold">Weekly Leaderboard</h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Top performers this week
                        </p>
                        <p className="text-sm mt-2 text-muted-foreground/60">
                            Resets every Monday at 00:00
                        </p>
                    </div>

                    {/* Current User Rank Card */}
                    {currentUserRank && (
                        <div className="mb-8 p-6 rounded-2xl border backdrop-blur-md bg-card border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-primary/20 text-primary">
                                        #{currentUserRank.rank}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Your Rank</p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentUserRank.displayName}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{formatTime(currentUserRank.weeklyFocusMinutes)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Focus Time
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading leaderboard...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-6 rounded-2xl border text-center bg-destructive/10 border-destructive/20 text-destructive">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && leaderboard.length === 0 && (
                        <div className="p-12 rounded-2xl border text-center bg-card border-border">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-xl font-semibold mb-2">No data yet</h3>
                            <p className="text-muted-foreground">
                                Complete focus sessions to appear on the leaderboard!
                            </p>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    {!isLoading && !error && leaderboard.length > 0 && (
                        <div className="space-y-3">
                            {leaderboard.map((entry, index) => {
                                const isCurrentUser = entry.userId === currentUserId;
                                const isTop3 = index < 3;

                                return (
                                    <div
                                        key={entry.userId}
                                        className={`p-5 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${isCurrentUser
                                            ? "bg-primary/20 border-primary/40 ring-2 ring-primary/30"
                                            : isTop3
                                                ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
                                                : "bg-card border-border hover:bg-muted/50"
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                {/* Rank Badge */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" :
                                                    index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white" :
                                                        index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                                                            "bg-muted text-muted-foreground"
                                                    }`}>
                                                    {index === 0 ? <Trophy className="w-6 h-6" /> :
                                                        index === 1 ? <Medal className="w-6 h-6" /> :
                                                            index === 2 ? <Award className="w-6 h-6" /> :
                                                                `#${entry.rank}`}
                                                </div>

                                                {/* User Info */}
                                                <div>
                                                    <p className="font-semibold text-lg flex items-center gap-2">
                                                        {entry.displayName}
                                                        {isCurrentUser && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Rank #{entry.rank}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Focus Time */}
                                            <div className="text-left sm:text-right w-full sm:w-auto pl-[64px] sm:pl-0">
                                                <div className="flex items-center gap-2 justify-start sm:justify-end">
                                                    <Flame className={`w-5 h-5 ${isTop3 ? "text-orange-500" : "text-muted-foreground"}`} />
                                                    <p className="text-2xl font-bold">{formatTime(entry.weeklyFocusMinutes)}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Focus Time
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Stats Footer */}
                    {!isLoading && !error && leaderboard.length > 0 && (
                        <div className="mt-8 p-6 rounded-2xl border backdrop-blur-md text-center bg-card border-border">
                            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {leaderboard.length} {leaderboard.length === 1 ? "person" : "people"} competing this week
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {settings.showFooter && <Footer />}
        </div>
    );
}
