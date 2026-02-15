"use client";

import React, { useState, useCallback, ReactNode, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import NotificationContext, { Toast, ToastType, DialogOptions } from "@/lib/NotificationContext";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/lib/ThemeContext";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [dialog, setDialog] = useState<{
        open: boolean;
        options: DialogOptions;
        resolve?: (value: boolean) => void;
    } | null>(null);

    const { theme } = useTheme();
    const isDark = theme === "dark";

    const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const showAlert = useCallback((title: string, description: string) => {
        return new Promise<void>((resolve) => {
            setDialog({
                open: true,
                options: {
                    title,
                    description,
                    confirmText: "OK",
                    onConfirm: () => {
                        setDialog(null);
                        resolve();
                    }
                }
            });
        });
    }, []);

    const showConfirm = useCallback((options: DialogOptions) => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                open: true,
                options: {
                    ...options,
                    onConfirm: () => {
                        setDialog(null);
                        resolve(true);
                    },
                    onCancel: () => {
                        setDialog(null);
                        resolve(false);
                    }
                },
                resolve
            });
        });
    }, []);

    const contextValue = useMemo(() => ({
        showToast,
        showAlert,
        showConfirm,
    }), [showToast, showAlert, showConfirm]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}

            {/* Global Alert/Confirm Dialog */}
            <AlertDialog open={dialog?.open} onOpenChange={(open) => !open && dialog?.resolve?.(false)}>
                {dialog && (
                    <AlertDialogContent className="border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dialog.options.title}</AlertDialogTitle>
                            <AlertDialogDescription className="opacity-70">
                                {dialog.options.description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {dialog.options.cancelText && (
                                <AlertDialogCancel onClick={dialog.options.onCancel}>
                                    {dialog.options.cancelText}
                                </AlertDialogCancel>
                            )}
                            <AlertDialogAction onClick={dialog.options.onConfirm}>
                                {dialog.options.confirmText || "Confirm"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>

            {/* Toasts Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} isDark={isDark} />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

const ToastItem = ({ toast, isDark }: { toast: Toast; isDark: boolean }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={18} />,
        error: <AlertCircle className="text-red-500" size={18} />,
        warning: <AlertTriangle className="text-amber-500" size={18} />,
        info: <Info className="text-blue-500" size={18} />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${isDark
                    ? "bg-black/60 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                    : "bg-white/80 border-black/10 text-black shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                }`}
        >
            {icons[toast.type]}
            <p className="text-sm font-medium">{toast.message}</p>
        </motion.div>
    );
};
