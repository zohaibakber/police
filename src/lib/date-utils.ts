/**
 * App date format: dd-mm-yyyy (display and form values).
 * DB stores yyyy-mm-dd for correct sorting.
 */

/** Parse dd-mm-yyyy string to Date. Returns undefined if invalid. */
export function parseDdMmYyyy(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined;
  const parts = value.split("-");
  if (parts.length !== 3) return undefined;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return undefined;
  const month = m - 1;
  const date = new Date(y, month, d);
  if (date.getFullYear() !== y || date.getMonth() !== month || date.getDate() !== d) return undefined;
  return date;
}

/** Format Date to dd-mm-yyyy */
export function toDdMmYyyy(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Convert dd-mm-yyyy to yyyy-mm-dd for DB storage */
export function ddMmYyyyToYyyyMmDd(value: string): string {
  const date = parseDdMmYyyy(value);
  if (!date) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convert yyyy-mm-dd (from DB) to dd-mm-yyyy for app/display */
export function yyyyMmDdToDdMmYyyy(value: string): string {
  if (!value || value.length < 10) return value;
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  if (y.length === 4 && m.length <= 2 && d.length <= 2) return `${d}-${m}-${y}`;
  return value;
}

/** Check if string looks like dd-mm-yyyy */
export function isDdMmYyyy(value: string): boolean {
  return /^\d{1,2}-\d{1,2}-\d{4}$/.test(value.trim()) && !!parseDdMmYyyy(value);
}
