"use client";

import React from 'react';
import { useHabitContext } from '@/lib/HabitContext';
import { useTheme } from '@/lib/ThemeContext';
import { Counter, Reveal } from '../animations/RevealEffect';

interface DayData {
  dayName: string;
  dayNum: string;
  count: number;
}

interface WeekProps {
  weekNum: number;
  dateRange: string;
  days: DayData[];
  completed: string;
  percent: number;
}

const WeeklyProgressCard: React.FC<WeekProps> = ({ weekNum, dateRange, days, completed, percent }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`border rounded-[12px] p-6 flex flex-col min-h-[280px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 ${isDark ? "bg-[#111218] border-[#2d2e37] shadow-[0_10px_30px_rgba(0,0,0,0.5)]" : "bg-white border-[#e5e5ea]"
      }`}>
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        <h3 className={`text-[14px] font-semibold tracking-widest uppercase ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          WEEK {weekNum}
        </h3>
        <span className={`text-[12px] font-medium ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
          {dateRange}
        </span>
      </div>

      {/* Days Labels */}
      <div className="flex justify-between mb-4 px-1">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <span className={`text-[10px] mb-1 leading-none ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>{day.dayName}</span>
            <span className={`text-[10px] leading-none ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>{day.dayNum}</span>
          </div>
        ))}
      </div>

      {/* Bar Chart Representation */}
      <div className="flex items-end justify-between flex-1 gap-2 mb-6 px-1">
        {days.map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
            <div className="w-full relative h-[40px] flex flex-col justify-end">
              <div
                className={`w-full bg-primary rounded-full transition-all duration-500 ${day.count > 0 ? 'shadow-[0_0_8px_rgba(var(--primary),0.5)] opacity-100' : 'opacity-20'}`}
                style={{ height: day.count > 0 ? `${Math.min(day.count * 10, 40)}px` : '3px' }}
              />
            </div>
            <span className={`text-[10px] mt-1 font-medium ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>{day.count}</span>
          </div>
        ))}
      </div>

      {/* Bottom Summary Stats */}
      <div className={`flex justify-between items-center mt-auto pt-4 border-t ${isDark ? "border-[#2d2e37]/50" : "border-[#e5e5ea]"}`}>
        <div className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          {completed}
        </div>
        <div className={`text-[12px] ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
          <Counter value={percent} decimals={2} suffix="%" />
        </div>
      </div>
    </div>
  );
};

const WeeklyCards: React.FC = () => {
  const { getStatsForDay, habits } = useHabitContext();

  const getWeekData = (start: number, end: number) => {
    let weekTotal = 0;
    let weekCompleted = 0;
    const days: DayData[] = [];

    for (let d = start; d <= end; d++) {
      const stats = getStatsForDay(d);
      weekTotal += stats.total;
      weekCompleted += stats.completed;

      const date = new Date(2026, 0, d);
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
        dayNum: d.toString(),
        count: stats.completed
      });
    }

    const percent = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;

    return {
      days,
      completed: `${weekCompleted}/${weekTotal}`,
      percent
    };
  };

  const weeksData = [
    { weekNum: 1, dateRange: "Jan 1 - Jan 3", ...getWeekData(1, 3) },
    { weekNum: 2, dateRange: "Jan 4 - Jan 10", ...getWeekData(4, 10) },
    { weekNum: 3, dateRange: "Jan 11 - Jan 17", ...getWeekData(11, 17) },
    { weekNum: 4, dateRange: "Jan 18 - Jan 24", ...getWeekData(18, 24) },
    { weekNum: 5, dateRange: "Jan 25 - Jan 31", ...getWeekData(25, 31) },
  ];

  return (
    <div className="w-full mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[16px]">
        {weeksData.map((week, i) => (
          <Reveal key={week.weekNum} delay={i * 100}>
            <WeeklyProgressCard {...week} />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCards;
