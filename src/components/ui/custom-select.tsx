import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    disabled?: boolean;
    placeholder?: string;
    onAdd?: (val: string) => void;
    onRemove?: (val: string) => void;
}

export const CustomSelect = ({ value, onChange, options, disabled, placeholder, onAdd, onRemove }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newSubject, setNewSubject] = useState("");
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsAdding(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAdd = () => {
        if (newSubject.trim() && onAdd) {
            onAdd(newSubject.trim());
            setNewSubject("");
            setIsAdding(false);
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl appearance-none outline-none transition-all cursor-pointer font-medium bg-card/10 border border-border hover:bg-card/20 focus:border-primary ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ color: isDark ? "#ffffff" : "#000000" }}
            >
                <span className={!value ? "opacity-50" : ""}>{value || placeholder}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} opacity-50`} style={{ color: isDark ? "#ffffff" : "#000000" }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full left-0 w-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-[100] ${isDark
                            ? "bg-black/40 border-white/10"
                            : "bg-white/60 border-black/5"}`}
                        style={{
                            backdropFilter: "blur(24px) saturate(160%)",
                            WebkitBackdropFilter: "blur(24px) saturate(160%)",
                            isolation: "isolate"
                        }}
                    >
                        <div className="max-h-[250px] overflow-y-auto">
                            {options.map((option) => (
                                <div key={option} className="group flex items-center w-full">
                                    <button
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                        className={`flex-grow text-left px-4 py-3 text-sm font-medium transition-colors ${value === option
                                            ? isDark ? "bg-white/10" : "bg-black/5"
                                            : "hover:bg-white/10"}`}
                                        style={{ color: isDark ? "#ffffff" : "#000000" }}
                                    >
                                        {option}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onRemove) onRemove(option);
                                        }}
                                        className={`p-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-white/40 hover:text-red-400" : "text-black/30 hover:text-red-500"}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Subject */}
                        <div className={`p-2 border-t ${isDark ? "border-white/10" : "border-black/5"}`}>
                            {isAdding ? (
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        placeholder="Enter subject..."
                                        className={`flex-grow px-3 py-2 text-sm rounded-lg outline-none ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                    />
                                    <button
                                        onClick={handleAdd}
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${isDark ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"}`}
                                >
                                    <Plus size={14} /> Add New Subject
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
