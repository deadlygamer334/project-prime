"use client";

import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useSettings } from "./SettingsContext";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use SettingsContext as the source of truth
  const { themeMode, updateSetting } = useSettings();

  // Sync to DOM whenever themeMode changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);

  const setTheme = useCallback((newTheme: Theme) => {
    updateSetting("themeMode", newTheme);
  }, [updateSetting]);

  const toggleTheme = useCallback(() => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    updateSetting("themeMode", newTheme);
  }, [themeMode, updateSetting]);

  return (
    <ThemeContext.Provider value={{ theme: themeMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
