"use client";

import { FCMToken } from "./fcm-config";
import NotificationManager from "./NotificationManager";
import { getNotificationTemplate, NotificationType } from "./notification-templates";
import { db, auth } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

    private constructor() { }

    static getInstance(): NotificationEngine {
        if (!NotificationEngine.instance) {
            NotificationEngine.instance = new NotificationEngine();
        }
        return NotificationEngine.instance;
    }

    /**
     * Check and trigger achievement notifications based on total minutes
     */
    async checkAchievements(totalMinutes: number): Promise<void> {
        const milestones = [100, 500, 1000, 5000, 10000];
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const lastMinutesMilestone = userData?.lastMilestoneNotified?.minutes || 0;

        for (const milestone of milestones) {
            if (totalMinutes >= milestone && lastMinutesMilestone < milestone) {
                // Trigger Achievement
                const title = this.getAchievementTitle(milestone);
                const desc = `Incredible! You've clocked ${milestone} minutes of focused work.`;

                await this.notificationManager.sendLocalNotification({
                    type: "achievement",
                    title: `🏆 ${title}`,
                    body: desc,
                    requireInteraction: true,
                    data: { milestone }
                });

                // Update Firestore to prevent duplicate notifications
                await updateDoc(userRef, {
                    "lastMilestoneNotified.minutes": milestone
                });

                break; // Only trigger one milestone at a time
            }
        }
    }

    /**
     * Check and trigger streak milestone notifications
     */
    async checkStreakMilestones(currentStreak: number): Promise<void> {
        const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const lastStreakMilestone = userData?.lastMilestoneNotified?.streak || 0;

        if (milestones.includes(currentStreak) && lastStreakMilestone < currentStreak) {
            await this.notificationManager.sendLocalNotification({
                type: "streak",
                title: currentStreak >= 30 ? `🔥 ${currentStreak} Day Milestone!` : `🔥 ${currentStreak} Day Streak!`,
                body: currentStreak >= 30
                    ? `Absolute Legend! You've maintained your streak for ${currentStreak} days!`
                    : `You're on fire! ${currentStreak} days of consistency.`,
                data: { streak: currentStreak }
            });

            // Update Firestore
            await updateDoc(userRef, {
                "lastMilestoneNotified.streak": currentStreak
            });
        }
    }

    /**
     * Schedule a morning nudge (Client-side implementation)
     * In a production app, this would ideally be a Cloud Function
     */
    setupMorningNudge(preferredTime: string = "09:00"): void {
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
        setInterval(checkNudge, 60000);
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
