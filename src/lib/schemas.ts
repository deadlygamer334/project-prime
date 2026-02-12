import { z } from "zod";

export const HabitSchema = z.object({
    name: z.string().min(1, "Habit name is required").max(50, "Habit name must be under 50 characters"),
    frequency: z.enum(["daily", "weekly"]).optional(),
    color: z.string().optional(),
    id: z.string().optional(),
});

export const GoalSchema = z.object({
    title: z.string().min(3, "Goal title must be at least 3 characters").max(100, "Goal title must be under 100 characters"),
    deadline: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > new Date();
    }, "Deadline must be a future date"),
    notes: z.string().max(500, "Notes must be under 500 characters").optional(),
    completed: z.boolean().optional(),
});

export const TaskSchema = z.object({
    title: z.string().min(1, "Task title is required").max(100, "Task title too long"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    completed: z.boolean().default(false),
    dueDate: z.string().optional(),
});

export const TimerSettingsSchema = z.object({
    focusDuration: z.number().min(1).max(180), // Minutes
    breakDuration: z.number().min(1).max(60),
    longBreakDuration: z.number().min(5).max(60).optional(),
    sessionsBeforeLongBreak: z.number().min(2).max(10).optional(),
});

export type HabitInput = z.infer<typeof HabitSchema>;
export type GoalInput = z.infer<typeof GoalSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type TimerSettingsInput = z.infer<typeof TimerSettingsSchema>;
