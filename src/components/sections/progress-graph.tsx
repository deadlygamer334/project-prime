"use client";

import React from "react";
import { useHabitContext } from "@/lib/HabitContext";
import { useTheme } from "@/lib/ThemeContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Day {label}</p>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-[0_0_12px] bg-white"
          />
          <div>
            <span className="text-2xl font-bold tabular-nums text-white tracking-tight">
              {payload[0].value.toFixed(1)}%
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Completion</p>
          </div>
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
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-muted-foreground mb-1">
              Consistency Overview
            </h3>
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">
              {monthName} <span className="opacity-30 font-medium">{currentYear}</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 text-muted-foreground mb-1">Avg Completion</span>
              <span className="text-3xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                {avgCompletion}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataPoints}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHabit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "rgb(255, 255, 255)" : "rgba(var(--primary), 1)"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isDark ? "rgb(255, 255, 255)" : "rgba(var(--primary), 1)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 500 }}
                dy={15}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 500 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isDark ? "#ffffff" : "rgba(var(--primary), 1)"}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorHabit)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Info */}
        <div className="mt-12 pt-6 border-t border-border/10 flex flex-wrap gap-8 justify-center opacity-60">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDark ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
}
