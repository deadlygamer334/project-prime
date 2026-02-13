"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, XCircle, Calendar, Timer, GripVertical, Settings2, ChevronDown } from "lucide-react";
import { useHomeTodo, HomeTask, Priority } from "@/hooks/useHomeTodo";
import { useTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useSettings } from "@/lib/SettingsContext";

interface PriorityDropdownProps {
  currentPriority: Priority;
  onSelect: (p: Priority) => void;
  isDark: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const PriorityDropdown = ({ currentPriority, onSelect, isDark, isOpen, onToggle, onClose }: PriorityDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const priorities: { id: Priority; label: string; color: string }[] = [
    { id: "none", label: "None", color: isDark ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-600" },
    { id: "IU", label: "Urgent & Important (I)", color: "bg-red-500 text-white" },
    { id: "IBNU", label: "Important, Not Urgent (II)", color: "bg-blue-500 text-white" },
    { id: "NIBU", label: "Urgent, Not Important (III)", color: "bg-orange-500 text-white" },
    { id: "NINU", label: "Not Urgent & Not Important (IV)", color: "bg-gray-500 text-white" },
  ];

  const current = priorities.find(p => p.id === currentPriority) || priorities[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm active:scale-95 ${current.id === "none"
          ? isDark ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" : "bg-black/5 border-black/5 text-black/60 hover:bg-black/10"
          : current.color
          }`}
      >
        {current.id === "none" ? "Set Priority" : current.id}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute left-0 mt-2 w-56 p-2 rounded-2xl shadow-2xl z-[110] border border-border backdrop-blur-xl bg-card/95"
          >
            <div className="flex flex-col gap-1">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(p.id);
                  }}
                  className={`flex flex-col items-start w-full px-3 py-2.5 rounded-xl transition-all text-left group ${currentPriority === p.id
                    ? isDark ? "bg-white/10" : "bg-black/5"
                    : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.id === 'none' ? 'bg-gray-400' : p.color.split(' ')[0]}`} />
                    <span className={`text-[12px] font-bold ${isDark ? "text-white" : "text-black"}`}>{p.id === 'none' ? 'None' : p.id}</span>
                    {currentPriority === p.id && <CheckCircle2 size={12} className="ml-auto text-blue-500" />}
                  </div>
                  <span className={`text-[10px] leading-tight mt-0.5 opacity-60 ${isDark ? "text-white" : "text-black"}`}>{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TodoPanelProps {
  searchQuery?: string;
}

export default function TodoPanel({ searchQuery = "" }: TodoPanelProps) {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    setTaskStatus,
    setPriority,
    moveTaskToDate,
    reorderTasks,
    attachPomodoro,
    getTasksByDate,
    getTotalEstimatedMinutes,
    getStatsByDateStr,
    stats,
    isLoaded,
    loadMoreTasks,
    loadingHistory
  } = useHomeTodo();

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [filter, setFilter] = useState<"all" | "active" | "done" | "cancelled">("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moveCompletedToBottom, setMoveCompletedToBottom] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const settings = useSettings();

  // Load persistence settings
  useEffect(() => {
    const saved = localStorage.getItem("paaranagat_system_todo_settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (typeof settings.moveCompletedToBottom === 'boolean') {
          setMoveCompletedToBottom(settings.moveCompletedToBottom);
        }
      } catch (e) { }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("paaranagat_system_todo_settings", JSON.stringify({ moveCompletedToBottom }));
  }, [moveCompletedToBottom]);
  const [availableHours, setAvailableHours] = useState("0");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [newTaskHours, setNewTaskHours] = useState("0");
  const [newTaskMins, setNewTaskMins] = useState("0");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("none");

  const taskInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut: Alt + N to focus New Task Input
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        taskInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Date navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);

    const dateStr = formatDateString(newDate);
    const hasTasks = tasks.some(t => t.date === dateStr);

    if (!hasTasks) {
      loadMoreTasks();
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

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

  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const est = `${newTaskHours}:${newTaskMins}`;
    const dateStr = formatDateString(currentDate);
    // Use priorityFilter for new task if active, else use selected priority
    const finalPriority = priorityFilter !== "all" ? priorityFilter : newTaskPriority;
    addTask(newTaskText, newTaskNote, est, finalPriority, dateStr);
    setNewTaskText("");
    setNewTaskNote("");
    setNewTaskHours("0");
    setNewTaskMins("0");
    setNewTaskPriority("none");
  };

  // Filter and sort tasks
  const currentDateString = formatDateString(currentDate);
  const tasksForDate = getTasksByDate(currentDateString);

  let filteredTasks = tasksForDate.filter((t: HomeTask) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return t.text.toLowerCase().includes(query) || (t.note && t.note.toLowerCase().includes(query));
    }
    return true;
  });

  if (moveCompletedToBottom) {
    filteredTasks = [...filteredTasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }

  const handleReorder = (newOrder: HomeTask[]) => {
    // Create a copy of the full task list
    const updatedTasks = [...tasks];

    // Create a map of ids to their positions in the full list
    const idToIndexMap = new Map();
    filteredTasks.forEach(task => {
      const index = updatedTasks.findIndex(t => t.id === task.id);
      if (index !== -1) idToIndexMap.set(task.id, index);
    });

    // Get all indices that were occupied by the tasks currently being reordered
    const targetIndices = Array.from(idToIndexMap.values()).sort((a, b) => a - b);

    // Replace items at those specific indices with items from the new order
    newOrder.forEach((task, i) => {
      if (i < targetIndices.length) {
        updatedTasks[targetIndices[i]] = task;
      }
    });

    reorderTasks(updatedTasks);
  };

  if (!isLoaded) return null;

  return (
    <section
      className={`todo-panel flex flex-col relative w-full lg:max-w-[912px] rounded-3xl p-4 md:p-8 backdrop-blur-[20px] transition-all duration-500 border ${isDark
        ? "bg-[rgba(10,10,10,0.6)] border-white/5 shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
        : "bg-[rgba(255,255,255,0.6)] border-white shadow-[0_24px_48px_rgba(0,0,0,0.05)]"
        }`}
      style={{ height: "auto", minHeight: "500px" }}
    >
      {/* Todo Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className={`text-[20px] md:text-[24px] font-bold tracking-[-0.02em] ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          To-do list
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setMoveCompletedToBottom(!moveCompletedToBottom)}
            className={`p-2 rounded-xl border transition-all ${moveCompletedToBottom
              ? isDark ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
              : isDark ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-black/5 border-black/5 text-black/40 hover:text-black"
              }`}
            title="Move Completed to Bottom"
          >
            <Settings2 size={18} />
          </button>
          <div className={`flex items-center rounded-xl p-1 ${isDark ? "bg-[#1c1c1e]" : "bg-[#f5f5f7]"} overflow-x-auto max-w-full hide-scrollbar`}>
            <button
              onClick={goToPreviousDay}
              className={`flex items-center px-3 md:px-4 py-2 text-[12px] md:text-[14.4px] font-medium transition-colors rounded-lg ${isDark ? "text-white hover:bg-[#3a3a3c]" : "text-[#1d1d1f] hover:bg-[#e5e5ea]"}`}
            >
              <ChevronLeft className="w-3 md:w-4 h-3 md:h-4 mr-1" /> Prev
            </button>
            <button
              onClick={goToToday}
              className={`flex items-center px-3 md:px-4 py-2 text-[12px] md:text-[14.4px] font-medium transition-colors rounded-lg border-x ${isDark ? "text-white hover:bg-[#3a3a3c] border-black/20" : "text-[#1d1d1f] hover:bg-[#e5e5ea] border-black/5"}`}
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className={`flex items-center px-3 md:px-4 py-2 text-[12px] md:text-[14.4px] font-medium transition-colors rounded-lg ${isDark ? "text-white hover:bg-[#3a3a3c]" : "text-[#1d1d1f] hover:bg-[#e5e5ea]"}`}
            >
              Next <ChevronRight className="w-3 md:w-4 h-3 md:h-4 ml-1" />
            </button>
          </div>
          <span className={`text-[12px] md:text-[14.4px] font-medium px-2 py-2 whitespace-nowrap ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}>
            {formatDisplayDate(currentDate)}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`flex-1 h-[12px] rounded-full relative overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.1)] ${isDark ? "bg-white/10" : "bg-black/5"}`}>
          <div
            className="h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            style={{
              width: `${getStatsByDateStr(currentDateString).progress}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)'
            }}
          />
        </div>
        <span className={`text-base font-medium min-w-[32px] ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>{getStatsByDateStr(currentDateString).progress.toFixed(2)}%</span>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <input
              ref={taskInputRef}
              placeholder="Task title (required)"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-[14px] focus:border-[#007aff] outline-none transition-colors ${isDark ? "bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93]" : "bg-white border-[#e5e5ea] text-black placeholder-[#86868b]"
                }`}
            />
            <input
              placeholder="Add a note (optional)"
              value={newTaskNote}
              onChange={(e) => setNewTaskNote(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-[14px] focus:border-[#007aff] outline-none transition-colors ${isDark ? "bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93]" : "bg-white border-[#e5e5ea] text-black placeholder-[#86868b]"
                }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider opacity-40 mr-1`}>Priority Filter:</span>
              <button
                onClick={() => setPriorityFilter("all")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${priorityFilter === "all"
                  ? isDark ? "bg-white/20 border-white/40 text-white" : "bg-black/10 border-black/20 text-black"
                  : isDark ? "border-white/5 text-white/40 hover:bg-white/5" : "border-black/5 text-black/40 hover:bg-black/5"
                  }`}
              >
                All
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["IU", "IBNU", "NIBU", "NINU"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(priorityFilter === p ? "all" : p)}
                  className={`text-[11px] font-bold px-4 py-2 rounded-xl border-2 transition-all active:scale-95 ${priorityFilter === p
                    ? p === "IU" ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30" :
                      p === "IBNU" ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30" :
                        p === "NIBU" ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30" :
                          p === "NINU" ? "bg-gray-500 border-gray-500 text-white shadow-lg shadow-gray-500/30" :
                            isDark ? "bg-white/20 border-white/40 text-white" : "bg-black/10 border-black/20 text-black"
                    : isDark ? "border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10" : "border-black/5 text-black/40 hover:bg-black/5 hover:border-black/10"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleAddTask}
          className="h-full font-semibold rounded-xl px-8 py-3 transition-all text-[14px] flex items-center justify-center gap-2 active:scale-95 self-start md:self-stretch shadow-lg hover:brightness-110 transition-all duration-300"
          style={{
            backgroundColor: "var(--color-button)",
            color: "var(--color-button-foreground)",
            boxShadow: "0 10px 30px -10px var(--color-button)"
          }}
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Task List */}
      <Reorder.Group
        axis="y"
        values={filteredTasks}
        onReorder={handleReorder}
        className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar"
      >
        {filteredTasks.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}>
            <p className="text-[14px]">No tasks found for this filter</p>
            {loadingHistory && (
              <div className="mt-4 flex items-center gap-2 text-[12px] opacity-70">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Checking archives...
              </div>
            )}
          </div>
        ) : (
          filteredTasks.map((task: HomeTask) => (
            <Reorder.Item
              key={task.id}
              value={task}
              className={`group flex items-center gap-3 p-4 border rounded-2xl transition-colors ${isDark ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] border-[#3a3a3c]" : "bg-[#f5f5f7] hover:bg-[#e5e5ea] border-[#e5e5ea]"
                }`}
            >
              {/* Drag Handle */}
              <div
                className={`cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}
                title="Drag to reorder"
              >
                <GripVertical size={18} />
              </div>

              {/* Checkbox */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                animate={task.completed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  toggleTask(task.id);
                  if (!task.completed && settings.confettiEnabled) {
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                  }
                }}
                className={`transition-colors shrink-0 ${task.completed ? "text-green-500" : isDark ? "text-[#8e8e93] hover:text-white" : "text-[#86868b] hover:text-black"}`}
              >
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </motion.button>

              {/* Task Content */}
              <div className="flex flex-col flex-1 min-w-0">
                <motion.span
                  animate={task.completed ? { scale: [1, 1.02, 1], opacity: 0.5 } : { scale: 1, opacity: 1 }}
                  className={`text-[15px] font-medium transition-all truncate ${task.completed ? "line-through" : isDark ? "text-white" : "text-black"}`}
                >
                  {task.text}
                </motion.span>
                {task.note && <span className={`text-[12px] truncate ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}>{task.note}</span>}
                <div className="mt-2">
                  <PriorityDropdown
                    currentPriority={task.priority}
                    isDark={isDark}
                    isOpen={activeDropdown === task.id}
                    onToggle={() => setActiveDropdown(activeDropdown === task.id ? null : task.id)}
                    onClose={() => setActiveDropdown(null)}
                    onSelect={(p) => {
                      setPriority(task.id, p);
                      setActiveDropdown(null);
                    }}
                  />
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Estimated Time */}
                {task.estimatedTime !== "0:0" && (
                  <span className={`text-[12px] font-medium px-2 py-1 rounded-md ${isDark ? "text-[#8e8e93] bg-[#0c0c0e]" : "text-[#86868b] bg-white border border-[#e5e5ea]"}`}>
                    {task.estimatedTime}
                  </span>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  {/* Move to Yesterday Button */}
                  <button
                    onClick={() => {
                      const currentTaskDate = new Date(task.date);
                      currentTaskDate.setDate(currentTaskDate.getDate() - 1);
                      moveTaskToDate(task.id, currentTaskDate.toISOString().split('T')[0]);
                    }}
                    className={`p-2 hover:bg-yellow-500/10 rounded-lg transition-all ${isDark ? "text-[#8e8e93] hover:text-yellow-400" : "text-[#86868b] hover:text-yellow-600"}`}
                    title="Move to Yesterday"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Move to Tomorrow Button */}
                  <button
                    onClick={() => {
                      const currentTaskDate = new Date(task.date);
                      currentTaskDate.setDate(currentTaskDate.getDate() + 1);
                      moveTaskToDate(task.id, currentTaskDate.toISOString().split('T')[0]);
                    }}
                    className={`p-2 hover:bg-yellow-500/10 rounded-lg transition-all ${isDark ? "text-[#8e8e93] hover:text-yellow-400" : "text-[#86868b] hover:text-yellow-600"}`}
                    title="Move to Tomorrow"
                  >
                    <ChevronRight size={18} />
                  </button>


                  {/* Attach Pomodoro Button */}
                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 hover:bg-red-500/10 text-[#8e8e93] hover:text-red-500 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))
        )}
      </Reorder.Group>
    </section>
  );
}
