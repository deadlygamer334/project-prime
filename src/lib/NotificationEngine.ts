"use client";

import NotificationManager from "./NotificationManager";
import { getNotificationTemplate, NotificationType } from "./notification-templates";
import { db, auth } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// M2 fix: removed unused FCMToken import

export interface UserStats {
    totalMinutes: number;
    currentStreak: number;
    lastMilestoneNotified: {
        streak: number;
        minutes: number;
    };
}

class NotificationEngine {
    private static instance: NotificationEngine;
    private notificationManager = NotificationManager.getInstance();

    // H4 fix: in-memory cache to avoid a Firestore read on every timer completion
    private cachedMinutesMilestone: number | null = null;
    private cachedStreakMilestone: number | null = null;

    // C1 fix: store the interval so we can clear it on re-call
    private morningNudgeInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() { }

    static getInstance(): NotificationEngine {
        if (!NotificationEngine.instance) {
            NotificationEngine.instance = new NotificationEngine();
        }
        return NotificationEngine.instance;
    }

    /**
     * Check and trigger achievement notifications based on total minutes.
     * Uses an in-memory cache so Firestore is only hit when a new milestone is crossed.
     */
    async checkAchievements(totalMinutes: number): Promise<void> {
        const milestones = [100, 500, 1000, 5000, 10000];
        const user = auth.currentUser;
        if (!user) return;

        // H4 fix: load cache from Firestore only once per session
        if (this.cachedMinutesMilestone === null) {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                this.cachedMinutesMilestone = userData?.lastMilestoneNotified?.minutes || 0;
            } catch {
                this.cachedMinutesMilestone = 0;
            }
        }

        for (const milestone of milestones) {
            if (totalMinutes >= milestone && (this.cachedMinutesMilestone ?? 0) < milestone) {
                const title = this.getAchievementTitle(milestone);
                const desc = `Incredible! You've clocked ${milestone} minutes of focused work.`;

                await this.notificationManager.sendLocalNotification({
                    type: "achievement",
                    title: `🏆 ${title}`,
                    body: desc,
                    requireInteraction: true,
                    data: { milestone }
                });

                // Update Firestore and in-memory cache to prevent duplicate notifications
                try {
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                        "lastMilestoneNotified.minutes": milestone
                    });
                } catch { /* non-fatal */ }

                this.cachedMinutesMilestone = milestone;
                break; // Only trigger one milestone at a time
            }
        }
    }

    /**
     * Check and trigger streak milestone notifications.
     * Uses an in-memory cache so Firestore is only hit when a new milestone is crossed.
     */
    async checkStreakMilestones(currentStreak: number): Promise<void> {
        const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
        const user = auth.currentUser;
        if (!user) return;

        // H4 fix: load cache from Firestore only once per session
        if (this.cachedStreakMilestone === null) {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                this.cachedStreakMilestone = userData?.lastMilestoneNotified?.streak || 0;
            } catch {
                this.cachedStreakMilestone = 0;
            }
        }

        if (milestones.includes(currentStreak) && (this.cachedStreakMilestone ?? 0) < currentStreak) {
            await this.notificationManager.sendLocalNotification({
                type: "streak",
                title: currentStreak >= 30 ? `🔥 ${currentStreak} Day Milestone!` : `🔥 ${currentStreak} Day Streak!`,
                body: currentStreak >= 30
                    ? `Absolute Legend! You've maintained your streak for ${currentStreak} days!`
                    : `You're on fire! ${currentStreak} days of consistency.`,
                data: { streak: currentStreak }
            });

            // Update Firestore and in-memory cache
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    "lastMilestoneNotified.streak": currentStreak
                });
            } catch { /* non-fatal */ }

            this.cachedStreakMilestone = currentStreak;
        }
    }

    /**
     * Schedule a morning nudge (Client-side implementation).
     * C1 fix: clears any previously registered interval before creating a new one.
     */
    setupMorningNudge(preferredTime: string = "09:00"): void {
        // C1 fix: always clear the previous interval before starting a new one
        if (this.morningNudgeInterval !== null) {
            clearInterval(this.morningNudgeInterval);
            this.morningNudgeInterval = null;
        }

        const [hours, minutes] = preferredTime.split(":").map(Number);

        const checkNudge = () => {
            const now = new Date();
            if (now.getHours() === hours && now.getMinutes() === minutes) {
                this.notificationManager.sendLocalNotification({
                    type: "reminder",
                    title: "⏰ Morning Nudge",
                    body: "Time to start your first focus session of the day!",
                });
            }
        };

        // Check every minute
        this.morningNudgeInterval = setInterval(checkNudge, 60000);
    }

    /**
     * Clears the morning nudge interval. Call when the user signs out or disables reminders.
     */
    clearMorningNudge(): void {
        if (this.morningNudgeInterval !== null) {
            clearInterval(this.morningNudgeInterval);
            this.morningNudgeInterval = null;
        }
    }

    /** Reset in-memory caches (e.g. on sign-out / user switch) */
    resetCache(): void {
        this.cachedMinutesMilestone = null;
        this.cachedStreakMilestone = null;
    }

    private getAchievementTitle(minutes: number): string {
        if (minutes >= 10000) return "Deep Work God";
        if (minutes >= 5000) return "Master of Focus";
        if (minutes >= 1000) return "Dedicated Scholar";
        if (minutes >= 500) return "Commitment King";
        return "Focus Rookie";
    }
}

export default NotificationEngine;
