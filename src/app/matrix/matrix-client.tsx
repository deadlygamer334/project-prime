"use client";

import AppHeader from "@/components/sections/AppHeader";
import MatrixHero from "@/components/sections/matrix-hero";
import MatrixToolbar from "@/components/sections/matrix-toolbar";
import MatrixGrid from "@/components/sections/matrix-grid";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";

export default function MatrixPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">

      <AppHeader title="Mind Matrix" activePath="/matrix" />

      <main className="container mx-auto flex-grow py-8 px-6 relative z-10">
        <MatrixHero />
        <MatrixToolbar />
        <MatrixGrid />
      </main>

      <Footer />
    </div>
  );
}
