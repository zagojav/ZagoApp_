export function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function normalizeDateInput(input: string): string | null {
  const parts = input.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => parseInt(p, 10));
  if (!d || !m || !y) return null;
  return formatDateKey(new Date(y, m - 1, d));
}

// 'DD/MM/YYYY' -> 'YYYY-MM-DD'. Firestore rejects '/' in a nested field
// path (e.g. `completions.${dateKey}`), so any date used as a map key
// inside a document must go through this first.
export function toStorageKey(dateKey: string): string {
  const [day, month, year] = dateKey.split('/');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [day, month, year] = dateKey.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = startOfDay(date);
  result.setDate(result.getDate() + days);
  return result;
}
