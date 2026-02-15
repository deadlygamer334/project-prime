"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, ChevronDown, Search, LayoutGrid, Target, Zap, Headphones, Settings, Home, CheckCircle2, Calendar, Trophy } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  title: string;
  activePath?: string;
  onSearch?: (query: string) => void;
  onClearAll?: () => void;
  showSearch?: boolean;
}

export default function AppHeader({ title, activePath, onSearch, onClearAll, showSearch = false }: AppHeaderProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMoreMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMoreOpen(true);
  };

  const handleMoreMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsMoreOpen(false);
    }, 300);
  };

  const mainNavItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Habits", href: "/habit-tracker", icon: CheckCircle2 },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  const toolItems = [
    { label: "Matrix", href: "/matrix", icon: LayoutGrid, desc: "Prioritize tasks" },
    { label: "Timer Progress", href: "/focus-progress", icon: Target, desc: "Track goals" },
    { label: "Motivation", href: "/motivation", icon: Zap, desc: "Fuel your drive" },
    { label: "Ambience", href: "/ambience", icon: Headphones, desc: "Soundscapes" },
    { label: "Settings", href: "/settings", icon: Settings, desc: "Customize app" },
  ];

  const isDark = theme === "dark";

  return (
    <header className="transition-all duration-300 sticky top-0 w-full z-[1000] px-4 md:px-6 pt-4">
      <div
        className={`mx-auto max-w-[1400px] flex relative items-center justify-between w-full h-[64px] px-4 md:px-6 rounded-2xl border backdrop-blur-[24px] transition-all duration-500 shadow-2xl ${isDark
          ? "bg-[rgba(20,20,20,0.6)] border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          : "bg-[rgba(255,255,255,0.6)] border-white/40 text-[#1d1d1f] shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
          }`}
        style={{
          fontFamily: 'var(--font-current)'
        }}
      >
        {/* Header Left: Logo/Title */}
        <div className="header-left flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className={`absolute -inset-1.5 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${isDark ? "bg-white" : "bg-black"}`}></div>
              <svg viewBox="0 0 512 512" className="w-6 h-6 relative z-10">
                <path d="M160 140 h120 c60 0 100 40 100 100 s-40 100 -100 100 h-70 v132 h-50 z m50 50 v100 h70 c30 0 50 -20 50 -50 s-20 -50 -50 -50 z" fill={isDark ? "white" : "black"} />
                <circle cx="360" cy="380" r="25" fill="#3b82f6" />
              </svg>
            </div>
            <h1
              className={`page-title text-[18px] md:text-[22px] font-bold tracking-tight cursor-pointer transition-all whitespace-nowrap ${isDark ? "text-white" : "text-[#1d1d1f]"
                }`}
              style={{
                letterSpacing: "-0.03em",
                lineHeight: "1.2"
              }}
            >
              PRIME
            </h1>
          </Link>
        </div>

        {/* Header Right: Navigation Links */}
        <div className="header-right flex items-center gap-2 lg:gap-4">

          {/* Desktop Navigation (Hidden on Mobile/Tablet) */}
          <nav className="primary-nav hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative flex items-center justify-center px-4 h-[36px] text-[13.5px] font-medium rounded-xl transition-colors duration-300 whitespace-nowrap ${isActive
                    ? isDark ? "text-white shadow-sm" : "text-[#1d1d1f] font-semibold"
                    : isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeHighlight"
                      className={`absolute inset-0 z-0 rounded-xl ${isDark ? "bg-white/10" : "bg-black/5"
                        }`}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMoreMouseEnter}
              onMouseLeave={handleMoreMouseLeave}
            >
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                aria-label="More Menu"
                className={`flex items-center gap-1.5 px-4 h-[36px] text-[13.5px] font-medium rounded-xl transition-all duration-300 whitespace-nowrap ${isMoreOpen || toolItems.some(i => i.href === activePath)
                  ? isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                  : isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
              >
                More <ChevronDown size={14} className={`transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border overflow-hidden z-[100] ${isDark
                      ? "bg-[#1a1a1a] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_1px_0_0_rgba(255,255,255,0.1)_inset]"
                      : "bg-white border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.9)_inset,0_1px_0_0_rgba(255,255,255,1)_inset]"
                      }`}
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(40, 40, 40, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.98) 100%)",
                    }}
                  >
                    <div className="grid grid-cols-1">
                      {toolItems.map((item, index) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors group ${isDark
                            ? "text-white hover:bg-white/10"
                            : "text-black hover:bg-black/5"
                            }`}
                          onClick={() => setIsMoreOpen(false)}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${isDark ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10"}`}>
                            <item.icon size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13.5px] font-medium leading-tight">{item.label}</span>
                            <span className={`text-[11px] leading-tight ${isDark ? "text-white/40" : "text-black/40"}`}>{item.desc}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Search Bar (Hidden on Mobile) */}
          {showSearch && (
            <div className={`relative hidden md:flex items-center ml-2 ${isDark ? "text-white" : "text-black"}`}>
              <Search size={14} className={`absolute left-3 ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                className={`w-[140px] lg:w-[180px] h-[36px] pl-9 pr-3 rounded-xl text-[13px] border transition-all outline-none focus:ring-1 focus:ring-white/20 ${isDark
                  ? "bg-white/5 border-white/10 text-white placeholder-white/30"
                  : "bg-black/5 border-black/5 text-black placeholder-black/30"
                  }`}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-500 hover:rotate-[360deg] ${isDark ? "bg-white/5 text-yellow-400 hover:bg-white/10" : "bg-black/5 text-indigo-600 hover:bg-black/10"
                }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Menu Toggle (DEPRECATED - Removed in favor of Bottom Dock) */}
            <div className="lg:hidden flex items-center justify-center w-9 h-9">
              {/* Intentional space to keep theme toggle centered/right-aligned */}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Dock (Visible only on Mobile/Tablet) */}
      <div className="lg:hidden fixed bottom-6 left-0 right-0 z-[1001] px-4 pointer-events-none">
        <div className="flex justify-center max-w-md mx-auto pointer-events-auto">
          <nav
            className={`flex items-center gap-1 p-2 rounded-full border shadow-2xl backdrop-blur-3xl transition-all duration-500 ${isDark
              ? "bg-[rgba(20,20,20,0.8)] border-white/20 text-white"
              : "bg-[rgba(255,255,255,0.8)] border-black/10 text-black"
              }`}
          >
            {mainNavItems.map((item) => {
              const isActive = (activePath || pathname) === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isActive
                    ? isDark ? "text-white" : "text-black"
                    : isDark ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveHighlight"
                      className={`absolute inset-0 z-0 rounded-full ${isDark ? "bg-white/10" : "bg-black/5"
                        }`}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <item.icon size={20} className="relative z-10" />
                  <span className="text-[9px] font-bold tracking-tighter uppercase mt-1 relative z-10">{item.label}</span>
                </Link>
              );
            })}

            {/* More Drawer Trigger */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isDrawerOpen
                    ? isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                    : isDark ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
                    }`}
                >
                  <Menu size={20} />
                  <span className="text-[9px] font-bold tracking-tighter uppercase mt-1">More</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className={`rounded-t-[32px] border-t backdrop-blur-3xl transition-[background-color] duration-500 overflow-hidden ${isDark
                ? "bg-[#0a0a0c]/90 border-white/10"
                : "bg-white/95 border-black/5"
                }`}>
                <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mt-4 mb-4" />
                <DrawerHeader>
                  <DrawerTitle className={`text-2xl font-bold tracking-tight text-center ${isDark ? "text-white" : "text-black"}`}>Apps & Tools</DrawerTitle>
                  <DrawerDescription className={`text-center mb-6 ${isDark ? "text-white/40" : "text-black/40"}`}>
                    All your productivity tools in one place
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-3 gap-y-8 px-6 pb-12 overflow-y-auto max-h-[60vh]">
                  {toolItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex flex-col items-center gap-3 transition-transform active:scale-90"
                    >
                      <div className={`p-4 rounded-[24px] shadow-xl transition-all ${isDark ? "bg-white/5 border border-white/5" : "bg-black/5 border border-black/5"}`}>
                        <item.icon size={28} className={isDark ? "text-white" : "text-black"} />
                      </div>
                      <span className={`text-[13px] font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          </nav>
        </div>
      </div>

    </header>
  );
}
