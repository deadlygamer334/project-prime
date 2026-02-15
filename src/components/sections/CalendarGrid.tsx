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
  const [selectedMobileDate, setSelectedMobileDate] = useState(new Date());

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
    const d = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(d);
    setSelectedMobileDate(d);
  };

  const goToToday = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedMobileDate(d);
  };

  const goToNextMonth = () => {
    const d = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(d);
    setSelectedMobileDate(d);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return formatLocalDate(d1) === formatLocalDate(d2);
  };

  const today = new Date();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="calendar-grid-container w-full max-w-[1400px] mx-auto px-6 py-4">
      {/* --- DESKTOP VIEW (Visible on tablet and laptop) --- */}
      <div className="hidden md:block">
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
      </div>

      {/* --- MOBILE VIEW (Agenda Layout) --- */}
      <div className="md:hidden flex flex-col gap-6">
        {/* Month Selector Strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className={cn(
                "p-2 rounded-xl border transition-all",
                isDark ? "text-white/40 hover:text-white border-white/5" : "text-black/40 hover:text-black border-black/5"
              )}
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-2xl font-black tracking-tight select-none">
              {currentDate.toLocaleString('default', { month: 'long' })}
              <span className="ml-2 font-medium opacity-20 text-foreground">
                {currentYear}
              </span>
            </h2>
            <button
              onClick={goToNextMonth}
              className={cn(
                "p-2 rounded-xl border transition-all",
                isDark ? "text-white/40 hover:text-white border-white/5" : "text-black/40 hover:text-black border-black/5"
              )}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-black/5 border-black/5 text-black/50"
            )}
            title="Go to Today"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Horizontal Week Strip */}
        <div className="overflow-x-auto hide-scrollbar -mx-6 px-6">
          <div className="flex gap-2.5 min-w-max pb-2">
            {/* Show 14 days around the selected date for quick navigation */}
            {Array.from({ length: 14 }).map((_, i) => {
              const d = new Date(selectedMobileDate);
              d.setDate(d.getDate() - 3 + i);
              const isSelected = formatLocalDate(d) === formatLocalDate(selectedMobileDate);
              const isTodayMobile = formatLocalDate(d) === formatLocalDate(today);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedMobileDate(d)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all min-w-[65px]",
                    isSelected
                      ? "bg-primary border-primary shadow-[0_8px_20px_rgba(var(--primary),0.3)] shadow-primary/30"
                      : isDark
                        ? "bg-white/5 border-white/5 hover:bg-white/10"
                        : "bg-white border-black/5 hover:bg-black/5 shadow-sm"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {d.toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className={cn(
                    "text-xl font-black",
                    isSelected ? "text-primary-foreground" : isTodayMobile ? "text-primary" : "text-foreground"
                  )}>
                    {d.getDate()}
                  </span>
                  {isTodayMobile && !isSelected && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agenda Title */}
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Daily Agenda
          </span>
          <h3 className="text-xl font-bold">
            {formatLocalDate(selectedMobileDate) === formatLocalDate(today) ? "Today" : selectedMobileDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
        </div>

        {/* Task List (Agenda) */}
        <div className="flex flex-col gap-3 min-h-[300px]">
          {getTasksByDate(formatLocalDate(selectedMobileDate)).length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed",
              isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-black/5"
            )}>
              <span className="text-sm opacity-50 font-medium italic text-center text-balance">
                Your schedule is clear for this day. Feel free to rest or plan ahead.
              </span>
              <button
                onClick={() => {
                  const agendaDay = document.querySelector('.mobile-agenda-add') as HTMLElement;
                  if (agendaDay) agendaDay.focus();
                }}
                className="mt-4 text-xs font-bold text-primary flex items-center gap-2"
              >
                <Plus size={14} /> Add First Task
              </button>
            </div>
          ) : (
            getTasksByDate(formatLocalDate(selectedMobileDate)).map(task => (
              <div
                key={task.id}
                className={cn(
                  "p-5 rounded-3xl border flex items-center gap-4 transition-all active:scale-[0.98]",
                  isDark ? "bg-[#1c1c1e] border-white/5" : "bg-white border-black/5 shadow-sm",
                  task.completed && "opacity-60"
                )}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    task.completed ? "bg-green-500 border-green-500 text-white" : isDark ? "border-white/20" : "border-black/10"
                  )}
                >
                  {task.completed && <CheckCircle2 size={18} strokeWidth={3} />}
                </button>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={cn(
                    "text-[17px] font-bold leading-tight select-text",
                    task.completed && "line-through opacity-50"
                  )}>
                    {task.text}
                  </span>
                  {task.note && (
                    <span className="text-sm text-muted-foreground mt-1 line-clamp-2 select-text">
                      {task.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const prevDate = new Date(selectedMobileDate);
                      prevDate.setDate(prevDate.getDate() - 1);
                      moveTaskToDate(task.id, formatLocalDate(prevDate));
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    title="Move to Yesterday"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const nextDate = new Date(selectedMobileDate);
                      nextDate.setDate(nextDate.getDate() + 1);
                      moveTaskToDate(task.id, formatLocalDate(nextDate));
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    title="Move to Tomorrow"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Inline Add Task for Mobile */}
          <div className={cn(
            "p-5 rounded-3xl border border-dashed flex items-center gap-4 mt-2",
            isDark ? "border-white/10" : "border-black/5"
          )}>
            <div className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center opacity-30">
              <Plus size={18} />
            </div>
            <input
              className="bg-transparent flex-1 border-none focus:ring-0 outline-none text-[16px] font-medium text-foreground placeholder-muted-foreground mobile-agenda-add"
              placeholder="What's on your mind?"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    addTask(target.value.trim(), "", "0:0", "none", formatLocalDate(selectedMobileDate));
                    target.value = "";
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarGrid;
