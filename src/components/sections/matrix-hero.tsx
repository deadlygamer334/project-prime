import React from 'react';

const MatrixHero = () => {
  return (
    <section className="matrix-hero panel mb-10 w-full rounded-3xl p-10 bg-card/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-soft relative overflow-hidden flex flex-col gap-6">
      {/* Top section: Title and Subtitle */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground/60">
          Eisenhower Matrix
        </p>
        <h2 className="text-[42px] font-extrabold leading-[1.2] tracking-tight mb-3 text-foreground">
          Decide what deserves your energy
        </h2>
        <p className="text-base font-normal leading-relaxed max-w-[520px] text-muted-foreground m-0">
          Re-classify anything on your Paaranagat System into the four urgency/importance quadrants.
          Updates sync instantly with your main list and calendar.
        </p>
      </div>

      {/* Bottom section: Color Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-fit">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-[0_0_0_4px_rgba(255,95,86,0.15)]"></span>
          <span className="text-sm text-foreground/80">
            Important & urgent (IU)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#5eaeff] shadow-[0_0_0_4px_rgba(94,174,255,0.15)]"></span>
          <span className="text-sm text-foreground/80">
            Important, not urgent (IBNU)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-[0_0_0_4px_rgba(255,189,46,0.15)]"></span>
          <span className="text-sm text-foreground/80">
            Not important, urgent (NIBU)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#a1a1aa] shadow-[0_0_0_4px_rgba(161,161,170,0.15)]"></span>
          <span className="text-sm text-foreground/80">
            Not important, not urgent (NINU)
          </span>
        </div>
      </div>

      {/* Decorative subtle top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
};

export default MatrixHero;