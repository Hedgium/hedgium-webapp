/**
 * Format date with time up to minutes
 * Example: "September 9, 2025, 11:24 AM"
 */
export function formatDateTimeMinutes(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date with time up to seconds
 * Example: "September 9, 2025, 11:24:18 AM"
 */
export function formatDateTimeSeconds(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Format date only
 * Example: "September 9, 2025"
 */
export function formatDateOnly(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Example usage:
// const iso = "2025-09-09T11:24:18.406Z";

// console.log(formatDateTimeMinutes(iso)); // "September 9, 2025, 11:24 AM"
// console.log(formatDateTimeSeconds(iso)); // "September 9, 2025, 11:24:18 AM"
// console.log(formatDateOnly(iso));        // "September 9, 2025"
