export type ISODate = string; // "YYYY-MM-DD"

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): ISODate {
  return toISO(new Date());
}

export function tomorrow(from: Date = new Date()): ISODate {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  return toISO(d);
}

export function fromISO(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function formatCardDate(iso: ISODate): string {
  const d = fromISO(iso);
  return `${DAYS[d.getDay()].toUpperCase()} · ${MONTHS[d.getMonth()].toUpperCase()} ${d.getDate()}`;
}

export function formatHeaderDate(iso: ISODate): string {
  const d = fromISO(iso);
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatClock(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function weekOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d.getTime() - start.getTime()) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const add = day === 0 ? 0 : 7 - day;
  x.setDate(x.getDate() + add);
  return x;
}

export function endOfMonth(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return startOfDay(x);
}

export function sameDay(a: number, b: number): boolean {
  const d1 = new Date(a), d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function relLabel(dueAt: number, now: Date = new Date()): string {
  const start = startOfDay(now).getTime();
  const day = 86400000;
  const diff = Math.round((startOfDay(new Date(dueAt)).getTime() - start) / day);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1 && diff < 7) return DAYS[new Date(dueAt).getDay()].toLowerCase();
  const d = new Date(dueAt);
  return `${MONTHS[d.getMonth()].toLowerCase()} ${d.getDate()}`;
}

// Parse "jul 20", "20 jul", "2026-07-20", "7/20", "20/7" leniently. Returns null on fail.
export function parseFuzzyDate(input: string, now: Date = new Date()): Date | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  // ISO
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // month name + day
  const monRe = MONTHS.map((x) => x.toLowerCase()).join("|");
  m = s.match(new RegExp(`^(${monRe})\\s+(\\d{1,2})$`));
  if (m) {
    const mi = MONTHS.map((x) => x.toLowerCase()).indexOf(m[1]);
    const day = +m[2];
    const y = now.getFullYear();
    const d = new Date(y, mi, day);
    if (d.getTime() < startOfDay(now).getTime()) d.setFullYear(y + 1);
    return d;
  }
  m = s.match(new RegExp(`^(\\d{1,2})\\s+(${monRe})$`));
  if (m) {
    const mi = MONTHS.map((x) => x.toLowerCase()).indexOf(m[2]);
    const day = +m[1];
    const y = now.getFullYear();
    const d = new Date(y, mi, day);
    if (d.getTime() < startOfDay(now).getTime()) d.setFullYear(y + 1);
    return d;
  }
  // M/D (assume current year, US-ish)
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const a = +m[1], b = +m[2];
    const y = now.getFullYear();
    const d = new Date(y, a - 1, b);
    if (d.getTime() < startOfDay(now).getTime()) d.setFullYear(y + 1);
    return d;
  }
  if (s === "today") return startOfDay(now);
  if (s === "tomorrow" || s === "tmrw") { const d = startOfDay(now); d.setDate(d.getDate() + 1); return d; }
  return null;
}
