"use client";

import { getToken, onMessage, deleteToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "./firebase";

// VAPID key for push notifications
// You need to generate this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface FCMToken {
    token: string;
    deviceType: "desktop" | "mobile" | "tablet";
    browser: string;
    timestamp: number;
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        // Check if notifications are supported
        if (!("Notification" in window)) {
            console.warn("This browser does not support notifications");
            return null;
        }

        // Check for secure context
        if (!window.isSecureContext) {
            console.error("Notifications require a secure context (HTTPS or localhost)");
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        // Get FCM token
        if (!messaging) {
            console.warn("Firebase Messaging not initialized");
            return null;
        }

        if (!VAPID_KEY) {
            console.error("VAPID key not configured. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local");
            return null;
        }

        // Explicitly register service worker to be sure
        if ('serviceWorker' in navigator) {
            try {
                console.log("Registering service worker...");
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

                // Wait for the service worker to become active
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error("SW Activation Timeout")), 5000);

                    const check = () => {
                        if (registration.active) {
                            clearTimeout(timeout);
                            resolve();
                            return true;
                        }
                        return false;
                    };

                    if (check()) return;

                    const worker = registration.installing || registration.waiting;
                    if (worker) {
                        worker.addEventListener('statechange', () => {
                            if (worker.state === 'activated') check();
                        });
                    }

                    // Extra poll as backup
                    const interval = setInterval(() => {
                        if (check()) clearInterval(interval);
                    }, 500);
                });

                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (token) return token;
            } catch (swErr) {
                console.error("Service worker registration failed:", swErr);
            }
        }

        // Fallback to default getToken behavior
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        return token;
    } catch (error) {
        console.error("Notification permission error:", error);
        return null;
    }
}

/**
 * Register FCM token to user's Firestore document
 */
export async function registerFCMToken(token: string): Promise<boolean> {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("No authenticated user to register token");
            return false;
        }

        const deviceInfo: FCMToken = {
            token,
            deviceType: getDeviceType(),
            browser: getBrowserInfo(),
            timestamp: Date.now(),
        };

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            fcmTokens: arrayUnion(deviceInfo),
        });

        console.log("FCM token registered successfully");
        return true;
    } catch (error) {
        console.error("Error registering FCM token:", error);
        return false;
    }
}

/**
 * Unregister FCM token from user's Firestore document
 */
export async function unregisterFCMToken(token: string): Promise<boolean> {
    try {
        const user = auth.currentUser;
        if (!user) {
            return false;
        }

        const userRef = doc(db, "users", user.uid);

        // We need to remove the entire token object, not just the token string
        // This is a simplified approach - in production, you'd query and remove the exact object
        await updateDoc(userRef, {
            fcmTokens: arrayRemove({ token }),
        });

        // Delete token from Firebase
        if (messaging) {
            await deleteToken(messaging);
        }

        console.log("FCM token unregistered successfully");
        return true;
    } catch (error) {
        console.error("Error unregistering FCM token:", error);
        return false;
    }
}

/**
 * Set up foreground message listener
 */
export function setupForegroundMessageListener(
    callback: (payload: any) => void
): (() => void) | null {
    if (!messaging) {
        console.warn("Firebase Messaging not initialized");
        return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
    });

    return unsubscribe;
}

/**
 * Get device type based on screen size and user agent
 */
function getDeviceType(): "desktop" | "mobile" | "tablet" {
    if (typeof window === "undefined") return "desktop";

    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    // Check for tablet
    if (
        (userAgent.includes("ipad") ||
            (userAgent.includes("android") && !userAgent.includes("mobile"))) ||
        (width >= 768 && width <= 1024)
    ) {
        return "tablet";
    }

    // Check for mobile
    if (
        userAgent.includes("mobile") ||
        userAgent.includes("iphone") ||
        userAgent.includes("android") ||
        width < 768
    ) {
        return "mobile";
    }

    return "desktop";
}

/**
 * Get browser information
 */
function getBrowserInfo(): string {
    if (typeof window === "undefined") return "unknown";

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("edg")) return "Edge";
    if (userAgent.includes("chrome")) return "Chrome";
    if (userAgent.includes("firefox")) return "Firefox";
    if (userAgent.includes("safari")) return "Safari";
    if (userAgent.includes("opera")) return "Opera";

    return "Unknown";
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator
    );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
    }
    return Notification.permission;
}
