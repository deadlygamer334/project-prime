"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSettings, TickSound, AlarmSound } from "@/lib/SettingsContext";

export default function useSoundEffects() {
    const { soundEnabled, tickSound, alarmSound } = useSettings();
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction or mount
        // Note: Chrome requires user interaction to resume/start context
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        };
        document.addEventListener('click', initAudio, { once: true });
        return () => document.removeEventListener('click', initAudio);
    }, []);

    const playTick = useCallback(() => {
        if (!soundEnabled || tickSound === 'none' || !audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            if (tickSound === 'mechanical') {
                // High frequency click
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.03);
            } else if (tickSound === 'digital') {
                // Soft blip
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(1200, ctx.currentTime);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.02, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            }
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }, [soundEnabled, tickSound]);

    const playAlarm = useCallback(() => {
        if (!soundEnabled || !audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;

            if (alarmSound === 'bell') {
                // Synthetic Bell
                const frequencies = [523.25, 783.99, 1046.50]; // C Major Chord
                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.value = freq;
                    osc.type = 'triangle';
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + (i * 0.5));
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + (i * 0.1));
                    osc.stop(now + 2 + (i * 0.5));
                });
            } else if (alarmSound === 'digital') {
                // Digital Alarm Beep beep
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(880, now + 0.2);
                osc.frequency.setValueAtTime(0, now + 0.2); // Silence
                osc.frequency.setValueAtTime(880, now + 0.3);

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.setValueAtTime(0.1, now + 0.5);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            } else if (alarmSound === 'chime') {
                // Gentle Sine Sweep
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
                osc.type = 'sine';

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 2);
            }
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }, [soundEnabled, alarmSound]);

    return { playTick, playAlarm };
}
