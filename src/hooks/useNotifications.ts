"use client";

import { useState, useEffect, useCallback } from "react";
import NotificationManager, { NotificationPayload } from "@/lib/NotificationManager";
import { useSettings } from "@/lib/SettingsContext";

export function useNotifications() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const settings = useSettings();
    const notificationManager = NotificationManager.getInstance();

    // Initialize notification manager
    useEffect(() => {
        const init = async () => {
            const initialized = await notificationManager.initialize();
            setIsInitialized(initialized);
            setPermissionStatus(notificationManager.getPermissionStatus());
            setFcmToken(notificationManager.getToken());
        };

        init();

        return () => {
            notificationManager.cleanup();
        };
    }, []);

    // Update permission status when it changes
    useEffect(() => {
        const checkPermission = () => {
            setPermissionStatus(notificationManager.getPermissionStatus());
        };

        // Check permission periodically (in case user changes it in browser settings)
        const interval = setInterval(checkPermission, 5000);

        return () => clearInterval(interval);
    }, []);

    /**
     * Request notification permission
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        const granted = await notificationManager.requestPermissionAndRegister();
        setPermissionStatus(notificationManager.getPermissionStatus());
        setFcmToken(notificationManager.getToken());
        return granted;
    }, []);

    /**
     * Disable notifications
     */
    const disableNotifications = useCallback(async (): Promise<boolean> => {
        const disabled = await notificationManager.unregister();
        setFcmToken(null);
        return disabled;
    }, []);

    /**
     * Send a notification
     */
    const sendNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
        // Check if notifications are enabled in settings
        if (!settings.notificationsEnabled) {
            console.log("Notifications disabled in settings");
            return;
        }

        await notificationManager.sendLocalNotification(payload);
    }, [settings.notificationsEnabled]);

    /**
     * Send timer completion notification
     */
    const sendTimerNotification = useCallback(async (
        mode: "FOCUS" | "BREAK",
        duration: number,
        subject?: string
    ): Promise<void> => {
        const isFocus = mode === "FOCUS";

        await sendNotification({
            type: isFocus ? "timer_complete" : "break_complete",
            title: isFocus ? "🎯 Session Complete!" : "☕ Break Over!",
            body: isFocus
                ? `Great job! You completed ${duration.toFixed(0)} minutes${subject ? ` of ${subject}` : ""}.`
                : "Ready to get back to work?",
            icon: "/icon.svg",
            badge: "/icon.svg",
            requireInteraction: true,
            actions: isFocus ? [
                { action: "start_break", title: "Start Break" },
                { action: "continue", title: "Keep Going" },
            ] : [
                { action: "start_focus", title: "Start Focus" },
                { action: "dismiss", title: "Dismiss" },
            ],
            data: {
                mode,
                duration,
                subject,
                timestamp: Date.now(),
            },
        });
    }, [sendNotification]);

    /**
     * Send achievement notification
     */
    const sendAchievementNotification = useCallback(async (
        title: string,
        description: string
    ): Promise<void> => {
        await sendNotification({
            type: "achievement",
            title: `🏆 ${title}`,
            body: description,
            icon: "/icon.svg",
            badge: "/icon.svg",
            requireInteraction: true,
            data: {
                timestamp: Date.now(),
            },
        });
    }, [sendNotification]);

    /**
     * Send streak notification
     */
    const sendStreakNotification = useCallback(async (
        days: number
    ): Promise<void> => {
        await sendNotification({
            type: "streak",
            title: `🔥 ${days} Day Streak!`,
            body: `You're on fire! Keep up the momentum.`,
            icon: "/icon.svg",
            badge: "/icon.svg",
            data: {
                days,
                timestamp: Date.now(),
            },
        });
    }, [sendNotification]);

    /**
     * Send reminder notification
     */
    const sendReminderNotification = useCallback(async (
        message: string
    ): Promise<void> => {
        await sendNotification({
            type: "reminder",
            title: "⏰ Reminder",
            body: message,
            icon: "/icon.svg",
            badge: "/icon.svg",
            data: {
                timestamp: Date.now(),
            },
        });
    }, [sendNotification]);

    return {
        isInitialized,
        permissionStatus,
        fcmToken,
        isEnabled: permissionStatus === "granted",
        requestPermission,
        disableNotifications,
        sendNotification,
        sendTimerNotification,
        sendAchievementNotification,
        sendStreakNotification,
        sendReminderNotification,
    };
}
