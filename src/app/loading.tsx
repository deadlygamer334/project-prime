"use client";

import PremiumSkeleton from "@/components/ui/PremiumSkeleton";

export default function Loading() {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none" aria-hidden="true">
            <div className="h-[2.5px] w-full bg-primary/20 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-full animate-pulse" />
            </div>
        </div>
    );
}
