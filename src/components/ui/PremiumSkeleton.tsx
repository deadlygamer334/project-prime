"use client";

import { useTheme } from "@/lib/ThemeContext";

interface PremiumSkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
}

export default function PremiumSkeleton({ className = "", width, height, borderRadius }: PremiumSkeletonProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div
            className={`relative overflow-hidden ${className} transition-colors duration-300`}
            style={{
                width,
                height,
                borderRadius: borderRadius ?? "12px",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
            }}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{
                    background: isDark
                        ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.04) 50%, transparent 100%)"
                        : "linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.04) 50%, transparent 100%)",
                }}
            />
        </div>
    );
}
