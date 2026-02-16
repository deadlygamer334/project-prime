/**
 * Formats a Date object to a local YYYY-MM-DD string.
 * This avoids UTC offset issues common with toISOString().
 */
export const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a Date object at local midnight.
 */
export const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Formats a duration in minutes into a human-readable string (e.g., "1h 30m" or "45m").
 */
export const formatDuration = (minutes: number): string => {
    if (minutes < 1) {
        const seconds = Math.round(minutes * 60);
        return `${seconds}s`;
    }

    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    return `${Math.round(minutes)}m`;
};
