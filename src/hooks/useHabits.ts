"use client";

import { useState, useEffect } from "react";

export interface Habit {
  id: string;
  name: string;
  completions: { [date: number]: boolean }; // date is day of month (1-31)
  createdAt: number;
}

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("habit_tracker_habits");
    if (saved) {
      try {
        setHabits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse habits", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("habit_tracker_habits", JSON.stringify(habits));
    }
  }, [habits, isLoaded]);

  const addHabit = (name: string) => {
    if (!name.trim()) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      completions: {},
      createdAt: Date.now(),
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const toggleHabitCompletion = (habitId: string, day: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const newCompletions = { ...h.completions };
          newCompletions[day] = !newCompletions[day];
          return { ...h, completions: newCompletions };
        }
        return h;
      })
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const getStatsForDay = (day: number) => {
    const total = habits.length;
    const completed = habits.filter((h) => h.completions[day]).length;
    return {
      total,
      completed,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  };

  const overallStats = {
    totalHabits: habits.length,
    completedToday: habits.filter((h) => h.completions[new Date().getDate()]).length,
    averageProgress: habits.length > 0 ? habits.reduce((acc, h) => {
      const done = Object.values(h.completions).filter(Boolean).length;
      return acc + (done / 31);
    }, 0) / habits.length * 100 : 0,
  };

  return {
    habits,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
    getStatsForDay,
    overallStats,
    isLoaded,
  };
};
