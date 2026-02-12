import type { Metadata } from "next";
import AmbienceClient from "./ambience-client";

export const metadata: Metadata = {
    title: "Acoustic Ambience",
    description: "Curate your focus environment with customizable soundscapes.",
};

export default function AmbiencePage() {
    return <AmbienceClient />;
}
