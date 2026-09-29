"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSettings } from "@/lib/SettingsContext";

interface KeyboardShortcutsContextType {
    isShortcutsModalOpen: boolean;
    openShortcutsModal: () => void;
    closeShortcutsModal: () => void;
    toggleShortcutsModal: () => void;
    deviceType: "desktop" | "mobile";
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
    const [deviceType, setDeviceType] = useState<"desktop" | "mobile">("desktop");
    const { isZenMode, setIsZenMode } = useSettings();

    useEffect(() => {
        const checkDevice = () => {
            const isTouch = window.matchMedia("(pointer: coarse)").matches;
            setDeviceType(isTouch ? "mobile" : "desktop");
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    const openShortcutsModal = useCallback(() => setIsShortcutsModalOpen(true), []);
    const closeShortcutsModal = useCallback(() => setIsShortcutsModalOpen(false), []);
    const toggleShortcutsModal = useCallback(() => setIsShortcutsModalOpen(prev => !prev), []);

    const router = useRouter();
    const pathname = usePathname();

    const navigateWithZenExit = useCallback((targetPath: string) => {
        if (isZenMode) {
            setIsZenMode(false);
            // Smooth delay allows Framer Motion exit animation to complete before route change
            setTimeout(() => {
                router.push(targetPath);
            }, 300);
        } else {
            router.push(targetPath);
        }
    }, [isZenMode, setIsZenMode, router]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            // Global Shortcut: '?' (Shift + /) to toggle modal
            if (e.key === "?") {
                toggleShortcutsModal();
            }

            // Global Shortcut: 'Escape' to close modal
            if (e.key === "Escape" && isShortcutsModalOpen) {
                closeShortcutsModal();
            }

            // Navigation Shortcuts (Shift + Key)
            if (e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case "h": navigateWithZenExit("/"); break;           // Home
                    case "c": navigateWithZenExit("/calendar"); break;   // Calendar
                    case "m": navigateWithZenExit("/matrix"); break;     // Matrix
                    case "t": navigateWithZenExit("/habit-tracker"); break; // Tracker (Habits)
                    case "s": navigateWithZenExit("/settings"); break;   // Settings
                    case "l": navigateWithZenExit("/leaderboard"); break;// Leaderboard
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isShortcutsModalOpen, toggleShortcutsModal, closeShortcutsModal, navigateWithZenExit]);

    // Touch Gesture Logic
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                touchStartX = e.touches[0].screenX;
                touchStartY = e.touches[0].screenY;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.changedTouches.length === 2) {
                const touchEndX = e.changedTouches[0].screenX;
                const touchEndY = e.changedTouches[0].screenY;

                const diffX = touchStartX - touchEndX;
                const diffY = touchStartY - touchEndY;

                // Horizontal Swipe (Nav)
                if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
                    const pages = ["/", "/calendar", "/matrix", "/habit-tracker", "/leaderboard", "/settings"];
                    const currentIndex = pages.indexOf(pathname);

                    if (currentIndex !== -1) {
                        if (diffX > 0) { // Swipe Left (Next)
                            const nextIndex = (currentIndex + 1) % pages.length;
                            navigateWithZenExit(pages[nextIndex]);
                        } else { // Swipe Right (Prev)
                            const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
                            navigateWithZenExit(pages[prevIndex]);
                        }
                    }
                }

                // Vertical Swipe Down (Toggle Modal)
                if (diffY < -100 && Math.abs(diffX) < 50) {
                    toggleShortcutsModal();
                }
            }
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [deviceType, toggleShortcutsModal, navigateWithZenExit, pathname]);

    return (
        <KeyboardShortcutsContext.Provider
            value={{
                isShortcutsModalOpen,
                openShortcutsModal,
                closeShortcutsModal,
                toggleShortcutsModal,
                deviceType,
            }}
        >
            {children}
        </KeyboardShortcutsContext.Provider>
    );
}

export function useKeyboardShortcuts() {
    const context = useContext(KeyboardShortcutsContext);
    if (context === undefined) {
        throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider");
    }
    return context;
}
