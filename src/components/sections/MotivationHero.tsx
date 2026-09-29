import React from 'react';

const MotivationHero: React.FC = () => {
  return (
    <section className="motivation-hero px-6 py-[60px] flex justify-center items-center w-full">
      <div className="max-w-[720px] w-full text-center p-10 rounded-[20px] gradient-border card-premium bg-card">
        <p className="hero-kicker mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Motivation Vault
        </p>

        <h2 className="hero-title mb-6 flex items-center justify-center gap-2 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Motivation 🕙
        </h2>

        <p className="hero-subtitle mx-auto max-w-[500px] text-base font-normal text-muted-foreground leading-relaxed">
          Hover a reel to pop it open in full view with sound. Use the controls to pause,
          mute, or replay without leaving the grid.
        </p>
      </div>
    </section>
  );
};

export default MotivationHero;