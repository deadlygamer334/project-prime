"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';

const HomeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Habit Tracker', href: '/habit-tracker' },
    { label: 'Matrix View', href: '/matrix' },
    { label: 'Calendar View', href: '/calendar' },
    { label: 'Motivation 🕙', href: '/motivation' },
    { label: 'Ambience 🎵', href: '/ambience' },
  ];

  return (
    <header
      className="flex items-center justify-between w-full h-[82px] px-6 md:px-8 bg-white text-[#1d1d1f] border-b border-[#e5e5ea] sticky top-0 z-50"
      style={{
        fontFamily: 'var(--font-current)'
      }}
    >
      <div className="flex items-center">
        <Link href="/">
          <h1 className="text-[20px] md:text-[24px] font-bold tracking-tight text-[#1d1d1f] m-0 cursor-pointer">
            Paaranagat System
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-3 h-full">
        <nav className="hidden xl:flex items-center h-full">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center h-full px-4 text-[14.4px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-2">
          <div className="hidden md:relative md:flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#86868b]" />
            <input
              placeholder="Search tasks..."
              className="w-[180px] lg:w-[212px] h-[36px] pl-10 pr-4 bg-[#f7f7f8] border border-[#e5e5ea] rounded-lg text-[14px] outline-none focus:border-[#007aff] transition-colors"
            />
          </div>

          <button className="flex items-center justify-center w-[40px] h-[40px] md:w-[44px] md:h-[44px] bg-transparent border-none rounded-xl hover:bg-[#f5f5f7] cursor-pointer">
            <span className="text-[14.4px]">💻</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="xl:hidden flex items-center justify-center w-10 h-10 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[82px] bg-white z-[40] animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col p-6 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center px-6 py-4 text-[16px] font-medium text-[#1d1d1f] rounded-xl hover:bg-[#f5f5f7] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-[#e5e5ea] flex flex-col gap-4">
              <div className="relative flex items-center md:hidden">
                <Search className="absolute left-3 w-4 h-4 text-[#86868b]" />
                <input
                  placeholder="Search tasks..."
                  className="w-full h-[44px] pl-10 pr-4 bg-[#f7f7f8] border border-[#e5e5ea] rounded-lg text-[14px] outline-none"
                />
              </div>
              <button className="w-full h-[44px] flex items-center justify-center bg-transparent border border-[#e5e5ea] rounded-xl text-[14.4px] font-medium hover:bg-[#f5f5f7]">
                Close Menu
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default HomeHeader;

