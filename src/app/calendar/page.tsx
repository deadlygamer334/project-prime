"use client";

import React from "react";
import AppHeader from "@/components/sections/AppHeader";
import CalendarGrid from "@/components/sections/CalendarGrid";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";
import DynamicBackground from "@/components/sections/DynamicBackground";
import { useSettings } from "@/lib/SettingsContext";

export default function CalendarPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
            <DynamicBackground />

            <AppHeader
                title="Calendar"
                activePath="/calendar"
            />

            <main className="container mx-auto flex-grow py-4 px-6 relative z-10 flex flex-col">
                <CalendarGrid />
            </main>

            {settings.showFooter && <Footer />}
        </div>
    );
}
