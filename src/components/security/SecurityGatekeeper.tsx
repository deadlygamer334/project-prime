"use client";

import { useEffect } from "react";

/**
 * SecurityGatekeeper
 * 
 * Implements client-side protection layers:
 * 1. Disables Right-Click (Context Menu)
 * 2. Blocks Common DevTools Shortcuts
 * 3. Anti-Debugger Loop
 * 4. Domain Lock (Optional - currently permissive for localhost)
 * 
 * Note: Client-side security is a deterrent, not a guarantee.
 */
export default function SecurityGatekeeper() {
    useEffect(() => {
        // 1. Disable Right-Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // 2. Block DevTools Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault();
                return;
            }

            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Chrome/Edge/Firefox DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
                e.preventDefault();
                return;
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === "U") {
                e.preventDefault();
                return;
            }

            // Mac: Cmd+Option+I, Cmd+Option+J, Cmd+Option+C
            if (e.metaKey && e.altKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
                e.preventDefault();
                return;
            }

            // Mac: Cmd+Option+U (View Source - rare but exists)
            if (e.metaKey && e.altKey && e.key === "U") {
                e.preventDefault();
                return;
            }
        };

        // 3. Anti-Debugger Loop
        // This constantly triggers a breakpoint if DevTools is open and breakpoints are active.
        // It makes stepping through code annoying.
        const antiDebugger = setInterval(() => {
            // Using constructor to avoid static analysis removal of 'debugger' statement
            // and checking strictly in production mode would be better, but user requested it.
            // We wrap in try-catch to prevent crashing if something weird happens.
            try {
                (function () { }.constructor("debugger")());
            } catch (err) {
                // Ignore
            }
        }, 1000);

        // 4. Domain Lock (Simple Implementation)
        // Replace array with your allowed domains.
        // CAUTION: Including 'localhost' is vital for development.
        const allowedDomains = ["localhost", "127.0.0.1", "paarangat.vercel.app", "yourdomain.com"];

        const checkDomain = () => {
            const hostname = window.location.hostname;
            // If we are NOT in an allowed domain, redirect or break.
            // Currently just logging for safety, uncomment logic to enforce.
            if (!allowedDomains.includes(hostname) && !hostname.endsWith(".vercel.app")) {
                // document.body.innerHTML = "<h1>Access Denied</h1>";
                // window.location.href = "about:blank";
            }
        };
        checkDomain();


        // Add Event Listeners
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
            clearInterval(antiDebugger);
        };
    }, []);

    // This component renders nothing visibly
    return null;
}
