import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: number;
    priority?: boolean;
}

export function Logo({ className, size = 32, priority = false }: LogoProps) {
    return (
        <div className={cn("relative flex items-center justify-center overflow-hidden rounded-lg", className)} style={{ width: size, height: size }}>
            <Image
                src="/logo.png"
                alt="Prime Logo"
                width={size}
                height={size}
                className="object-contain"
                priority={priority}
            />
        </div>
    );
}
