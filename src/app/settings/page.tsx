"use client";

import React from "react";
import AppHeader from "@/components/sections/AppHeader";
import Footer from "@/components/sections/Footer";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings, AccentColor, FontFamily, BackgroundStyle, TickSound, AlarmSound } from "@/lib/SettingsContext";
import { useKeyboardShortcuts } from "@/lib/KeyboardShortcutsContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
    Moon, Sun, Layout, Palette, ArrowLeft, Music, PartyPopper,
    Clock, Shield, Download, LogOut, Keyboard, Command,
    Lock, ArrowRight, X, CheckCircle2, AlertCircle, Loader2, Bell
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, updatePassword } from "firebase/auth";
import useSoundEffects from "@/hooks/useSoundEffects";
import { useHabitContext } from "@/lib/HabitContext";
import VibeGallery from "@/components/sections/VibeGallery";

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    const settings = useSettings();
    const { playTick, playAlarm } = useSoundEffects();
    const router = useRouter();
    const { habits } = useHabitContext();
    const [showPasswordModal, setShowPasswordModal] = React.useState(false);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleDownloadData = () => {
        const data = {
            settings: settings,
            habits: habits,
            exportDate: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nano-banana-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fonts: { id: FontFamily; label: string }[] = [
        { id: "inter", label: "Inter" },
        { id: "roboto", label: "Roboto" },
        { id: "serif", label: "Serif" },
        { id: "mono", label: "Mono" },
    ];

    const tickSounds: { id: TickSound; label: string }[] = [
        { id: "mechanical", label: "Click" },
        { id: "digital", label: "Blip" },
        { id: "none", label: "None" },
    ];

    const alarmSounds: { id: AlarmSound; label: string }[] = [
        { id: "bell", label: "Bell" },
        { id: "chime", label: "Chime" },
        { id: "digital", label: "Digital" },
    ];

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-300 text-foreground">
            <AppHeader title="Settings" activePath="/settings" />

            <main className="container mx-auto flex-grow py-8 px-4 md:px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">
                                <ArrowLeft size={14} /> Back to Dashboard
                            </Link>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">Settings</h1>
                            <p className="text-lg text-muted-foreground dark:text-neutral-400">Customize your immersive focus environment.</p>
                        </div>

                        {/* User Greeting Input */}
                        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-2xl border border-border">
                            <span className="text-sm font-medium text-muted-foreground dark:text-neutral-300">Hello,</span>
                            <input
                                type="text"
                                value={settings.userName}
                                onChange={(e) => settings.updateSetting("userName", e.target.value)}
                                className="bg-transparent border-b border-dashed border-border outline-none w-[120px] text-base font-bold focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50"
                                placeholder="Enter Name"
                            />
                        </div>
                    </div>

                    {/* Vibe Gallery (Full Width) */}
                    <div className="mb-12">
                        <SectionHeading icon={Palette} title="Visual Theme" color="text-purple-400" />
                        <VibeGallery />
                    </div>

                    {/* Main Settings Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* LEFT COLUMN */}
                        <div className="space-y-8">

                            {/* Appearance Section */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={Layout} title="Appearance" color="text-blue-400" />

                                <div className="space-y-8">
                                    {/* Typography */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block text-foreground/70">Typography</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {fonts.map(font => (
                                                <button
                                                    key={font.id}
                                                    onClick={() => settings.updateSetting("fontFamily", font.id)}
                                                    className={`px-2 py-2 text-xs rounded-xl border transition-all ${settings.fontFamily === font.id
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border hover:bg-muted text-foreground/70"
                                                        }`}
                                                >
                                                    {font.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Clock Style */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block text-foreground/70">Clock Style</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: "standard", label: "Standard" },
                                                { id: "minimal", label: "Minimal" },
                                                { id: "bold", label: "Bold" },
                                                { id: "neon", label: "Neon" },
                                                { id: "elegant", label: "Elegant" },
                                                { id: "outline", label: "Outline" },
                                                { id: "pill", label: "Pill" },
                                                { id: "glitch", label: "Glitch" },
                                                { id: "vertical", label: "Vertical" },
                                            ].map((style) => (
                                                <button
                                                    key={style.id}
                                                    // @ts-ignore
                                                    onClick={() => settings.updateSetting("clockStyle", style.id)}
                                                    className={`px-2 py-2 text-xs rounded-xl border transition-all truncate ${settings.clockStyle === style.id
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border hover:bg-muted text-foreground/70"
                                                        }`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Visual Density */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Density</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(["compact", "normal", "spacious"] as const).map(scale => (
                                                <button
                                                    key={scale}
                                                    onClick={() => settings.updateSetting("paddingScale", scale)}
                                                    className={`px-3 py-2 text-xs rounded-xl border transition-all ${settings.paddingScale === scale
                                                        ? "bg-primary/20 border-primary/50 text-foreground"
                                                        : "border-transparent bg-muted/50 hover:bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    {scale.charAt(0).toUpperCase() + scale.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Corner Radius */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Corners</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(["sharp", "smooth"] as const).map(radius => (
                                                <button
                                                    key={radius}
                                                    onClick={() => settings.updateSetting("borderRadius", radius)}
                                                    className={`px-3 py-2 text-xs rounded-xl border transition-all ${settings.borderRadius === radius
                                                        ? "bg-primary/20 border-primary/50 text-foreground"
                                                        : "border-transparent bg-muted/50 hover:bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    {radius.charAt(0).toUpperCase() + radius.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Acoustics Section */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={Music} title="Acoustics" color="text-pink-400" />

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                        <span className="font-medium text-sm">Master Sound</span>
                                        <button
                                            onClick={() => settings.updateSetting("soundEnabled", !settings.soundEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Timer Tick</label>
                                            <div className="flex flex-col gap-2">
                                                {tickSounds.map(sound => (
                                                    <button
                                                        key={sound.id}
                                                        onClick={() => settings.updateSetting("tickSound", sound.id)}
                                                        className={`px-3 py-2 text-xs text-left rounded-lg transition-all ${settings.tickSound === sound.id
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-muted/50"
                                                            }`}
                                                    >
                                                        {sound.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Alarm Tone</label>
                                            <div className="flex flex-col gap-2">
                                                {alarmSounds.map(sound => (
                                                    <button
                                                        key={sound.id}
                                                        onClick={() => settings.updateSetting("alarmSound", sound.id)}
                                                        className={`px-3 py-2 text-xs text-left rounded-lg transition-all ${settings.alarmSound === sound.id
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-muted/50"
                                                            }`}
                                                    >
                                                        {sound.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={playAlarm} className="mt-4 text-[10px] flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider font-bold">
                                                <PlayCircle size={12} /> Test Sound
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-8">

                            {/* Clock & Timer Preferences */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={Clock} title="Clock & Timer" color="text-orange-400" />
                                <div className="space-y-2">
                                    <ToggleRow
                                        label="Show Seconds"
                                        desc="Display seconds in all clocks"
                                        value={settings.showSeconds}
                                        onChange={(v) => settings.updateSetting("showSeconds", v)}
                                    />
                                    <ToggleRow
                                        label="24-Hour Clock"
                                        desc="Use military time format"
                                        value={settings.clockFormat === "24h"}
                                        onChange={(v) => settings.updateSetting("clockFormat", v ? "24h" : "12h")}
                                    />
                                    <ToggleRow
                                        label="Large Dashboard Clock"
                                        desc="Show big digital clock on home"
                                        value={settings.showClock}
                                        onChange={(v) => settings.updateSetting("showClock", v)}
                                    />
                                    <ToggleRow
                                        label="Daily Quotes"
                                        desc="Show motivation in timer"
                                        value={settings.showQuotes}
                                        onChange={(v) => settings.updateSetting("showQuotes", v)}
                                    />
                                </div>
                            </section>

                            {/* Notifications Section */}
                            <NotificationSettings />

                            {/* Visual Effects */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={PartyPopper} title="Visual Effects" color="text-emerald-400" />
                                <div className="space-y-2">
                                    <ToggleRow
                                        label="Confetti Celebration"
                                        desc="Explosions on task completion"
                                        value={settings.confettiEnabled}
                                        onChange={(v) => settings.updateSetting("confettiEnabled", v)}
                                    />
                                    <ToggleRow
                                        label="Glassmorphism"
                                        desc="Enable blur effects on cards"
                                        value={settings.enableGlassmorphism}
                                        onChange={(v) => settings.updateSetting("enableGlassmorphism", v)}
                                    />
                                    <ToggleRow
                                        label="Reduced Motion"
                                        desc="Minimize UI animations"
                                        value={settings.reducedMotion}
                                        onChange={(v) => settings.updateSetting("reducedMotion", v)}
                                    />
                                </div>
                            </section>

                            {/* Security */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={Shield} title="Security" color="text-indigo-400" />
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl border transition-all group bg-muted/20 border-border hover:bg-muted/50 hover:border-primary/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="text-left">
                                                <span className="block text-sm font-medium text-foreground">Change Password</span>
                                                <span className="block text-xs text-muted-foreground dark:text-neutral-400">Update your account security</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="opacity-30" />
                                    </button>
                                </div>
                            </section>

                            {/* System */}
                            <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
                                <SectionHeading icon={Layout} title="System" color="text-cyan-400" />
                                <div className="space-y-4">
                                    <ShortcutsSection />
                                    <div className="pt-4 border-t border-border mt-4">
                                        <button
                                            onClick={() => settings.updateSetting("leaderboardPublic", !settings.leaderboardPublic)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group text-left"
                                        >
                                            <div>
                                                <div className="text-sm font-medium">Public Profile</div>
                                                <div className="text-xs text-foreground/60">Manage leaderboard visibility</div>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full border transition-colors ${settings.leaderboardPublic ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                                <div className={`h-full w-4 rounded-full bg-white transition-transform ${settings.leaderboardPublic ? "translate-x-4" : ""}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Data & Privacy (Full Width Footer) */}
                    <div className="mt-12 bg-muted/10 border border-border rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold mb-1 text-foreground">Data & Privacy</h3>
                                <p className="text-sm text-muted-foreground dark:text-neutral-400 max-w-md">
                                    Manage your personal data. All data is stored securely in the cloud.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleDownloadData}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted transition-all active:scale-95"
                                >
                                    <Download size={14} /> Export JSON
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex justify-center">
                            <button
                                onClick={settings.resetSettings}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Reset all settings to default
                            </button>
                        </div>
                    </div>

                </div>
            </main>

            {settings.showFooter && <Footer />}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
            )}
        </div>
    );
}

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const user = auth.currentUser;
            if (user) {
                await updatePassword(user, newPassword);
                setSuccess(true);
                setTimeout(onClose, 2000);
            }
        } catch (err: any) {
            if (err.code === 'auth/requires-recent-login') {
                setError("For security, please sign out and sign back in to change your password.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Change Password</h2>
                    <p className="text-sm text-muted-foreground">Ensure your account stays secure.</p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="font-bold text-lg">Password Updated!</p>
                        <p className="text-sm text-neutral-400">Closing window...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Update Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function SectionHeading({ icon: Icon, title, color }: { icon: any, title: string, color: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl bg-muted/30 ${color}`}>
                <Icon size={18} />
            </div>
            <h2 className="text-base font-bold tracking-tight">{title}</h2>
        </div>
    );
}

function ToggleRow({ label, desc, value, onChange }: { label: string, desc: string, value: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-3 group">
            <div className="pr-4">
                <div className="text-sm font-medium group-hover:text-primary transition-colors">{label}</div>
                <div className="text-xs text-muted-foreground dark:text-neutral-400">{desc}</div>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${value ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

function ShortcutsSection() {
    const { openShortcutsModal } = useKeyboardShortcuts();
    return (
        <button
            onClick={openShortcutsModal}
            className="flex items-center justify-between w-full p-4 rounded-xl border transition-all group bg-muted/20 border-border hover:bg-muted/50 hover:border-primary/30"
        >
            <div className="flex items-center gap-3">
                <Keyboard size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-left">
                    <span className="block text-sm font-medium text-foreground">Shortcuts & Gestures</span>
                    <span className="block text-xs text-muted-foreground dark:text-neutral-400">View cheat sheet</span>
                </div>
            </div>
            <Command size={14} className="opacity-30" />
        </button>
    );
}

function NotificationSettings() {
    const settings = useSettings();
    const {
        permissionStatus,
        isEnabled,
        requestPermission,
        disableNotifications,
        sendNotification,
        fcmToken
    } = useNotifications();
    const [isLoading, setIsLoading] = React.useState(false);
    const [testSent, setTestSent] = React.useState(false);

    const handleToggleNotifications = async (enabled: boolean) => {
        setIsLoading(true);
        try {
            if (enabled) {
                const granted = await requestPermission();
                if (granted) {
                    settings.updateSetting("notificationsEnabled", true);
                } else {
                    // Permission denied
                    settings.updateSetting("notificationsEnabled", false);
                }
            } else {
                await disableNotifications();
                settings.updateSetting("notificationsEnabled", false);
            }
        } catch (error) {
            console.error("Error toggling notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = async () => {
        setTestSent(false);
        // Use a unique tag to ensure it's not grouped or suppressed by the OS
        const uniqueTag = `test-${Date.now()}`;

        await sendNotification({
            type: "reminder",
            title: "🔔 Test Notification",
            body: `Successfully sent at ${new Date().toLocaleTimeString()}. If you see this, notifications are working!`,
            icon: "/icon.svg",
            requireInteraction: true,
            data: { tag: uniqueTag }
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
    };

    const getPermissionBadge = () => {
        if (permissionStatus === "granted") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    <CheckCircle2 size={12} /> Enabled
                </span>
            );
        } else if (permissionStatus === "denied") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                    <X size={12} /> Blocked
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                    <AlertCircle size={12} /> Not Set
                </span>
            );
        }
    };

    const getDeviceCapability = () => {
        if (typeof window === "undefined") return "Unknown";

        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

        if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
            return "⚠️ iOS: Install as PWA for notifications";
        } else if (isIOS) {
            return "✅ iOS PWA: Full support";
        } else if (isAndroid) {
            return "✅ Android: Full support";
        } else if (isSafari) {
            return "⚠️ Safari: Limited support";
        } else {
            return "✅ Desktop: Full support";
        }
    };

    return (
        <section className="p-6 rounded-3xl border backdrop-blur-md bg-card border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <SectionHeading icon={Bell} title="Push Notifications" color="text-purple-400" />
                {getPermissionBadge()}
            </div>

            <div className="space-y-4">
                {/* Main Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                    <div>
                        <div className="text-sm font-medium">Enable Notifications</div>
                        <div className="text-xs text-muted-foreground">Get alerts for timer completion</div>
                    </div>
                    <button
                        onClick={() => handleToggleNotifications(!settings.notificationsEnabled)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
                        ) : (
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        )}
                    </button>
                </div>

                {/* Granular Toggles */}
                {isEnabled && (
                    <div className="pt-4 border-t border-border/50 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground opacity-60 mb-2">Notification Types</div>

                        <ToggleRow
                            label="Achievements"
                            desc="Trophies for focused time"
                            value={settings.notifyAchievements}
                            onChange={(v) => settings.updateSetting("notifyAchievements", v)}
                        />

                        <ToggleRow
                            label="Streak Milestones"
                            desc="Celebrate consistency goals"
                            value={settings.notifyStreaks}
                            onChange={(v) => settings.updateSetting("notifyStreaks", v)}
                        />

                        <ToggleRow
                            label="Daily Reminders"
                            desc="Morning nudges and tips"
                            value={settings.notifyReminders}
                            onChange={(v) => settings.updateSetting("notifyReminders", v)}
                        />

                        {settings.notifyReminders && (
                            <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-primary/20 ml-2">
                                <div className="text-sm font-medium">Nudge Time</div>
                                <input
                                    type="time"
                                    value={settings.morningNudgeTime}
                                    onChange={(e) => settings.updateSetting("morningNudgeTime", e.target.value)}
                                    className="bg-muted/30 border border-border/50 rounded-lg px-2 py-1 text-sm outline-none focus:border-primary/50 transition-all font-mono"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Device Capability */}
                <div className="p-3 rounded-xl bg-muted/10 border border-border/50">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Device Capability</div>
                    <div className="text-sm">{getDeviceCapability()}</div>
                </div>

                {/* Test Notification Button */}
                {isEnabled && (
                    <button
                        onClick={handleTestNotification}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all text-sm font-medium"
                    >
                        {testSent ? (
                            <>
                                <CheckCircle2 size={16} className="text-green-500" />
                                Test Sent!
                            </>
                        ) : (
                            <>
                                <Bell size={16} />
                                Send Test Notification
                            </>
                        )}
                    </button>
                )}

                {/* FCM Token Status (for debugging) */}
                {fcmToken && (
                    <div className="p-3 rounded-xl bg-muted/10 border border-border/50">
                        <div className="text-xs font-medium text-muted-foreground mb-1">FCM Token Status</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="text-xs font-mono text-green-500/80 truncate">
                                Registered & Ready
                            </div>
                        </div>
                    </div>
                )}

                {/* Permission Denied Help */}
                {permissionStatus === "denied" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-xs text-red-500">
                            <strong>Notifications Blocked:</strong> Please enable notifications in your browser settings.
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function PlayCircle({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" opacity="0.5" />
        </svg>
    )
}
