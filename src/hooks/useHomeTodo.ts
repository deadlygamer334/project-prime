"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { formatLocalDate } from "@/lib/dateUtils";
import { auth, db } from "@/lib/firebase";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch, limit, query, orderBy, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export type Priority = "IU" | "IBNU" | "NIBU" | "NINU" | "none"; // Kept for backward compatibility if needed, but QuadrantId is preferred for Matrix
export type QuadrantId = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";

export type TaskStatus = "active" | "done" | "cancelled";

export interface HomeTask {
    id: string;
    text: string;
    note?: string;
    completed: boolean;
    status: TaskStatus;
    priority: Priority;
    quadrant?: QuadrantId | null; // Unified field for Matrix
    date: string; // YYYY-MM-DD
    estimatedTime?: string; // "H:M"
    createdAt: number;
}

export const useHomeTodo = () => {
    const [recentTasks, setRecentTasks] = useState<HomeTask[]>([]);
    const [historyTasks, setHistoryTasks] = useState<HomeTask[]>([]);
    const [lastLoadedDoc, setLastLoadedDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const lastRecentDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

    // Combined tasks for UI
    const tasks = useMemo(() => [...recentTasks, ...historyTasks], [recentTasks, historyTasks]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setRecentTasks([]);
                setHistoryTasks([]);
                setLastLoadedDoc(null);
                lastRecentDocRef.current = null;
                setIsLoaded(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Firestore Sync (Recent 200)
    useEffect(() => {
        if (!user) return;

        const todosRef = collection(db, "users", user.uid, "todoLists");
        // We might need to filter by date here later for "Past 2 Months" optimization, 
        // but for now let's keep the limit(200) or switch to date-based if requested immediately.
        // Plan said: "Initial Load: where("date", ">=", "YYYY-MM-DD" (2 months ago))"
        // Let's implement that change now while we are here.

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const dateStr = formatLocalDate(twoMonthsAgo);

        // Compound query with orderBy might require index. 
        // orderBy("date", "desc") would be better than createdAt for date-based pagination?
        // But users usually want to see "Recently Created" or "Due Today"? 
        // "Daily to do list" implies filtering by 'date' field.
        // So we should probably index on 'date'.
        // However, to avoid immediate index requirements if not present, let's stick to createdAt for recent *entry* 
        // OR standard 'date' based if that's the primary view.
        // The prompt asked for "data on website should be shown for the past 2 mnoths".
        // This implies 'date' field is the primary key for visibility.
        // Let's try ordering by 'date' desc.

        const q = query(
            todosRef,
            where("date", ">=", dateStr),
            orderBy("date", "desc"),
            orderBy("createdAt", "desc") // Secondary sort for same day
        );

        let unsubscribeFallback: (() => void) | null = null;
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks: HomeTask[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as HomeTask));

            setRecentTasks(fetchedTasks);

            if (snapshot.docs.length > 0) {
                lastRecentDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            } else {
                lastRecentDocRef.current = null;
            }

            setIsLoaded(true);
        }, (error) => {
            if (error.code === 'permission-denied') {
                console.warn("useHomeTodo: Permission denied (likely logout in progress).");
                return;
            }

            console.error("Error syncing tasks (likely index missing for date query):", error);
            const qFallback = query(todosRef, orderBy("createdAt", "desc"), limit(200));
            unsubscribeFallback = onSnapshot(qFallback, (snap) => {
                const fetched: HomeTask[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as HomeTask));
                setRecentTasks(fetched);
                setIsLoaded(true);
            }, (fallbackError) => {
                if (fallbackError.code !== 'permission-denied') {
                    console.error("useHomeTodo: Fallback sync failed:", fallbackError);
                }
                setIsLoaded(true);
            });
        });

        return () => {
            unsubscribe();
            if (unsubscribeFallback) unsubscribeFallback();
        };
    }, [user]);

    const loadMoreTasks = useCallback(async () => {
        if (!user || loadingHistory) return;

        let startPointDoc = lastLoadedDoc || lastRecentDocRef.current;
        if (!startPointDoc) return;

        setLoadingHistory(true);
        try {
            const todosRef = collection(db, "users", user.uid, "todoLists");
            // Load older than what we have. 
            // Query needs to match the initial one but startAfter.
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
            const dateStr = formatLocalDate(twoMonthsAgo);

            // Fetch tasks older than 2 months? Or just older than current list?
            // If the initial list is "Past 2 months", then "Load More" means "Older than 2 months".

            // Actually, if we use startAfter(startPointDoc), we continue from where we left off.
            // But we need to remove the 'where' clause if we want to go beyond 2 months.
            // OR if the user just scrolls to the bottom of "Recent 2 months", they might want "Older".

            const q = query(
                todosRef,
                orderBy("date", "desc"),
                orderBy("createdAt", "desc"),
                startAfter(startPointDoc),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const newTasks: HomeTask[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as HomeTask));

            if (newTasks.length > 0) {
                setHistoryTasks(prev => [...prev, ...newTasks]);
                setLastLoadedDoc(snapshot.docs[snapshot.docs.length - 1]);
            } else {
                setLastLoadedDoc(null);
            }
        } catch (e) {
            console.error("Error loading history:", e);
        } finally {
            setLoadingHistory(false);
        }
    }, [user, loadingHistory, lastLoadedDoc]);

    // Helper to update tasks optimistically
    const optimisticUpdate = (fn: (prev: HomeTask[]) => HomeTask[]) => {
        setRecentTasks(fn);
        setHistoryTasks(prev => fn(prev));
    };

    const addTask = useCallback(async (text: string, note?: string, estimatedTime?: string, priority: Priority = "none", date?: string, quadrant?: QuadrantId) => {
        if (!text.trim() || !user) return;

        const newTask: any = {
            text,
            completed: false,
            status: "active" as TaskStatus,
            priority,
            date: date || formatLocalDate(new Date()),
            estimatedTime: estimatedTime || "0:0",
            createdAt: Date.now(),
            quadrant: quadrant || null
        };

        if (note !== undefined) newTask.note = note;

        // Optimistic
        const tempId = crypto.randomUUID();
        const optimisticTask = { ...newTask, id: tempId };
        setRecentTasks(prev => [optimisticTask, ...prev]); // Add to top since desc

        try {
            await addDoc(collection(db, "users", user.uid, "todoLists"), newTask);
        } catch (e) {
            console.error("Error adding task:", e);
        }
    }, [user]);

    const toggleTask = useCallback(async (id: string) => {
        if (!user) return;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        const newStatus = newCompleted ? "done" : "active";

        // Optimistic
        const updateFn = (prev: HomeTask[]) => prev.map(t => t.id === id ? { ...t, completed: newCompleted, status: newStatus as TaskStatus } : t);
        setRecentTasks(updateFn);
        setHistoryTasks(updateFn);

        try {
            const taskRef = doc(db, "users", user.uid, "todoLists", id);
            await updateDoc(taskRef, { completed: newCompleted, status: newStatus });
        } catch (e) {
            console.error("Error toggling task:", e);
        }
    }, [user, tasks]);

    const setTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
        if (!user) return;

        // Optimistic
        const updateFn = (prev: HomeTask[]) => prev.map(t => t.id === id ? { ...t, status, completed: status === "done" } : t);
        setRecentTasks(updateFn);
        setHistoryTasks(updateFn);

        try {
            await updateDoc(doc(db, "users", user.uid, "todoLists", id), {
                status,
                completed: status === "done"
            });
        } catch (e) {
            console.error("Error updating status:", e);
        }
    }, [user]);

    const setPriority = useCallback(async (id: string, priority: Priority) => {
        if (!user) return;

        const updateFn = (prev: HomeTask[]) => prev.map(t => t.id === id ? { ...t, priority } : t);
        setRecentTasks(updateFn);
        setHistoryTasks(updateFn);

        try {
            await updateDoc(doc(db, "users", user.uid, "todoLists", id), { priority });
        } catch (e) {
            console.error("Error setting priority:", e);
        }
    }, [user]);

    const deleteTask = useCallback(async (id: string) => {
        if (!user) return;

        const updateFn = (prev: HomeTask[]) => prev.filter(t => t.id !== id);
        setRecentTasks(updateFn);
        setHistoryTasks(updateFn);

        try {
            await deleteDoc(doc(db, "users", user.uid, "todoLists", id));
        } catch (e) {
            console.error("Error deleting task:", e);
        }
    }, [user]);

    const moveTaskToDate = useCallback(async (id: string, date: string) => {
        if (!user) return;

        const updateFn = (prev: HomeTask[]) => prev.map(t => t.id === id ? { ...t, date } : t);
        setRecentTasks(updateFn);
        setHistoryTasks(updateFn);

        try {
            await updateDoc(doc(db, "users", user.uid, "todoLists", id), { date });
        } catch (e) {
            console.error("Error moving task:", e);
        }
    }, [user]);

    const reorderTasks = useCallback((newTasks: HomeTask[]) => {
        // Since we split the list, reordering is tricky.
        // For now, update recent (most common).
        // Best effort:
        setRecentTasks(newTasks);
    }, []);

    const clearAllTasks = useCallback(async () => {
        if (!user) return;

        // Optimistic
        const backupRecent = [...recentTasks];
        setRecentTasks([]);
        setHistoryTasks([]); // Clear loaded history too

        try {
            const batch = writeBatch(db);
            // Only deleting loaded tasks? Or all?
            // "Clear All" usually implies everything.
            // But if we haven't loaded everything, we can't delete it easily without a query.
            // For safety/simplicity in this "Infinite" mode, let's just delete what we see.
            // OR simpler: just delete loaded ones.
            tasks.forEach(t => {
                batch.delete(doc(db, "users", user.uid, "todoLists", t.id));
            });
            await batch.commit();
        } catch (e) {
            console.error("Error clearing tasks:", e);
            setRecentTasks(backupRecent);
        }
    }, [user, recentTasks, tasks]);

    const getTasksByDate = useCallback((dateString: string) => {
        return tasks.filter((t) => t.date === dateString);
    }, [tasks]);

    const getTotalEstimatedMinutes = useCallback((dateString: string) => {
        const tasksForDate = getTasksByDate(dateString);
        return tasksForDate.reduce((acc, t) => {
            if (!t.estimatedTime) return acc;
            const [h, m] = t.estimatedTime.split(':').map(Number);
            return acc + (h * 60) + m;
        }, 0);
    }, [getTasksByDate]);

    const attachPomodoro = useCallback((taskId: string, pomodoroTaskId: string) => {
        // Implementation for attaching pomodoro to todo
    }, []);

    const getStatsByDateStr = useCallback((dateString: string) => {
        const dateTasks = tasks.filter((t) => t.date === dateString);
        const completed = dateTasks.filter((t) => t.completed).length;
        return {
            total: dateTasks.length,
            completed,
            progress: dateTasks.length > 0 ? (completed / dateTasks.length) * 100 : 0,
        };
    }, [tasks]);

    const stats = useMemo(() => {
        const today = formatLocalDate(new Date());
        const todayTasks = tasks.filter((t) => t.date === today);
        const completedToday = todayTasks.filter((t) => t.completed).length;

        return {
            total: tasks.length,
            completed: tasks.filter((t) => t.completed).length,
            progress: todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0,
        };
    }, [tasks]);

    return useMemo(() => ({
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        setTaskStatus,
        setPriority,
        moveTaskToDate,
        reorderTasks,
        clearAllTasks,
        attachPomodoro,
        getTasksByDate,
        getTotalEstimatedMinutes,
        getStatsByDateStr,
        stats,
        isLoaded,
        loadMoreTasks,
        loadingHistory
    }), [
        tasks, addTask, toggleTask, deleteTask, setTaskStatus, setPriority,
        moveTaskToDate, reorderTasks, clearAllTasks, attachPomodoro,
        getTasksByDate, getTotalEstimatedMinutes, getStatsByDateStr,
        stats, isLoaded, loadMoreTasks, loadingHistory
    ]);
};
