"use client";

import React from "react";
import Link from "next/link";

/**
 * Navigation Component
 * 
 * A pixel-perfect clone of the top navigation bar.
 * Features:
 * - "Paaranagat System" logo on the left
 * - Navigation links for List View, Calendar View, and Matrix View in the center/right
 * - Theme toggle button with emoji on the far right
 * - Glassmorphism effect as per high-level design
 */
const Navigation = () => {
  return (
    <header className="sticky top-0 z-50 flex h-[64px] w-full items-center justify-between border-b border-[#2a2a2e] bg-[#0a0a0c]/80 px-6 backdrop-blur-md">
      {/* Left Section: Logo */}
      <div className="flex items-center">
        <Link href="/" className="text-[1.25rem] font-bold tracking-tight text-white transition-opacity hover:opacity-80">
          Paaranagat System
        </Link>
      </div>

      {/* Right Section: Navigation Links & Actions */}
      <div className="flex items-center gap-2">
        {/* Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-[0.9rem] font-medium text-white transition-colors hover:bg-white/10"
          >
            List View
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg px-4 py-2 text-[0.9rem] font-medium text-white transition-colors hover:bg-white/10"
          >
            Calendar View
          </Link>
          <Link
            href="/matrix"
            className="rounded-lg px-4 py-2 text-[0.9rem] font-medium text-white transition-colors hover:bg-white/10"
          >
            Matrix View
          </Link>
        </nav>

        {/* Theme Toggle Button */}
        <div className="ml-2 flex items-center border-l border-[#2a2a2e] pl-4">
          <button
            id="themeToggle"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-white/10 active:scale-95"
            aria-label="Toggle theme"
          >
            <span className="text-[1.1rem]">💻</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;