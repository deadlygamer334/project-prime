import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes (or adjust as needed)
            retry: 1,
            networkMode: 'offlineFirst', // Important for offline support
        },
        mutations: {
            networkMode: 'offlineFirst',
        },
    },
});

export const persister = createAsyncStoragePersister({
    storage: {
        getItem: async (key: string) => await get(key),
        setItem: async (key: string, value: unknown) => await set(key, value),
        removeItem: async (key: string) => await del(key),
    },
});

export { PersistQueryClientProvider };
