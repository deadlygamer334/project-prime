"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    moduleName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.moduleName || "Module"}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="w-full p-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm flex flex-col items-center justify-center text-center min-h-[200px]">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                    <h3 className="text-lg font-bold text-red-500 mb-2">
                        {this.props.moduleName ? `${this.props.moduleName} Crashed` : "Something went wrong"}
                    </h3>
                    <p className="text-sm text-red-400/80 mb-6 max-w-md">
                        The system encountered a critical error. Your data is safe, but this module needs to restart.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <RefreshCcw size={14} />
                        Reload Module
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
