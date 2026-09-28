"use client";

import React from 'react';
import { useHabitContext } from '@/lib/HabitContext';
import { Counter, Reveal } from '../animations/RevealEffect';

export default function OverviewStats() {
  const { habits, getStatsForDay } = useHabitContext();

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
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mt-[24px]">
      {/* Overview Daily Progress Card */}
      <Reveal className="border rounded-[16px] p-[32px] flex flex-col items-center transition-colors duration-300 bg-card border-border gradient-border card-premium">
        <h3 className="text-[14px] font-[600] tracking-[0.05em] uppercase mb-[32px] w-full text-center text-foreground">
          OVERVIEW DAILY PROGRESS
        </h3>

        <div className="relative w-[200px] h-[200px] mb-[24px] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="currentColor"
              strokeWidth="20"
              fill="transparent"
              className="text-muted"
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

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-[600] uppercase tracking-wider text-muted-foreground">
              COMPLETED
            </div>
            <div className="text-[24px] font-[700] text-foreground">
              <Counter value={stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
        </div>

        <div className="flex gap-[24px] mt-[8px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[12px] h-[12px] rounded-[2px] bg-muted"></div>
            <div className="text-[12px] font-[500] uppercase tracking-wide text-muted-foreground">
              LEFT <Counter value={100 - stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
          <div className="flex items-center gap-[8px]">
            <div className="w-[12px] h-[12px] rounded-[2px] bg-primary"></div>
            <div className="text-[12px] font-[500] uppercase tracking-wide text-muted-foreground">
              DONE <Counter value={stats.percent} decimals={2} suffix="%" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Top 5 Daily Habits Card */}
      <Reveal delay={200} className="border rounded-[16px] p-[32px] flex flex-col items-center transition-colors duration-300 bg-card border-border gradient-border card-premium">
        <h3 className="text-[14px] font-[600] tracking-[0.05em] uppercase mb-[32px] w-full text-center text-foreground">
          TOP 5 DAILY HABITS
        </h3>

        <div className="w-full flex flex-col flex-grow min-h-[200px]">
          {topHabits.length === 0 ? (
            <div className="text-center italic text-sm py-10 text-muted-foreground">
              No habits tracked yet
            </div>
          ) : (
            topHabits.map((h, i) => (
              <div key={i} className="w-full flex items-center justify-between border-b py-[12px] border-border">
                <span className="text-[14px] font-medium text-foreground">{i + 1}. {h.name}</span>
                <span className="text-primary font-[600]"><Counter value={h.percent} decimals={2} suffix="%" /></span>
              </div>
            ))
          )}
        </div>
      </Reveal>
    </section>
  );
}
