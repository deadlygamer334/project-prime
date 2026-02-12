"use client";

import React from 'react';
import { useHabitContext } from '@/lib/HabitContext';
import { useTheme } from '@/lib/ThemeContext';
import { Counter, Reveal } from '../animations/RevealEffect';

export default function OverviewStats() {
  const { habits, getStatsForDay } = useHabitContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date().getDate();
  const stats = getStatsForDay(today);

  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (stats.percent / 100) * circumference;

  const todayDate = new Date();
  const currentMonthKey = `${todayDate.getFullYear()}-${todayDate.getMonth()}`;
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();

  const topHabits = habits
    .map(h => {
      const monthData = h.completions[currentMonthKey] || {};
      const completedDays = Object.values(monthData).filter(Boolean).length;
      return {
        name: h.name,
        percent: (completedDays / daysInMonth) * 100
      };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  return (
    <section className="habit-overview-section grid grid-cols-1 lg:grid-cols-2 gap-[24px] mt-[24px]">
      {/* Overview Daily Progress Card */}
      <Reveal className={`habit-overview-card border rounded-[16px] p-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] flex flex-col items-center transition-colors duration-300 ${isDark ? "bg-[rgba(255,255,255,0.06)] border-[#2d2e37] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" : "bg-white border-[#e5e5ea]"
        }`}>
        <h3 className={`habit-overview-title text-[14px] font-[600] tracking-[0.05em] uppercase mb-[32px] w-full text-center ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          OVERVIEW DAILY PROGRESS
        </h3>

        <div className="habit-donut-container relative w-[200px] h-[200px] mb-[24px] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke={isDark ? "#333" : "#e5e5ea"}
              strokeWidth="20"
              fill="transparent"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="currentColor"
              strokeWidth="20"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="habit-donut-center absolute inset-0 flex flex-col items-center justify-center">
            <div className={`habit-donut-label text-[10px] font-[600] uppercase tracking-wider ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
              COMPLETED
            </div>
            <div className={`habit-donut-value text-[24px] font-[700] ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
              <Counter value={stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
        </div>

        <div className="habit-donut-legend flex gap-[24px] mt-[8px]">
          <div className="habit-donut-legend-item flex items-center gap-[8px]">
            <div className={`habit-donut-legend-color w-[12px] h-[12px] rounded-[2px] ${isDark ? "bg-[#333]" : "bg-[#e5e5ea]"}`}></div>
            <div className={`habit-donut-legend-text text-[12px] font-[500] uppercase tracking-wide ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
              LEFT <Counter value={100 - stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
          <div className="habit-donut-legend-item flex items-center gap-[8px]">
            <div className="habit-donut-legend-color w-[12px] h-[12px] rounded-[2px] bg-primary"></div>
            <div className={`habit-donut-legend-text text-[12px] font-[500] uppercase tracking-wide ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
              DONE <Counter value={stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Top 10 Daily Habits Card */}
      <Reveal delay={200} className={`habit-overview-card border rounded-[16px] p-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] flex flex-col items-center transition-colors duration-300 ${isDark ? "bg-[rgba(255,255,255,0.06)] border-[#2d2e37] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" : "bg-white border-[#e5e5ea]"
        }`}>
        <h3 className={`habit-overview-title text-[14px] font-[600] tracking-[0.05em] uppercase mb-[32px] w-full text-center ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          TOP 5 DAILY HABITS
        </h3>

        <div className="habit-top-habits w-full flex flex-col flex-grow min-h-[200px]">
          {topHabits.length === 0 ? (
            <div className={`text-center italic text-sm py-10 ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
              No habits tracked yet
            </div>
          ) : (
            topHabits.map((h, i) => (
              <div key={i} className={`w-full flex items-center justify-between border-b py-[12px] ${isDark ? "border-[#2d2e37]" : "border-[#e5e5ea]"}`}>
                <span className={`text-[14px] font-medium ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>{i + 1}. {h.name}</span>
                <span className="text-primary font-[600]"><Counter value={h.percent} decimals={2} suffix="%" /></span>
              </div>
            ))
          )}
        </div>
      </Reveal>
    </section>
  );
}
