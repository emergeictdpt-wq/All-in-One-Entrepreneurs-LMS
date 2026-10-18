// How long a programme runs, worked out from its cohort's start and end dates.
// Cohort dates are typed by the programme team as free text ("Jan 2026", "28 Jul 2025", "2026-03-01"),
// so they are read loosely. When a date can't be read the length is unknown (null); nothing is guessed.

import { addDays, daysBetween, isIso } from "./clock";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const lastDayOfMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/**
 * Reads a cohort date into an ISO day.
 * A month with no day ("Jan 2026") is the first day when it is a start and the last day when it is an end.
 * Returns null for anything unreadable ("—", "TBD", "").
 */
export function parseCohortDate(text: string | undefined, edge: "start" | "end"): string | null {
  const s = (text ?? "").trim();
  if (!s) return null;
  if (isIso(s)) return s;
  const monthIdx = (w: string) => MONTHS.indexOf(w.slice(0, 3).toLowerCase());

  // "Jan 2026", "January 2026"
  let m = /^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/.exec(s);
  if (m && monthIdx(m[1]) >= 0) {
    const mi = monthIdx(m[1]), y = Number(m[2]);
    return `${y}-${pad(mi + 1)}-${pad(edge === "start" ? 1 : lastDayOfMonth(y, mi))}`;
  }
  // "28 Jul 2025", "28 July 2025"
  m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/.exec(s);
  if (m && monthIdx(m[2]) >= 0) return fromParts(Number(m[3]), monthIdx(m[2]), Number(m[1]));
  // "Jul 28, 2025", "July 28 2025"
  m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/.exec(s);
  if (m && monthIdx(m[1]) >= 0) return fromParts(Number(m[3]), monthIdx(m[1]), Number(m[2]));
  // "28/07/2025" (day first, as written in Malawi)
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(s);
  if (m) return fromParts(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

/** An ISO day, or null when the day does not exist (31 Feb). */
function fromParts(y: number, m0: number, d: number): string | null {
  if (m0 < 0 || m0 > 11 || d < 1 || d > lastDayOfMonth(y, m0)) return null;
  return `${y}-${pad(m0 + 1)}-${pad(d)}`;
}

export interface CohortDates { startDate?: string; endDate?: string }

/** Whole weeks from the cohort's start to its end (a part week counts as a week). Null when either date is unreadable or the end is not after the start. */
export function cohortWeeks(c: CohortDates | undefined | null): number | null {
  if (!c) return null;
  const a = parseCohortDate(c.startDate, "start"), b = parseCohortDate(c.endDate, "end");
  if (!a || !b) return null;
  const days = daysBetween(a, b) + 1; // both end days count
  return days > 0 ? Math.ceil(days / 7) : null;
}

/**
 * Where a founder is in the programme. `total` comes from the cohort dates; when it is unknown the week is
 * still reported but there is no total and no percentage.
 */
export function programmeWeek(opts: { start: string; today: string; cohort?: CohortDates | null }): { week: number; total: number | null; pct: number | null } {
  const elapsed = Math.max(0, Math.floor(daysBetween(opts.start, opts.today) / 7)) + 1;
  const total = cohortWeeks(opts.cohort);
  if (total == null) return { week: elapsed, total: null, pct: null };
  const week = Math.min(elapsed, total);
  return { week, total, pct: Math.round((week / total) * 100) };
}

/** The ISO day the programme ends, when readable. */
export const cohortEnd = (c: CohortDates | undefined | null) => parseCohortDate(c?.endDate, "end");
/** Convenience for callers that want "N weeks left". */
export const weeksLeft = (c: CohortDates | undefined | null, today: string): number | null => {
  const e = cohortEnd(c); return e ? Math.max(0, Math.ceil((daysBetween(today, addDays(e, 1))) / 7)) : null;
};
