"use client";

import { useState, useEffect } from "react";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  blockId: string;
  createdAt: number;
}

export const useDayPlanner = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTasks = localStorage.getItem("day_planner_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("day_planner_tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (text: string, blockId: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      blockId,
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const clearBlockTasks = (blockId: string) => {
    setTasks((prev) => prev.filter((task) => task.blockId !== blockId));
  };

  const getTasksByBlock = (blockId: string) => {
    return tasks.filter((task) => task.blockId === blockId);
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    progress: tasks.length > 0 ? (tasks.filter((t) => t.completed).length / tasks.length) * 100 : 0,
  };

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    clearBlockTasks,
    getTasksByBlock,
    stats,
    isLoaded,
  };
};
