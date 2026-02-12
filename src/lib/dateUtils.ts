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
