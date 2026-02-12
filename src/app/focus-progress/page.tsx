import type { Metadata } from "next";
import FocusProgressClient from "./focus-progress-client";

export const metadata: Metadata = {
    title: "Focus Progress",
    description: "Analyze your productivity and focus trends over time.",
};

export default function FocusProgressPage() {
    return <FocusProgressClient />;
}
