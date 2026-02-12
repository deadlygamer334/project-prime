"use client";

import React from "react";

const CalendarHeader: React.FC = () => {
  return (
    <div className="flex flex-row items-center justify-between w-full max-w-[689.859px] mb-8 mx-auto self-start">
      {/* Title */}
      <h2
        className="calendar-title"
        style={{
          display: "block",
          fontSize: "32px",
          fontWeight: 700,
          fontFamily: 'var(--font-current)',
          color: "rgb(29, 29, 31)",
          lineHeight: "1.2",
          margin: 0,
        }}
      >
        Working Space
      </h2>

      {/* Navigation Toolbar */}
      <div className="flex flex-row items-center gap-2">
        <button
          id="prevBtn"
          className="ghost-button"
          style={{
            fontSize: "14.4px",
            fontWeight: 500,
            padding: "8px 16px",
            height: "44px",
            color: "rgb(29, 29, 31)",
          }}
        >
          &larr; Previous
        </button>

        <button
          id="todayBtn"
          className="ghost-button"
          style={{
            fontSize: "14.4px",
            fontWeight: 500,
            padding: "8px 16px",
            height: "44px",
            color: "rgb(29, 29, 31)",
          }}
        >
          Today
        </button>

        <button
          id="nextBtn"
          className="ghost-button"
          style={{
            fontSize: "14.4px",
            fontWeight: 500,
            padding: "8px 16px",
            height: "44px",
            color: "rgb(29, 29, 31)",
          }}
        >
          Next &rarr;
        </button>

        {/* Settings Dropdown */}
        <details className="relative">
          <summary
            className="ghost-button list-none cursor-pointer"
            style={{
              fontSize: "14.4px",
              fontWeight: 500,
              padding: "8px 24px",
              height: "44px",
              color: "rgb(29, 29, 31)",
            }}
          >
            Settings
          </summary>
          <div
            className="absolute right-0 top-full mt-4 z-50 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-4 min-w-[200px] grid gap-4"
            style={{
              fontFamily: 'var(--font-current)',
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-[#111827] font-medium">
                Work (min)
              </label>
              <input
                id="durWork"
                type="number"
                placeholder="25"
                className="w-full bg-[#f7f7f8] border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007aff] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-[#111827] font-medium">
                Short break (min)
              </label>
              <input
                id="durShort"
                type="number"
                placeholder="5"
                className="w-full bg-[#f7f7f8] border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007aff] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-[#111827] font-medium">
                Long break (min)
              </label>
              <input
                id="durLong"
                type="number"
                placeholder="15"
                className="w-full bg-[#f7f7f8] border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007aff] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14.4px] text-[#111827] font-medium">
                Rounds until long break
              </label>
              <input
                id="roundsLong"
                type="number"
                placeholder="4"
                className="w-full bg-[#f7f7f8] border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#007aff] outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[14.4px] text-[#111827] py-1">
              <input
                type="checkbox"
                id="autoNext"
                className="w-4 h-4 rounded border-[#e5e7eb] text-[#007aff] focus:ring-[#007aff]"
              />
              Auto-next session
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[14.4px] text-[#111827] py-1">
              <input
                type="checkbox"
                id="soundOn"
                defaultChecked
                className="w-4 h-4 rounded border-[#e5e7eb] text-[#007aff] focus:ring-[#007aff]"
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