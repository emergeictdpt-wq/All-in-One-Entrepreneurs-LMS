import { describe, expect, it } from "vitest";
import { cohortWeeks, parseCohortDate, programmeWeek } from "./programmeLength";

describe("parseCohortDate", () => {
  it("reads the formats the programme team types", () => {
    expect(parseCohortDate("2026-03-01", "start")).toBe("2026-03-01");
    expect(parseCohortDate("28 Jul 2025", "start")).toBe("2025-07-28");
    expect(parseCohortDate("Jul 28, 2025", "end")).toBe("2025-07-28");
    expect(parseCohortDate("28/07/2025", "start")).toBe("2025-07-28");
  });
  it("a bare month is the first day for a start and the last day for an end", () => {
    expect(parseCohortDate("Jan 2026", "start")).toBe("2026-01-01");
    expect(parseCohortDate("Feb 2028", "end")).toBe("2028-02-29");
    expect(parseCohortDate("December 2025", "end")).toBe("2025-12-31");
  });
  it("returns null for anything unreadable or impossible", () => {
    for (const t of ["", "—", "TBD", "31 Feb 2026", "soon", undefined]) expect(parseCohortDate(t as string, "start")).toBeNull();
  });
});

describe("cohortWeeks", () => {
  it("is not fixed at 24: it follows the cohort", () => {
    expect(cohortWeeks({ startDate: "2026-01-05", endDate: "2026-04-26" })).toBe(16); // the 16-week example in the spec
    expect(cohortWeeks({ startDate: "2026-01-05", endDate: "2026-06-21" })).toBe(24);
    expect(cohortWeeks({ startDate: "Jan 2025", endDate: "Dec 2025" })).toBe(53);
    expect(cohortWeeks({ startDate: "Aug 2025", endDate: "Jan 2026" })).toBe(27);
  });
  it("a part week counts as a week", () => {
    expect(cohortWeeks({ startDate: "2026-01-05", endDate: "2026-01-12" })).toBe(2);
  });
  it("is unknown when a date is missing or the end is before the start", () => {
    expect(cohortWeeks({ startDate: "Jan 2026", endDate: "—" })).toBeNull();
    expect(cohortWeeks({ startDate: "2026-05-01", endDate: "2026-04-01" })).toBeNull();
    expect(cohortWeeks(undefined)).toBeNull();
  });
});

describe("programmeWeek", () => {
  const cohort = { startDate: "2026-01-05", endDate: "2026-04-26" }; // 16 weeks
  it("reports week N of the cohort's length", () => {
    expect(programmeWeek({ start: "2026-01-05", today: "2026-01-27", cohort })).toEqual({ week: 4, total: 16, pct: 25 });
  });
  it("never runs past the last week", () => {
    expect(programmeWeek({ start: "2026-01-05", today: "2026-12-01", cohort })).toEqual({ week: 16, total: 16, pct: 100 });
  });
  it("with no readable cohort dates there is a week but no total and no percentage", () => {
    expect(programmeWeek({ start: "2026-01-05", today: "2026-01-27", cohort: { startDate: "Jan 2026", endDate: "—" } })).toEqual({ week: 4, total: null, pct: null });
  });
});
