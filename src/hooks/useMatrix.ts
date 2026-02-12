import { useState, useEffect, useMemo, useCallback } from "react";
import { useHomeTodo, HomeTask } from "./useHomeTodo";

export type QuadrantId = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";

export interface MatrixTask extends HomeTask {
  quadrant: QuadrantId;
}

export const useMatrix = () => {
  const { tasks, addTask: addHomeTask, toggleTask: toggleHomeTask, deleteTask: deleteHomeTask, isLoaded: isHomeLoaded } = useHomeTodo();

  // Filter only matrix tasks (those with a quadrant)
  const matrixTasks = useMemo(() => tasks.filter(t => t.quadrant) as MatrixTask[], [tasks]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Migration Effect
  useEffect(() => {
    if (!isHomeLoaded) return;

    const saved = localStorage.getItem("matrix_tasks");
    if (saved) {
      try {
        const localTasks = JSON.parse(saved);
        if (Array.isArray(localTasks) && localTasks.length > 0) {
          console.log("Migrating Matrix tasks to Firestore...", localTasks.length);
          // Migrate each task
          localTasks.forEach(t => {
            // Avoid duplicates if possible? Unique ID check might fail if IDs were random.
            // Just push them as new tasks to be safe, or check text?
            // Let's just push them.
            addHomeTask(t.text, undefined, undefined, "none", undefined, t.quadrant);
          });
          // Clear local storage after migration
          localStorage.removeItem("matrix_tasks");
        }
      } catch (e) {
        console.error("Failed to parse/migrate matrix tasks", e);
      }
    }
    setIsLoaded(true);
  }, [isHomeLoaded]);

  const addTask = useCallback((text: string, quadrant: QuadrantId) => {
    addHomeTask(text, undefined, undefined, "none", undefined, quadrant);
  }, [addHomeTask]);

  const toggleTask = useCallback((id: string) => {
    toggleHomeTask(id);
  }, [toggleHomeTask]);

  const deleteTask = useCallback((id: string) => {
    deleteHomeTask(id);
  }, [deleteHomeTask]);

  const getTasksByQuadrant = useCallback((quadrant: QuadrantId) => {
    return matrixTasks.filter((t) => t.quadrant === quadrant);
  }, [matrixTasks]);

  const clearQuadrant = useCallback((quadrant: QuadrantId) => {
    matrixTasks.filter(t => t.quadrant === quadrant).forEach(t => deleteTask(t.id));
  }, [matrixTasks, deleteTask]);

  return useMemo(() => ({
    tasks: matrixTasks,
    addTask,
    toggleTask,
    deleteTask,
    getTasksByQuadrant,
    clearQuadrant,
    isLoaded: isHomeLoaded && isLoaded,
  }), [matrixTasks, isHomeLoaded, isLoaded, addTask, toggleTask, deleteTask, getTasksByQuadrant, clearQuadrant]);
};
