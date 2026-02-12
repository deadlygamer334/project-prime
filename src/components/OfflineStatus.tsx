"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineStatus() {
    const [isOffline, setIsOffline] = useState(false);

    const [showOnlineToast, setShowOnlineToast] = useState(false);

    useEffect(() => {
        // Initial check
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            setShowOnlineToast(true);
            setTimeout(() => setShowOnlineToast(false), 3000);
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-2 bg-neutral-900/90 text-white rounded-full backdrop-blur-md shadow-lg border border-white/10"
                >
                    <WifiOff size={16} className="text-red-400" />
                    <span className="text-sm font-medium">Working Offline</span>
                </motion.div>
            )}
            {showOnlineToast && !isOffline && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-2 bg-emerald-600/90 text-white rounded-full backdrop-blur-md shadow-lg border border-white/10"
                >
                    <span className="text-sm font-medium">Back Online</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
