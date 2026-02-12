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
    const { getMonthlyStats, getYearlyOverview } = useHabitContext();
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1100] flex items-center justify-center p-8 backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 48 }} // 48px offset (approx translate-y-12)
                        exit={{ opacity: 0, scale: 0.9, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`relative w-full max-w-6xl max-h-[75vh] overflow-y-auto custom-scrollbar rounded-2xl p-8 shadow-2xl transition-colors ${isDark
                            ? "bg-[#1a1b23] border border-[#2d2e37]"
                            : "bg-white border border-[#e5e5ea]"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-6 right-6 p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                                }`}
                            aria-label="Close modal"
                        >
                            <X size={24} className={isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"} />
                        </button>

                        {/* Header */}
                        <h2 className={`text-[28px] font-bold mb-8 ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                            Monthly Statistics
                        </h2>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {/* Completion Rate */}
                            <div className={`rounded-xl p-5 border ${isDark ? "bg-white/5 border-[#2d2e37]" : "bg-[#f5f5f7] border-[#e5e5ea]"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-[#007bff]" />
                                    <span className={`text-[12px] font-medium uppercase tracking-wider ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                        Completion Rate
                                    </span>
                                </div>
                                <div className={`text-[32px] font-bold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                    {stats.completionRate.toFixed(2)}%
                                </div>
                            </div>

                            {/* Total Completed */}
                            <div className={`rounded-xl p-5 border ${isDark ? "bg-white/5 border-[#2d2e37]" : "bg-[#f5f5f7] border-[#e5e5ea]"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={18} className="text-[#28a745]" />
                                    <span className={`text-[12px] font-medium uppercase tracking-wider ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                        Total Completed
                                    </span>
                                </div>
                                <div className={`text-[32px] font-bold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                    {stats.totalCompleted}
                                </div>
                            </div>

                            {/* Current Streak */}
                            <div className={`rounded-xl p-5 border ${isDark ? "bg-white/5 border-[#2d2e37]" : "bg-[#f5f5f7] border-[#e5e5ea]"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={18} className="text-[#ffc107]" />
                                    <span className={`text-[12px] font-medium uppercase tracking-wider ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                        Current Streak
                                    </span>
                                </div>
                                <div className={`text-[32px] font-bold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                    {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
                                </div>
                            </div>

                            {/* Longest Streak */}
                            <div className={`rounded-xl p-5 border ${isDark ? "bg-white/5 border-[#2d2e37]" : "bg-[#f5f5f7] border-[#e5e5ea]"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={18} className="text-[#dc3545]" />
                                    <span className={`text-[12px] font-medium uppercase tracking-wider ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                        Longest Streak
                                    </span>
                                </div>
                                <div className={`text-[32px] font-bold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                    {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
                                </div>
                            </div>
                        </div>

                        {/* Best Day */}
                        {stats.bestDay && (
                            <div className={`rounded-xl p-5 mb-10 border ${isDark ? "bg-white/5 border-[#2d2e37]" : "bg-[#f5f5f7] border-[#e5e5ea]"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={18} className="text-[#17a2b8]" />
                                    <span className={`text-[12px] font-medium uppercase tracking-wider ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                        Best Day
                                    </span>
                                </div>
                                <div className={`text-[20px] font-semibold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                    Day {stats.bestDay.day} - {stats.bestDay.count} habits completed ({stats.bestDay.percentage.toFixed(2)}%)
                                </div>
                            </div>
                        )}

                        {/* Yearly Overview */}
                        <div>
                            <h3 className={`text-[18px] font-bold mb-6 ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                2026 Overview
                            </h3>

                            {/* Bar Chart */}
                            <div className="flex items-end justify-between gap-2 h-[200px] mb-4">
                                {yearlyData.map((month, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        {/* Bar */}
                                        <div className="w-full flex flex-col justify-end h-full">
                                            <div
                                                className={`w-full rounded-t-lg transition-all duration-500 ${month.percentage > 0 ? "bg-[#007bff]" : isDark ? "bg-white/10" : "bg-black/10"
                                                    }`}
                                                style={{
                                                    height: `${(month.percentage / maxPercentage) * 100}%`,
                                                    minHeight: month.percentage > 0 ? '4px' : '2px'
                                                }}
                                            />
                                        </div>
                                        {/* Month Label */}
                                        <span className={`text-[10px] font-medium ${isDark ? "text-[#98989d]" : "text-[#86868b]"}`}>
                                            {month.month}
                                        </span>
                                        {/* Percentage */}
                                        {month.percentage > 0 && (
                                            <span className={`text-[10px] font-bold ${isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"}`}>
                                                {month.percentage.toFixed(2)}%
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Close Button at Bottom */}
                        <div className="flex justify-end mt-8">
                            <button
                                onClick={onClose}
                                className="bg-[#007bff] hover:bg-[#0069d9] text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-[0_4px_12px_0_rgba(10,132,255,0.3)] active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
