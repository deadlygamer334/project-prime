"use client";

import {
    requestNotificationPermission,
    registerFCMToken,
    unregisterFCMToken,
    setupForegroundMessageListener,
    areNotificationsSupported,
    getNotificationPermission,
} from "./fcm-config";

// M1 fix: import NotificationType from the single canonical source
import type { NotificationType } from "./notification-templates";

export type { NotificationType };

export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
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
     * Initialize notification system.
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            if (!areNotificationsSupported()) {
                console.warn("Notifications not supported in this browser");
                return false;
            }

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
     * Request permission and register for push notifications.
     */
    async requestPermissionAndRegister(): Promise<boolean> {
        try {
            const token = await requestNotificationPermission();

            if (!token) {
                return false;
            }

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
     * Unregister from push notifications.
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
     * Send a local notification.
     * H3 fix: removed the visibility guard that was silently swallowing in-app notifications.
     * The browser/OS handles focus+DND; in-app toasts (via NotificationContext) cover the
     * visible-tab case separately.
     */
    async sendLocalNotification(payload: NotificationPayload): Promise<void> {
        try {
            // Check permission
            const permission = getNotificationPermission();
            if (permission !== "granted") return;

            // Strategy 1: Attempt via Service Worker
            if ("serviceWorker" in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();

                    let registration = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw'));

                    if (!registration && registrations.length > 0) {
                        registration = registrations.find(r => r.active);
                    }

                    if (registration && registration.active) {
                        const options: NotificationOptions & { actions?: NotificationAction[] } = {
                            body: payload.body,
                            icon: payload.icon || "/icon.svg",
                            badge: payload.badge || "/icon.svg",
                            data: {
                                ...payload.data,
                                type: payload.type,
                                timestamp: Date.now()
                            },
                            tag: (payload.data?.tag as string | undefined) || payload.type,
                            requireInteraction: payload.requireInteraction || false,
                            silent: false,
                        };

                        if (payload.actions && payload.actions.length > 0) {
                            (options as any).actions = payload.actions;
                        }

                        await registration.showNotification(payload.title, options);
                        return;
                    }
                } catch (swError) {
                    console.error("Notification SW failed:", swError);
                }
            }

            // Strategy 2: Fallback to Browser Notification API
            this.showBrowserNotification(payload);
        } catch (error) {
            console.error("Notification failed:", error);
        }
    }

    /**
     * Fallback to browser Notification API.
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
                // Note: actions are not supported in the browser Notification API
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error("Error showing browser notification:", error);
        }
    }

    /**
     * Handle foreground messages from FCM.
     */
    private handleForegroundMessage(payload: {
        notification?: { title?: string; body?: string; icon?: string };
        data?: Record<string, string>;
    }): void {
        const notification = payload.notification;
        if (notification) {
            this.sendLocalNotification({
                type: (payload.data?.type as NotificationType) || "reminder",
                title: notification.title || "Notification",
                body: notification.body || "",
                icon: notification.icon,
                data: payload.data,
            });
        }
    }

    /**
     * Get notification permission status.
     */
    getPermissionStatus(): NotificationPermission | null {
        return getNotificationPermission();
    }

    /**
     * Check if notifications are enabled.
     */
    isEnabled(): boolean {
        return this.getPermissionStatus() === "granted";
    }

    /**
     * Get current FCM token.
     */
    getToken(): string | null {
        return this.fcmToken;
    }

    /**
     * Cleanup — only call this when the entire app is torn down (sign-out, unload).
     * Do NOT call this on component unmount; the manager is a singleton.
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
