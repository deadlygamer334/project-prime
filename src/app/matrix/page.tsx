import type { Metadata } from "next";
import MatrixClient from "./matrix-client";

export const metadata: Metadata = {
    title: "Mind Matrix",
    description: "Organize your life with the Eisenhower Matrix for better prioritization.",
};

export default function MatrixPage() {
    return <MatrixClient />;
}
