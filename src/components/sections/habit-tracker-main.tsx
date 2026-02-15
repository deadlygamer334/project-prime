"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Check, BarChart3, Copy } from "lucide-react";
import { useHabitContext } from "@/lib/HabitContext";
import { useTheme } from "@/lib/ThemeContext";
import MonthlyStatsModal from "./monthly-stats-modal";
import { Counter, Reveal } from "../animations/RevealEffect";
import { HabitSchema } from "@/lib/schemas";
import { z } from "zod";
import { AlertCircle } from "lucide-react";

const HabitTrackerMain = () => {
  const {
    habits,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
    removeHabitFromMonth,
    copyFromPreviousMonth,
    getStatsForDay,
    overallStats,
    currentMonth,
    currentYear,
    nextMonth,
    prevMonth,
    isLoaded
  } = useHabitContext();

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [newHabitName, setNewHabitName] = useState("");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
    return {
      day: dayName,
      date: i + 1
    };
  });

  const handleAddHabit = () => {
    setError(null);
    if (!newHabitName.trim()) return;

    const result = HabitSchema.safeParse({ name: newHabitName });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    addHabit(newHabitName);
    setNewHabitName("");
  };

  const today = new Date().getDate();

  if (!isLoaded) return null;

  return (
    <section className="px-4 md:px-10 pb-6 w-full max-w-[1400px] mx-auto">
      <div
        className="border rounded-[16px] p-4 md:p-8 shadow-lg transition-colors duration-300 bg-card border-border"
        style={{ minHeight: '600px' }}
      >
        {/* Month Navigation */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer bg-muted/50 hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} className="text-foreground" strokeWidth={2.5} />
            </button>
            <h2 className="text-[20px] md:text-[32px] font-bold tracking-tight leading-none text-foreground whitespace-nowrap">
              {monthName} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer bg-muted/50 hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight size={20} className="text-foreground" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Summary Statistics Bar */}
        <div className="rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 border transition-colors bg-muted/20 border-border/50">
          <div className="flex md:flex-row gap-4 md:gap-8 w-full md:w-auto">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[11px] md:text-[13px] font-medium leading-tight text-muted-foreground uppercase tracking-widest">Habits</span>
              <span className="text-xl md:text-2xl font-bold text-foreground">{habits.length}</span>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[11px] md:text-[13px] font-medium leading-tight text-muted-foreground uppercase tracking-widest">Today</span>
              <span className="text-xl md:text-2xl font-bold text-foreground">{overallStats.completedToday}</span>
            </div>
          </div>

          <Reveal delay={100} className="flex flex-col gap-2 w-full flex-grow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] md:text-[13px] font-medium leading-tight text-muted-foreground uppercase tracking-widest">Average Progress</span>
              <span className="text-[14px] md:text-[16px] font-bold leading-tight text-foreground">
                <Counter value={overallStats.averageProgress} decimals={2} suffix="%" />
              </span>
            </div>
            <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted">
              <div
                className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_0_rgba(var(--primary),0.5)]"
                style={{ width: `${overallStats.averageProgress}%` }}
              />
            </div>
          </Reveal>
        </div>



        {/* Action Bar / Add Habit Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="rounded-xl p-3 md:p-4 flex flex-col gap-4 bg-muted/30">
            <input
              type="text"
              placeholder="Add a new habit..."
              value={newHabitName}
              onChange={(e) => {
                setNewHabitName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              className={`w-full border-none rounded-xl py-3 px-4 outline-none text-base transition-colors bg-card text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary ${error ? "ring-1 ring-destructive bg-destructive/10" : ""}`}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddHabit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg grow active:scale-95 whitespace-nowrap"
              >
                Add Habit
              </button>

              <button
                onClick={copyFromPreviousMonth}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all grow active:scale-95 bg-card hover:bg-muted text-foreground whitespace-nowrap"
                title="Copy from Previous Month"
              >
                <Copy size={16} />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all grow active:scale-95 bg-card hover:bg-muted text-foreground whitespace-nowrap"
              >
                <BarChart3 size={16} />
                <span>Stats</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm px-2 animate-in slide-in-from-top-1">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Habit Data Table - Desktop (md+) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 backdrop-blur-md bg-card/95">
              <tr>
                <th
                  className="sticky left-0 min-w-[200px] text-left px-4 py-4 text-[13px] font-semibold border-b border-border z-30 bg-background text-foreground shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)]"
                >
                  My Habits
                </th>
                {days.map((item, idx) => (
                  <th key={idx} className={`min-w-[44px] py-4 px-1 text-center border-b border-border transition-colors ${item.date === today ? 'bg-primary/10' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">{item.day}</span>
                      <span className={`text-[13px] font-bold ${item.date === today ? 'text-primary' : 'text-foreground'}`}>{item.date}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={32} className="py-20 text-center italic text-sm text-muted-foreground">
                    No habits added yet. Add your first habit above.
                  </td>
                </tr>
              ) : (
                habits.map((habit) => (
                  <tr key={habit.id} className="group transition-colors hover:bg-muted/30">
                    <td className="sticky left-0 z-20 px-4 py-3 border-b border-r border-border flex items-center justify-between bg-background text-foreground shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] select-text">
                      <span className="truncate max-w-[140px] font-medium">{habit.name}</span>
                      <button
                        onClick={() => removeHabitFromMonth(habit.id)}
                        className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                        title="Remove from this month"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                    {days.map((day) => (
                      <td
                        key={`${habit.id}-${day.date}`}
                        className={`p-1 border-b border-border text-center ${day.date === today ? 'bg-primary/5' : ''}`}
                      >
                        <button
                          onClick={() => toggleHabitCompletion(habit.id, day.date)}
                          className={`w-8 h-8 rounded-md border transition-all flex items-center justify-center mx-auto ${habit.completions[`${currentYear}-${currentMonth}`]?.[day.date]
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted/10 border-2 border-neutral-300 dark:border-muted hover:border-primary text-transparent"
                            }`}
                        >
                          {habit.completions[`${currentYear}-${currentMonth}`]?.[day.date] && <Check size={16} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Habit List - Mobile/Tablet (<md) */}
        <div className="md:hidden space-y-8">
          {habits.length === 0 ? (
            <div className="py-12 text-center italic text-sm text-muted-foreground border rounded-xl border-dashed">
              No habits added yet.
            </div>
          ) : (
            habits.map((habit) => (
              <div key={habit.id} className="flex flex-col gap-4">
                {/* Habit Header */}
                <div className="flex items-center justify-between px-1 select-text">
                  <h3 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[80%]">
                    {habit.name}
                  </h3>
                  <button
                    onClick={() => removeHabitFromMonth(habit.id)}
                    className="p-2 bg-destructive/10 text-destructive rounded-xl active:scale-90 transition-transform"
                    aria-label={`Remove ${habit.name} from this month`}
                    title="Remove from this month"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Labelling and Scrolling Grid */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                    My Habits Progress
                  </span>

                  <div className="overflow-x-auto custom-scrollbar pb-4 -mx-1 px-1 snap-x select-none touch-pan-x">
                    <div className="flex items-center gap-2.5 min-w-max">
                      {days.map((item) => (
                        <div
                          key={item.date}
                          className={`flex flex-col items-center gap-3 p-2 rounded-2xl border snap-center transition-colors ${item.date === today
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted/10 border-border"
                            }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground leading-none">
                              {item.day}
                            </span>
                            <span className={`text-[13px] font-black ${item.date === today ? "text-primary" : "text-foreground"}`}>
                              {item.date}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleHabitCompletion(habit.id, item.date)}
                            className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${habit.completions[`${currentYear}-${currentMonth}`]?.[item.date]
                              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.4)]"
                              : "bg-background border-muted dark:border-white/10 text-transparent active:border-primary"
                              }`}
                          >
                            {habit.completions[`${currentYear}-${currentMonth}`]?.[item.date] && <Check size={20} strokeWidth={3} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Stats Modal */}
      <MonthlyStatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
    </section>
  );
};

export default HabitTrackerMain;

