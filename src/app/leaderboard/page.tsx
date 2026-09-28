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
import { motion, AnimatePresence } from "framer-motion";
import PremiumSkeleton from "@/components/ui/PremiumSkeleton";

export default function LeaderboardPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();
    const { leaderboard, currentUserEntry, isLoading, error } = useLeaderboard(50);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUserId(user?.uid || null);
        });
        return () => unsubscribe();
    }, []);

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes.toFixed(2)}m`;
        return `${(minutes / 60).toFixed(2)}h`;
    };

    // Stagger container for entries
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
            <AppHeader title="Leaderboard" activePath="/leaderboard" />

            <main className="container mx-auto flex-grow py-8 px-6 relative z-10 pb-24 md:pb-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                <Trophy className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight"
                                style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, rgba(167,139,250,0.8) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                Weekly Leaderboard
                            </h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Top performers this week
                        </p>
                        <p className="text-sm mt-2 text-muted-foreground/60">
                            Resets every Monday at 00:00 UTC
                        </p>
                    </motion.div>

                    {/* Current User Rank Card - USES THE NEW currentUserEntry FROM HOOK */}
                    <AnimatePresence>
                        {currentUserEntry && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8 p-6 rounded-2xl border gradient-border card-premium bg-primary/5 border-primary/20 shadow-[0_0_40px_rgba(167,139,250,0.1)] ring-1 ring-primary/30"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${!settings.leaderboardPublic ? "bg-muted text-muted-foreground" :
                                            currentUserEntry.rank === 1 ? "bg-yellow-500 text-white" :
                                                currentUserEntry.rank === 2 ? "bg-gray-400 text-white" :
                                                    currentUserEntry.rank === 3 ? "bg-orange-500 text-white" :
                                                        "bg-primary/20 text-primary"
                                            }`}>
                                            {!settings.leaderboardPublic ? "?" : (currentUserEntry.rank > 0 ? `#${currentUserEntry.rank}` : "?")}
                                        </div>
                                        <div className="max-w-[150px] sm:max-w-none">
                                            <p className="font-semibold text-lg truncate">
                                                {!settings.leaderboardPublic ? "Private Profile Standing" : "Your Current Standing"}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {currentUserEntry.displayName} (You)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-primary">{formatTime(currentUserEntry.weeklyFocusMinutes)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Weekly Progress
                                        </p>
                                    </div>
                                </div>
                                {!settings.leaderboardPublic && (
                                    <p className="mt-4 text-xs text-center text-muted-foreground/60 italic">
                                        You are currently in Private Mode. Enable "Public Leaderboard" in settings to appear in the global list.
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading State with PremiumSkeleton */}
                    {isLoading && (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <PremiumSkeleton key={i} height={80} className="rounded-2xl" />
                            ))}
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
                        <div className="p-12 rounded-2xl border text-center bg-card border-border gradient-border card-premium">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-xl font-semibold mb-2">No data yet</h3>
                            <p className="text-muted-foreground">
                                Complete focus sessions to appear on the leaderboard!
                            </p>
                        </div>
                    )}

                    {/* Leaderboard List with Staggered Animations */}
                    {!isLoading && !error && leaderboard.length > 0 && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-3"
                        >
                            {leaderboard.map((entry, index) => {
                                const isCurrentUser = entry.userId === currentUserId;
                                const isTop1 = index === 0;
                                const isTop2 = index === 1;
                                const isTop3 = index === 2;

                                return (
                                    <motion.div
                                        key={entry.userId}
                                        variants={itemVariants}
                                        className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] gradient-border shimmer-hover card-premium ${isCurrentUser
                                            ? "bg-primary/5 border-primary/20 shadow-[0_0_40px_rgba(167,139,250,0.1)] ring-1 ring-primary/30"
                                            : isTop1
                                                ? "border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                                : isTop2
                                                    ? "border-slate-400/30 bg-slate-400/5"
                                                    : isTop3
                                                        ? "border-amber-700/30 bg-amber-700/5"
                                                        : "bg-card border-border hover:bg-muted/30"
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                {/* Rank Badge */}
                                                <div className="shrink-0">
                                                    {isTop1 ? (
                                                        <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                                            <Trophy size={20} className="text-yellow-500" />
                                                        </div>
                                                    ) : isTop2 ? (
                                                        <div className="p-2.5 rounded-xl bg-slate-400/10 border border-slate-400/20">
                                                            <Medal size={20} className="text-slate-300" />
                                                        </div>
                                                    ) : isTop3 ? (
                                                        <div className="p-2.5 rounded-xl bg-amber-700/10 border border-amber-700/20">
                                                            <Award size={20} className="text-amber-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                                                            #{entry.rank}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-lg flex items-center gap-2 truncate">
                                                        <span className="truncate">{entry.displayName}</span>
                                                        {isCurrentUser && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                                                                YOU
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {index === 0 ? "Weekly Champion" : `Rank #${entry.rank}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Focus Time */}
                                            <div className="text-left sm:text-right w-full sm:w-auto pl-[56px] sm:pl-0">
                                                <div className="flex items-center gap-2 justify-start sm:justify-end">
                                                    <Flame className={`w-5 h-5 ${index < 3 ? "text-orange-500 animate-pulse" : "text-muted-foreground"}`} />
                                                    <p className={`text-2xl font-bold ${index < 3 ? "text-orange-500" : ""}`}>{formatTime(entry.weeklyFocusMinutes)}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Focus Minutes
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Stats Footer */}
                    {!isLoading && !error && leaderboard.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 p-6 rounded-2xl border text-center bg-card border-border gradient-border card-premium"
                        >
                            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {leaderboard.length} {leaderboard.length === 1 ? "person" : "people"} competing globally this week
                            </p>
                        </motion.div>
                    )}
                </div>
            </main>

            {settings.showFooter && <Footer />}
        </div>
    );
}
