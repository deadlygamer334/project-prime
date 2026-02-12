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
}

interface HabitContextType {
  habits: Habit[];
  addHabit: (name: string) => void;
  toggleHabitCompletion: (habitId: string, day: number) => void;
  deleteHabit: (id: string) => void;
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

  // Auth Listener
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

  // Firestore Sync - History in Subcollections
  useEffect(() => {
    if (!user) return;

    const habitsRef = collection(db, "users", user.uid, "habits");
    const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
      const fetchedHabits: Habit[] = snapshot.docs.map(doc => ({
        id: doc.id,
        completions: {}, // Default to empty
        ...doc.data()
      } as Habit));

      // Sort by creation time
      fetchedHabits.sort((a, b) => a.createdAt - b.createdAt);

      // MIGRATION CHECK: If habit has 'completions' field on main doc, migrate it
      fetchedHabits.forEach(async (h) => {
        if (h.completions && Object.keys(h.completions).length > 0) {
          console.log(`Migrating history for habit ${h.name}...`);
          const batch = writeBatch(db);
          const habitRef = doc(db, "users", user.uid, "habits", h.id);

          // Move each month to sub-collection
          for (const [monthKey, data] of Object.entries(h.completions)) {
            const historyRef = doc(db, "users", user.uid, "habits", h.id, "history", monthKey);
            batch.set(historyRef, { ...data }); // Use set to overwrite/create
          }

          // Remove completions from main doc
          batch.update(habitRef, { completions: {} }); // Or deleteField()
          // But we need to keep completions for optimistic UI? 
          // Ideally we load it back. 
          // For now, let's just clear it to finish migration.
          await batch.commit();
        }
      });

      // After fetching habits, we need to LISTEN to their history sub-collections
      // For "Past 2 months" + Current month.
      // This is dynamic. 
      // To avoid 10+ listeners, maybe we just fetch current month?
      // Or we accept we need listeners for the currently visible range.
      // Let's implement a "loadHistoryForMonth" function.

      setHabits(fetchedHabits);
      setIsLoaded(true);
    }, (error) => {
      console.error("HabitContext: Habits sync error:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  // Listener for Current Month History
  useEffect(() => {
    if (!user || habits.length === 0) return;

    const monthKey = `${currentYear}-${currentMonth}`;
    // Also listen to previous month for "Streak" calculations working across months
    const prevDate = new Date(currentYear, currentMonth - 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;

    const unsubscribes: (() => void)[] = [];

    habits.forEach(h => {
      // Listen to Current Month
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
      }, (err) => {
        if (err.code !== 'permission-denied') {
          console.error(`HabitContext: History sync error for ${h.id}:`, err);
        }
      }));

      // Listen to Previous Month
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
      }, (err) => {
        if (err.code !== 'permission-denied') {
          console.error(`HabitContext: Prev history error for ${h.id}:`, err);
        }
      }));
    });

    return () => unsubscribes.forEach(u => u());
  }, [user, currentMonth, currentYear, habits.length]); // Re-run if habits list changes (add/remove) or month changes

  const addHabit = useCallback(async (name: string) => {
    if (!name.trim() || !user) return;

    const newHabit = {
      name,
      // completions: {}, // Don't store completions on main doc anymore
      createdAt: Date.now(),
    };

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const optimisticHabit = { ...newHabit, id: tempId, completions: {} } as Habit;
    setHabits(prev => [...prev, optimisticHabit]);

    try {
      await addDoc(collection(db, "users", user.uid, "habits"), newHabit);
    } catch (e) {
      console.error("Error adding habit to Firestore:", e);
      setHabits(prev => prev.filter(h => h.id !== tempId));
    }
  }, [user]);

  const toggleHabitCompletion = useCallback(async (habitId: string, day: number) => {
    if (!user) return;

    const monthKey = `${currentYear}-${currentMonth}`;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Calculate new value
    const currentVal = habit.completions[monthKey]?.[day] || false;
    const newVal = !currentVal;

    // Optimistic Update
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newCompletions = { ...h.completions };
        const monthCompletions = { ...(newCompletions[monthKey] || {}) };
        monthCompletions[day] = newVal;
        newCompletions[monthKey] = monthCompletions;
        return { ...h, completions: newCompletions };
      }
      return h;
    }));

    try {
      const historyRef = doc(db, "users", user.uid, "habits", habitId, "history", monthKey);
      // We need to use "merge: true" with setDoc because updateDoc fails if doc doesn't exist
      await setDoc(historyRef, { [day]: newVal }, { merge: true });

      // Trigger achievement/streak checks if completed
      if (newVal) {
        const stats = getMonthlyStats();
        if (stats.currentStreak > 0) {
          await NotificationEngine.getInstance().checkStreakMilestones(stats.currentStreak);
        }
      }
    } catch (e) {
      console.error("Error toggling habit:", e);
    }
  }, [user, currentYear, currentMonth, habits]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic
    setHabits(prev => prev.filter(h => h.id !== id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "habits", id));
      // Optionally delete sub-collections? Firestore doesn't cascade delete. 
      // For now, we leave history or use a Cloud Function for cleanup.
    } catch (e) {
      console.error("Error deleting habit:", e);
    }
  }, [user]);

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

    habits.forEach(async (h) => {
      // We might not have previous month data loaded if we only listen to current/prev. 
      // But assuming we do (since we added listener for prev month):
      const prevData = h.completions[prevKey];
      if (prevData) {
        const historyRef = doc(db, "users", user.uid, "habits", h.id, "history", currentKey);
        batch.set(historyRef, prevData, { merge: true }); // Merge to avoid overwriting existing progress?
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }
  }, [user, currentMonth, currentYear, habits]);

  const getStatsForDay = useCallback((day: number) => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const total = habits.length;
    const completed = habits.filter((h) => h.completions[monthKey]?.[day]).length;
    return {
      total,
      completed,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [currentYear, currentMonth, habits]);

  const overallStats = useMemo(() => {
    // Reset time to midnight for accurate day comparison
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
    const todayDay = todayDateObj.getDate();
    const currentMonthKeyStr = `${todayDateObj.getFullYear()}-${todayDateObj.getMonth()}`;

    return {
      totalHabits: habits.length,
      completedToday: habits.filter((h) => h.completions[currentMonthKeyStr]?.[todayDay]).length,
      averageProgress: habits.length > 0 ? habits.reduce((acc, h) => {
        const monthKey = `${currentYear}-${currentMonth}`;
        const done = Object.values(h.completions[monthKey] || {}).filter(Boolean).length;
        return acc + (done / 31);
      }, 0) / habits.length * 100 : 0,
    };
  }, [habits, currentYear, currentMonth]);

  const getMonthlyStats = useCallback(() => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let totalCompletions = 0;
    const dailyCounts: { [day: number]: number } = {};

    habits.forEach(habit => {
      const monthData = habit.completions[monthKey] || {};
      Object.keys(monthData).forEach(dayStr => {
        const day = parseInt(dayStr);
        if (monthData[day]) {
          totalCompletions++;
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        }
      });
    });

    const completionRate = habits.length > 0
      ? (totalCompletions / (habits.length * daysInMonth)) * 100
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
          percentage: (count / habits.length) * 100
        };
      }
    }

    // Streak calculation (any habit completed)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
    const isCurrentMonth = todayDateObj.getMonth() === currentMonth && todayDateObj.getFullYear() === currentYear;

    for (let d = 1; d <= daysInMonth; d++) {
      if (dailyCounts[d] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

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
  }, [currentYear, currentMonth, habits]);

  const getYearlyOverview = useCallback(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, m) => {
      const monthKey = `${currentYear}-${m}`;
      const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
      let completions = 0;

      habits.forEach(h => {
        const data = h.completions[monthKey] || {};
        completions += Object.values(data).filter(Boolean).length;
      });

      const percentage = habits.length > 0
        ? (completions / (habits.length * daysInMonth)) * 100
        : 0;

      return { month, percentage };
    });
  }, [currentYear, habits]);

  const value = useMemo(() => ({
    habits,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
    copyFromPreviousMonth,
    getStatsForDay,
    overallStats,
    currentMonth,
    currentYear,
    nextMonth,
    prevMonth,
    getMonthlyStats,
    getYearlyOverview,
    isLoaded,
  }), [
    habits, addHabit, toggleHabitCompletion, deleteHabit, copyFromPreviousMonth,
    getStatsForDay, overallStats, currentMonth, currentYear, nextMonth,
    prevMonth, getMonthlyStats, getYearlyOverview, isLoaded
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
