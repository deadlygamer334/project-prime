"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFocusProgress, FocusSession } from "@/hooks/useFocusProgress";
import { useNotification } from "@/lib/NotificationContext";
import { useTheme } from "@/lib/ThemeContext";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const FocusChart = dynamic(() => import("@/components/sections/FocusChart"), {
    ssr: false,
    loading: () => <PremiumSkeleton height="400px" borderRadius="1.5rem" />
});
import { Clock, BarChart3, PieChart, Trash2 } from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, format } from "date-fns";
import { formatDuration } from "@/lib/dateUtils";
import PremiumSkeleton from "@/components/ui/PremiumSkeleton";
import AppHeader from "@/components/sections/AppHeader";
import DynamicBackground from "@/components/sections/DynamicBackground";

type Timeframe = "day" | "week" | "month" | "year";

export default function FocusProgressPage() {
    const { getSessionsInRange, isLoaded, deleteSession } = useFocusProgress();
    const { showConfirm, showToast } = useNotification();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [timeframe, setTimeframe] = useState<Timeframe>("week");
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayLimit, setDisplayLimit] = useState(5);

    const handleDelete = async (session: FocusSession) => {
        const confirmed = await showConfirm({
            title: "Delete Session",
            description: "Are you sure you want to delete this session? This will also update your total time.",
            confirmText: "Delete",
            cancelText: "Cancel"
        });

        if (!confirmed) return;

        // Optimistic update locally in this component too
        setSessions(prev => prev.filter(s => s.id !== session.id));

        await deleteSession(session);
        showToast("Session deleted successfully", "success");
    };

    // Fetch data when timeframe changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const now = new Date();
            let start, end;

            switch (timeframe) {
                case "day":
                    start = startOfDay(now);
                    end = endOfDay(now);
                    break;
                case "week":
                    start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
                    end = endOfWeek(now, { weekStartsOn: 1 });
                    break;
                case "month":
                    start = startOfMonth(now);
                    end = endOfMonth(now);
                    break;
                case "year":
                    start = startOfYear(now);
                    end = endOfYear(now);
                    break;
            }

            const data = await getSessionsInRange(start, end);
            setSessions(data);
            setDisplayLimit(5); // Reset limit when timeframe changes
            setLoading(false);
        };

        if (isLoaded) {
            fetchData();
        }
    }, [timeframe, isLoaded, getSessionsInRange]);

    const [showBreakdown, setShowBreakdown] = useState(false);

    // Process Data for Chart
    const chartData = useMemo(() => {
        if (!sessions.length) return [];

        const now = new Date();
        const dataMap = new Map<string, any>();

        const initEntry = () => ({ value: 0 });

        if (timeframe === "day") {
            // Group by Hour (0-23)
            for (let i = 0; i < 24; i++) {
                const label = format(new Date().setHours(i, 0, 0, 0), "h a");
                dataMap.set(label, initEntry());
            }
            sessions.forEach(s => {
                const date = new Date(s.timestamp);
                const label = format(date, "h a");
                const entry = dataMap.get(label) || initEntry();

                entry.value += s.duration;
                const subj = s.subject || "Uncategorized";
                entry[subj] = ((entry[subj] as number) || 0) + s.duration;

                dataMap.set(label, entry);
            });
        } else if (timeframe === "week" || timeframe === "month") {
            // Group by Day
            let start = timeframe === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
            let end = timeframe === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

            const days = eachDayOfInterval({ start, end });
            days.forEach(day => {
                const label = format(day, timeframe === "week" ? "EEE" : "d");
                dataMap.set(label, initEntry());
            });

            sessions.forEach(s => {
                const date = new Date(s.timestamp);
                const label = format(date, timeframe === "week" ? "EEE" : "d");
                const entry = dataMap.get(label) || initEntry();

                entry.value += s.duration;
                const subj = s.subject || "Uncategorized";
                entry[subj] = ((entry[subj] as number) || 0) + s.duration;

                dataMap.set(label, entry);
            });
        } else if (timeframe === "year") {
            // Group by Month
            for (let i = 0; i < 12; i++) {
                const label = format(new Date().setMonth(i), "MMM");
                dataMap.set(label, initEntry());
            }
            sessions.forEach(s => {
                const date = new Date(s.timestamp);
                const label = format(date, "MMM");
                const entry = dataMap.get(label) || initEntry();

                entry.value += s.duration;
                const subj = s.subject || "Uncategorized";
                entry[subj] = ((entry[subj] as number) || 0) + s.duration;

                dataMap.set(label, entry);
            });
        }

        return Array.from(dataMap.entries()).map(([name, data]) => ({
            name,
            date: name,
            ...data
        }));
    }, [sessions, timeframe]);

    // Subject Breakdown
    const subjectStats = useMemo(() => {
        const stats: Record<string, number> = {};
        sessions.forEach(s => {
            const subject = s.subject || "Uncategorized";
            stats[subject] = (stats[subject] || 0) + s.duration;
        });

        const total = sessions.reduce((acc, s) => acc + s.duration, 0);
        return Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({
                name,
                value,
                percent: total > 0 ? (value / total) * 100 : 0
            }));
    }, [sessions]);

    // Summary Stats
    const totalFocusTime = useMemo(() => sessions.reduce((acc, s) => acc + s.duration, 0), [sessions]);
    const bestSubject = useMemo(() => subjectStats[0]?.name || "N/A", [subjectStats]);
    const avgSessionLen = useMemo(() => sessions.length > 0 ? (totalFocusTime / sessions.length) : 0, [sessions, totalFocusTime]);

    if (!isLoaded) return (
        <div className="min-h-screen p-8 pt-24 bg-background transition-colors duration-500">
            <div className="max-w-5xl mx-auto space-y-8">
                <PremiumSkeleton height="200px" borderRadius="2rem" />
                <PremiumSkeleton height="400px" borderRadius="2rem" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-500 bg-background text-foreground">
            <AppHeader title="Timer Progress" activePath="/focus-progress" />

            <div className="max-w-6xl mx-auto w-full p-6 md:p-12 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2 opacity-90">
                            Timer Progress
                        </h1>
                    </div>

                    {/* Timeframe Selector - Minimal text only */}
                    <div className="flex items-center gap-1">
                        {(["day", "week", "month", "year"] as Timeframe[]).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-4 py-2 text-sm transition-all duration-300 ${timeframe === tf
                                    ? "opacity-100 font-medium"
                                    : "opacity-40 hover:opacity-70"
                                    }`}
                            >
                                {tf.charAt(0).toUpperCase() + tf.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metric Strip - No Cards */}
                <div className="flex flex-wrap gap-6 md:gap-24 mb-16 pb-8 border-b border-border">
                    <Metric
                        label="Total Timer"
                        value={formatDuration(totalFocusTime)}
                    />
                    <Metric
                        label="Top Subject"
                        value={bestSubject}
                    />
                    <Metric
                        label="Avg Session"
                        value={formatDuration(avgSessionLen)}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="space-y-8">

                    {/* Main Chart - Full Width */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="text-blue-500" />
                                <h2 className="text-xl font-semibold">Activity Graph</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs uppercase tracking-widest font-bold ${showBreakdown ? "" : "opacity-40"}`}>
                                    Breakdown
                                </span>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${showBreakdown ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-800"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${showBreakdown ? "translate-x-4" : ""}`} />
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <PremiumSkeleton height="400px" borderRadius="1.5rem" />
                        ) : (
                            <FocusChart
                                data={chartData}
                                timeframe={timeframe}
                                showBreakdown={showBreakdown}
                                subjects={subjectStats.map(s => s.name)}
                            />
                        )}
                    </section>

                    {/* Lower Section: Subject Split & Recent Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">

                        {/* Subject Breakdown */}
                        <div>
                            <div className="flex items-center gap-3 mb-8 opacity-60">
                                <PieChart size={18} />
                                <h2 className="text-sm font-medium uppercase tracking-widest">Subject Split</h2>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    <PremiumSkeleton height="40px" borderRadius="8px" />
                                    <PremiumSkeleton height="40px" borderRadius="8px" />
                                    <PremiumSkeleton height="40px" borderRadius="8px" />
                                </div>
                            ) : subjectStats.length === 0 ? (
                                <div className="h-40 flex items-center justify-center opacity-40 text-sm">
                                    No data recorded
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {subjectStats.map((stat, idx) => (
                                        <div key={stat.name} className="group">
                                            <div className="flex justify-between items-end mb-3">
                                                <span className="text-lg font-light text-foreground">{stat.name}</span>
                                                <div className="text-right">
                                                    <span className="text-lg font-light tabular-nums text-foreground">
                                                        {formatDuration(stat.value)}
                                                    </span>
                                                    <span className="text-xs opacity-40 ml-2">({stat.percent.toFixed(2)}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-[1px] w-full bg-border overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stat.percent}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut", delay: idx * 0.1 }}
                                                    className="h-full bg-foreground"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Sessions List */}
                        <div>
                            <div className="flex items-center gap-3 mb-8 opacity-60">
                                <Clock size={18} />
                                <h2 className="text-sm font-medium uppercase tracking-widest">History</h2>
                            </div>
                            <div className="space-y-6">
                                {loading ? (
                                    [...Array(3)].map((_, i) => <PremiumSkeleton key={i} height="60px" borderRadius="0px" />)
                                ) : sessions.length === 0 ? (
                                    <p className="opacity-40 text-sm">No sessions in this period.</p>
                                ) : (
                                    <>
                                        {sessions.slice(0, displayLimit).map((session, i) => (
                                            <motion.div
                                                key={session.id || i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between py-4 border-b border-border"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <h4 className="text-base font-medium text-foreground">{session.subject || "Timer"}</h4>
                                                        <p className="text-xs opacity-40 mt-1 uppercase tracking-wider">
                                                            {format(new Date(session.timestamp), "MMM d • h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-base font-medium tabular-nums text-foreground">
                                                            {formatDuration(session.duration)}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDelete(session)}
                                                        className={`p-2 rounded-lg transition-all ${isDark
                                                            ? "hover:bg-red-500/10 text-white/20 hover:text-red-400"
                                                            : "hover:bg-red-500/5 text-black/20 hover:text-red-500"
                                                            }`}
                                                        title="Delete session"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {sessions.length > displayLimit && (
                                            <motion.button
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                onClick={() => setDisplayLimit(prev => prev + 5)}
                                                className={`w-full py-4 text-xs font-bold tracking-widest uppercase opacity-40 hover:opacity-100 transition-all border-b border-transparent hover:border-border mt-2`}
                                            >
                                                Load More ({sessions.length - displayLimit} remaining)
                                            </motion.button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string, value: string | number }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-widest opacity-40 mb-1">{label}</p>
            <h3 className="text-3xl md:text-5xl font-light tracking-tight">{value}</h3>
        </div>
    );
}
