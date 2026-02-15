"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { DatePicker } from "@/components/ui/date-picker";

export default function MatrixToolbar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(newDate);
  };

  const newDate = new Date();

  return (
    <section
      className={`matrix-date-toolbar flex items-center justify-between w-full max-w-[1152px] h-[66.5938px] px-[24px] py-[16px] mx-auto mb-[24px] transition-colors duration-300 rounded-3xl bg-card/60 backdrop-blur-xl shadow-soft border border-border`}
    >
      <div className="matrix-date-nav flex items-center gap-[8px]">
        <button
          onClick={handlePrev}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-muted/80`}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={handleToday}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-muted/80`}
        >
          Today
        </button>
        <button
          onClick={handleNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-muted/80`}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <DatePicker
          date={currentDate}
          setDate={(d) => d && setCurrentDate(d)}
          className="h-10 px-4 py-2 rounded-full border-none shadow-none bg-muted text-muted-foreground hover:bg-muted/80"
        />
        <span
          className={`hidden sm:inline-block text-[15px] font-semibold uppercase tracking-widest text-foreground/80`}
          style={{ fontFamily: 'var(--font-current)' }}
        >
          {formatDisplayDate(currentDate)}
        </span>
      </div>
    </section>
  );
}
