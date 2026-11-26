// src/services/waste.ts
/**
 * Simple in‑memory implementation of the waste business logic.
 * In the real app this would call Supabase, but for unit tests we keep it
 * lightweight and deterministic.
 */
import { getShift } from '../utils/shift';

export type WasteRecord = {
  lineId: string;
  amount: number;
  timestamp: Date;
};

// In‑memory store – resettable in tests.
let wasteStore: WasteRecord[] = [];
let alerts: Set<string> = new Set(); // key = `${lineId}-${shift}-${date}`

export function resetStore() {
  wasteStore = [];
  alerts = new Set();
}

export function recordWaste(record: WasteRecord) {
  wasteStore.push(record);
}

export function calcShiftWaste(lineId: string, date: Date) {
  const shift = getShift(date);
  // Determine start/end of the shift that contains `date`
  const { start, end } = getShiftRange(date);
  const total = wasteStore
    .filter(
      (r) =>
        r.lineId === lineId && r.timestamp >= start && r.timestamp <= end,
    )
    .reduce((sum, r) => sum + r.amount, 0);
  return { shift, total };
}

export function getShiftRange(date: Date) {
  const shift = getShift(date);
  const hour = date.getHours();
  const day = new Date(date);
  day.setMinutes(0, 0, 0);
  if (shift === 'NIGHT') {
    // Night shift: 22:00 – 05:59 (next day)
    let start = new Date(date);
    start.setHours(22, 0, 0, 0);
    if (hour < 6) {
      // after midnight, start is previous day 22:00
      start.setDate(start.getDate() - 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(5, 59, 59, 999);
    return { start, end };
  }
  // DAY shift: 06:00 – 21:59
  const start = new Date(date);
  start.setHours(6, 0, 0, 0);
  const end = new Date(date);
  end.setHours(21, 59, 59, 999);
  return { start, end };
}

export function createAlertIfExceeds(lineId: string, date: Date, threshold: number) {
  const { shift, total } = calcShiftWaste(lineId, date);
  const key = `${lineId}-${shift}-${date.toISOString().slice(0, 10)}`;
  if (total > threshold && !alerts.has(key)) {
    alerts.add(key);
    return { lineId, shift, total, alert: true };
  }
  return { lineId, shift, total, alert: false };
}
