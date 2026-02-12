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
            <div className="flex flex-col items-center">
                <div className={`text-[15vw] leading-none font-bold text-white ${fontClass} drop-shadow-2xl`}>
                    {formatTimeDigit(value)}
                </div>
                <span className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] mt-2 opacity-50 text-white">{label}</span>
            </div>
        );
    }

    // Retro Flip Card Style
    return (
        <div className="flex flex-col items-center">
            <div className={`relative bg-zinc-900 ${fontClass} text-[15vw] leading-none rounded-xl px-4 py-8 border-b-4 border-zinc-800 shadow-2xl ${isDark ? 'text-white' : 'text-zinc-200'}`}>
                {formatTimeDigit(value)}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none rounded-xl" />
                <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/40" />
            </div>
            <span className={`text-xl md:text-2xl font-bold uppercase tracking-[0.2em] mt-4 opacity-50 ${isDark ? 'text-white' : 'text-black'}`}>{label}</span>
        </div>
    );
});
FlipDigit.displayName = "FlipDigit";

export { FlipDigit };
