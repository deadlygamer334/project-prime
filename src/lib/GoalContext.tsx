"use client";
import React, { createContext, useContext, useState } from "react";

interface Goal {
    id: string;
    text: string;
    completed: boolean;
}

interface GoalContextType {
    goals: Goal[];
    addGoal: (text: string) => void;
    toggleGoal: (id: string) => void;
    deleteGoal: (id: string) => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
    const [goals, setGoals] = useState<Goal[]>([]);

    const addGoal = (text: string) => {
        setGoals(prev => [...prev, { id: Date.now().toString(), text, completed: false }]);
    };

    const toggleGoal = (id: string) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
    };

    const deleteGoal = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    return (
        <GoalContext.Provider value={{ goals, addGoal, toggleGoal, deleteGoal }}>
            {children}
        </GoalContext.Provider>
    );
}

export function useGoalContext() {
    const context = useContext(GoalContext);
    if (!context) {
        throw new Error("useGoalContext must be used within a GoalProvider");
    }
    return context;
}
