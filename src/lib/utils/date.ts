import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format date as full date string
 */
export function formatFullDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP'); // e.g., "April 29, 2024"
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP p'); // e.g., "April 29, 2024 at 9:30 AM"
}
