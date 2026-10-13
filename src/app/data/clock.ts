// The platform clock. Everything that ages (overdue tasks, countdowns, "week in programme",
// session health, monthly charts) reads "today" from here, so it follows the real date.
//
// Tests and demos can pin the clock with setClock("2026-03-01") / setClock(null).

let pinned: string | null = null;
export const setClock = (iso: string | null) => { pinned = iso; };

const DAY = 86400000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD (not UTC: a mentor in Lilongwe logging at 00:30 means that day). */
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => pinned ?? isoOf(new Date());
/** Current moment. When the clock is pinned, it is 08:00 on the pinned day. */
export const nowDate = () => (pinned ? new Date(`${pinned}T08:00:00`) : new Date());
/** HH:MM now, for defaults and "has this slot started yet" checks. */
export const nowHHMM = () => { const n = nowDate(); return `${pad(n.getHours())}:${pad(n.getMinutes())}`; };

const utc = (iso: string) => new Date(iso + "T00:00:00Z").getTime();
export const daysBetween = (a: string, b: string) => Math.round((utc(b) - utc(a)) / DAY);
export const addDays = (iso: string, n: number) => new Date(utc(iso) + n * DAY).toISOString().slice(0, 10);
/** First day of the month `n` months from the month of `iso` (n may be negative). */
export const addMonths = (iso: string, n: number) => {
  const [y, m] = iso.split("-").map(Number); const t = (y * 12 + (m - 1)) + n;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}-01`;
};
export const monthKey = (iso: string) => iso.slice(0, 7);
export const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
/** "28 Jul 2025": use when the year matters (session history that can span years). */
export const fmtDateY = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** Free text such as "Next session" passes through; ISO dates are formatted. */
export const fmtDue = (due: string) => (isIso(due) ? fmtDate(due) : due);
export const monthShort = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
