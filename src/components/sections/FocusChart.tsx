"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/lib/ThemeContext";
import { formatDuration } from "@/lib/dateUtils";

interface ChartDataPoint {
    name: string; // Time label (e.g., "Mon", "12 PM")
    value: number; // Minutes
    date: string; // Full date for tooltip
}

const COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"
];

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getSubjectColor = (subject: string, index: number) => {
    return COLORS[index % COLORS.length];
};

interface FocusChartProps {
    data: any[]; // Using any for flexibility with dynamic subject keys
    timeframe: "day" | "week" | "month" | "year";
    showBreakdown?: boolean;
    subjects?: string[];
}

const CustomTooltip = ({ active, payload, label, isDark, showBreakdown }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={`p-4 rounded-xl border backdrop-blur-md shadow-xl bg-popover border-border text-popover-foreground min-w-[200px]`}>
                <p className="text-sm font-medium opacity-60 mb-2">{payload[0].payload.date}</p>

                {showBreakdown ? (
                    <div className="space-y-1">
                        {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="opacity-80">{entry.name}</span>
                                </div>
                                <span className="font-mono tabular-nums font-bold">
                                    {formatDuration(entry.value)}
                                </span>
                            </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between gap-4 text-sm">
                            <span className="font-bold opacity-60">Total</span>
                            <span className="font-mono tabular-nums font-bold">
                                {formatDuration(payload.reduce((acc: number, curr: any) => acc + curr.value, 0))}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums">
                            {formatDuration(payload[0].value)}
                        </span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default function FocusChart({ data, timeframe, showBreakdown, subjects = [] }: FocusChartProps) {
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
                        {showBreakdown ? "Subject Breakdown" : "Timer Trends"}
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
                        {formatDuration(data.reduce((acc, curr) => acc + (showBreakdown ? 0 : curr.value) + (showBreakdown ? subjects.reduce((sAcc, s) => sAcc + (curr[s] || 0), 0) : 0), 0))}
                        {/* Note: Logic above is a bit complex to handle both cases, simplification: just sum the values we display */}
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
                            content={<CustomTooltip isDark={isDark} showBreakdown={showBreakdown} />}
                            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                        />

                        {showBreakdown ? (
                            subjects.map((subject, index) => (
                                <Area
                                    key={subject}
                                    type="monotone"
                                    dataKey={subject}
                                    name={subject}
                                    stackId="1"
                                    stroke={getSubjectColor(subject, index)}
                                    fill={getSubjectColor(subject, index)}
                                    fillOpacity={0.6}
                                    strokeWidth={2}
                                    animationDuration={1000}
                                />
                            ))
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="var(--foreground)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorFocus)"
                                animationDuration={1500}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
