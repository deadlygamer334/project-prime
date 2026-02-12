import React from 'react';

/**
 * Header section for the Habit Tracker application.
 * Features a dark theme with "Midnight Tech" aesthetic styling.
 * 
 * DESIGN SPECIFICATIONS:
 * - Theme: Light (actually implemented as dark based on global tokens and screenshots)
 * - Typography: Inter, sans-serif
 * - Colors: 
 *      Background: #0a0a0a (computed)
 *      Text: #f5f5f7 (computed)
 *      Ghost Button Background: transparent (hover state matches the card aesthetic)
 * - Layout: Flexbox container with 32px padding
 */

export default function Header() {
  const navLinks = [
    { label: 'To-Do List', href: '/' },
    { label: 'Matrix View', href: '/matrix' },
    { label: 'Calendar View', href: '/calendar' },
    { label: 'Motivation 🕙', href: '/motivation' },
    { label: 'Goal Countdown', href: '/goal-countdown' },
  ];

  return (
    <header
      className="relative flex items-center justify-between z-[5] w-full px-8 py-4 h-[84px] text-foreground font-sans transition-colors duration-300 bg-card/60 backdrop-blur-xl border-b border-border"
    >
      <div className="flex items-center w-[200px] h-12">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground m-0 p-0">
          Habit Tracker
        </h1>
      </div>

      <div className="header-right flex items-center h-12">
        <nav className="primary-nav flex items-center gap-0" id="primaryNav">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-center transition-all duration-200 hover:bg-muted/20 active:scale-95 px-6 py-3 text-[14.4px] text-foreground rounded-md whitespace-nowrap leading-tight text-center h-12 font-normal"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions container for future expansion (music controls etc) */}
        <div className="header-actions flex ml-4" />
      </div>

      {/* Subtle bottom border to match the design's crisp boundaries - handled by border-b class */}
    </header>
  );
}