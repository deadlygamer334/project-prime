"use client";

import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Chrome, ArrowRight, Loader2, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Identification required.");
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setError("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020203] text-white selection:bg-purple-500/30">
            {/* Vibrant Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[100px]" />
            </div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] bg-[grid-white]/[0.02] bg-[size:40px_40px]" />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center">

                {/* Visual Anchor / Logo */}
                <div className="mb-10 relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="w-20 h-20 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/20">
                        <svg viewBox="0 0 512 512" className="w-12 h-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                            <path
                                d="M144 80 C 144 80, 120 120, 120 200 C 120 320, 220 400, 360 400 C 400 400, 440 380, 440 380 L 440 340 C 440 340, 400 360, 360 360 C 260 360, 180 300, 180 200 C 180 140, 190 100, 190 100 L 144 80"
                                fill="#fbbf24"
                            />
                            <path d="M144 80 L 160 60 L 180 75 L 170 95 Z" fill="#4ade80" />
                        </svg>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-300" />
                    </div>
                </div>

                <div className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] space-y-10 relative overflow-hidden">
                    {/* Inner Glow Border */}
                    <div className="absolute inset-px rounded-[39px] border border-white/5 pointer-events-none" />

                    {/* Header */}
                    <header className="text-center space-y-2 relative">
                        <h1 className="text-4xl font-black tracking-tighter text-white">
                            NANO BANANA
                        </h1>
                        <p className="text-yellow-500 text-[10px] font-bold tracking-[0.4em] uppercase">
                            {isLogin ? "Neural Interface Login" : "Initialize New Sequence"}
                        </p>
                    </header>

                    <div className="space-y-8">
                        {/* Google Auth - More Vibrant */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white text-black hover:bg-zinc-200 transition-all duration-300 rounded-2xl text-[13px] font-bold shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)] group active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Chrome size={20} />
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                                <span className="bg-[#0b0b0d] px-4 text-zinc-600">Secure Protocol</span>
                            </div>
                        </div>

                        {/* Manual Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="user@system.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3.5 px-4 outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all duration-300 text-sm placeholder:text-zinc-700"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3.5 px-4 outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all duration-300 text-sm placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {resetSent && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-center">
                                        Access link dispatched.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_15px_30px_-10px_rgba(147,51,234,0.3)] transition-all duration-500 rounded-2xl text-[12px] font-black uppercase tracking-[3px] flex items-center justify-center group active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? "Authenticate" : "Create Entity"}
                                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer Actions */}
                    <footer className="flex flex-col items-center gap-6 pt-2">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center w-full">
                            {isLogin && (
                                <button
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            )}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                {isLogin ? "New User? Register" : "Existing Member? Login"}
                            </button>
                        </div>
                    </footer>
                </div>

                {/* System Status */}
                <div className="mt-10 flex items-center gap-4 text-zinc-600">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <p className="text-[10px] font-mono tracking-widest opacity-40 uppercase">
                        v2.0.1 Stable
                    </p>
                </div>
            </div>
        </div>
    );
}
