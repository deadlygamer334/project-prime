"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function QuoteBlock() {
    const [quote, setQuote] = useState("");
    const [quotesList, setQuotesList] = useState<string[]>([]);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const fetchQuotes = async () => {
        try {
            const response = await fetch('/api/quotes');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setQuotesList(data);
                    setQuote(data[Math.floor(Math.random() * data.length)]);
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching quotes:', error);
        }

        // Fallback quotes if API fails
        const fallbacks = [
            "🔋 Your energy is your currency. Invest it wisely today.",
            "🚀 Focus is the bridge between goals and accomplishment.",
            "💎 Progress over perfection, every single day.",
            "🌊 Stay calm, stay focused, stay productive.",
            "✨ Your future self will thank you for the work you do today."
        ];
        setQuotesList(fallbacks);
        setQuote(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const refreshQuote = () => {
        if (quotesList.length === 0) return;
        let nextQuote = quote;
        while (nextQuote === quote && quotesList.length > 1) {
            nextQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
        }
        setQuote(nextQuote);
    };

    return (
        <div className="group relative w-full max-w-[600px] mx-auto px-4">
            <div
                className={`flex flex-col items-center justify-center min-h-[140px] p-8 rounded-3xl border transition-all duration-500 backdrop-blur-md relative overflow-hidden select-text ${isDark
                    ? "bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:bg-white/[0.07] hover:border-white/20"
                    : "bg-white/40 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:bg-white/60 hover:border-black/10"
                    }`}
            >
                <h2
                    className={`text-[16px] md:text-[18px] font-semibold leading-relaxed tracking-tight transition-all duration-500 text-center ${isDark ? "text-white/90" : "text-black/80"
                        } opacity-100 translate-y-0`}
                >
                    {quote}
                </h2>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button
                        onClick={refreshQuote}
                        className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/5'
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
