"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 12, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.995 }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="flex-grow flex flex-col w-full h-full"
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
