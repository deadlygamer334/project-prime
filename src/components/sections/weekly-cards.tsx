"use client";

import React, { useMemo } from 'react';
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
    <div className={`group border rounded-2xl p-5 flex flex-col min-h-[260px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark
      ? "bg-[#111218]/80 backdrop-blur-md border-[#2d2e37] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      : "bg-white/80 backdrop-blur-md border-[#e5e5ea] shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
      }`}>
      {/* Card Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h3 className={`text-[11px] font-black tracking-widest uppercase mb-0.5 ${isDark ? "text-primary/90" : "text-primary"}`}>
            Week {weekNum}
          </h3>
          <span className={`text-[13px] font-bold ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
            {dateRange}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${isDark ? "bg-white/5 text-[#a0a0a0]" : "bg-black/5 text-[#86868b]"
          }`}>
          {percent >= 100 ? "Perfect" : percent >= 80 ? "Great" : percent >= 50 ? "Steady" : "Starting"}
        </div>
      </div>

      {/* Days Representation */}
      <div className="flex items-end justify-between flex-1 gap-1.5 mb-5 px-0.5">
        {days.map((day, idx) => {
          const hasCompletion = day.count > 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group/day">
              <div className="w-full relative h-[60px] flex flex-col justify-end mb-2">
                {/* Bar */}
                <div
                  className={`w-full rounded-full transition-all duration-500 ease-out relative ${hasCompletion
                    ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]'
                    : isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}
                  style={{ height: hasCompletion ? `${Math.max((day.count / 5) * 60, 4)}px` : '4px' }}
                >
                  {hasCompletion && (
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-full" />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[9px] font-black uppercase ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
                  {day.dayName}
                </span>
                <span className={`text-[10px] font-medium leading-none ${isDark ? "text-white/40" : "text-black/40"}`}>
                  {day.dayNum}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className={`flex justify-between items-end mt-auto pt-4 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
        <div className="flex flex-col">
          <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>Completion</span>
          <div className={`text-[18px] font-black leading-none ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
            {completed}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>Progress</span>
          <div className={`text-[14px] font-bold leading-none ${isDark ? "text-primary" : "text-primary"}`}>
            <Counter value={percent} decimals={0} suffix="%" />
          </div>
        </div>
      </div>
    </div>
  );
};

const WeeklyCards: React.FC = () => {
  const { getStatsForDay, currentMonth, currentYear } = useHabitContext();

  const weeksData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeks: any[] = [];

    let currentWeekDays: DayData[] = [];
    let weekStartDay = 1;
    let weekNum = 1;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      // Day of week: 0 (Sun) to 6 (Sat). We want Monday (1) to be start, Sunday (0) end.
      const dayOfWeek = date.getDay();

      const stats = getStatsForDay(d);
      currentWeekDays.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1),
        dayNum: d.toString(),
        count: stats.completed
      });

      // If Sunday (0) or last day of month, close the week
      if (dayOfWeek === 0 || d === daysInMonth) {
        let weekCompleted = 0;
        let weekTotal = 0;

        currentWeekDays.forEach(day => {
          const dayStats = getStatsForDay(parseInt(day.dayNum));
          weekCompleted += dayStats.completed;
          weekTotal += dayStats.total;
        });

        const startDate = new Date(currentYear, currentMonth, weekStartDay);
        const endDate = new Date(currentYear, currentMonth, d);

        const monthShort = startDate.toLocaleString('default', { month: 'short' });
        const dateRange = `${monthShort} ${weekStartDay} - ${d === daysInMonth ? monthShort + ' ' : ''}${d}`;

        weeks.push({
          weekNum,
          dateRange,
          days: [...currentWeekDays],
          completed: `${weekCompleted}/${weekTotal}`,
          percent: weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0
        });

        currentWeekDays = [];
        weekStartDay = d + 1;
        weekNum++;
      }
    }

    return weeks;
  }, [currentMonth, currentYear, getStatsForDay]);

  return (
    <div className="w-full mt-8">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(weeksData.length, 5)} gap-4 xl:grid-cols-${weeksData.length}`}>
        {weeksData.map((week, i) => (
          <Reveal key={`${currentYear}-${currentMonth}-${week.weekNum}`} delay={i * 100}>
            <WeeklyProgressCard {...week} />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCards;
