import React from 'react';

/**
 * Header Component
 * Cloned with pixel-perfect accuracy based on the provided design instructions, 
 * computed styles, and high-level design documentation.
 * 
 * Theme: Dark
 * Style: Glassmorphism / Modern Ambient
 */
const Header: React.FC = () => {
  return (
    <header className="w-full max-w-[1200px] mx-auto pt-[60px] pb-[48px] px-6">
      <div className="flex items-start gap-8">
        {/* Back Button */}
        <a
          href="/"
          className="flex items-center gap-2 h-[46px] px-[24px] py-[12px] bg-card/60 text-foreground hover:bg-card/80 transition-colors duration-200 rounded-2xl shadow-soft backdrop-blur-md border border-border group"
          style={{
            fontSize: '15.2px',
            fontWeight: 500,
            fontFamily: 'var(--font-current)'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:-translate-x-1"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </a>

        {/* Title and Subtitle Container */}
        <div className="flex flex-col">
          <h1
            className="text-foreground font-bold tracking-tight m-0 mb-2 leading-[59px]"
            style={{
              fontSize: '48px',
              fontFamily: 'var(--font-current)'
            }}
          >
            Ambience Studio
          </h1>
          <p
            className="subtitle text-muted-foreground font-normal m-0 leading-[21px]"
            style={{
              fontSize: '17.6px',
              fontFamily: 'var(--font-current)'
            }}
          >
            Immerse yourself in soothing sounds
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;