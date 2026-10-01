import type { AdminProgram, TimelineEntry } from "../types";

/* ───────────── Validation ───────────── */

export type Problem = { field: string; message: string };

export function validateProgram(p: AdminProgram): Problem[] {
  const out: Problem[] = [];
  if (!p.name.trim()) out.push({ field: "name", message: "Program name is required" });
  if (!p.sector.trim()) out.push({ field: "sector", message: "Sector is required" });
  if (!p.duration.trim()) out.push({ field: "duration", message: "Duration is required" });
  if (!p.location.trim()) out.push({ field: "location", message: "Location is required" });
  if (!p.description.trim() && !p.overview.trim()) out.push({ field: "description", message: "Program description is required" });
  if (!p.eligibility.trim()) out.push({ field: "eligibility", message: "Add at least one eligibility criterion" });
  if (!p.benefits.trim()) out.push({ field: "benefits", message: "Add at least one benefit" });
  if (!p.timelineEntries.length) out.push({ field: "timeline", message: "Add at least one timeline entry" });
  if (p.cohortSize !== undefined && (!Number.isFinite(p.cohortSize) || p.cohortSize < 1 || !Number.isInteger(p.cohortSize)))
    out.push({ field: "cohortSize", message: "Cohort size must be a whole number of 1 or more" });
  if (p.deadline && p.deadline.trim() && !parseDates(p.deadline))
    out.push({ field: "deadline", message: "Deadline should look like \"31 August 2026\"" });
  return out;
}

/* ───────────── Date helpers (timeline dates are free text) ───────────── */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthIndex = (w: string) => MONTHS.findIndex(m => m === w.toLowerCase() || m.slice(0, 3) === w.toLowerCase().slice(0, 3) && w.length <= 4);

/** Understands "31 August 2026", "1–10 September 2026", "January 2027". Returns start/end (UTC ms) or null. */
export function parseDates(text: string): { start: number; end: number } | null {
  const t = text.replace(/[\u2013\u2014]/g, "-").replace(/,/g, " ").replace(/\s+/g, " ").trim();
  let m = /^(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (m) { const mi = monthIndex(m[3]); if (mi >= 0) return { start: Date.UTC(+m[4], mi, +m[1]), end: Date.UTC(+m[4], mi, +m[2]) }; }
  m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (m) { const mi = monthIndex(m[2]); if (mi >= 0) { const x = Date.UTC(+m[3], mi, +m[1]); return { start: x, end: x }; } }
  m = /^([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (m) { const mi = monthIndex(m[1]); if (mi >= 0) return { start: Date.UTC(+m[2], mi, 1), end: Date.UTC(+m[2], mi + 1, 0) }; }
  return null;
}

const startOfToday = (now = new Date()) => Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

export type StepState = "done" | "open" | "upcoming";

/** The step that is "now" is the last one whose start date has passed; earlier steps are done. Nothing is open for closed programmes. */
export function timelineStates(entries: TimelineEntry[], status: string, now = new Date()): StepState[] {
  const today = startOfToday(now);
  const starts = entries.map(e => parseDates(e.date)?.start ?? null);
  let current = -1;
  starts.forEach((s, i) => { if (s !== null && s <= today) current = i; });
  return entries.map((_, i) => {
    if (current < 0 || i > current) return "upcoming";
    if (i < current) return "done";
    return status === "Closed" ? "done" : "open";
  });
}

/* ───────────── What the public card shows ───────────── */

export type CohortLite = { id: number; name: string; startDate: string; enrolled: number };
const isCloseTitle = (t: string) => /applications?\s+clos/i.test(t);
const isStartTitle = (t: string) => /(training|programme|program|cohort|classes|sessions?)\s+(commence|start|begin)|^start|^kick-?off|commence/i.test(t);

export function programFacts(p: AdminProgram, cohorts: CohortLite[] = []) {
  const cohort = p.cohortId != null ? cohorts.find(c => c.id === p.cohortId) : undefined;
  const startEntry = p.timelineEntries.find(e => isStartTitle(e.title));
  const deadlineEntry = p.timelineEntries.find(e => isCloseTitle(e.title));
  const startDate = p.startDate?.trim() || startEntry?.date || cohort?.startDate || "—";
  const deadline = p.deadline?.trim() || deadlineEntry?.date || "—";
  const places = p.cohortSize && p.cohortSize > 0 ? p.cohortSize : 0;
  let cohortLine: string | null = null;
  if (cohort && places) cohortLine = `${cohort.enrolled} of ${places} places filled`;
  else if (places) cohortLine = `${places} places`;
  else if (cohort) cohortLine = `${cohort.enrolled} enrolled`;
  return { startDate, deadline, cohort: cohortLine, cohortName: cohort?.name ?? null, places, enrolled: cohort?.enrolled ?? null };
}

/* ───────────── "Notify me" sign-ups ───────────── */

export const INTEREST_KEY = "emerge.interest.v1";
export type Interest = { programId: string; programName: string; email: string; date: string };

export function loadInterest(): Interest[] {
  try {
    const v = JSON.parse(localStorage.getItem(INTEREST_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter(x => x && typeof x.email === "string") : [];
  } catch { return []; }
}

export function saveInterest(programId: string, programName: string, email: string): boolean {
  try {
    const all = loadInterest();
    if (!all.some(x => x.programId === programId && x.email.toLowerCase() === email.toLowerCase()))
      all.push({ programId, programName, email, date: new Date().toISOString() });
    localStorage.setItem(INTEREST_KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

const csvCell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // stop spreadsheet formula injection
  return `"${safe.replace(/"/g, '""')}"`;
};
export const interestToCsv = (rows: Interest[]) =>
  ["Email,Programme,Signed up", ...rows.map(r => [r.email, r.programName, r.date.slice(0, 10)].map(csvCell).join(","))].join("\n");
