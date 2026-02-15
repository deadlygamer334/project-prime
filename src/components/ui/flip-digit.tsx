import React from "react";

interface FlipDigitProps {
    value: number;
    label: string;
    isRetro: boolean;
    fontClass: string;
    isDark: boolean;
}

const FlipDigit = React.memo(({ value, label, isRetro, fontClass, isDark }: FlipDigitProps) => {
    const formatTimeDigit = (val: number) => val.toString().padStart(2, "0");

    if (!isRetro) {
        // Normal Digital Style for non-retro fonts
        return (
            <div className="flex flex-col items-center select-text">
                <div className={`text-[15vw] leading-none font-bold ${fontClass} drop-shadow-2xl ${isDark ? "text-white" : "text-foreground"}`}>
                    {formatTimeDigit(value)}
                </div>
                <span className={`text-xl md:text-2xl font-bold uppercase tracking-[0.2em] mt-2 opacity-50 ${isDark ? "text-white" : "text-foreground"}`}>{label}</span>
            </div>
        );
    }

    // Retro Flip Card Style
    return (
        <div className="flex flex-col items-center select-text">
            <div className={`relative ${fontClass} text-[15vw] leading-none rounded-xl px-4 py-8 border-b-4 shadow-2xl transition-colors ${isDark
                ? 'bg-zinc-900/90 border-zinc-800 text-white'
                : 'bg-card/90 border-border text-foreground'}`}>
                {formatTimeDigit(value)}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none rounded-xl" />
                <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/20" />
            </div>
            <span className={`text-xl md:text-2xl font-bold uppercase tracking-[0.2em] mt-4 opacity-50 ${isDark ? 'text-white' : 'text-foreground'}`}>{label}</span>
        </div>
    );
});
FlipDigit.displayName = "FlipDigit";

export { FlipDigit };
