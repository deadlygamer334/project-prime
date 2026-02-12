"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import NameCollectionModal from "./NameCollectionModal";
import PremiumSkeleton from "./ui/PremiumSkeleton";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // List of public paths that don't satisfy the protection rule
    const PUBLIC_PATHS = ["/login"];

    // Set to true to allow anyone to use the app without logging in temporarily.
    const BYPASS_AUTH = false;

    useEffect(() => {
        // If on a public path, skip check
        if (PUBLIC_PATHS.includes(pathname)) {
            setAuthorized(true);
            setLoading(false);
            return;
        }

        let unsubscribeUser: (() => void) | null = null;

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Immediately clear existing user listener on auth change
            if (unsubscribeUser) {
                unsubscribeUser();
                unsubscribeUser = null;
            }

            if (!user) {
                // Not logged in
                setUserId(null); // Clear ID
                if (BYPASS_AUTH) {
                    setAuthorized(true);
                    setLoading(false);
                } else {
                    router.push("/login");
                    setLoading(false);
                }
            } else {
                setUserId(user.uid);
                // Check if user has display name
                const userRef = doc(db, "users", user.uid);
                unsubscribeUser = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        if (!userData.displayName || userData.displayName.trim() === "") {
                            setShowNameModal(true);
                            setAuthorized(false);
                        } else {
                            setShowNameModal(false);
                            setAuthorized(true);
                        }
                    } else {
                        setShowNameModal(true);
                        setAuthorized(false);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("ProtectedRoute: User snapshot error:", error);
                    if (error.code === "permission-denied") {
                        // If we lose permission, typically it means a session expired or logout in progress
                        setAuthorized(false);
                    }
                    setLoading(false);
                });
            }
        });

        return () => {
            unsubscribe();
            if (unsubscribeUser) {
                unsubscribeUser();
            }
        };
    }, [router, pathname]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#050505] gap-6 transition-colors duration-300">
                <div className="relative">
                    <PremiumSkeleton width="64px" height="64px" borderRadius="16px" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <PremiumSkeleton width="180px" height="20px" borderRadius="12px" />
                    <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest opacity-80 animate-pulse">
                        Authenticating
                    </p>
                </div>
            </div>
        );
    }

    // Show name collection modal if needed
    if (showNameModal && userId) {
        return (
            <NameCollectionModal
                userId={userId}
                onComplete={() => {
                    setShowNameModal(false);
                    setAuthorized(true);
                }}
            />
        );
    }

    // If not authorized (and not loading), we are likely redirecting, so render nothing or null
    if (!authorized && !PUBLIC_PATHS.includes(pathname)) return null;

    return <>{children}</>;
}
