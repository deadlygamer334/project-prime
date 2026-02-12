"use client";

import React, { useState, useMemo } from 'react';
import { Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHomeTodo, HomeTask, Priority } from '@/hooks/useHomeTodo';
import { useTheme } from '@/lib/ThemeContext';

export type QuadrantId = "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";

interface QuadrantProps {
  id: QuadrantId;
  title: string;
  description: string;
  tasks: HomeTask[];
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const quadrantToPriority: Record<QuadrantId, Priority> = {
  "urgent-important": "IU",
  "not-urgent-important": "IBNU",
  "urgent-not-important": "NIBU",
  "not-urgent-not-important": "NINU",
};

const quadrantColors: Record<QuadrantId, {
  bg: string;
  border: string;
  text: string;
  countBg: string; // New: Background for count badge
  countText: string; // New: Text color for count badge
}> = {
  "urgent-important": {
    bg: "bg-red-500/5 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/20",
    text: "text-red-700 dark:text-red-400",
    countBg: "bg-red-100 dark:bg-red-500/20",
    countText: "text-red-700 dark:text-red-300"
  },
  "not-urgent-important": {
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    countBg: "bg-blue-100 dark:bg-blue-500/20",
    countText: "text-blue-700 dark:text-blue-300"
  },
  "urgent-not-important": {
    bg: "bg-orange-500/5 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-500/20",
    text: "text-orange-700 dark:text-orange-400",
    countBg: "bg-orange-100 dark:bg-orange-500/20",
    countText: "text-orange-700 dark:text-orange-300"
  },
  "not-urgent-not-important": {
    bg: "bg-slate-500/5 dark:bg-slate-500/10",
    border: "border-slate-200 dark:border-slate-500/20",
    text: "text-slate-700 dark:text-slate-400",
    countBg: "bg-slate-100 dark:bg-slate-500/20",
    countText: "text-slate-700 dark:text-slate-300"
  }
};

const QuadrantCard = ({ id, title, description, tasks, onAddTask, onToggleTask, onDeleteTask }: QuadrantProps) => {
  const [newTaskText, setNewTaskText] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText, quadrantToPriority[id]);
    setNewTaskText("");
  };

  const colors = quadrantColors[id];

  return (
    <section
      className={`matrix-quadrant flex flex-col h-full rounded-3xl p-5 md:p-[30.4px] border transition-all duration-300 shadow-soft hover:shadow-lg backdrop-blur-sm ${colors.bg} ${colors.border}`}
    >
      <header className="matrix-quadrant-header flex justify-between items-start mb-6">
        <div className="flex-1 pr-4">
          <h3 className="relative pl-[20px] text-[18.4px] font-semibold leading-[1.4] mb-[5.6px] text-foreground">
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] ${id === 'urgent-important' ? 'bg-red-500' :
              id === 'not-urgent-important' ? 'bg-blue-500' :
                id === 'urgent-not-important' ? 'bg-yellow-500' : 'bg-zinc-400'
              }`} />
            {title}
          </h3>
          <p className="text-[14.4px] leading-[1.6] font-normal text-muted-foreground">
            {description}
          </p>
        </div>
        <span className={`matrix-count flex items-center justify-center min-w-[36px] h-[34.5px] px-[13.6px] py-[6.4px] text-[13.6px] font-semibold rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] shrink-0 ${colors.countBg} ${colors.countText} border-transparent`}>
          {tasks.length}
        </span>
      </header>

      <form className="matrix-add space-y-3 mb-8" onSubmit={handleSubmit}>
        <div className="relative">
          <input
            className={`matrix-input w-full border rounded-xl px-4 py-3 text-[14.4px] transition-all pr-[100px] outline-none focus:ring-2 focus:ring-primary/30 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50`}
            placeholder="Add a task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow-lg"
          >
            Add
          </button>
        </div>
      </form>

      <div className="matrix-list flex-1 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
        {tasks.length === 0 ? (
          <div className={`matrix-empty border border-dashed rounded-2xl p-[40px] text-center text-[14px] backdrop-blur-sm border-border text-muted-foreground bg-muted/20`}>
            No tasks here yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-3 border rounded-xl transition-all bg-card/50 hover:bg-card border-border`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`transition-colors ${task.completed ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-[14px] transition-all ${task.completed ? "opacity-50 line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.text}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === "IU" ? "bg-red-500/20 text-red-500" :
                      task.priority === "IBNU" ? "bg-blue-500/20 text-blue-500" :
                        task.priority === "NIBU" ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-gray-500/20 text-gray-500"
                      }`}>
                      {task.priority}
                    </span>
                    {task.estimatedTime && task.estimatedTime !== "0:0" && (
                      <span className="text-[9px] text-muted-foreground">
                        {task.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const MatrixGrid = () => {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    isLoaded
  } = useHomeTodo();

  const [currentDate, setCurrentDate] = useState(new Date());
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Define helpers BEFORE potential early return to ensure consistent scope
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (formatDateString(date) === formatDateString(today)) return "Today";
    if (formatDateString(date) === formatDateString(yesterday)) return "Yesterday";
    if (formatDateString(date) === formatDateString(tomorrow)) return "Tomorrow";

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const currentDateString = formatDateString(currentDate);

  const getTasksByQuadrant = (priority: Priority) => {
    return tasks.filter((t) => t.priority === priority && t.date === currentDateString);
  };

  const quadrants: { id: QuadrantId; title: string; description: string }[] = useMemo(() => [
    {
      id: 'urgent-important',
      title: 'Quadrant I · Important & Urgent',
      description: 'High-value tasks with immediate consequences if ignored.',
    },
    {
      id: 'not-urgent-important',
      title: 'Quadrant II · Important, Not Urgent',
      description: 'Strategic tasks that compound over time without fixed deadlines.',
    },
    {
      id: 'urgent-not-important',
      title: 'Quadrant III · Not Important, Urgent',
      description: 'Time-sensitive tasks that don’t require your expertise.',
    },
    {
      id: 'not-urgent-not-important',
      title: 'Quadrant IV · Not Important, Not Urgent',
      description: 'Low-value distractions that steal focus and energy.',
    }
  ], []);

  const handleAddTask = (text: string, priority: Priority) => {
    addTask(text, undefined, undefined, priority, currentDateString);
  };

  if (!isLoaded) return null;

  return (
    <div className="w-full max-w-[1152px] mx-auto px-6">
      {/* Date Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-foreground">Focus Matrix</h2>
          <p className="text-lg text-muted-foreground">Categorize your tasks by priority.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-xl p-1 bg-muted`}>
            <button
              onClick={goToPreviousDay}
              className={`flex items-center px-4 py-2 text-[14.4px] font-medium transition-colors rounded-lg text-foreground hover:bg-background/50`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
            </button>
            <button
              onClick={goToToday}
              className={`flex items-center px-4 py-2 text-[14.4px] font-medium transition-colors rounded-lg border-x text-foreground hover:bg-background/50 border-border`}
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className={`flex items-center px-4 py-2 text-[14.4px] font-medium transition-colors rounded-lg text-foreground hover:bg-background/50`}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card/50 text-foreground/80`}>
            <span className="text-[14.4px] font-semibold whitespace-nowrap">
              {formatDisplayDate(currentDate)}
            </span>
          </div>
        </div>
      </div>

      <section
        id="matrixGrid"
        className="matrix-grid grid grid-cols-1 md:grid-cols-2 gap-6 pb-16"
      >
        {quadrants.map((q) => (
          <QuadrantCard
            key={q.id}
            id={q.id}
            title={q.title}
            description={q.description}
            tasks={getTasksByQuadrant(quadrantToPriority[q.id])}
            onAddTask={handleAddTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </section>
    </div>
  );
};

export default MatrixGrid;
