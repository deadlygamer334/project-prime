"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.12,
                    ease: "easeOut"
                }}
                className="flex-grow flex flex-col w-full h-full"
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
