"use client";

import React from "react";
import { useHabitContext } from "@/lib/HabitContext";
import { useTheme } from "@/lib/ThemeContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 rounded-xl border backdrop-blur-md shadow-xl bg-card border-border text-foreground">
        <p className="text-sm font-medium opacity-60 mb-1">Day {label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">
            {payload[0].value.toFixed(2)}%
          </span>
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">Completion</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProgressGraph() {
  const { getStatsForDay, currentMonth, currentYear } = useHabitContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Get data points for the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const dataPoints = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const stats = getStatsForDay(day);
    return {
      name: day.toString(),
      value: Number(stats.percent.toFixed(2)),
    };
  });

  const avgCompletion = (dataPoints.reduce((acc, p) => acc + p.value, 0) / dataPoints.length).toFixed(2);

  return (
    <section className="w-full mt-10 px-0">
      <div
        className={`habit-main-card w-full border rounded-3xl p-8 md:p-12 transition-all duration-500 relative overflow-hidden bg-card border-border shadow-soft backdrop-blur-xl`}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 bg-primary" />
        <div className="absolute bottom-0 left-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-10 bg-blue-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold tracking-[0.2em] uppercase opacity-40 text-muted-foreground">
              Consistency Overview
            </h3>
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">
              {monthName} <span className="opacity-30">{currentYear}</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-40 text-muted-foreground">Avg Completion</span>
              <span className="text-2xl font-bold text-primary">
                {avgCompletion}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataPoints}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHabit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#ffffff" : "rgba(var(--primary), 1)"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isDark ? "#ffffff" : "rgba(var(--primary), 1)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--foreground)", fontSize: 11, fontFamily: "monospace", opacity: 0.5 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--foreground)", fontSize: 11, fontFamily: "monospace", opacity: 0.5 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isDark ? "#ffffff" : "rgba(var(--primary), 1)"}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorHabit)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Info */}
        <div className="mt-12 pt-8 border-t border-border/20 flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
            <span className="text-[12px] font-medium opacity-60 text-muted-foreground">Completion Rate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-[2px] bg-primary opacity-30 rounded-full" />
            <span className="text-[12px] font-medium opacity-60 text-muted-foreground">Activity Trend</span>
          </div>
        </div>
      </div>
    </section>
  );
}
