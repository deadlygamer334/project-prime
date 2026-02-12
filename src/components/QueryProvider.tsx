"use client";

import React from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/queryClient";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}
