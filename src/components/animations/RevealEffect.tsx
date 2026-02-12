"use client";

import React, { useState, useEffect, useRef } from "react";

/**
 * Counter Component
 * Animates a number from 0 to target value
 */
export const Counter: React.FC<{
    value: number;
    duration?: number;
    suffix?: string;
    className?: string;
    decimals?: number;
}> = ({ value, duration = 1500, suffix = "", className = "", decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTime = useRef<number | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        startTime.current = null; // Reset on value change

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = timestamp - startTime.current;
            const percentage = Math.min(progress / duration, 1);

            // Easing function: outQuart
            const easePath = 1 - Math.pow(1 - percentage, 4);
            const currentCount = easePath * value;

            setCount(currentCount);

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value, duration]);

    return <span className={className}>{count.toFixed(decimals)}{suffix}</span>;
};

/**
 * Reveal Component
 * Fades in content when it enters the viewport
 */
export const Reveal: React.FC<{
    children: React.ReactNode;
    delay?: number;
    className?: string;
    direction?: "up" | "down" | "none";
    style?: React.CSSProperties;
}> = ({ children, delay = 0, className = "", direction = "up", style = {} }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    const getTransform = () => {
        if (isVisible) return "translate(0, 0)";
        if (direction === "up") return "translate(0, 20px)";
        if (direction === "down") return "translate(0, -20px)";
        return "none";
    };

    return (
        <div
            ref={domRef}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransform(),
                transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                ...style
            }}
        >
            {children}
        </div>
    );
};
