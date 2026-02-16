"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                key={pathname}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                    type: "spring",
                    duration: 0.25,
                    bounce: 0.2
                }}
                className="flex-grow flex flex-col w-full h-full"
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
