"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/lib/ThemeContext";

interface ChartDataPoint {
    name: string; // Time label (e.g., "Mon", "12 PM")
    value: number; // Minutes
    date: string; // Full date for tooltip
}

interface FocusChartProps {
    data: ChartDataPoint[];
    timeframe: "day" | "week" | "month" | "year";
}

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={`p-4 rounded-xl border backdrop-blur-md shadow-xl bg-popover border-border text-popover-foreground`}>
                <p className="text-sm font-medium opacity-60 mb-1">{payload[0].payload.date}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">
                        {payload[0].value.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">mins</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function FocusChart({ data, timeframe }: FocusChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (!data || data.length === 0) {
        return (
            <div className={`w-full h-[300px] flex items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20`}>
                <p className="opacity-40 text-muted-foreground">No data available for this period</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h3 className={`text-sm font-medium uppercase tracking-widest text-muted-foreground`}>
                        Timer Trends
                    </h3>
                    <p className={`text-sm text-muted-foreground/60`}>
                        {timeframe === "day" && "Minutes per hour"}
                        {timeframe === "week" && "Daily timer total"}
                        {timeframe === "month" && "Daily timer total"}
                        {timeframe === "year" && "Monthly timer total"}
                    </p>
                </div>
                {/* Total for the chart period */}
                <div className="text-right">
                    <p className={`text-xs uppercase tracking-widest font-bold opacity-40 text-foreground`}>
                        Total
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        {data.reduce((acc, curr) => acc + curr.value, 0).toFixed(2)} <span className="text-sm text-foreground opacity-50">min</span>
                    </p>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isDark ? "#fff" : "#000"} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={isDark ? "#fff" : "#000"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                            strokeOpacity={0.3}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--foreground)", fontSize: 11, fontFamily: "monospace", opacity: 0.5 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--foreground)", fontSize: 11, fontFamily: "monospace", opacity: 0.5 }}
                        />
                        <Tooltip
                            content={<CustomTooltip isDark={isDark} />}
                            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--foreground)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorFocus)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
