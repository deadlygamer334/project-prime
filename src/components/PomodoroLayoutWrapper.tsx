"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useSettings } from "@/lib/SettingsContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const PomodoroPanel = dynamic(() => import("@/components/sections/PomodoroPanel"), {
    ssr: false,
});

export default function PomodoroLayoutWrapper() {
    const pathname = usePathname();
    const settings = useSettings();
    const isDashboard = pathname === "/";
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!isDashboard) {
            setPortalTarget(null);
            return;
        }

        // 1. Initial check
        const target = document.getElementById("pomodoro-panel-portal-target");
        if (target) {
            setPortalTarget(target);
            return;
        }

        // 2. If not found, observe mutations (e.g., when ProtectedRoute finishes loading)
        const observer = new MutationObserver(() => {
            const foundTarget = document.getElementById("pomodoro-panel-portal-target");
            if (foundTarget) {
                setPortalTarget(foundTarget);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    }, [isDashboard, pathname]);

    const content = (
        <GlobalErrorBoundary moduleName="Focus Engine">
            <PomodoroPanel />
        </GlobalErrorBoundary>
    );

    // If we're on the dashboard and the portal target exists, render into the grid slot.
    if (isDashboard && portalTarget) {
        return createPortal(content, portalTarget);
    }

    // If we're NOT on the dashboard, render it hidden in the layout so PiP/Timer stays active.
    // If we're on the dashboard but target isn't found yet (first render), we can render it hidden temporarily to avoid unmounting.
    return (
        <div
            className="opacity-0 pointer-events-none absolute left-[-9999px] top-[-9999px] invisible"
            data-component="pomodoro-layout-wrapper-hidden"
        >
            {content}
        </div>
    );
}
