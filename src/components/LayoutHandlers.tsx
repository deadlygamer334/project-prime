"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/SettingsContext";

export default function LayoutHandlers({ children }: { children: React.ReactNode }) {
    const settings = useSettings();
    const isZenMode = settings?.isZenMode;

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Prevent multi-touch zoom if not in Zen Mode
            if (e.touches.length > 1 && !isZenMode) {
                e.preventDefault();
            }
        };

        // We must use { passive: false } to be able to preventDefault on touch events
        document.addEventListener("touchstart", handleTouchStart, { passive: false });
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
        };
    }, [isZenMode]);

    return <>{children}</>;
}
