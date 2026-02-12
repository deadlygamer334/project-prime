import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings",
    description: "Customize your experience. Configuration options for timers, sounds, and visual themes.",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
