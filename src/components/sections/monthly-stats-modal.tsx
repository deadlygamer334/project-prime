"use client";

import React, { useEffect } from "react";
import { X, TrendingUp, Calendar, Award, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabitContext } from "@/lib/HabitContext";
import { useTheme } from "@/lib/ThemeContext";

interface MonthlyStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MonthlyStatsModal({ isOpen, onClose }: MonthlyStatsModalProps) {
    const { getMonthlyStats, getYearlyOverview, currentMonth, currentYear } = useHabitContext();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const stats = getMonthlyStats();
    const yearlyData = getYearlyOverview();
    const maxPercentage = Math.max(...yearlyData.map(d => d.percentage), 1);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const containerVariants: any = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-8 overflow-hidden"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[2rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-2xl transition-colors ${isDark
                            ? "bg-[#0a0a0c]/80"
                            : "bg-white/80"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glow Effect */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--color-primary)] opacity-10 blur-[100px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--color-primary)] opacity-10 blur-[100px] pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-6 right-6 p-2.5 rounded-2xl transition-all active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 text-white/50" : "bg-black/5 hover:bg-black/10 text-black/50"}`}
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <motion.div variants={itemVariants} className="mb-10">
                            <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${isDark ? "text-white" : "text-black"}`}>
                                {months[currentMonth]} <span className="text-[var(--color-primary)] opacity-90">{currentYear}</span> Stats
                            </h2>
                            <p className="text-sm font-medium opacity-50 uppercase tracking-[0.2em]">Detailed Analytics Overview</p>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                            {[
                                { label: "Completion Rate", value: `${stats.completionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-[var(--color-primary)]" },
                                { label: "Total Habits Done", value: stats.totalCompleted, icon: Target, color: "text-emerald-500" },
                                { label: "Current Streak", value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`, icon: Award, color: "text-amber-500" },
                                { label: "Perfect Streak", value: `${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`, icon: Award, color: "text-rose-500" }
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className={`relative group flex flex-col p-6 rounded-3xl border transition-all ${isDark
                                        ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                                        : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04] hover:border-black/10"
                                        }`}
                                >
                                    <div className={`p-3 w-fit rounded-2xl mb-4 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                                        <stat.icon size={20} className={stat.color} />
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-1 opacity-50`}>
                                        {stat.label}
                                    </span>
                                    <div className={`text-3xl font-black ${isDark ? "text-white" : "text-black"}`}>
                                        {stat.value}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Best Day Highlight */}
                        {stats.bestDay && (
                            <motion.div
                                variants={itemVariants}
                                className={`group relative overflow-hidden rounded-[2rem] p-8 mb-12 border ${isDark
                                    ? "bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent border-white/5"
                                    : "bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent border-black/5"
                                    }`}
                            >
                                <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--color-primary)] opacity-5 blur-[50px] group-hover:opacity-10 transition-opacity" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-50 block mb-1">Peak Performance Day</span>
                                            <h4 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                                                Day {stats.bestDay.day} of {months[currentMonth]}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center md:text-right">
                                            <div className="text-2xl font-black text-[var(--color-primary)]">{stats.bestDay.count}</div>
                                            <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Completed</div>
                                        </div>
                                        <div className="h-8 w-px bg-current opacity-10 hidden md:block" />
                                        <div className="text-center md:text-right">
                                            <div className="text-2xl font-black text-[var(--color-primary)]">{stats.bestDay.percentage.toFixed(0)}%</div>
                                            <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Success Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Yearly Overview */}
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                                    Yearly Performance Overview
                                </h3>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-black/5 border-black/10 text-black/50"}`}>
                                    Year {currentYear}
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="relative group p-6 rounded-[2rem] border bg-white/[0.01] border-white/5">
                                <div className="flex items-end justify-between gap-2 md:gap-4 h-[180px]">
                                    {yearlyData.map((month, index) => {
                                        const isCurrent = index === currentMonth;
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center group/bar max-w-[50px]">
                                                <div className="relative w-full flex flex-col justify-end h-full">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none mb-2 z-20">
                                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-xl border ${isDark ? "bg-[#1a1b23] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}>
                                                            {month.percentage.toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(month.percentage / maxPercentage) * 100}%` }}
                                                        transition={{ delay: 0.5 + (index * 0.05), duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                        className={`w-full rounded-full transition-all duration-300 relative ${isCurrent ? "shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" : "opacity-60 hover:opacity-100"}`}
                                                        style={{
                                                            background: isCurrent
                                                                ? 'var(--color-primary)'
                                                                : 'linear-gradient(to top, var(--color-primary), var(--color-primary))',
                                                            minHeight: month.percentage > 0 ? '6px' : '2px'
                                                        }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-bold mt-4 transition-all ${isCurrent ? "text-[var(--color-primary)] scale-110" : "opacity-40"}`}>
                                                    {month.month}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>

                        {/* Footer Actions */}
                        <motion.div variants={itemVariants} className="flex justify-center md:justify-end mt-12">
                            <button
                                onClick={onClose}
                                className={`group relative px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95`}
                                style={{
                                    backgroundColor: "var(--color-button)",
                                    color: "var(--color-button-foreground)",
                                }}
                            >
                                <span className="relative z-10">Return to Grid</span>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
