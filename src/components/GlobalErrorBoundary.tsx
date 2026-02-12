"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    moduleName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] h-full w-full flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-[#050505] transition-colors">
                    <div className="p-4 rounded-full bg-red-500/10 mb-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3 dark:text-white text-zinc-900 tracking-tight">
                        {this.props.moduleName ? `${this.props.moduleName} Malfunction` : "System Malfunction"}
                    </h2>

                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
                        {this.props.moduleName
                            ? `A critical error occurred in the ${this.props.moduleName} module.`
                            : "A critical error has occurred. The system has been paused to prevent data corruption."}
                    </p>

                    {/* Error Details (Optional, for dev context or serious users) */}
                    <div className="w-full max-w-md p-4 mb-8 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-left overflow-hidden">
                        <p className="text-xs font-mono text-red-500 break-words">
                            {this.state.error?.toString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            <RefreshCcw size={18} />
                            Reinitialize System
                        </button>

                        <button
                            onClick={() => window.location.href = "/"}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-300 font-medium transition-all active:scale-95"
                        >
                            <Home size={18} />
                            Return to Base
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
