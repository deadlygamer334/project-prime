import type { Metadata } from "next";
import HabitTrackerClient from "./habit-tracker-client";

export const metadata: Metadata = {
    title: "Habit Tracker",
    description: "Track and build lasting habits with detailed consistency metrics.",
};

export default function HabitTrackerPage() {
    return <HabitTrackerClient />;
}
