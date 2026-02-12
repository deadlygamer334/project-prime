"use client";

import PremiumSkeleton from "@/components/ui/PremiumSkeleton";

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#050505] gap-6 transition-colors duration-300">
            <div className="relative">
                <PremiumSkeleton width="64px" height="64px" borderRadius="16px" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <PremiumSkeleton width="180px" height="20px" borderRadius="12px" />
                <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest opacity-80 animate-pulse">
                    Loading System
                </p>
            </div>
        </div>
    );
}
