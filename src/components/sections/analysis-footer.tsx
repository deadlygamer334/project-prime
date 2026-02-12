"use client";

import React from 'react';
import { useHabitContext } from '@/lib/HabitContext';
import { useTheme } from '@/lib/ThemeContext';
import { Counter } from '../animations/RevealEffect';

const AnalysisFooter = () => {
  const { habits, overallStats } = useHabitContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getAnalysisText = () => {
    if (habits.length === 0) return "Add some habits to start your journey! Consistency is the key to building long-term success.";

    if (overallStats.averageProgress > 80) {
      return (
        <>Outstanding work! You're maintaining an average consistency of <Counter value={overallStats.averageProgress} decimals={2} suffix="%" />. Your discipline is setting a high bar for excellence.</>
      );
    } else if (overallStats.averageProgress > 50) {
      return (
        <>You're doing great! With <Counter value={overallStats.averageProgress} decimals={2} suffix="%" /> consistency, you're well on your way. Focus on those missing days to reach the next level.</>
      );
    } else if (overallStats.averageProgress > 0) {
      return (
        <>A solid start. You're at <Counter value={overallStats.averageProgress} decimals={2} suffix="%" /> consistency. Remember, every checkmark counts toward your long-term transformation.</>
      );
    }

    return "Your progress for January 2026 is being tracked. Start checking off your habits daily to see your performance metrics grow.";
  };

  return (
    <section className="container mt-6 mb-8 w-full px-10">
      <div
        className={`w-full border rounded-[16px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 ${isDark
          ? "bg-[rgba(255,255,255,0.06)] border-[#2d2e37] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
          : "bg-white border-[#e5e5ea]"
          }`}
        style={{ minHeight: '120px' }}
      >
        <h3 className={`font-bold mb-4 tracking-wide text-[14px] ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          Analysis
        </h3>

        <div className="flex flex-col gap-4">
          <p className={`leading-relaxed text-[14px] ${isDark ? "text-[#a0a0a0]" : "text-[#86868b]"}`}>
            {getAnalysisText()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AnalysisFooter;
