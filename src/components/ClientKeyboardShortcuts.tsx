"use client";

import dynamic from "next/dynamic";

const KeyboardShortcutsModal = dynamic(() => import("@/components/KeyboardShortcutsModal"), {
    ssr: false
});

export default function ClientKeyboardShortcuts() {
    return <KeyboardShortcutsModal />;
}
