import { beforeEach, describe, expect, it } from "vitest";
import { setClock } from "./clock";
import { actionItems, currentCourse, journeyMetrics, priorityFor, recommendations, roadmap, stageIndex, stageResourceId } from "./journey";
import { RESOURCES, type Course, type Goal, type Pair, type Session, type Task } from "./programmeStore";

const TODAY = "2026-10-10";
beforeEach(() => setClock(TODAY));

const pair = (o: Partial<Pair> = {}): Pair => ({ id: "p", mentee: "A", mentor: "Dr. B", venture: "V", sector: "S", stage: "Validation", expertise: "", matchScore: 80, cohortId: 1, startDate: "2026-07-01", milestones: { registered: false, mvp: false, firstRevenue: false, grant: false, graduated: false }, ...o });
const task = (o: Partial<Task> = {}): Task => ({ id: "t", pairId: "p", title: "T", due: "2026-10-20", status: "pending", from: "Mentor", ...o });
const goal = (o: Partial<Goal> = {}): Goal => ({ id: "g", pairId: "p", title: "G", category: "Market", pct: 50, due: "2026-10-30", status: "on-track", ...o });
const course = (o: Partial<Course> = {}): Course => ({ id: "c", pairId: "p", title: "C", done: 2, total: 4, ...o });
const sess = (date: string, min = 60): Session => ({ id: date, pairId: "p", date, durationMin: min, mode: "Virtual", topics: [], tasks: [], notes: "", rating: null });

describe("roadmap", () => {
  it("maps the stage names used in forms and sample data", () => {
    expect(stageIndex("Idea Stage")).toBe(0);
    expect(stageIndex("Validation Stage")).toBe(3);
    expect(stageIndex("Prototype / MVP Stage")).toBe(4);
    expect(stageIndex("Prototype / MVP Stage", { mvp: true })).toBe(5);
    expect(stageIndex("Early Startup Stage")).toBe(5);
    expect(stageIndex("Something else")).toBeNull();
    expect(stageIndex("—")).toBeNull();
  });
  it("marks earlier steps done, the stage current and the rest upcoming", () => {
    const r = roadmap(pair(), [], "Validation");
    expect(r.steps.map(s => s.state)).toEqual(["done", "done", "done", "current", "upcoming", "upcoming", "upcoming"]);
    expect(r.current).toBe("Market Validation");
  });
  it("an unknown stage shows nothing as current instead of guessing", () => {
    const r = roadmap(pair(), [], "—");
    expect(r.current).toBeNull();
    expect(r.steps.every(s => s.state === "upcoming")).toBe(true);
  });
  it("registration counts as done when the milestone is reached, even on the Idea stage", () => {
    const r = roadmap(pair({ milestones: { registered: true, mvp: false, firstRevenue: false, grant: false, graduated: false } }), [], "Idea");
    expect(r.steps[0].state).toBe("current");
    expect(r.steps[1].state).toBe("done");
  });
  it("graduating completes every step", () => {
    const r = roadmap(pair({ milestones: { registered: true, mvp: true, firstRevenue: true, grant: true, graduated: true } }), [], "MVP");
    expect(r.steps.every(s => s.state === "done")).toBe(true);
  });
});

describe("journeyMetrics", () => {
  it("measures learning, assignments, goals and milestones from the records", () => {
    const m = journeyMetrics({ pair: pair(), goals: [goal({ pct: 40 }), goal({ id: "g2", pct: 60, category: "Legal" })], tasks: [task({ status: "done" }), task({ id: "t2" })], courses: [course({ done: 2, total: 4 }), course({ id: "c2", done: 4, total: 4 })], sessions: [sess("2026-09-20")] });
    expect(m.learning).toBe(75); // 6 of 8 modules
    expect(m.assignments).toBe(50);
    expect(m.goals).toBe(50);
    expect(m.milestones).toBe(0);
    expect(m.counts.coursesCompleted).toBe(1);
    expect(m.counts.mentoringHours).toBe(1);
  });
  it("gives null, not zero, where there is no data", () => {
    const m = journeyMetrics({ pair: pair(), goals: [], tasks: [], courses: [], sessions: [] });
    expect(m.learning).toBeNull(); expect(m.assignments).toBeNull(); expect(m.goals).toBeNull();
    expect(m.health.validation).toBeNull(); expect(m.health.documentation).toBeNull();
    expect(m.overall).toBe(0); // only milestones (0 of 5) and the session cadence have data
  });
  it("a brand-new pairing is not behind on sessions yet", () => {
    expect(journeyMetrics({ pair: pair({ startDate: "2026-10-05" }), goals: [], tasks: [], courses: [], sessions: [] }).sessions).toBeNull();
  });
  it("documentation score is the share of finished tasks that have evidence", () => {
    const ev = [{ id: "e", name: "a.pdf", size: 1, at: TODAY }];
    const m = journeyMetrics({ pair: pair(), goals: [], tasks: [task({ status: "done", evidence: ev }), task({ id: "t2", status: "done" }), task({ id: "t3" })], courses: [], sessions: [] });
    expect(m.health.documentation).toBe(50);
  });
  it("validation comes from Market goals only; investment from the four funding milestones", () => {
    const m = journeyMetrics({ pair: pair({ milestones: { registered: true, mvp: true, firstRevenue: false, grant: false, graduated: false } }), goals: [goal({ pct: 80 }), goal({ id: "g2", category: "Revenue", pct: 10 })], tasks: [], courses: [], sessions: [] });
    expect(m.health.validation).toBe(80);
    expect(m.health.investment).toBe(50);
  });
  it("ignores another pair's records", () => {
    const m = journeyMetrics({ pair: pair(), goals: [goal({ pairId: "other", pct: 99 })], tasks: [task({ pairId: "other", status: "done" })], courses: [course({ pairId: "other" })], sessions: [] });
    expect(m.goals).toBeNull(); expect(m.assignments).toBeNull(); expect(m.learning).toBeNull();
  });
});

describe("action items", () => {
  it("each has a priority, a due date and a status, most urgent first", () => {
    const items = actionItems({ tasks: [task({ id: "late", title: "Late", due: "2026-10-01" }), task({ id: "far", title: "Far", due: "2026-12-01" }), task({ id: "free", title: "Free", due: "Next session" }), task({ id: "d", status: "done" })], goals: [], courses: [], nextBooking: { date: "2026-10-11", time: "10:00", mentor: "Dr. B" } });
    expect(items.map(i => i.text)).toEqual(["Late", "Session with Dr. B", "Free", "Far"]);
    expect(items[0]).toMatchObject({ priority: "High", status: "Overdue" });
    expect(items[3].priority).toBe("Low");
  });
  it("priority bands", () => {
    expect(priorityFor("2026-10-12")).toBe("High");
    expect(priorityFor("2026-10-17")).toBe("Medium");
    expect(priorityFor("2026-10-18")).toBe("Low");
    expect(priorityFor("Next session")).toBe("Medium");
  });
});

describe("recommendations", () => {
  const base = { pair: pair(), mentorFirst: "Tiwonge", stage: "Validation", tasks: [] as Task[], goals: [] as Goal[], courses: [] as Course[], sessions: [] as Session[], hasNextBooking: true, downloadedIds: new Set<string>(), resources: RESOURCES };
  it("every suggestion says why it is there", () => {
    const r = recommendations({ ...base, tasks: [task({ due: "2026-10-01" })], goals: [goal({ status: "at-risk", pct: 20 })], courses: [course()], sessions: [sess("2026-10-08")] });
    expect(r.length).toBeGreaterThan(2);
    r.forEach(x => { expect(x.text).toBeTruthy(); expect(x.why).toBeTruthy(); });
    expect(r[0].key).toBe("overdue");
  });
  it("suggests booking only when none is booked and it has been a while", () => {
    expect(recommendations({ ...base, hasNextBooking: false, sessions: [sess("2026-09-01")] }).some(x => x.key === "book")).toBe(true);
    expect(recommendations({ ...base, hasNextBooking: false, sessions: [sess("2026-10-08")] }).some(x => x.key === "book")).toBe(false);
    expect(recommendations({ ...base, hasNextBooking: true, sessions: [sess("2026-09-01")] }).some(x => x.key === "book")).toBe(false);
  });
  it("points a validation-stage founder at the Customer Discovery Toolkit until they have it", () => {
    expect(stageResourceId(3)).toBe("r10");
    expect(recommendations(base).find(x => x.key === "stage")?.text).toContain("Customer Discovery Toolkit");
    expect(recommendations({ ...base, downloadedIds: new Set(["r10"]) }).some(x => x.key === "stage")).toBe(false);
  });
  it("asks for evidence on finished tasks without any, but not for learning-academy tasks", () => {
    expect(recommendations({ ...base, tasks: [task({ status: "done" })] }).some(x => x.key === "proof")).toBe(true);
    expect(recommendations({ ...base, tasks: [task({ status: "done", from: "Learning Academy" })] }).some(x => x.key === "proof")).toBe(false);
  });
  it("never returns more than five", () => {
    const r = recommendations({ ...base, hasNextBooking: false, tasks: [task({ due: "2026-10-01" }), task({ id: "x", status: "done" })], goals: [goal({ status: "at-risk" }), goal({ id: "s", pct: 10, due: "2026-10-12" })], courses: [course()], sessions: [sess("2026-08-01")], fundingSoon: [{ id: "f", title: "F", days: 3, interested: false }] });
    expect(r.length).toBe(5);
  });
});

describe("current course", () => {
  it("is the first unfinished one", () => {
    expect(currentCourse([course({ id: "a", done: 4, total: 4 }), course({ id: "b" })])?.id).toBe("b");
    expect(currentCourse([course({ done: 4, total: 4 })])).toBeNull();
  });
});
