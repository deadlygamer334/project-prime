"use client";

import React from 'react';
import { useHabitContext } from '@/lib/HabitContext';
import { Counter } from '../animations/RevealEffect';

const AnalysisFooter = () => {
  const { habits, overallStats } = useHabitContext();

  const getAnalysisText = () => {
    if (habits.length === 0) return "Add some habits to start your journey! Consistency is the key to building long-term success.";

    if (overallStats.averageProgress > 80) {
      return (
        <>Outstanding work! You're maintaining an average consistency of <span className="text-primary font-bold"><Counter value={overallStats.averageProgress} decimals={2} suffix="%" /></span>. Your discipline is setting a high bar for excellence.</>
      );
    } else if (overallStats.averageProgress > 50) {
      return (
        <>You're doing great! With <span className="text-primary font-bold"><Counter value={overallStats.averageProgress} decimals={2} suffix="%" /></span> consistency, you're well on your way. Focus on those missing days to reach the next level.</>
      );
    } else if (overallStats.averageProgress > 0) {
      return (
        <>A solid start. You're at <span className="text-primary font-bold"><Counter value={overallStats.averageProgress} decimals={2} suffix="%" /></span> consistency. Remember, every checkmark counts toward your long-term transformation.</>
      );
    }

    return "Your progress is being tracked. Start checking off your habits daily to see your performance metrics grow.";
  };

  return (
    <section className="container mt-6 mb-8 w-full px-10">
      <div
        className="w-full gradient-border card-premium rounded-2xl p-6 transition-colors duration-300 bg-card border border-border min-h-[120px]"
      >
        <h3 className="font-bold mb-4 tracking-wide text-[14px] text-foreground">
          Analysis
        </h3>

        <div className="flex flex-col gap-4">
          <p className="leading-relaxed text-[14px] text-muted-foreground">
            {getAnalysisText()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AnalysisFooter;
