"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useWallpaper } from "@/lib/WallpaperContext";

export default function QuoteBlock() {
    const [quote, setQuote] = useState("");
    const [quotesList, setQuotesList] = useState<string[]>([]);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { wallpaper } = useWallpaper();
    const hasWallpaper = !!wallpaper;

    // Helper to remove leading numbers (e.g., "1. ", "123. ", etc.)
    const cleanQuote = (q: string) => {
        // Allow leading whitespace before digits, and optional quotes after the number
        let cleaned = q.replace(/^\s*\d+\.\s*/, '').trim();
        // Also strip wrapping quotes if they were left behind by the number stripping
        cleaned = cleaned.replace(/^["'](.*)["']$/, '$1').trim();
        return cleaned;
    };

    // Fisher-Yates Shuffle for truly random distribution
    const shuffle = (array: string[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const fetchQuotes = async () => {
        try {
            const response = await fetch('/api/quotes');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setQuotesList(data);

                    // Get pool from localStorage
                    let pool: string[] = [];
                    const storedPool = localStorage.getItem('quotes_pool');
                    const storedCount = localStorage.getItem('quotes_total_count');

                    if (storedPool) {
                        try {
                            pool = JSON.parse(storedPool);
                        } catch (e) {
                            pool = [];
                        }
                    }

                    // If pool is empty, OR data length changed (re-seeded), re-initialize
                    if (pool.length === 0 || storedCount !== data.length.toString()) {
                        pool = shuffle(data);
                        localStorage.setItem('quotes_total_count', data.length.toString());
                    }

                    const nextQuote = pool.pop();
                    localStorage.setItem('quotes_pool', JSON.stringify(pool));

                    if (nextQuote) {
                        setQuote(cleanQuote(nextQuote));
                    } else {
                        // Fallback logic if pop fails somehow
                        setQuote(cleanQuote(data[Math.floor(Math.random() * data.length)]));
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching quotes:', error);
        }

        // Fallback quotes if API fails
        const fallbacks = [
            "Your energy is your currency. Invest it wisely today.",
            "Focus is the bridge between goals and accomplishment.",
            "Progress over perfection, every single day.",
            "Stay calm, stay focused, stay productive.",
            "Your future self will thank you for the work you do today."
        ];
        setQuotesList(fallbacks);
        setQuote(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const refreshQuote = () => {
        if (quotesList.length === 0) return;

        let pool: string[] = [];
        const storedPool = localStorage.getItem('quotes_pool');

        if (storedPool) {
            try {
                pool = JSON.parse(storedPool);
            } catch (e) {
                pool = [];
            }
        }

        // If pool is empty, re-refill from quotesList and shuffle
        if (pool.length === 0) {
            pool = shuffle(quotesList);
            // Prevention: if the first quote to be popped is same as current, move it to the middle
            if (pool.length > 2 && cleanQuote(pool[pool.length - 1]) === quote) {
                const item = pool.pop();
                const mid = Math.floor(pool.length / 2);
                pool.splice(mid, 0, item!);
            }
        }

        const nextQuote = pool.pop();
        localStorage.setItem('quotes_pool', JSON.stringify(pool));

        if (nextQuote) {
            setQuote(cleanQuote(nextQuote));
        }
    };

    return (
        <div className="group relative w-full max-w-[600px] mx-auto px-4">
            <div
                className={`flex flex-col items-center justify-center min-h-[140px] p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden select-text ${hasWallpaper
                    ? "bg-black/30 border-white/20 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/40"
                    : isDark
                        ? "backdrop-blur-md bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:bg-white/[0.07] hover:border-white/20"
                        : "backdrop-blur-md bg-white/40 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:bg-white/60 hover:border-black/10"
                    }`}
            >
                <h2
                    className={`text-[16px] md:text-[18px] font-semibold leading-relaxed tracking-tight transition-all duration-500 text-center opacity-100 translate-y-0 ${hasWallpaper ? (isDark ? "text-white text-shadow-contrast" : "text-black text-shadow-light") : isDark ? "text-white/90" : "text-black/80"
                        }`}
                >
                    {quote}
                </h2>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button
                        onClick={refreshQuote}
                        className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${hasWallpaper ? (isDark ? 'text-white/80 hover:text-white hover:bg-white/20 drop-shadow-md' : 'text-black/60 hover:text-black hover:bg-black/10 drop-shadow-md') : isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/5'
                            }`}
                        title="Refresh Quote"
                    >
                        <RotateCcw size={16} className="hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}
