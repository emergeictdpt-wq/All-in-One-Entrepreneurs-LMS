import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Prof. Patrick Likoswe (MNT-018) mentors two people in the sample data: Kondwani Phiri (p2) and Yamikani Mwale (p6).
const LIKOSWE = { role: "mentor", id: "MNT-018", name: "Prof. Patrick Likoswe" };

async function boot(user: { role: string; id: string; name: string } | null, today = "2026-10-10") {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear();
  (await import("../data/clock")).setClock(today);
  if (user) sessionStorage.setItem("emerge.user.v3", JSON.stringify(user));
  return { store: await import("../data/programmeStore"), dir: await import("../data/directory") };
}
afterEach(cleanup);

async function mountDashboard(user = LIKOSWE) {
  const { store, dir } = await boot(user);
  const { MentorDashboard } = await import("./MentorDashboard");
  render(<store.ProgrammeDataProvider><dir.DirectoryProvider entApps={[]} mntApps={[]}><MentorDashboard onSignOut={() => {}} /></dir.DirectoryProvider></store.ProgrammeDataProvider>);
  return userEvent.setup();
}

describe("Mentor dashboard with two mentees", () => {
  it("opens the session log for the mentee whose button was clicked", async () => {
    const u = await mountDashboard();
    await u.click(screen.getAllByText("My Mentees")[0]);
    await u.click(await screen.findByText("Yamikani Mwale"));
    await u.click(screen.getByRole("button", { name: /Log Session Note/ }));
    expect((screen.getByLabelText("Mentee") as HTMLSelectElement).value).toBe("p6");
  });

  it("the Notes button on a Sessions card does the same", async () => {
    const u = await mountDashboard();
    await u.click(screen.getAllByText("Sessions")[0]);
    const notes = screen.getAllByRole("button", { name: "Notes" }); // one per mentee, in mentee order: Kondwani, then Yamikani
    expect(notes).toHaveLength(2);
    await u.click(notes[1]);
    expect((screen.getByLabelText("Mentee") as HTMLSelectElement).value).toBe("p6");
  });

  it("keeps each mentee's messages in their own thread", async () => {
    const u = await mountDashboard();
    await u.click(screen.getByRole("button", { name: /^Messages/ }));
    await u.type(screen.getByPlaceholderText(/^Message Kondwani Phiri/), "only for Kondwani");
    await u.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getAllByText("only for Kondwani")).toHaveLength(2); // the bubble and the thread preview
    await u.click(screen.getByText("Yamikani Mwale"));
    expect(screen.getByPlaceholderText(/^Message Yamikani Mwale/)).toBeTruthy();
    expect(screen.getAllByText("only for Kondwani")).toHaveLength(1); // only the Kondwani thread preview; no bubble in Yamikani's chat
  });

  it("clicking a mentee card on the overview opens that mentee", async () => {
    const u = await mountDashboard();
    await u.click(screen.getByText("Yamikani Mwale"));
    await u.click(await screen.findByRole("button", { name: /Log Session Note/ }));
    expect((screen.getByLabelText("Mentee") as HTMLSelectElement).value).toBe("p6");
  });

  it("greets by first name, skipping titles, and shows no hardcoded profile text", async () => {
    await mountDashboard();
    expect(screen.getByText(/Welcome back, Patrick\./)).toBeTruthy();
    expect(screen.queryByText(/Aug 4, 11:00/)).toBeNull();
    expect(screen.queryByText(/AgriTech & Finance/)).toBeNull();
  });

  it("profile shows this mentor's own details instead of fixed preferences", async () => {
    const u = await mountDashboard();
    await u.click(screen.getAllByText("My Profile")[0]);
    expect(screen.queryByText("Idea → MVP")).toBeNull();
    expect(screen.queryByText("8 hrs")).toBeNull();
    expect(screen.queryByText(/Cohort 5 mentoring programme/)).toBeNull();
    expect(screen.getAllByText("Not set").length).toBeGreaterThan(0); // sample mentors have no stored preferences
  });
});

describe("first names", () => {
  it("skips titles", async () => {
    const { store } = await boot(null);
    expect(store.firstName("Limbani Gondwe")).toBe("Limbani");
    expect(store.firstName("Dr. Tiwonge Banda")).toBe("Tiwonge");
    expect(store.firstName("Prof. Patrick Likoswe")).toBe("Patrick");
    expect(store.firstName("Mrs. Faith Nyirenda")).toBe("Faith");
    expect(store.firstName("Madonna")).toBe("Madonna");
    expect(store.firstName("Dr.")).toBe("Dr.");
  });
});

describe("store keys mentors by ID and guards ownership", () => {
  const wrap = (store: any) => ({ children }: { children: ReactNode }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider>;

  it("two mentors with the same name are not merged", async () => {
    const { store } = await boot(null);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    act(() => {
      hook.result.current.addPair({ menteeId: "APP-028", mentorId: "MNT-X1", mentee: "Grace Kamwendo", mentor: "Same Name", venture: "A", sector: "S", expertise: "E", matchScore: 80 });
      hook.result.current.addPair({ menteeId: "APP-029", mentorId: "MNT-X2", mentee: "Madalitso Chiumia", mentor: "Same Name", venture: "B", sector: "S", expertise: "E", matchScore: 80 });
    });
    const P = hook.result.current;
    expect(P.mentorLoad({ id: "MNT-X1", name: "Same Name" })).toBe(1);
    expect(P.mentorLoad({ id: "MNT-X2", name: "Same Name" })).toBe(1);
    const x1 = P.pairs.find(p => p.mentorId === "MNT-X1")!;
    act(() => { P.logSession({ pairId: x1.id, date: "2026-10-10", durationMin: 30, mode: "Virtual", topics: [], notes: "" }); });
    expect(store.mentorImpact(hook.result.current, { id: "MNT-X1", name: "Same Name" }))
      .toBeGreaterThan(store.mentorImpact(hook.result.current, { id: "MNT-X2", name: "Same Name" }));
  });

  it("a mentor cannot log, assign, note or propose on another mentor's pair", async () => {
    const { store } = await boot(LIKOSWE);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const P = () => hook.result.current;
    const sessions = P().sessions.length, tasks = P().tasks.length, goals = P().goals.length, notes = P().privateNotes.length;
    let r: any;
    act(() => { r = P().logSession({ pairId: "p1", date: "2026-10-10", durationMin: 30, mode: "Virtual", topics: [], notes: "" }); });
    expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/not yours/) });
    act(() => { r = P().assignTask("p1", "Do it", "Next session"); });
    expect(r.ok).toBe(false);
    act(() => { r = P().addPrivateNote("p1", "hi"); });
    expect(r.ok).toBe(false);
    act(() => { P().proposeGoal({ pairId: "p1", title: "x", category: "Custom", due: "TBD", by: "mentor" }); });
    expect([P().sessions.length, P().tasks.length, P().goals.length, P().privateNotes.length]).toEqual([sessions, tasks, goals, notes]);
    // ...but their own pairs work
    act(() => { r = P().assignTask("p6", "Do it", "Next session"); });
    expect(r.ok).toBe(true);
    act(() => { r = P().logSession({ pairId: "p6", date: "2026-10-10", durationMin: 30, mode: "Virtual", topics: ["x"], notes: "" }); });
    expect(r.ok).toBe(true);
  });
});

describe("pairing is keyed by ID and respects mentor capacity", () => {
  const wrap = (store: any) => ({ children }: { children: ReactNode }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider>;
  const base = { venture: "V", sector: "S", expertise: "E", matchScore: 80 };

  it("two mentees with the same name stay separate people", async () => {
    const { store } = await boot(null);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    act(() => { hook.result.current.addPair({ ...base, menteeId: "APP-A", mentorId: "MNT-021", mentee: "Twin Name", mentor: "Mentor One" }); });
    act(() => { hook.result.current.addPair({ ...base, menteeId: "APP-B", mentorId: "MNT-022", mentee: "Twin Name", mentor: "Mentor Two" }); });
    const twins = hook.result.current.pairs.filter(p => p.mentee === "Twin Name");
    expect(twins).toHaveLength(2);                       // the second is a new pair, not a re-match of the first
    expect(hook.result.current.pastPairs.some(p => p.mentee === "Twin Name")).toBe(false);
    // re-matching the same person (same ID) to a new mentor does archive the old pair
    act(() => { hook.result.current.addPair({ ...base, menteeId: "APP-A", mentorId: "MNT-023", mentee: "Twin Name", mentor: "Mentor Three" }); });
    expect(hook.result.current.pastPairs.filter(p => p.menteeId === "APP-A")).toHaveLength(1);
    expect(hook.result.current.pairs.find(p => p.menteeId === "APP-B")?.mentorId).toBe("MNT-022");
  });

  it("refuses a mentee once the mentor is at their limit, and a re-match to the same mentor is a no-op", async () => {
    const { store } = await boot(null);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const add = (n: number, capacity?: number) => { let r: any; act(() => { r = hook.result.current.addPair({ ...base, menteeId: `APP-${n}`, mentorId: "MNT-030", mentee: `Mentee ${n}`, mentor: "Busy Mentor", capacity }); }); return r; };
    expect(add(1, 2).ok).toBe(true);
    expect(add(2, 2).ok).toBe(true);
    const r = add(3, 2);
    expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/limit 2/) });
    expect(hook.result.current.pairs.some(p => p.menteeId === "APP-3")).toBe(false);
    expect(add(1, 2).ok).toBe(true);                     // already paired with this mentor: nothing changes
    expect(hook.result.current.mentorLoad({ id: "MNT-030", name: "Busy Mentor" })).toBe(2);
    // the default limit applies when none is given
    for (let n = 10; n < 12; n++) add(n);
    expect(add(12).ok).toBe(false);
  });

  it("only the programme team can create pairings", async () => {
    const { store } = await boot(LIKOSWE);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    let r: any; act(() => { r = hook.result.current.addPair({ ...base, menteeId: "APP-9", mentorId: "MNT-018", mentee: "Someone", mentor: "Prof. Patrick Likoswe" }); });
    expect(r.ok).toBe(false);
  });
});

describe("mentee and shared actions are guarded", () => {
  const wrap = (store: any) => ({ children }: { children: ReactNode }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider>;

  it("only the mentee of a session can rate it, once, from 1 to 5", async () => {
    const { store } = await boot(null);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const P = () => hook.result.current;
    // sample sessions are all rated already, so log a fresh one for pair p1, then sign in as its mentee
    act(() => { P().logSession({ pairId: "p1", date: "2026-10-10", durationMin: 30, mode: "Virtual", topics: ["x"], notes: "" }); });
    act(() => { P().signIn({ role: "mentee", id: "APP-001", name: "Chisomo Banda" }); });
    const mine = P().sessions.find(s => s.pairId === "p1" && s.rating == null)!;
    const other = P().sessions.find(s => s.pairId === "p2")!;
    let r: any;
    act(() => { r = P().rateSession(other.id, 5); }); expect(r.ok).toBe(false);
    act(() => { r = P().rateSession(mine.id, 9); }); expect(r.ok).toBe(false);
    act(() => { r = P().rateSession(mine.id, 4); }); expect(r.ok).toBe(true);
    act(() => { r = P().rateSession(mine.id, 1); }); expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/already/) });
    expect(P().sessions.find(s => s.id === mine.id)!.rating).toBe(4);
  });

  it("people cannot touch other pairs' tasks, goals, bookings, messages or re-matches", async () => {
    const { store } = await boot({ role: "mentee", id: "APP-001", name: "Chisomo Banda" });
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const P = () => hook.result.current;
    const task = P().tasks.find(t => t.pairId === "p2")!;
    act(() => { P().setTaskStatus(task.id, "done"); });
    expect(P().tasks.find(t => t.id === task.id)!.status).toBe(task.status);
    const msgs = P().messages.length;
    act(() => { P().sendMessage("p2", "mentee", "hello"); });
    expect(P().messages.length).toBe(msgs);
    act(() => { P().sendMessage("p1", "mentor", "pretending to be the mentor"); });   // wrong side of own pair
    expect(P().messages.length).toBe(msgs);
    act(() => { P().sendMessage("p1", "mentee", "hello"); });
    expect(P().messages.length).toBe(msgs + 1);
    const open = P().rematches.length;
    act(() => { P().requestRematch("p2", "nope"); });
    act(() => { P().requestRematch("p1", "nope", "admin"); });                         // a mentee is not the programme team
    expect(P().rematches.length).toBe(open);
    const b = P().bookings.find(x => x.pairId === "p2" && x.status === "confirmed");
    if (b) { act(() => { P().cancelBooking(b.id); }); expect(P().bookings.find(x => x.id === b.id)!.status).toBe("confirmed"); }
  });

  it("a goal proposed by the mentor can only be approved by the mentee, and a sign-off only by the mentor", async () => {
    const { store } = await boot(LIKOSWE);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const P = () => hook.result.current;
    act(() => { P().proposeGoal({ pairId: "p6", title: "Sign first customer", category: "Custom", due: "TBD", by: "mentor" }); });
    const g = P().goals.find(x => x.title === "Sign first customer")!;
    act(() => { P().approveGoal(g.id); });                                              // the proposer cannot approve their own goal
    expect(P().goals.find(x => x.id === g.id)!.status).toBe("proposed");
    const own = P().goals.find(x => x.pairId === "p6" && x.status === "on-track");
    const foreign = P().goals.find(x => x.pairId === "p1" && x.status !== "complete")!;
    act(() => { P().signOffGoal(foreign.id); });
    expect(P().goals.find(x => x.id === foreign.id)!.status).toBe(foreign.status);
    if (own) { act(() => { P().signOffGoal(own.id); }); expect(P().goals.find(x => x.id === own.id)!.status).toBe("complete"); }
  });
});

describe("mentor capacity set by the programme team", () => {
  const wrap = (store: any) => ({ children }: { children: ReactNode }) => <store.ProgrammeDataProvider>{children}</store.ProgrammeDataProvider>;
  const base = { venture: "V", sector: "S", expertise: "E", matchScore: 80 };

  it("a saved limit overrides the application's limit, survives a reload, and cannot go below current mentees", async () => {
    const { store } = await boot(null);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    const P = () => hook.result.current;
    const add = (n: number, capacity?: number) => { let r: any; act(() => { r = P().addPair({ ...base, menteeId: `APP-${n}`, mentorId: "MNT-040", mentee: `M${n}`, mentor: "Cap Mentor", capacity }); }); return r; };
    expect(P().capacityOf("MNT-040")).toBe(4);
    expect(P().capacityOf("MNT-040", 6)).toBe(6);
    expect(add(1, 1).ok).toBe(true);
    expect(add(2, 1).ok).toBe(false);                    // application says 1
    let r: any; act(() => { r = P().setMentorCapacity("MNT-040", 3, "Cap Mentor"); }); expect(r.ok).toBe(true);
    expect(add(2, 1).ok).toBe(true);                     // the team's setting wins over the application
    expect(add(3, 1).ok).toBe(true);
    expect(add(4, 1).ok).toBe(false);
    act(() => { r = P().setMentorCapacity("MNT-040", 2, "Cap Mentor"); }); expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/already has 3/) });
    act(() => { r = P().setMentorCapacity("MNT-040", 0, "Cap Mentor"); }); expect(r.ok).toBe(false);
    act(() => { r = P().setMentorCapacity("MNT-040", 2.5, "Cap Mentor"); }); expect(r.ok).toBe(false);
    expect(P().capacityOf("MNT-040", 1)).toBe(3);
    expect(JSON.parse(localStorage.getItem("emerge.programme.v4")!).mentorCapacity).toEqual({ "MNT-040": 3 });
  });

  it("a mentor or mentee cannot change capacity", async () => {
    const { store } = await boot(LIKOSWE);
    const hook = renderHook(() => store.useProgramme(), { wrapper: wrap(store) });
    let r: any; act(() => { r = hook.result.current.setMentorCapacity("MNT-018", 20, "Prof. Patrick Likoswe"); });
    expect(r.ok).toBe(false);
    expect(hook.result.current.capacityOf("MNT-018")).toBe(4);
  });
});
