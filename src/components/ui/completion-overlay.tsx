import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { TimerMode } from "@/hooks/useFocusTimer";

interface CompletionOverlayProps {
    show: boolean;
    duration: number;
    mode: TimerMode;
}

export const CompletionOverlay = ({ show, duration, mode }: CompletionOverlayProps) => {
    const isUnderMinute = duration < 1;
    const displayTime = isUnderMinute
        ? `${(duration * 60).toFixed(2)} seconds`
        : `${duration.toFixed(2)} minutes`;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-[3rem]"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className={`${mode === "FOCUS" ? "bg-green-500" : "bg-blue-500"} text-white p-6 rounded-full shadow-[0_0_50px_rgba(34,197,94,0.5)] mb-6`}
                    >
                        <CheckCircle size={64} strokeWidth={3} />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold text-white mb-2"
                    >
                        {mode === "FOCUS" ? "Session Logged" : "Refreshed!"}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/60 text-lg"
                    >
                        {mode === "FOCUS" ? `${displayTime} focused!` : "Ready to get back to work?"}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
