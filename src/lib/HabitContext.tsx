"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import NotificationEngine from "./NotificationEngine";

export interface Habit {
  id: string;
  name: string;
  completions: { [monthKey: string]: { [day: number]: boolean } }; // monthKey is "YYYY-MM"
  createdAt: number;
  monthKeys?: string[]; // Array of "YYYY-MM" keys where this habit is active
}

interface HabitContextType {
  habits: Habit[];
  addHabit: (name: string) => void;
  toggleHabitCompletion: (habitId: string, day: number) => void;
  deleteHabit: (id: string) => void;
  removeHabitFromMonth: (id: string) => void;
  copyFromPreviousMonth: () => void;
  getStatsForDay: (day: number) => { total: number; completed: number; percent: number };
  overallStats: {
    totalHabits: number;
    completedToday: number;
    averageProgress: number;
  };
  currentMonth: number;
  currentYear: number;
  nextMonth: () => void;
  prevMonth: () => void;
  getMonthlyStats: () => {
    completionRate: number;
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    bestDay: { day: number; count: number; percentage: number } | null;
  };
  getYearlyOverview: () => { month: string; percentage: number }[];
  isLoaded: boolean;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // --- 1. Derived State ---
  const visibleHabits = useMemo(() => {
    const monthKey = `${currentYear}-${currentMonth}`;
    return habits.filter(h => {
      // Legacy habits without monthKeys property show up everywhere
      if (h.monthKeys === undefined) return true;
      // Habits with empty monthKeys array are hidden (removed from all months)
      if (h.monthKeys.length === 0) return false;
      // Scoped habits only show if key matches
      return h.monthKeys.includes(monthKey);
    });
  }, [habits, currentMonth, currentYear]);

  // --- 2. Stats Functions ---
  const getMonthlyStats = useCallback(() => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let totalCompletions = 0;
    const dailyCounts: { [day: number]: number } = {};

    visibleHabits.forEach(habit => {
      const monthData = habit.completions[monthKey] || {};
      Object.keys(monthData).forEach(dayStr => {
        const day = parseInt(dayStr);
        if (monthData[day]) {
          totalCompletions++;
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        }
      });
    });

    const completionRate = visibleHabits.length > 0
      ? (totalCompletions / (visibleHabits.length * daysInMonth)) * 100
      : 0;

    let bestDay = null;
    let maxCompleted = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const count = dailyCounts[d] || 0;
      if (count > maxCompleted) {
        maxCompleted = count;
        bestDay = {
          day: d,
          count,
          percentage: (count / visibleHabits.length) * 100
        };
      }
    }

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      if (dailyCounts[d] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Current streak logic (backwards from today if current month)
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
    const isCurrentMonth = todayDateObj.getMonth() === currentMonth && todayDateObj.getFullYear() === currentYear;

    if (isCurrentMonth) {
      for (let d = todayDateObj.getDate(); d >= 1; d--) {
        if (dailyCounts[d] > 0) {
          currentStreak++;
        } else if (d < todayDateObj.getDate()) {
          break;
        }
      }
    } else {
      currentStreak = tempStreak;
    }

    return {
      completionRate,
      totalCompleted: totalCompletions,
      currentStreak,
      longestStreak,
      bestDay
    };
  }, [currentYear, currentMonth, visibleHabits]);

  const getYearlyOverview = useCallback(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, m) => {
      const monthKey = `${currentYear}-${m}`;
      const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
      let completions = 0;

      visibleHabits.forEach(h => {
        const data = h.completions[monthKey] || {};
        completions += Object.values(data).filter(Boolean).length;
      });

      const percentage = visibleHabits.length > 0
        ? (completions / (visibleHabits.length * daysInMonth)) * 100
        : 0;

      return { month, percentage };
    });
  }, [currentYear, visibleHabits]);

  const overallStats = useMemo(() => {
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
    const todayDay = todayDateObj.getDate();
    const currentMonthKeyStr = `${todayDateObj.getFullYear()}-${todayDateObj.getMonth()}`;

    return {
      totalHabits: visibleHabits.length,
      completedToday: visibleHabits.filter((h) => h.completions[currentMonthKeyStr]?.[todayDay]).length,
      averageProgress: visibleHabits.length > 0 ? visibleHabits.reduce((acc, h) => {
        const monthKey = `${currentYear}-${currentMonth}`;
        const done = Object.values(h.completions[monthKey] || {}).filter(Boolean).length;
        return acc + (done / 31);
      }, 0) / visibleHabits.length * 100 : 0,
    };
  }, [visibleHabits, currentYear, currentMonth]);

  // --- 3. Actions ---
  const addHabit = useCallback(async (name: string) => {
    if (!name.trim() || !user) return;
    const monthKey = `${currentYear}-${currentMonth}`;
    const newHabit = {
      name,
      createdAt: Date.now(),
      monthKeys: [monthKey]
    };
    const tempId = crypto.randomUUID();
    setHabits(prev => [...prev, { ...newHabit, id: tempId, completions: {} } as Habit]);

    try {
      await addDoc(collection(db, "users", user.uid, "habits"), newHabit);
    } catch (e) {
      console.error("Error adding habit:", e);
      setHabits(prev => prev.filter(h => h.id !== tempId));
    }
  }, [user, currentYear, currentMonth]);

  const toggleHabitCompletion = useCallback(async (habitId: string, day: number) => {
    if (!user) return;
    const monthKey = `${currentYear}-${currentMonth}`;

    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newCompletions = { ...h.completions };
        const monthCompletions = { ...(newCompletions[monthKey] || {}) };
        monthCompletions[day] = !monthCompletions[day];
        newCompletions[monthKey] = monthCompletions;
        return { ...h, completions: newCompletions };
      }
      return h;
    }));

    try {
      const historyRef = doc(db, "users", user.uid, "habits", habitId, "history", monthKey);
      const habit = habits.find(h => h.id === habitId);
      const newVal = !habit?.completions[monthKey]?.[day];

      await setDoc(historyRef, { [day]: newVal }, { merge: true });

      if (newVal) {
        const stats = getMonthlyStats();
        if (stats.currentStreak > 0) {
          // Decoupled notification call to prevent render issues
          setTimeout(() => {
            NotificationEngine.getInstance().checkStreakMilestones(stats.currentStreak);
          }, 0);
        }
      }
    } catch (e) {
      console.error("Error toggling habit:", e);
    }
  }, [user, currentYear, currentMonth, habits, getMonthlyStats]); // Kept getMonthlyStats dependency but decoupled execution

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;
    setHabits(prev => prev.filter(h => h.id !== id));
    try {
      await deleteDoc(doc(db, "users", user.uid, "habits", id));
    } catch (e) {
      console.error("Error deleting habit:", e);
    }
  }, [user]);

  const removeHabitFromMonth = useCallback(async (id: string) => {
    if (!user) return;
    const monthKey = `${currentYear}-${currentMonth}`;

    // Find the habit before optimistic update
    const habitToUpdate = habits.find(h => h.id === id);
    if (!habitToUpdate) {
      console.error("Habit not found:", id);
      return;
    }

    let newMonthKeys: string[];

    // Handle legacy habits (no monthKeys property) by converting them to scoped habits
    if (habitToUpdate.monthKeys === undefined) {
      console.log("Converting legacy habit to scoped habit and removing from current month");

      let createdDate: Date;
      // Robustly handle createdAt (could be number, string, or Firestore Timestamp)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdAt = habitToUpdate.createdAt as any;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdDate = createdAt.toDate();
      } else {
        createdDate = new Date(createdAt);
      }

      // Fallback for invalid dates: use Jan 1st of current year to safeguard against data loss
      if (isNaN(createdDate.getTime())) {
        console.warn("Invalid createdAt for habit", id, createdAt, "Using fallback.");
        createdDate = new Date(currentYear, 0, 1);
      }

      const createdYear = createdDate.getFullYear();
      const createdMonth = createdDate.getMonth();
      const allMonthKeys: string[] = [];

      // Cap at 5 years back to prevent performance issues with very old/buggy dates
      let year = Math.max(createdYear, currentYear - 5);
      let month = (year === createdYear) ? createdMonth : 0;

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        const key = `${year}-${month}`;
        if (key !== monthKey) { // Exclude current month
          allMonthKeys.push(key);
        }
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
      newMonthKeys = allMonthKeys;
    } else {
      // For scoped habits, just remove current month
      newMonthKeys = habitToUpdate.monthKeys.filter(m => m !== monthKey);
    }

    // Optimistic update
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        return { ...h, monthKeys: newMonthKeys };
      }
      return h;
    }));

    try {
      await updateDoc(doc(db, "users", user.uid, "habits", id), { monthKeys: newMonthKeys });
      console.log(`Habit ${id} removed from month ${monthKey}. New monthKeys:`, newMonthKeys);
    } catch (e) {
      console.error("Error removing habit from month:", e);
      // Revert optimistic update on error
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          return { ...h, monthKeys: habitToUpdate.monthKeys };
        }
        return h;
      }));
    }
  }, [user, currentYear, currentMonth, habits]);

  const nextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  const prevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const copyFromPreviousMonth = useCallback(async () => {
    if (!user) return;
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevKey = `${prevY}-${prevM}`;
    const currentKey = `${currentYear}-${currentMonth}`;

    const batch = writeBatch(db);
    let hasUpdates = false;

    habits.forEach((h) => {
      const wasActiveInPrev = h.monthKeys?.includes(prevKey);
      const isActiveInCurrent = h.monthKeys?.includes(currentKey);

      if (wasActiveInPrev && !isActiveInCurrent) {
        const habitRef = doc(db, "users", user.uid, "habits", h.id);
        const newMonthKeys = [...(h.monthKeys || []), currentKey];
        batch.update(habitRef, { monthKeys: newMonthKeys });
        hasUpdates = true;
      }

      const prevData = h.completions[prevKey];
      if (prevData) {
        const historyRef = doc(db, "users", user.uid, "habits", h.id, "history", currentKey);
        batch.set(historyRef, prevData, { merge: true });
        hasUpdates = true;
      }
    });

    if (hasUpdates) await batch.commit();
  }, [user, currentMonth, currentYear, habits]);

  // --- 4. Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setHabits([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const habitsRef = collection(db, "users", user.uid, "habits");
    const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
      const fetchedHabits = snapshot.docs.map(doc => ({
        id: doc.id,
        completions: {},
        ...doc.data()
      } as Habit));
      fetchedHabits.sort((a, b) => a.createdAt - b.createdAt);
      setHabits(fetchedHabits);
      setIsLoaded(true);
    }, (error) => {
      console.error("Habit sync error:", error);
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || habits.length === 0) return;
    const monthKey = `${currentYear}-${currentMonth}`;
    const prevDate = new Date(currentYear, currentMonth - 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;
    const unsubscribes: (() => void)[] = [];

    habits.forEach(h => {
      const historyRef = doc(db, "users", user.uid, "habits", h.id, "history", monthKey);
      unsubscribes.push(onSnapshot(historyRef, (snap) => {
        if (snap.exists()) {
          setHabits(prev => prev.map(habit => {
            if (habit.id === h.id) {
              const newCompletions = { ...habit.completions, [monthKey]: snap.data() };
              return { ...habit, completions: newCompletions };
            }
            return habit;
          }));
        }
      }));

      const prevHistoryRef = doc(db, "users", user.uid, "habits", h.id, "history", prevMonthKey);
      unsubscribes.push(onSnapshot(prevHistoryRef, (snap) => {
        if (snap.exists()) {
          setHabits(prev => prev.map(habit => {
            if (habit.id === h.id) {
              const newCompletions = { ...habit.completions, [prevMonthKey]: snap.data() };
              return { ...habit, completions: newCompletions };
            }
            return habit;
          }));
        }
      }));
    });
    return () => unsubscribes.forEach(u => u());
  }, [user, currentMonth, currentYear, habits.length]);

  const value = useMemo(() => ({
    habits: visibleHabits,
    allHabits: habits,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
    removeHabitFromMonth,
    copyFromPreviousMonth,
    getStatsForDay: (day: number) => {
      const monthKey = `${currentYear}-${currentMonth}`;
      const total = visibleHabits.length;
      const completed = visibleHabits.filter((h) => h.completions[monthKey]?.[day]).length;
      return { total, completed, percent: total > 0 ? (completed / total) * 100 : 0 };
    },
    overallStats,
    currentMonth,
    currentYear,
    nextMonth,
    prevMonth,
    getMonthlyStats,
    getYearlyOverview,
    isLoaded,
  }), [
    visibleHabits, habits, addHabit, toggleHabitCompletion, deleteHabit, removeHabitFromMonth,
    copyFromPreviousMonth, overallStats, currentMonth, currentYear,
    nextMonth, prevMonth, getMonthlyStats, getYearlyOverview, isLoaded
  ]);

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabitContext = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error("useHabitContext must be used within a HabitProvider");
  }
  return context;
};
