import type { Metadata } from "next";
import MotivationClient from "./motivation-client";

export const metadata: Metadata = {
    title: "Motivation Hub",
    description: "Find inspiration and stay focused on your long-term goals.",
};

export default function MotivationPage() {
    return <MotivationClient />;
}
