import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Leaderboard",
    description: "Community rankings and global progress. Compete with other productive achievers.",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
