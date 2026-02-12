"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Circle, Plus } from 'lucide-react';
import { useHomeTodo, HomeTask } from '@/hooks/useHomeTodo';
import { useTheme } from '@/lib/ThemeContext';
import { formatLocalDate } from '@/lib/dateUtils';
import { cn } from "@/lib/utils";

interface CalendarDayProps {
  date: Date;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  tasks: HomeTask[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (id: string, date: string) => void;
  onAddTask: (text: string, date: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, isToday, isCurrentMonth, tasks, onToggleTask, onDeleteTask, onMoveTask, onAddTask }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText, formatLocalDate(date));
      setNewTaskText("");
    }
    setIsAdding(false);
  };

  return (
    <div
      className={cn(
        "calendar-day flex flex-col w-full min-h-[220px] p-3 rounded-xl transition-all duration-200 ease-in-out border group",
        isDark
          ? (isCurrentMonth ? "bg-background/80" : "bg-background opacity-40")
          : (isCurrentMonth ? "bg-white" : "bg-card opacity-40"),
        isToday
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="day-header flex items-center justify-between mb-2">
        <span className={cn(
          "text-[14px] font-bold",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {date.getDate()}
        </span>
        <div className="flex items-center gap-1.5">
          {tasks.length > 0 && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/60"
            )}>
              {tasks.length}
            </span>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={cn(
              "p-1 rounded-md transition-all opacity-0 group-hover:opacity-100",
              isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-black/5 hover:bg-black/10 text-black/60"
            )}
            title="Add Task"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-3">
          <input
            autoFocus
            type="text"
            placeholder="New task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onBlur={() => !newTaskText.trim() && setIsAdding(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsAdding(false)}
            className={cn(
              "w-full px-2 py-1.5 text-[11px] rounded-lg border border-border outline-none bg-card text-foreground"
            )}
          />
        </form>
      )}

      <div className="day-tasks flex flex-col gap-1.5 flex-grow overflow-y-auto custom-scrollbar max-h-[180px]">
        {tasks.slice(0, 6).map(task => (
          <div
            key={task.id}
            className={cn(
              "task-item flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-medium transition-all relative group/task",
              isDark ? "bg-[#1c1c1e] border-[#333]" : "bg-[#f5f5f7] border-[#e5e5ea]"
            )}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
              className={cn("shrink-0", task.completed ? "text-green-500" : isDark ? "text-white/30" : "text-black/30")}
            >
              {task.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            </button>
            <span className={cn("truncate flex-1 pr-4", task.completed && "opacity-50 line-through")}>
              {task.text}
            </span>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity bg-inherit pl-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentTaskDate = new Date(task.date);
                  currentTaskDate.setDate(currentTaskDate.getDate() - 1);
                  onMoveTask(task.id, formatLocalDate(currentTaskDate));
                }}
                className={cn("p-1 rounded-md transition-all hover:bg-yellow-500/10", isDark ? "text-white/40 hover:text-yellow-400" : "text-black/40 hover:text-yellow-600")}
                title="Shift to Previous Day"
              >
                <ChevronLeft size={10} strokeWidth={3} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentTaskDate = new Date(task.date);
                  currentTaskDate.setDate(currentTaskDate.getDate() + 1);
                  onMoveTask(task.id, formatLocalDate(currentTaskDate));
                }}
                className={cn("p-1 rounded-md transition-all hover:bg-yellow-500/10", isDark ? "text-white/40 hover:text-yellow-400" : "text-black/40 hover:text-yellow-600")}
                title="Shift to Next Day"
              >
                <ChevronRight size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
        {tasks.length > 6 && (
          <div className={cn("text-[10px] text-center font-bold mt-1", isDark ? "text-white/20" : "text-black/20")}>
            +{tasks.length - 6} more
          </div>
        )}
      </div>
    </div >
  );
};

const CalendarGrid: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toggleTask, deleteTask, moveTaskToDate, addTask, getTasksByDate, isLoaded } = useHomeTodo();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isLoaded) return null;

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Calendar logic: padd with days from previous month
  const days = [];
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
      currentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(currentYear, currentMonth, i),
      currentMonth: true
    });
  }

  // Padd with days from next month to reach 42 days (6 weeks)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(currentYear, currentMonth + 1, i),
      currentMonth: false
    });
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return formatLocalDate(d1) === formatLocalDate(d2);
  };

  const today = new Date();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="calendar-grid-container w-full max-w-[1400px] mx-auto px-6 py-4">
      <div className="calendar-header-wrapper flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className={cn(
              "p-2 rounded-xl transition-all border",
              isDark ? "text-white/60 hover:text-white border-white/5 hover:bg-white/5" : "text-black/60 hover:text-black border-black/5 hover:bg-black/5"
            )}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <h2 className={cn(
            "text-[32px] md:text-[40px] font-bold leading-tight tracking-tight select-none",
            isDark ? "text-[#f5f5f7]" : "text-[#1d1d1f]"
          )}>
            {currentDate.toLocaleString('default', { month: 'long' })}
            <span className={cn("ml-3 font-medium opacity-30", isDark ? "text-white" : "text-black")}>
              {currentYear}
            </span>
          </h2>

          <button
            onClick={goToNextMonth}
            className={cn(
              "p-2 rounded-xl transition-all border",
              isDark ? "text-white/60 hover:text-white border-white/5 hover:bg-white/5" : "text-black/60 hover:text-black border-black/5 hover:bg-black/5"
            )}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={goToToday}
          className={cn(
            "p-3 rounded-xl transition-all border",
            isDark ? "text-white/60 hover:text-white border-white/5 hover:bg-white/5" : "text-black/60 hover:text-black border-black/5 hover:bg-black/5"
          )}
          title="Go to Today"
        >
          <RotateCcw size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="calendar-month-grid flex flex-col gap-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[700px]">
          {/* Week Day Labels */}
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map(day => (
              <div key={day} className={cn(
                "text-center text-[12px] font-bold uppercase tracking-widest py-2",
                isDark ? "text-white/20" : "text-black/20"
              )}>
                {day}
              </div>
            ))}
          </div>

          {/* The Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => (
              <CalendarDay
                key={idx}
                date={day.date}
                isCurrentMonth={day.currentMonth}
                isToday={isSameDay(day.date, today)}
                tasks={getTasksByDate(formatLocalDate(day.date))}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onMoveTask={moveTaskToDate}
                onAddTask={(text, dateStr) => addTask(text, "", "0:0", "none", dateStr)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarGrid;
