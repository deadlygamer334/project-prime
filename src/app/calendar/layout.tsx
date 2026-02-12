import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Calendar",
    description: "View your productivity timeline. Track scheduled sessions and historical performance.",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
