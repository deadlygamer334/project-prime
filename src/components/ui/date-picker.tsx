"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-auto justify-start text-left font-normal rounded-xl border border-border bg-background/50 backdrop-blur-sm transition-all hover:bg-accent/50",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon size={16} className="mr-2" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border border-border shadow-2xl backdrop-blur-xl bg-card/95" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-2xl"
                />
            </PopoverContent>
        </Popover>
    )
}
