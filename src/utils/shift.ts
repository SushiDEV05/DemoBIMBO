// src/utils/shift.ts
/**
 * Utility to determine the production shift for a given Date.
 * Shift A: 06:00 – 21:59 (day)
 * Shift B: 22:00 – 05:59 (night) – crosses midnight.
 */
export function getShift(date: Date): 'DAY' | 'NIGHT' {
  const hour = date.getHours();
  // Night shift starts at 22:00 and ends at 05:59
  if (hour >= 22 || hour < 6) {
    return 'NIGHT';
  }
  return 'DAY';
}
