import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The store reads the clock at import time (sample data is anchored to "today"), so pin it, then import fresh.
async function boot(today = "2026-10-10") {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear();
  const clock = await import("./clock"); clock.setClock(today);
  const store = await import("./programmeStore");
  const wrapper = ({ children }: { children: ReactNode }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider>;
  const hook = renderHook(() => store.useProgramme(), { wrapper });
  return { clock, store, hook, P: () => hook.result.current };
}
beforeEach(() => { vi.resetModules(); });

describe("the clock", () => {
  it("anchors sample data to the real date, then lets it age", async () => {
    const { clock, hook, P } = await boot("2026-10-10");
    // b1 was "3 days after the sample today": still upcoming, 3 days away
    const b1 = P().bookings.find(b => b.id === "b1")!;
    expect(b1.date).toBe("2026-10-13");
    expect(P().nextBooking("p1")?.id).toBe("b1");
    const healthNow = P().stats["p1"].health;
    // Two months later nothing was logged: the slot has passed, tasks are overdue, the pair is no longer healthy
    act(() => clock.setClock("2026-12-15"));
    hook.rerender();
    expect(P().nextBooking("p1")).toBeUndefined();
    expect(P().tasks.some(t => t.pairId === "p1" && t.due < "2026-12-15" && t.status !== "done")).toBe(true);
    expect(P().tasks.filter(t => t.pairId === "p1").some(t => /^\d{4}-/.test(t.due))).toBe(true);
    expect(["Stalled", "At Risk"]).toContain(P().stats["p1"].health);
    expect(healthNow).toBeDefined();
  });

  it("uses real dates for the weekly programme position and monthly report", async () => {
    const { store, P } = await boot("2027-03-02");
    const r = store.buildReport(P(), Object.keys(store.PERIODS)[0] as any);
    expect(r.monthly).toHaveLength(12);
    expect(r.monthly[11]).toMatchObject({ month: "Mar", year: 2027, current: true });
    expect(r.monthly[0]).toMatchObject({ month: "Apr", year: 2026 });
  });
});

describe("sessions and bookings", () => {
  it("logging a session completes the booking it came from, on that booking's date", async () => {
    const { clock, hook, P } = await boot("2026-10-10");
    act(() => clock.setClock("2026-10-14")); hook.rerender(); // b1 (13 Oct 10:00-11:00) is now in the past
    const b1 = () => P().bookings.find(b => b.id === "b1")!;
    expect(P().nextBooking("p1")).toBeUndefined();
    expect(P().bookings.filter(b => b.pairId === "p1" && b.status === "confirmed")).toHaveLength(1); // still "confirmed" but unlogged
    let res: any;
    act(() => { res = P().logSession({ pairId: "p1", bookingId: "b1", durationMin: 60, mode: "Virtual", topics: ["Pricing"], notes: "" }); });
    expect(res.ok).toBe(true);
    expect(b1().status).toBe("completed");
    const s = P().sessions.find(x => x.bookingId === "b1")!;
    expect(s.date).toBe("2026-10-13");          // the day it happened, not "today" and not a fixed date
    expect(b1().sessionId).toBe(s.id);
    // it can't be both logged and upcoming, and can't be logged twice
    expect(P().nextBooking("p1")).toBeUndefined();
    act(() => { res = P().logSession({ pairId: "p1", bookingId: "b1", durationMin: 60, mode: "Virtual", topics: [], notes: "" }); });
    expect(res).toMatchObject({ ok: false });
  });

  it("an ad-hoc log takes the date given and closes a same-day booking automatically", async () => {
    const { clock, hook, P } = await boot("2026-10-10");
    act(() => clock.setClock("2026-10-20")); hook.rerender();
    let res: any;
    act(() => { res = P().logSession({ pairId: "p1", date: "2026-10-13", durationMin: 30, mode: "In-person", topics: [], notes: "" }); });
    expect(res.ok).toBe(true);
    expect(P().bookings.find(b => b.id === "b1")!.status).toBe("completed");
    act(() => { res = P().logSession({ pairId: "p2", durationMin: 30, mode: "Virtual", topics: [], notes: "" }); });
    expect(P().sessions[0].date).toBe("2026-10-20"); // default is the real today
  });

  it("refuses future dates, dates before the pairing, and past meeting proposals", async () => {
    const { P } = await boot("2026-10-10");
    let r: any;
    act(() => { r = P().logSession({ pairId: "p1", date: "2026-10-11", durationMin: 30, mode: "Virtual", topics: [], notes: "" }); });
    expect(r).toMatchObject({ ok: false }); expect(r.reason).toMatch(/taken place/);
    act(() => { r = P().logSession({ pairId: "p1", date: "2020-01-01", durationMin: 30, mode: "Virtual", topics: [], notes: "" }); });
    expect(r.reason).toMatch(/before/);
    act(() => { r = P().proposeBooking({ pairId: "p1", date: "2026-10-09", time: "10:00", durationMin: 30, mode: "Virtual", by: "mentor" }); });
    expect(r).toMatchObject({ ok: false });
    act(() => { r = P().proposeBooking({ pairId: "p1", date: "2026-10-30", time: "10:00", durationMin: 30, mode: "Virtual", by: "mentor" }); });
    expect(r.ok).toBe(true);
  });
});

describe("goal progress needs the mentor", () => {
  it("only confirmed updates move the percentage; completion is the mentor's sign-off", async () => {
    const { P } = await boot();
    const g = P().goals.find(x => x.pairId === "p1" && x.status === "on-track")!;
    const start = g.pct; const pair = () => P().stats["p1"].goalPct;
    let r: any;
    act(() => { r = P().submitProgress(g.id, start + 10, "   "); }); expect(r.ok).toBe(false);            // evidence required
    act(() => { r = P().submitProgress(g.id, 100, "Done!"); }); expect(r.ok).toBe(false);                  // no self-completion
    const before = pair();
    act(() => { r = P().submitProgress(g.id, start + 10, "Interviewed 12 more farmers"); }); expect(r.ok).toBe(true);
    expect(P().goals.find(x => x.id === g.id)!.pct).toBe(start);                                            // not counted yet
    expect(pair()).toBe(before);
    act(() => { r = P().reviewProgress(g.id, "adjust", { pct: start + 5, comment: "Only 7 had notes" }); });
    const after = P().goals.find(x => x.id === g.id)!;
    expect(after).toMatchObject({ pct: start + 5, pending: undefined });
    expect(after.log![0]).toMatchObject({ from: start, to: start + 5, adjusted: true });
    act(() => { P().submitProgress(g.id, start + 20, "Pilot launched"); });
    expect(P().goals.find(x => x.id === g.id)!.pending?.pct).toBe(start + 20);
    act(() => { P().reviewProgress(g.id, "decline"); });
    expect(P().goals.find(x => x.id === g.id)).toMatchObject({ pct: start + 5, pending: undefined });
    act(() => { r = P().reviewProgress(g.id, "confirm"); }); expect(r.ok).toBe(false);                      // nothing pending
    act(() => P().signOffGoal(g.id));
    expect(P().goals.find(x => x.id === g.id)).toMatchObject({ pct: 100, status: "complete" });
  });
});

describe("projects", () => {
  it("sample pairs, waiting mentees and cohorts belong to a project", async () => {
    const { P } = await boot();
    expect(P().pairs.every(p => !!p.programId && !!p.cohortId)).toBe(true);
    expect(P().waiting.every(w => !!w.programId)).toBe(true);
    for (const p of P().pairs) expect(P().cohorts.find(c => c.id === p.cohortId)?.programId).toBe(p.programId);
  });

  it("a new pair joins the cohort of its own project; a project with none gets one", async () => {
    const { hook, P } = await boot();
    act(() => P().registerProjects([{ id: "emerge4biz-core", name: "Zantchito" }, { id: "proj-new", name: "Youth Agri Lab" }]));
    const pair = (id: string, programId: string) => ({ menteeId: id, mentorId: id + "m", programId, mentee: "M" + id, mentor: "T" + id, venture: "V", sector: "Agri", expertise: "Agri", matchScore: 80 });
    act(() => P().addPair(pair("X1", "emerge4biz-core")));
    act(() => P().addPair(pair("X2", "proj-new")));
    hook.rerender();
    const c1 = P().cohorts.find(c => c.id === P().pairs.find(p => p.menteeId === "X1")!.cohortId)!;
    const c2 = P().cohorts.find(c => c.id === P().pairs.find(p => p.menteeId === "X2")!.cohortId)!;
    expect(c1.programId).toBe("emerge4biz-core");
    expect(c2).toMatchObject({ programId: "proj-new", status: "Active" });
    expect(c2.name).toContain("Youth Agri Lab");
    expect(P().projectName("proj-new")).toBe("Youth Agri Lab");
  });
});

describe("data saved by the old build", () => {
  it("is moved to today instead of staying frozen in July 2025", async () => {
    vi.resetModules(); localStorage.clear();
    const clock = await import("./clock"); clock.setClock("2026-10-10");
    localStorage.setItem("emerge.programme.v3", JSON.stringify({
      pairs: [{ id: "px", mentee: "A", mentor: "B", venture: "v", sector: "s", stage: "Idea", expertise: "e", matchScore: 70, cohortId: 1, startDate: "2025-07-20", matchedAt: "2025-07-20" }],
      sessions: [{ id: "s1", pairId: "px", date: "2025-07-28", durationMin: 30, mode: "Virtual", topics: [], tasks: [], notes: "", rating: null }],
      tasks: [{ id: "t1", pairId: "px", title: "x", due: "Jul 31", status: "pending", from: "Mentor" }, { id: "t2", pairId: "px", title: "y", due: "Next session", status: "pending", from: "Mentor" }],
    }));
    const store = await import("./programmeStore");
    const { result } = renderHook(() => store.useProgramme(), { wrapper: ({ children }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider> });
    const P = result.current;
    expect(P.sessions.find(s => s.id === "s1")!.date).toBe("2026-10-10");  // logged "today" under the old frozen clock
    expect(P.pairs.find(p => p.id === "px")!.startDate).toBe("2026-10-02");
    expect(P.tasks.find(t => t.id === "t1")!.due).toBe("2026-10-13");
    expect(P.tasks.find(t => t.id === "t2")!.due).toBe("Next session");
    expect(P.cohorts.some(c => c.id === 4)).toBe(true);
  });
});

describe("signing in on the store", () => {
  it("remembers who, by id, for this tab only", async () => {
    const { P } = await boot();
    act(() => P().signIn({ role: "mentee", id: "APP-025", name: "Kondwani Phiri" }));
    expect(P().currentUser).toEqual({ role: "mentee", id: "APP-025", name: "Kondwani Phiri" });
    expect(JSON.parse(sessionStorage.getItem("emerge.user.v3")!).id).toBe("APP-025");
    act(() => P().signIn(null));
    expect(P().currentUser).toBeNull();
  });
});
