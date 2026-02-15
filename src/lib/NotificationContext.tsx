"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export interface DialogOptions {
    title: string;
    description: string;
    cancelText?: string;
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface NotificationContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showAlert: (title: string, description: string) => Promise<void>;
    showConfirm: (options: DialogOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};

export default NotificationContext;
