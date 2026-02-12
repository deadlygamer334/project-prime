"use client";

import {
    requestNotificationPermission,
    registerFCMToken,
    unregisterFCMToken,
    setupForegroundMessageListener,
    areNotificationsSupported,
    getNotificationPermission,
} from "./fcm-config";

export type NotificationType =
    | "timer_complete"
    | "break_complete"
    | "reminder"
    | "achievement"
    | "streak"
    | "leaderboard";

export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    actions?: NotificationAction[];
    requireInteraction?: boolean;
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

class NotificationManager {
    private static instance: NotificationManager;
    private fcmToken: string | null = null;
    private foregroundListener: (() => void) | null = null;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Initialize notification system
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Check if notifications are supported
            if (!areNotificationsSupported()) {
                console.warn("Notifications not supported in this browser");
                return false;
            }

            // Set up foreground message listener
            this.foregroundListener = setupForegroundMessageListener((payload) => {
                this.handleForegroundMessage(payload);
            });

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Error initializing NotificationManager:", error);
            return false;
        }
    }

    /**
     * Request permission and register for push notifications
     */
    async requestPermissionAndRegister(): Promise<boolean> {
        try {
            // Request permission and get token
            const token = await requestNotificationPermission();

            if (!token) {
                return false;
            }

            // Register token with backend
            const registered = await registerFCMToken(token);

            if (registered) {
                this.fcmToken = token;
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return false;
        }
    }

    /**
     * Unregister from push notifications
     */
    async unregister(): Promise<boolean> {
        try {
            if (this.fcmToken) {
                await unregisterFCMToken(this.fcmToken);
                this.fcmToken = null;
            }
            return true;
        } catch (error) {
            console.error("Error unregistering notifications:", error);
            return false;
        }
    }

    /**
     * Send a local notification (foreground)
     */
    async sendLocalNotification(payload: NotificationPayload): Promise<void> {
        try {
            // Check visibility: Only show if document is hidden (minimized or background tab)
            // or if we are explicitly forcing it (useful for testing)
            if (typeof document !== "undefined" && document.visibilityState === "visible") {
                console.log("🔍 [NotificationManager] Skipping notification: App is currently visible");
                return;
            }

            // Check permission
            const permission = getNotificationPermission();
            if (permission !== "granted") return;

            // Strategy 1: Attempt via Service Worker
            if ("serviceWorker" in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();

                    // Specific target for firebase worker
                    let registration = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw'));

                    if (!registration && registrations.length > 0) {
                        console.log("⚠️ Firebase SW not found specifically, trying first available active registration");
                        registration = registrations.find(r => r.active);
                    }

                    if (registration && registration.active) {
                        console.log("✅ Using Service Worker:", registration.active.scriptURL);

                        // Use casting to any to avoid lint errors with 'actions' and other non-standard properties
                        const options: any = {
                            body: payload.body,
                            icon: payload.icon || "/icon.svg",
                            badge: payload.badge || "/icon.svg",
                            data: {
                                ...payload.data,
                                type: payload.type,
                                timestamp: Date.now()
                            },
                            tag: (payload.data && (payload.data as any).tag) || payload.type,
                            renotify: true,
                            requireInteraction: payload.requireInteraction || false,
                            silent: false, // Ensure it's not silent
                        };

                        if (payload.actions && payload.actions.length > 0) {
                            options.actions = payload.actions;
                        }

                        await registration.showNotification(payload.title, options);
                        return;
                    }
                } catch (swError) {
                    console.error("Notification SW failed:", swError);
                }
            }

            // Strategy 2: Fallback to Browser Notification (Foreground only)
            this.showBrowserNotification(payload);
        } catch (error) {
            console.error("Notification failed:", error);
        }
    }

    /**
     * Fallback to browser Notification API
     */
    private showBrowserNotification(payload: NotificationPayload): void {
        try {
            const notification = new Notification(payload.title, {
                body: payload.body,
                icon: payload.icon || "/icon.svg",
                badge: payload.badge || "/icon.svg",
                data: payload.data,
                tag: payload.type,
                requireInteraction: payload.requireInteraction || false,
                // Note: actions are not supported in browser Notification API
                // They only work with service worker notifications
            });

            // Handle click
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error("Error showing browser notification:", error);
        }
    }

    /**
     * Handle foreground messages from FCM
     */
    private handleForegroundMessage(payload: any): void {
        console.log("Handling foreground message:", payload);

        const notification = payload.notification;
        if (notification) {
            this.sendLocalNotification({
                type: payload.data?.type || "reminder",
                title: notification.title || "Notification",
                body: notification.body || "",
                icon: notification.icon,
                data: payload.data,
            });
        }
    }

    /**
     * Get notification permission status
     */
    getPermissionStatus(): NotificationPermission | null {
        return getNotificationPermission();
    }

    /**
     * Check if notifications are enabled
     */
    isEnabled(): boolean {
        return this.getPermissionStatus() === "granted";
    }

    /**
     * Get current FCM token
     */
    getToken(): string | null {
        return this.fcmToken;
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        if (this.foregroundListener) {
            this.foregroundListener();
            this.foregroundListener = null;
        }
        this.isInitialized = false;
    }
}

export default NotificationManager;
