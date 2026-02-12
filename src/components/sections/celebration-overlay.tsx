"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CelebrationOverlay Component
 * 
 * A full-screen fixed overlay with a high z-index, semi-transparent black background.
 * Includes a confetti canvas, a "🌟" icon, and the "Goal Complete!" success message.
 * This component handles the confetti animation internally via Canvas API.
 */
export default function CelebrationOverlay({
  isVisible = false,
  onClose,
}: {
  isVisible?: boolean;
  onClose?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setupConfetti();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isVisible]);

  const setupConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const particleCount = 150;
    const colors = ["#8b5cf6", "#d946ef", "#3b82f6", "#10b981", "#f59e0b", "#ffffff"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 6.28,
        spin: Math.random() * 0.2 - 0.1,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speed;
        p.angle += p.spin;
        p.x += Math.sin(p.angle) * 2;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  };

  if (!shouldRender) return null;

  return (
    <div
      id="goalCelebration"
      className={cn(
        "celebration-overlay fixed inset-0 flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        backgroundColor: "rgba(5, 5, 8, 0.85)",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        id="goalConfetti"
        className="confetti-canvas absolute inset-0 block pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div
        className="celebration-content relative text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500"
        role="status"
        style={{
          width: "330.344px",
          height: "238px",
          padding: "40px 48px",
          backgroundColor: "rgba(20, 15, 30, 0.9)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "rgba(0, 0, 0, 0.5) 0px 25px 60px 0px, rgba(168, 85, 247, 0.35) 0px 0px 120px 0px",
          zIndex: 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="celebration-icon mb-2 flex items-center justify-center select-none"
          style={{
            fontSize: "48px",
            height: "64px",
            fontFamily: "var(--font-current)",
          }}
        >
          🌟
        </div>

        <h2
          className="celebration-title m-0 font-bold"
          id="goalCelebrationTitle"
          style={{
            fontSize: "32px",
            color: "rgb(245, 245, 247)",
            lineHeight: "1.3",
            fontFamily: "var(--font-current)",
          }}
        >
          Goal Complete!
        </h2>

        <p
          className="celebration-message mt-1 mb-4"
          id="goalCelebrationMessage"
          style={{
            fontSize: "16px",
            color: "rgb(160, 160, 165)",
            fontFamily: "var(--font-current)",
          }}
        >
          Way to go!
        </p>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[12px] font-semibold text-primary uppercase tracking-wider hover:underline opacity-60 hover:opacity-100 transition-opacity"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}