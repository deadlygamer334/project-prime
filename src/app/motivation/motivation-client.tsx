"use client";

import AppHeader from "@/components/sections/AppHeader";
import MotivationHero from "@/components/sections/MotivationHero";
import Footer from "@/components/sections/Footer";
import dynamic from "next/dynamic";
import { useTheme } from "@/lib/ThemeContext";

const MotivationGrid = dynamic(() => import("@/components/sections/MotivationGrid"), {
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">Loading Grid...</div>
});

export default function MotivationPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
      <AppHeader title="Motivation Hub" activePath="/motivation" />
      <main className="flex-grow">
        <MotivationHero />
        <MotivationGrid />
      </main>
      <Footer />
    </div>
  );
}
