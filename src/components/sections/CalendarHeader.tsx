"use client";

import React from "react";

const CalendarHeader: React.FC = () => {
  return (
    <div className="flex flex-row items-center justify-between w-full max-w-[689.859px] mb-8 mx-auto self-start">
      {/* Title */}
      <h2
        className="text-[32px] font-bold text-foreground leading-[1.2] m-0"
        style={{
          fontFamily: 'var(--font-current)',
        }}
      >
        Working Space
      </h2>

      {/* Navigation Toolbar */}
      <div className="flex flex-row items-center gap-2">
        <button
          id="prevBtn"
          className="text-[14.4px] font-medium px-4 h-[44px] text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          &larr; Previous
        </button>

        <button
          id="todayBtn"
          className="text-[14.4px] font-medium px-4 h-[44px] text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Today
        </button>

        <button
          id="nextBtn"
          className="text-[14.4px] font-medium px-4 h-[44px] text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Next &rarr;
        </button>

        {/* Settings Dropdown */}
        <details className="relative">
          <summary
            className="text-[14.4px] font-medium px-6 h-[44px] text-foreground hover:bg-muted rounded-xl transition-colors list-none cursor-pointer flex items-center"
          >
            Settings
          </summary>
          <div
            className="absolute right-0 top-full mt-4 z-50 bg-card border border-border text-foreground rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-4 min-w-[200px] grid gap-4"
            style={{
              fontFamily: 'var(--font-current)',
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-foreground font-medium">
                Work (min)
              </label>
              <input
                id="durWork"
                type="number"
                placeholder="25"
                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-foreground font-medium">
                Short break (min)
              </label>
              <input
                id="durShort"
                type="number"
                placeholder="5"
                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-foreground font-medium">
                Long break (min)
              </label>
              <input
                id="durLong"
                type="number"
                placeholder="15"
                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-foreground font-medium">
                Rounds until long break
              </label>
              <input
                id="roundsLong"
                type="number"
                placeholder="4"
                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[14.4px] text-foreground py-1">
              <input
                type="checkbox"
                id="autoNext"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              Auto-next session
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[14.4px] text-foreground py-1">
              <input
                type="checkbox"
                id="soundOn"
                defaultChecked
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              Sound on completion
            </label>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CalendarHeader;