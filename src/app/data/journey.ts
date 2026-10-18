// What the entrepreneur dashboard shows about a founder's journey, worked out from the programme store.
// Pure functions: nothing here is typed in by hand, and a figure with no data behind it is null so the
// screen can say "not enough data yet" instead of inventing a number.

import { daysBetween, fmtDue, isIso, todayISO } from "./clock";
import { effectiveMilestones, isOverdue, type Course, type Goal, type Milestones, type Pair, type Resource, type Session, type Task } from "./programmeStore";

export const ROADMAP_STEPS = ["Idea", "Business Registration", "Customer Discovery", "Market Validation", "Prototype", "MVP Testing", "Graduation"] as const;
export type StepState = "done" | "current" | "upcoming";

/** Where a business stage (free text from the application form or the sample data) sits on the roadmap. Null when unrecognised. */
export function stageIndex(stage: string | undefined, milestones?: Pick<Milestones, "mvp">): number | null {
  const s = (stage ?? "").toLowerCase();
  if (!s || s === "—") return null;
  if (/early|traction|growth|scal/.test(s)) return 5;
  if (/mvp/.test(s) && /prototype/.test(s)) return milestones?.mvp ? 5 : 4;
  if (/mvp/.test(s)) return 5;
  if (/prototype/.test(s)) return 4;
  if (/validat/.test(s)) return 3;
  if (/idea/.test(s)) return 0;
  return null;
}

export function roadmap(pair: Pair, goals: Goal[], stage: string | undefined): { steps: { label: string; state: StepState }[]; current: string | null } {
  const m = effectiveMilestones(pair, goals);
  const idx = m.graduated ? ROADMAP_STEPS.length : stageIndex(stage, m);
  const steps = ROADMAP_STEPS.map((label, i): { label: string; state: StepState } => {
    let state: StepState = idx == null ? "upcoming" : i < idx ? "done" : i === idx ? "current" : "upcoming";
    if (i === 1 && m.registered && state !== "current") state = "done"; // registration is a milestone of its own
    return { label, state };
  });
  return { steps, current: steps.find(s => s.state === "current")?.label ?? null };
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

export interface JourneyInput {
  pair: Pair; goals: Goal[]; tasks: Task[]; courses: Course[]; sessions: Session[]; today?: string; stage?: string;
}
/** One session every two weeks is what the progress bar measures against. */
export const SESSION_CADENCE_DAYS = 14;

export function journeyMetrics(i: JourneyInput) {
  const today = i.today ?? todayISO();
  const goals = i.goals.filter(g => g.pairId === i.pair.id && g.status !== "proposed");
  const tasks = i.tasks.filter(t => t.pairId === i.pair.id);
  const courses = i.courses.filter(c => c.pairId === i.pair.id);
  const sessions = i.sessions.filter(s => s.pairId === i.pair.id);
  const m = effectiveMilestones(i.pair, i.goals);
  const milestoneKeys = ["registered", "mvp", "firstRevenue", "grant", "graduated"] as const;
  const achieved = milestoneKeys.filter(k => m[k]).length;

  const modulesDone = courses.reduce((a, c) => a + c.done, 0), modulesTotal = courses.reduce((a, c) => a + c.total, 0);
  const learning = pct(modulesDone, modulesTotal);
  const assignments = pct(tasks.filter(t => t.status === "done").length, tasks.length);
  const goalsPct = avg(goals.map(g => g.pct));
  const milestonesPct = Math.round((achieved / milestoneKeys.length) * 100);
  const sinceMatch = daysBetween(i.pair.matchedAt ?? i.pair.startDate, today);
  const expected = Math.floor(sinceMatch / SESSION_CADENCE_DAYS);
  const sessionsPct = expected > 0 ? Math.min(100, Math.round((sessions.length / expected) * 100)) : null;
  const overall = avg([learning, assignments, goalsPct, milestonesPct, sessionsPct].filter((x): x is number => x != null));

  // Business health: five readings, each explained on screen
  const marketGoals = goals.filter(g => g.category === "Market");
  const done = tasks.filter(t => t.status === "done");
  const validation = avg(marketGoals.map(g => g.pct));
  const documentation = pct(done.filter(t => t.evidence?.length).length, done.length);
  const investment = pct(([m.registered, m.mvp, m.firstRevenue, m.grant] as boolean[]).filter(Boolean).length, 4);
  const readiness = avg([learning, validation, documentation, investment].filter((x): x is number => x != null));

  return {
    overall, learning, assignments, goals: goalsPct, milestones: milestonesPct, sessions: sessionsPct,
    counts: {
      modulesDone, modulesTotal, tasksDone: done.length, tasksTotal: tasks.length, sessionsHeld: sessions.length, sessionsExpected: expected,
      milestonesAchieved: achieved, milestonesTotal: milestoneKeys.length,
      coursesCompleted: courses.filter(c => c.total > 0 && c.done >= c.total).length, coursesEnrolled: courses.length,
      mentoringHours: Math.round((sessions.reduce((a, s) => a + s.durationMin, 0) / 60) * 10) / 10,
    },
    health: { readiness, learning, validation, documentation, investment },
  };
}

/** Course the founder is on now: the first one with modules left, else null (all finished or none assigned). */
export const currentCourse = (courses: Course[]) => courses.find(c => c.total > 0 && c.done < c.total) ?? null;

/** What the dashboard suggests reading at each point on the roadmap. */
export function stageResourceId(idx: number | null): string | null {
  if (idx == null) return null;
  if (idx === 0) return "r9";
  if (idx <= 3) return "r10";
  if (idx <= 5) return "r11";
  return "r5";
}

export type Priority = "High" | "Medium" | "Low";
const RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
/** High when overdue or due within two days; Medium within a week or with no fixed date; Low after that. */
export function priorityFor(due: string, today = todayISO()): Priority {
  if (!isIso(due)) return "Medium";
  const d = daysBetween(today, due);
  return d <= 2 ? "High" : d <= 7 ? "Medium" : "Low";
}

export interface ActionItem { key: string; text: string; due: string; priority: Priority; status: string; go: "sessions" | "tasks" | "goals" }
export function actionItems(i: { tasks: Task[]; goals: Goal[]; courses: Course[]; nextBooking?: { date: string; time: string; mentor: string }; today?: string }): ActionItem[] {
  const today = i.today ?? todayISO(), out: ActionItem[] = [];
  if (i.nextBooking) out.push({ key: "nb", text: `Session with ${i.nextBooking.mentor}`, due: i.nextBooking.date, priority: priorityFor(i.nextBooking.date, today), status: `At ${i.nextBooking.time}`, go: "sessions" });
  for (const t of i.tasks) {
    if (t.status === "done") continue;
    out.push({ key: `t${t.id}`, text: t.title, due: t.due, priority: isOverdue(t) ? "High" : priorityFor(t.due, today), status: isOverdue(t) ? "Overdue" : t.status === "in-progress" ? "In progress" : "Not started", go: "tasks" });
  }
  for (const g of i.goals) if (g.status === "proposed" && g.proposedBy === "mentor") out.push({ key: `g${g.id}`, text: `Review goal: ${g.title}`, due: g.due, priority: "Medium", status: "Needs your answer", go: "goals" });
  const c = currentCourse(i.courses);
  if (c) out.push({ key: `c${c.id}`, text: `Complete module ${c.done + 1} of ${c.title}`, due: "—", priority: "Medium", status: c.done ? "In progress" : "Not started", go: "tasks" });
  return out.map((x, n) => ({ x, n })).sort((a, b) => RANK[a.x.priority] - RANK[b.x.priority] || (isIso(a.x.due) ? a.x.due : "9").localeCompare(isIso(b.x.due) ? b.x.due : "9") || a.n - b.n).map(r => r.x);
}

export interface Recommendation { key: string; text: string; why: string; go: "sessions" | "tasks" | "goals" | "resources" | "funding" | "community"; tone: "warn" | "info" | "good" }
/**
 * The suggestions panel. These are rules over the founder's own records (overdue work, goals at risk, no session booked, learning left,
 * the stage's toolkit), so every line says why it is there. There is no language model behind it.
 */
export function recommendations(i: {
  pair: Pair; mentorFirst: string; stage?: string; tasks: Task[]; goals: Goal[]; courses: Course[]; sessions: Session[]; hasNextBooking: boolean;
  downloadedIds: Set<string>; resources: Resource[]; fundingSoon?: { id: string; title: string; days: number; interested: boolean }[]; today?: string;
}): Recommendation[] {
  const today = i.today ?? todayISO(), out: Recommendation[] = [];
  const tasks = i.tasks.filter(t => t.pairId === i.pair.id), goals = i.goals.filter(g => g.pairId === i.pair.id && g.status !== "proposed");
  const overdue = tasks.filter(isOverdue);
  if (overdue.length) out.push({ key: "overdue", text: `Clear ${overdue.length === 1 ? "your overdue task" : `your ${overdue.length} overdue tasks`} first: ${overdue[0].title}${overdue.length > 1 ? " and others" : ""}.`, why: `Due ${fmtDue(overdue[0].due)}, not done yet.`, go: "tasks", tone: "warn" });
  const last = i.sessions.filter(s => s.pairId === i.pair.id).map(s => s.date).sort().reverse()[0];
  const gap = last ? daysBetween(last, today) : daysBetween(i.pair.matchedAt ?? i.pair.startDate, today);
  if (!i.hasNextBooking && gap >= 10) out.push({ key: "book", text: `Book a session with ${i.mentorFirst} this week.`, why: last ? `Your last session was ${gap} days ago and none is booked.` : "You have not had a session yet and none is booked.", go: "sessions", tone: "warn" });
  const risky = goals.filter(g => g.status === "at-risk").sort((a, b) => a.pct - b.pct)[0];
  if (risky) out.push({ key: "risk", text: `Talk to ${i.mentorFirst} about "${risky.title}".`, why: `It is at risk: ${risky.pct}% done, due ${fmtDue(risky.due)}.`, go: "goals", tone: "warn" });
  const soon = goals.filter(g => g.status === "on-track" && isIso(g.due) && g.pct < 80 && daysBetween(today, g.due) >= 0 && daysBetween(today, g.due) <= 7)[0];
  if (soon) out.push({ key: "soon", text: `Push "${soon.title}" over the line before ${fmtDue(soon.due)}.`, why: `${soon.pct}% done with ${daysBetween(today, soon.due)} days left.`, go: "goals", tone: "info" });
  const c = currentCourse(i.courses.filter(x => x.pairId === i.pair.id));
  if (c) out.push({ key: "learn", text: `Complete module ${c.done + 1} of ${c.title}.`, why: `${c.total - c.done} module${c.total - c.done === 1 ? "" : "s"} left in this course.`, go: "tasks", tone: "info" });
  const noProof = tasks.filter(t => t.status === "done" && !t.evidence?.length && t.from !== "Learning Academy");
  if (noProof.length) out.push({ key: "proof", text: `Attach evidence to ${noProof.length === 1 ? "a completed task" : `${noProof.length} completed tasks`}.`, why: "Your mentor can verify work that has proof attached, and it raises your documentation score.", go: "tasks", tone: "info" });
  const rid = stageResourceId(stageIndex(i.stage, effectiveMilestones(i.pair, i.goals)));
  const res = rid ? i.resources.find(r => r.id === rid) : undefined;
  if (res && !i.downloadedIds.has(res.id)) out.push({ key: "stage", text: `Read the ${res.title}.`, why: `It is the toolkit for your stage (${i.stage}).`, go: "resources", tone: "info" });
  const f = i.fundingSoon?.find(x => !x.interested && x.days >= 0 && x.days <= 14);
  if (f) out.push({ key: "fund", text: `Look at "${f.title}": it closes in ${f.days} day${f.days === 1 ? "" : "s"}.`, why: "Funding that closes soon and that you have not yet shown interest in.", go: "funding", tone: "info" });
  return out.slice(0, 5);
}
