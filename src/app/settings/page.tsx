"use client";

import React, { useState } from "react";
import AppHeader from "@/components/sections/AppHeader";
import Footer from "@/components/sections/Footer";
import { useNotification } from "@/lib/NotificationContext";
import { useSettings, FontFamily, BackgroundStyle, TickSound, AlarmSound } from "@/lib/SettingsContext";
import { useKeyboardShortcuts } from "@/lib/KeyboardShortcutsContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
    Layout, Music, PartyPopper, Clock, Shield, Download, LogOut,
    Lock, ArrowRight, X, CheckCircle2, AlertCircle, Loader2, Bell,
    Image as ImageIcon, Trash2, Check, Keyboard, Command
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db, googleProvider } from "@/lib/firebase";
import { signOut, updatePassword, deleteUser, reauthenticateWithPopup, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, doc, deleteDoc, writeBatch, getDocs } from "firebase/firestore";
import useSoundEffects from "@/hooks/useSoundEffects";
import { useHabitContext } from "@/lib/HabitContext";
import VibeGallery from "@/components/sections/VibeGallery";
import { WallpaperManagerBtn } from "@/components/wallpaper/WallpaperManagerModal";
import { useWallpaper } from "@/lib/WallpaperContext";

export default function SettingsPage() {
    const { showToast, showConfirm } = useNotification();
    const settings = useSettings();
    const { wallpaper, setWallpaper } = useWallpaper();
    const { playAlarm } = useSoundEffects();
    const router = useRouter();
    const { habits } = useHabitContext();
    const [activeSection, setActiveSection] = useState("appearance");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            showToast("Signed out successfully", "info");
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
        a.download = `prime-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Data exported successfully", "success");
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

    const implementedClockStyles = [
        { value: "standard", label: "Standard" },
        { value: "minimal",  label: "Minimal" },
        { value: "bold",     label: "Bold" },
        { value: "neon",     label: "Neon" },
        { value: "elegant",  label: "Elegant" },
        { value: "outline",  label: "Outline" },
        { value: "pill",     label: "Pill" },
        { value: "glitch",   label: "Glitch" },
        { value: "vertical", label: "Vertical" },
    ];

    const ALL_BG_STYLES: { id: BackgroundStyle; label: string; preview: string }[] = [
        {
            id: "aurora",
            label: "Aurora",
            preview: `radial-gradient(circle at 20% 30%, var(--color-orb-purple) 0%, transparent 55%), radial-gradient(circle at 80% 20%, var(--color-orb-pink) 0%, transparent 50%), radial-gradient(circle at 50% 80%, var(--color-orb-green) 0%, transparent 55%)`
        },
        {
            id: "radial",
            label: "Radial",
            preview: `radial-gradient(circle at 50% 50%, var(--color-orb-purple) 0%, transparent 70%)`
        },
        {
            id: "bloom",
            label: "Bloom",
            preview: `radial-gradient(ellipse 120% 60% at 50% -10%, var(--color-orb-purple) 0%, transparent 75%)`
        },
        {
            id: "diagonal",
            label: "Diagonal",
            preview: `radial-gradient(circle at 0% 0%, var(--color-orb-purple) 0%, transparent 60%), radial-gradient(circle at 100% 100%, var(--color-orb-pink) 0%, transparent 60%)`
        },
        {
            id: "edge",
            label: "Edge",
            preview: `radial-gradient(ellipse 80% 25% at 50% 0%, var(--color-orb-purple) 0%, transparent 100%), radial-gradient(ellipse 80% 25% at 50% 100%, var(--color-orb-purple) 0%, transparent 100%), radial-gradient(ellipse 25% 80% at 0% 50%, var(--color-orb-pink) 0%, transparent 100%), radial-gradient(ellipse 25% 80% at 100% 50%, var(--color-orb-pink) 0%, transparent 100%)`
        },
        {
            id: "mesh",
            label: "Mesh",
            preview: `radial-gradient(at 0% 0%, var(--color-orb-purple) 0, transparent 60%), radial-gradient(at 50% 0%, var(--color-orb-pink) 0, transparent 60%), radial-gradient(at 100% 0%, var(--color-orb-green) 0, transparent 60%)`
        },
        {
            id: "particles",
            label: "Particles",
            preview: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`
        },
        {
            id: "midnight",
            label: "Midnight",
            preview: `radial-gradient(ellipse at 50% 100%, var(--color-orb-purple) 0%, transparent 60%)`
        }
    ];

    const SECTIONS = [
        { id: "appearance",    label: "Appearance",    icon: Layout },
        { id: "background",    label: "Background",    icon: ImageIcon },
        { id: "timer",         label: "Timer",         icon: Clock },
        { id: "acoustics",     label: "Acoustics",     icon: Music },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "effects",       label: "Effects",       icon: PartyPopper },
        { id: "security",      label: "Security",      icon: Shield },
        { id: "data",          label: "Data",          icon: Download },
    ];

    return (
        <div className="min-h-screen bg-background">
            <AppHeader title="Settings" activePath="/settings" />

            <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">

                {/* Page title & User Greeting */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight"
                            style={{
                                background: "linear-gradient(135deg, var(--foreground) 0%, color-mix(in srgb, var(--foreground) 60%, transparent) 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                            }}>
                            Settings
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Customize your Prime experience
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-card px-3 py-2 rounded-2xl border border-border self-start sm:self-auto">
                        <span className="text-sm font-medium text-muted-foreground">Hello,</span>
                        <input
                            type="text"
                            value={settings.userName}
                            onChange={(e) => settings.updateSetting("userName", e.target.value)}
                            className="bg-transparent border-b border-dashed border-border outline-none w-[120px] text-base font-bold focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50"
                            placeholder="Enter Name"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* ── Sidebar nav (desktop) ───────── */}
                    <nav className="hidden md:flex flex-col gap-1 w-[200px] shrink-0 sticky top-24">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    <Icon size={15} className={isActive ? "text-primary" : "text-muted-foreground"} />
                                    {s.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* ── Mobile section pills ─────────── */}
                    <div className="md:hidden flex gap-2 overflow-x-auto pb-3 hide-scrollbar mb-6 w-full shrink-0">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 shrink-0 rounded-full text-xs font-bold border transition-all ${
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border text-muted-foreground hover:border-primary/40"
                                    }`}
                                >
                                    <Icon size={11} />
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Content panel ───────────────── */}
                    <div className="flex-1 min-w-0 w-full">

                        {activeSection === "appearance" && (
                            <SettingsCard
                                icon={Layout}
                                title="Appearance"
                                desc="Visual style, typography, layout">
                                {/* Theme Vibe picker — show VibeGallery here */}
                                <div className="mb-6">
                                    <SectionLabel>Theme Vibe</SectionLabel>
                                    <VibeGallery />
                                </div>
                                {/* Note about accent color */}
                                <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border">
                                    <p className="text-xs text-muted-foreground">
                                        Accent color and primary palette are defined by your Theme Vibe selection above.
                                    </p>
                                </div>
                                <FormRow
                                    label="Reverse Desktop Layout"
                                    desc="Swap Timer and Todo columns">
                                    <Toggle
                                        value={settings.dashboardLayout === "reversed"}
                                        onChange={v => settings.updateSetting(
                                            "dashboardLayout",
                                            v ? "reversed" : "standard")} />
                                </FormRow>
                                <FormRow label="Typography" desc="Font style">
                                    <SegmentedControl
                                        options={fonts.map(f => ({
                                            value: f.id, label: f.label }))}
                                        value={settings.fontFamily}
                                        onChange={v => settings.updateSetting(
                                            "fontFamily", v as FontFamily)} />
                                </FormRow>
                                <FormRow label="Clock Style" desc="Dashboard clock variant">
                                    <GridPicker
                                        cols={3}
                                        options={implementedClockStyles}
                                        value={settings.clockStyle}
                                        onChange={v => settings.updateSetting(
                                            "clockStyle", v as any)} />
                                </FormRow>
                                <FormRow label="Density" desc="UI spacing scale">
                                    <SegmentedControl
                                        options={[
                                            { value: "compact",  label: "Compact"  },
                                            { value: "normal",   label: "Normal"   },
                                            { value: "spacious", label: "Spacious" },
                                        ]}
                                        value={settings.paddingScale}
                                        onChange={v => settings.updateSetting(
                                            "paddingScale", v as any)} />
                                </FormRow>
                                <FormRow label="Corners" desc="Border radius style">
                                    <SegmentedControl
                                        options={[
                                            { value: "sharp",  label: "Sharp"  },
                                            { value: "smooth", label: "Smooth" },
                                        ]}
                                        value={settings.borderRadius}
                                        onChange={v => settings.updateSetting(
                                            "borderRadius", v as any)} />
                                </FormRow>
                            </SettingsCard>
                        )}

                        {activeSection === "background" && (
                            <SettingsCard
                                icon={ImageIcon}
                                title="Background"
                                desc="Global atmosphere and wallpapers">
                                <SectionLabel className="mb-3">
                                    Background Style
                                </SectionLabel>
                                <div className="grid grid-cols-4 gap-2 mb-6">
                                    {ALL_BG_STYLES.map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => settings.updateSetting(
                                                "backgroundStyle", style.id)}
                                            className={`relative h-[72px] rounded-xl border-2 overflow-hidden text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                                                settings.backgroundStyle === style.id
                                                    ? "border-primary shadow-[0_0_12px_rgba(167,139,250,0.25)]"
                                                    : "border-border hover:border-primary/40"
                                            }`}
                                        >
                                            <div
                                                className="absolute inset-0 opacity-75"
                                                style={{ background: style.preview }} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                                <p className="text-white text-[11px] font-bold leading-none drop-shadow">
                                                    {style.label}
                                                </p>
                                            </div>
                                            {settings.backgroundStyle === style.id && (
                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {/* Immersive wallpaper section */}
                                <div className="border-t border-border pt-5">
                                    <SectionLabel className="mb-3">
                                        Immersive Wallpaper
                                    </SectionLabel>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Custom wallpapers display behind your Pomodoro timer and in Zen Mode.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <WallpaperManagerBtn
                                            className="h-11 w-full !rounded-xl !bg-primary !text-primary-foreground !font-bold hover:opacity-90 transition-opacity">
                                            Browse Wallpapers
                                        </WallpaperManagerBtn>
                                        {wallpaper && (
                                            <button
                                                onClick={() => setWallpaper(null)}
                                                className="h-10 w-full rounded-xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove Wallpaper
                                            </button>
                                        )}
                                        <FormRow
                                            label="Auto-Dim Wallpaper"
                                            desc="Darken during Focus sessions">
                                            <Toggle
                                                value={settings.autoDimWallpaper}
                                                onChange={v => settings.updateSetting(
                                                    "autoDimWallpaper", v)} />
                                        </FormRow>
                                    </div>
                                </div>
                            </SettingsCard>
                        )}

                        {activeSection === "timer" && (
                            <SettingsCard
                                icon={Clock}
                                title="Timer & Clock"
                                desc="Pomodoro, clock display, Zen Mode">
                                <FormRow label="Show Seconds"
                                    desc="Display seconds in all clocks">
                                    <Toggle value={settings.showSeconds}
                                        onChange={v => settings.updateSetting(
                                            "showSeconds", v)} />
                                </FormRow>
                                <FormRow label="24-Hour Format"
                                    desc="Military time">
                                    <Toggle
                                        value={settings.clockFormat === "24h"}
                                        onChange={v => settings.updateSetting(
                                            "clockFormat", v ? "24h" : "12h")} />
                                </FormRow>
                                <FormRow label="Large Dashboard Clock"
                                    desc="Show big digital clock on home">
                                    <Toggle value={settings.showClock}
                                        onChange={v => settings.updateSetting(
                                            "showClock", v)} />
                                </FormRow>
                                <FormRow label="Daily Quotes"
                                    desc="Motivation quote in timer area">
                                    <Toggle value={settings.showQuotes}
                                        onChange={v => settings.updateSetting(
                                            "showQuotes", v)} />
                                </FormRow>
                                <div className="border-t border-border pt-5 mt-2">
                                    <SectionLabel className="mb-3">
                                        Zen Mode
                                    </SectionLabel>
                                    <FormRow label="Show Clock in Zen"
                                        desc="Small ambient clock overlay">
                                        <Toggle value={settings.showZenClock}
                                            onChange={v => settings.updateSetting(
                                                "showZenClock", v)} />
                                    </FormRow>
                                    <FormRow label="Zen Seconds"
                                        desc="Show seconds in Zen Mode">
                                        <Toggle value={settings.showZenSeconds}
                                            onChange={v => settings.updateSetting(
                                                "showZenSeconds", v)} />
                                    </FormRow>
                                    <FormRow label="Controls Position"
                                        desc="Where Zen controls appear">
                                        <GridPicker
                                            cols={2}
                                            options={[
                                                { value: "top-left",
                                                  label: "Top Left" },
                                                { value: "top-right",
                                                  label: "Top Right" },
                                                { value: "bottom-left",
                                                  label: "Bottom Left" },
                                                { value: "bottom-right",
                                                  label: "Bottom Right" },
                                            ]}
                                            value={settings.zenControlsAlignment}
                                            onChange={v => settings.updateSetting(
                                                "zenControlsAlignment", v as any)} />
                                    </FormRow>
                                </div>
                            </SettingsCard>
                        )}

                        {activeSection === "acoustics" && (
                            <SettingsCard icon={Music}
                                title="Acoustics"
                                desc="Sound effects and audio feedback">
                                <FormRow label="Enable Sounds"
                                    desc="Master sound switch">
                                    <Toggle value={settings.soundEnabled}
                                        onChange={v => settings.updateSetting(
                                            "soundEnabled", v)} />
                                </FormRow>
                                <div className="grid grid-cols-2 gap-6 mt-4">
                                    <div>
                                        <SectionLabel className="mb-2">
                                            Timer Tick
                                        </SectionLabel>
                                        <div className="flex flex-col gap-1">
                                            {tickSounds.map(s => (
                                                <button key={s.id}
                                                    onClick={() =>
                                                        settings.updateSetting(
                                                            "tickSound", s.id)}
                                                    className={`px-3 py-2 text-xs text-left rounded-lg transition-all ${
                                                        settings.tickSound === s.id
                                                            ? "bg-primary/10 text-primary font-semibold"
                                                            : "text-muted-foreground hover:bg-muted/50"
                                                    }`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <SectionLabel className="mb-2">
                                            Alarm Tone
                                        </SectionLabel>
                                        <div className="flex flex-col gap-1">
                                            {alarmSounds.map(s => (
                                                <button key={s.id}
                                                    onClick={() =>
                                                        settings.updateSetting(
                                                            "alarmSound", s.id)}
                                                    className={`px-3 py-2 text-xs text-left rounded-lg transition-all ${
                                                        settings.alarmSound === s.id
                                                            ? "bg-primary/10 text-primary font-semibold"
                                                            : "text-muted-foreground hover:bg-muted/50"
                                                    }`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={playAlarm}
                                            className="mt-3 text-[10px] flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-bold">
                                            <PlayCircle size={11} /> Test Sound
                                        </button>
                                    </div>
                                </div>
                            </SettingsCard>
                        )}

                        {activeSection === "notifications" && (
                            <NotificationSettings />
                        )}

                        {activeSection === "effects" && (
                            <SettingsCard icon={PartyPopper}
                                title="Visual Effects"
                                desc="Animations, motion, and visual polish">
                                <FormRow label="Confetti on Completion"
                                    desc="Celebrate finished sessions">
                                    <Toggle value={settings.confettiEnabled}
                                        onChange={v => settings.updateSetting(
                                            "confettiEnabled", v)} />
                                </FormRow>
                                <FormRow label="Glassmorphism"
                                    desc="Blur effects on floating surfaces">
                                    <Toggle value={settings.enableGlassmorphism}
                                        onChange={v => settings.updateSetting(
                                            "enableGlassmorphism", v)} />
                                </FormRow>
                                <FormRow label="Reduced Motion"
                                    desc="Minimise all UI animations">
                                    <Toggle value={settings.reducedMotion}
                                        onChange={v => settings.updateSetting(
                                            "reducedMotion", v)} />
                                </FormRow>
                                <FormRow label="Public Leaderboard Profile"
                                    desc="Appear on the weekly leaderboard">
                                    <Toggle value={settings.leaderboardPublic}
                                        onChange={v => settings.updateSetting(
                                            "leaderboardPublic", v)} />
                                </FormRow>
                            </SettingsCard>
                        )}

                        {activeSection === "security" && (
                            <SettingsCard icon={Shield}
                                title="Security"
                                desc="Account credentials and access">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Lock size={16}
                                            className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">
                                                Change Password
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Update your account credentials
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="opacity-30" />
                                </button>
                                <div className="mt-4">
                                    <ShortcutsSection />
                                </div>
                            </SettingsCard>
                        )}

                        {activeSection === "data" && (
                            <SettingsCard icon={Download}
                                title="Data & Privacy"
                                desc="Export, sign out, account management">
                                <p className="text-sm text-muted-foreground mb-5">
                                    All data is stored securely and belongs to you.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDownloadData}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted transition-all active:scale-95 w-full">
                                        <Download size={15} /> Export Data as JSON
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted transition-all active:scale-95 w-full">
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all active:scale-95 w-full">
                                        <AlertCircle size={15} /> Delete Account
                                    </button>
                                </div>
                                <div className="mt-8 pt-5 border-t border-border text-center">
                                    <button
                                        onClick={async () => {
                                            const confirmed = await showConfirm({
                                                title: "Reset Settings",
                                                description: "Reset all settings to defaults? Cannot be undone.",
                                                confirmText: "Reset",
                                                cancelText: "Cancel"
                                            });
                                            if (confirmed) {
                                                settings.resetSettings();
                                                showToast("Settings reset", "success");
                                            }
                                        }}
                                        className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                                        Reset all settings to default
                                    </button>
                                </div>
                            </SettingsCard>
                        )}

                    </div>
                </div>
            </main>

            {settings.showFooter && <Footer />}
            {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
            {showDeleteModal && <AccountDeletionModal onClose={() => setShowDeleteModal(false)} />}
        </div>
    );
}

function SettingsCard({
    icon: Icon, title, desc, children
}: {
    icon: React.ElementType;
    title: string;
    desc: string;
    children: React.ReactNode;
}) {
    return (
        <div className="gradient-border card-premium rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                <div className="p-2.5 rounded-xl bg-primary/10">
                    <Icon size={17} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">
                        {title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
            </div>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function FormRow({
    label, desc, children
}: {
    label: string;
    desc?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0 gap-4">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                    {label}
                </p>
                {desc && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {desc}
                    </p>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function SectionLabel({
    children, className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground ${className}`}>
            {children}
        </p>
    );
}

function Toggle({
    value, onChange
}: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                value ? "bg-primary" : "bg-muted border border-border"
            }`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                value ? "translate-x-6" : "translate-x-1"
            }`} />
        </button>
    );
}

function SegmentedControl({
    options, value, onChange
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 ${
                        value === opt.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function GridPicker({
    options, value, onChange, cols = 3
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    cols?: number;
}) {
    return (
        <div className={`grid gap-1.5`}
             style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-2 py-2 text-xs rounded-xl border transition-all font-medium ${
                        value === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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

function AccountDeletionModal({ onClose }: { onClose: () => void }) {
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const [reauthPassword, setReauthPassword] = useState("");
    const [authProvider, setAuthProvider] = useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const provider = user.providerData[0]?.providerId;
            setAuthProvider(provider);
        }
    }, []);

    const performDeletion = async (user: any) => {
        const uid = user.uid;

        // 0. Signal Protection Route to ignore updates
        window.dispatchEvent(new CustomEvent('account-deletion-started'));

        // 1. Delete Focus Sessions
        const sessionsRef = collection(db, "users", uid, "focusSessions");
        const sessionsSnap = await getDocs(sessionsRef);
        const batch1 = writeBatch(db);
        sessionsSnap.docs.forEach(d => batch1.delete(d.ref));
        await batch1.commit();

        // 2. Delete Habits and History
        const habitsRef = collection(db, "users", uid, "habits");
        const habitsSnap = await getDocs(habitsRef);

        for (const habitDoc of habitsSnap.docs) {
            const habitData = habitDoc.data();
            if (habitData.monthKeys && Array.isArray(habitData.monthKeys)) {
                const historyBatch = writeBatch(db);
                let historyCount = 0;
                for (const monthKey of habitData.monthKeys) {
                    const historyRef = doc(db, "users", uid, "habits", habitDoc.id, "history", monthKey);
                    historyBatch.delete(historyRef);
                    historyCount++;
                }
                if (historyCount > 0) await historyBatch.commit();
            }
            await deleteDoc(habitDoc.ref);
        }

        // 3. Delete User Doc
        await deleteDoc(doc(db, "users", uid));

        // 4. Delete Auth & Sign Out
        await deleteUser(user);
        await signOut(auth);

        router.push("/login");
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (confirmText !== "DELETE") return;
        setLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (!user) return;
            await performDeletion(user);
        } catch (err: any) {
            console.error("Deletion error:", err);
            if (err.code === 'auth/requires-recent-login') {
                setIsReauthenticating(true);
                setError("For security, please re-verify your identity before deleting your account.");
            } else {
                setError("Failed to delete account. Please try again or contact support.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReauth = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (!user) return;

            if (authProvider === "google.com") {
                await reauthenticateWithPopup(user, googleProvider);
            } else if (authProvider === "password") {
                if (!reauthPassword) {
                    setError("Please enter your current password.");
                    setLoading(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user.email!, reauthPassword);
                await reauthenticateWithCredential(user, credential);
            }

            // After successful re-auth, try deleting again
            await performDeletion(user);
        } catch (err: any) {
            console.error("Re-auth error:", err);
            setError(err.message || "Failed to re-verify identity.");
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
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2 text-destructive">Delete Account</h2>
                    <p className="text-sm text-muted-foreground">
                        This action is <span className="font-bold text-foreground">irreversible</span>. All your habits, focus history, and settings will be permanently lost.
                    </p>
                </div>

                {!isReauthenticating ? (
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50">Type "DELETE" to confirm</label>
                            <input
                                type="text"
                                autoFocus
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all font-mono"
                                placeholder="DELETE"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-2xl font-bold border border-border hover:bg-muted transition-colors text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={confirmText !== "DELETE" || loading}
                                className={`flex-1 py-3 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                                    confirmText === "DELETE"
                                        ? "bg-destructive text-destructive-foreground hover:scale-[1.01] active:scale-[0.98] shadow-red-500/20"
                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                }`}
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                Delete Forever
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium">
                            {error}
                        </div>

                        {authProvider === "google.com" ? (
                            <button
                                onClick={() => handleReauth()}
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-white text-black font-bold shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                Re-verify with Google
                            </button>
                        ) : (
                            <form onSubmit={handleReauth} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Current Password</label>
                                    <input
                                        type="password"
                                        autoFocus
                                        value={reauthPassword}
                                        onChange={(e) => setReauthPassword(e.target.value)}
                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    Verify & Delete
                                </button>
                            </form>
                        )}

                        <button
                            onClick={() => setIsReauthenticating(false)}
                            className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to confirmation
                        </button>
                    </div>
                )}
            </div>
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
                <Keyboard size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-left">
                    <span className="block text-sm font-medium text-foreground">Shortcuts & Gestures</span>
                    <span className="block text-xs text-muted-foreground">View cheat sheet</span>
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
    const [isLoading, setIsLoading] = useState(false);
    const [testSent, setTestSent] = useState(false);

    const handleToggleNotifications = async (enabled: boolean) => {
        setIsLoading(true);
        try {
            if (enabled) {
                const granted = await requestPermission();
                if (granted) {
                    settings.updateSetting("notificationsEnabled", true);
                } else {
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

    const deviceCapability = React.useMemo(() => {
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
    }, []);

    return (
        <SettingsCard icon={Bell} title="Notifications" desc="Push notifications and smart reminders">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                {getPermissionBadge()}
            </div>

            <div className="space-y-4">
                <FormRow label="Enable Notifications" desc="Get alerts for timer completion">
                    <button
                        type="button"
                        onClick={() => handleToggleNotifications(!settings.notificationsEnabled)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            settings.notificationsEnabled ? "bg-primary" : "bg-muted border border-border"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary-foreground" />
                        ) : (
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                settings.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                            }`} />
                        )}
                    </button>
                </FormRow>

                {isEnabled && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                        <SectionLabel className="mb-2">Notification Types</SectionLabel>

                        <FormRow
                            label="Achievements"
                            desc="Trophies for focused time">
                            <Toggle
                                value={settings.notifyAchievements}
                                onChange={(v) => settings.updateSetting("notifyAchievements", v)}
                            />
                        </FormRow>

                        <FormRow
                            label="Streak Milestones"
                            desc="Celebrate consistency goals">
                            <Toggle
                                value={settings.notifyStreaks}
                                onChange={(v) => settings.updateSetting("notifyStreaks", v)}
                            />
                        </FormRow>

                        <FormRow
                            label="Daily Reminders"
                            desc="Morning nudges and tips">
                            <Toggle
                                value={settings.notifyReminders}
                                onChange={(v) => settings.updateSetting("notifyReminders", v)}
                            />
                        </FormRow>

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

                <div className="p-3 rounded-xl bg-muted/10 border border-border/50">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Device Capability</div>
                    <div className="text-sm">{deviceCapability}</div>
                </div>

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

                {permissionStatus === "denied" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-xs text-red-500">
                            <strong>Notifications Blocked:</strong> Please enable notifications in your browser settings.
                        </div>
                    </div>
                )}
            </div>
        </SettingsCard>
    );
}

function PlayCircle({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" opacity="0.5" />
        </svg>
    );
}
