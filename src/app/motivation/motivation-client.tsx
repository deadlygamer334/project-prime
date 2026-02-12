"use client";

import AppHeader from "@/components/sections/AppHeader";
import MotivationHero from "@/components/sections/MotivationHero";
import MotivationGrid from "@/components/sections/MotivationGrid";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";

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
