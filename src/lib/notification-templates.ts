export type NotificationType =
    | "timer_complete"
    | "break_complete"
    | "reminder"
    | "achievement"
    | "streak"
    | "leaderboard";

export interface NotificationTemplate {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
}

/**
 * Get notification template for timer completion
 */
export function getTimerCompleteTemplate(
    duration: number,
    subject?: string
): NotificationTemplate {
    return {
        title: "🎯 Session Complete!",
        body: `Great job! You completed ${duration.toFixed(0)} minutes${subject ? ` of ${subject}` : ""}.`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        requireInteraction: true,
        actions: [
            { action: "start_break", title: "Start Break" },
            { action: "continue", title: "Keep Going" },
        ],
    };
}

/**
 * Get notification template for break completion
 */
export function getBreakCompleteTemplate(): NotificationTemplate {
    return {
        title: "☕ Break Over!",
        body: "Ready to get back to work?",
        icon: "/icon.svg",
        badge: "/icon.svg",
        requireInteraction: true,
        actions: [
            { action: "start_focus", title: "Start Focus" },
            { action: "dismiss", title: "Dismiss" },
        ],
    };
}

/**
 * Get notification template for achievement
 */
export function getAchievementTemplate(
    title: string,
    description: string
): NotificationTemplate {
    return {
        title: `🏆 ${title}`,
        body: description,
        icon: "/icon.svg",
        badge: "/icon.svg",
        requireInteraction: true,
    };
}

/**
 * Get notification template for streak milestone
 */
export function getStreakTemplate(days: number): NotificationTemplate {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const isMilestone = milestones.includes(days);

    return {
        title: isMilestone ? `🔥 ${days} Day Milestone!` : `🔥 ${days} Day Streak!`,
        body: isMilestone
            ? `Incredible! You've maintained your streak for ${days} days!`
            : "You're on fire! Keep up the momentum.",
        icon: "/icon.svg",
        badge: "/icon.svg",
        requireInteraction: isMilestone,
    };
}

/**
 * Get notification template for reminder
 */
export function getReminderTemplate(message: string): NotificationTemplate {
    return {
        title: "⏰ Reminder",
        body: message,
        icon: "/icon.svg",
        badge: "/icon.svg",
    };
}

/**
 * Get notification template for leaderboard update
 */
export function getLeaderboardTemplate(
    position: number,
    change: "up" | "down" | "same"
): NotificationTemplate {
    const emoji = change === "up" ? "📈" : change === "down" ? "📉" : "📊";
    const message =
        change === "up"
            ? `You moved up to #${position}!`
            : change === "down"
                ? `You're now at #${position}. Time to catch up!`
                : `You're holding strong at #${position}!`;

    return {
        title: `${emoji} Leaderboard Update`,
        body: message,
        icon: "/icon.svg",
        badge: "/icon.svg",
    };
}

/**
 * Get notification template for daily goal
 */
export function getDailyGoalTemplate(
    completed: number,
    goal: number
): NotificationTemplate {
    const percentage = Math.round((completed / goal) * 100);
    const isComplete = completed >= goal;

    return {
        title: isComplete ? "🎉 Daily Goal Achieved!" : "💪 Keep Going!",
        body: isComplete
            ? `You've completed your daily goal of ${goal} minutes!`
            : `You're ${percentage}% of the way to your ${goal} minute goal.`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        requireInteraction: isComplete,
    };
}

/**
 * Get notification template based on type and data
 */
export function getNotificationTemplate(
    type: NotificationType,
    data: Record<string, any>
): NotificationTemplate {
    switch (type) {
        case "timer_complete":
            return getTimerCompleteTemplate(data.duration, data.subject);

        case "break_complete":
            return getBreakCompleteTemplate();

        case "achievement":
            return getAchievementTemplate(data.title, data.description);

        case "streak":
            return getStreakTemplate(data.days);

        case "reminder":
            return getReminderTemplate(data.message);

        case "leaderboard":
            return getLeaderboardTemplate(data.position, data.change);

        default:
            return {
                title: "Notification",
                body: data.message || "",
                icon: "/icon.svg",
                badge: "/icon.svg",
            };
    }
}
