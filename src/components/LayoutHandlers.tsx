"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/SettingsContext";

export default function LayoutHandlers({ children }: { children: React.ReactNode }) {
    const settings = useSettings();
    const isZenMode = settings?.isZenMode;

    return <>{children}</>;
}
