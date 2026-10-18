// Shared programme store (frontend sample data).
// Mentor dashboard, mentee dashboard and the four Programme Admin pages all read/write here,
// so a change made in one place (log a session, rate it, sign off a goal, connect Zoom)
// shows up everywhere. Swap the seed + actions for API calls when the backend exists.
import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { addDays, addMonths, daysBetween, fmtDate, fmtDateY, isIso, monthKey, monthShort, nowDate, nowHHMM, todayISO } from "./clock";
import { DECISIONS_KEY } from "./applicationTracker";
import { SAMPLE_CORE, SAMPLE_SHE } from "./directory";
import { deleteEvidenceFile, evidenceProblem, saveEvidenceFile } from "./evidenceFiles";

// The platform runs on the real clock (see clock.ts). Re-exported so dashboards have one import.
export { daysBetween, fmtDate, fmtDateY, fmtDue, todayISO } from "./clock";
let TS = 0; // shared id counter (persisted so ids stay unique across reloads)
const DAY = 86400000;

// Sample data is written as if "today" were 28 Jul 2025, then shifted so that on first load it is
// anchored to the real today. After that it ages normally (overdue tasks, stalled pairs, countdowns).
const SEED_ANCHOR = "2025-07-28";
const SHIFT = () => daysBetween(SEED_ANCHOR, todayISO());
const sh = (iso: string) => addDays(iso, SHIFT());
const MONTH_NUM: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
/** "Jul 31" (2025 sample label) → shifted ISO date */
const dd = (label: string) => { const m = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(label)!; return sh(`2025-${MONTH_NUM[m[1]]}-${m[2].padStart(2, "0")}`); };
/** "Aug 15" → "15 Aug 2026" style label for the SMART "Time-bound" line */
const tt = (label: string) => fmtDateY(dd(label));
/** "Jul 20" message label → shifted short date */
const ml = (label: string) => fmtDate(dd(label));

export type Role = "mentor" | "mentee";
/** Who is signed in on this tab. `id` is the application id (APP-… / MNT-…), the reliable key; names can repeat. */
export interface CurrentUser { role: Role; id: string; name: string }
export interface Project { id: string; name: string; status?: string }
export type Health = "Healthy" | "At Risk" | "Stalled" | "New";
export interface Milestones { registered: boolean; mvp: boolean; firstRevenue: boolean; grant: boolean; graduated: boolean }
export interface Pair {
  id: string; mentee: string; mentor: string; venture: string; sector: string; stage: string;
  expertise: string; matchScore: number; cohortId: number; startDate: string; milestones: Milestones;
  /** set when this pair replaced an earlier one after a re-match */
  predecessorId?: string;
  /** when THIS mentor–mentee relationship began (startDate is the programme start). Health is measured from here. */
  matchedAt?: string;
  /** Application ids from the admin pipeline — pairs are linked by id, names are for display only */
  menteeId?: string; mentorId?: string;
  /** admin project (programme) this pair belongs to */
  programId?: string;
  /** Introductory call date (ISO). Undefined = not scheduled yet. */
  introDate?: string;
  /** only on archived pairs (see pastPairs) */
  endedAt?: string; endReason?: string; successorId?: string;
}
/** A mentee who is enrolled and waiting for a mentor (no Pair exists yet). */
export interface Waiting { id: string; menteeId?: string; mentee: string; venture: string; sector: string; stage: string; programId?: string }
export interface Session {
  id: string; pairId: string; date: string; durationMin: number; mode: "Virtual" | "In-person";
  topics: string[]; tasks: string[]; notes: string; rating: number | null;
  /** the scheduled booking this session was logged against (it is then marked completed) */
  bookingId?: string;
}
export interface Goal {
  id: string; pairId: string; title: string; category: string; pct: number; due: string;
  status: "on-track" | "at-risk" | "complete" | "proposed";
  proposedBy?: Role;
  smart?: { S: string; M: string; A: string; R: string; T: string };
  /** a progress update the mentee submitted that the mentor has not reviewed yet; only confirmed updates move `pct` */
  pending?: { pct: number; note: string; at: string };
  /** confirmed progress updates, newest first */
  log?: { at: string; from: number; to: number; note: string; adjusted?: boolean }[];
}
/** `due` is an ISO date (YYYY-MM-DD) or free text such as "Next session". */
/** Proof of work attached to a task. Only the details live in the store; the bytes are in evidenceFiles.ts. */
export interface Evidence { id: string; name: string; size: number; /** ISO day uploaded */ at: string; note?: string }
export interface Task { id: string; pairId: string; title: string; due: string; status: "pending" | "in-progress" | "done"; from: string; evidence?: Evidence[] }
/** A post on a cohort's discussion board (founders in the same cohort see each other's posts). */
export interface PostReply { id: string; authorId: string; author: string; text: string; at: string }
export interface Post { id: string; cohortId: number; authorId: string; author: string; venture: string; text: string; at: string; ts: number; replies: PostReply[] }
export interface Download { id: string; resourceId: string; pairId: string; at: string }
/** A founder saying they want to apply for a funding opportunity (the mentor is told). */
export interface FundingInterest { id: string; oppId: string; pairId: string; at: string }
export interface RubricRow { label: string; weight: number }
export interface Cohort {
  id: number; /** the project (admin programme) this cohort belongs to */ programId?: string; name: string; status: "Active" | "Completed"; startDate: string; endDate: string; sector: string;
  enrolled: number; rubric: RubricRow[];
  snapshot?: { mentees: number; mentors: number; avgProgress: number }; // completed cohorts have no live pairs
}
/** Single source for "how many are enrolled" (Cohort Management, Program Setup and the public card all use this).
 *  Never lower than the mentees actually in the cohort: paired + still waiting (who join the active cohort). */
export const cohortEnrolled = (c: Cohort, pairs: Pair[], waiting: Waiting[]) => {
  const ps = pairs.filter(p => p.cohortId === c.id);
  const waitingHere = waiting.filter(w => !c.programId || !w.programId || w.programId === c.programId).length;
  return ps.length > 0
    ? Math.max(c.enrolled, ps.length + (c.status === "Active" ? waitingHere : 0))
    : c.snapshot?.mentees ?? c.enrolled;
};
export interface Booking {
  id: string; pairId: string; date: string; time: string; durationMin: number; mode: "Virtual" | "In-person"; proposedBy: Role;
  /** "completed" = the mentor logged the session that took place in this slot */
  status: "proposed" | "confirmed" | "declined" | "cancelled" | "completed";
  sessionId?: string;
}
export interface Message { id: string; pairId: string; from: Role; text: string; time: string; /** ISO day sent; older saved messages have none */ date?: string; ts: number; read: boolean }
export interface AppEvent { id: string; to: Role; pairId: string; text: string; time: string; ts: number; tone: "info" | "warn" | "good" }
export interface Rematch { id: string; pairId: string; mentee: string; reason: string; at: string; status: "open" | "handled" }
export interface PrivateNote { id: string; pairId: string; text: string; at: string }
export interface Course { id: string; pairId: string; title: string; done: number; total: number; goalId?: string; /** ISO day the last module was completed (older records have none) */ completedAt?: string }
export interface Resource { id: string; title: string; type: string; tag: string }
export interface Share { id: string; resourceId: string; pairId: string; by: string; at: string }
export interface Nudge { id: string; pairId: string; at: string; text: string; channel: string }
export interface Intervention { pairId: string; openedAt: string; resolved: boolean }
export interface Integration {
  name: string; category: string; status: "Connected" | "Not Connected" | "Configurable"; desc: string; lastSync: string;
}

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
/** ISO due date, or null for free text such as "Next session" (those never go overdue). */
export const dueIso = (due: string) => (isIso(due) ? due : null);
export const isOverdue = (t: Task) => { const iso = dueIso(t.due); return t.status !== "done" && !!iso && iso < todayISO(); };
export type BookingResult = { ok: true } | { ok: false; reason: string };
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
/** Same mentor, same day, overlapping time range (a 60-min session at 10:00 blocks 10:00–11:00). */
export const overlaps = (a: { date: string; time: string; durationMin: number }, b: { date: string; time: string; durationMin: number }) =>
  a.date === b.date && toMin(a.time) < toMin(b.time) + b.durationMin && toMin(b.time) < toMin(a.time) + a.durationMin;
export const fmtBooking = (b: Booking) => `${new Date(b.date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}, ${b.time}`;
/** Countdown to the start of a booking, from the real now (local time). */
export const countdown = (b: Booking) => { const ms = Math.max(0, new Date(`${b.date}T${b.time}:00`).getTime() - nowDate().getTime()); return { days: Math.floor(ms / DAY), hrs: Math.floor((ms % DAY) / 3600000), min: Math.floor((ms % 3600000) / 60000) }; };
/** Minutes since midnight at which the slot ends. */
const endMin = (b: { time: string; durationMin: number }) => toMin(b.time) + b.durationMin;
/** The slot has not finished yet (so it is still "upcoming"). */
export const slotNotOver = (b: { date: string; time: string; durationMin: number }) => { const t = todayISO(); return b.date > t || (b.date === t && endMin(b) > toMin(nowHHMM())); };
/** Confirmed, upcoming or in progress. */
export const isUpcoming = (b: Booking) => b.status === "confirmed" && slotNotOver(b);
/** A confirmed slot that has passed with no session logged against it yet: the mentor still owes a log. */
export const awaitingLog = (b: Booking) => b.status === "confirmed" && !slotNotOver(b);
/** A proposal nobody answered before its slot passed. */
export const isStaleProposal = (b: Booking) => b.status === "proposed" && !slotNotOver(b);
/** What the lists on both dashboards show: open proposals, upcoming sessions, and sessions waiting to be logged. */
export const isLiveBooking = (b: Booking) => (b.status === "proposed" && !isStaleProposal(b)) || isUpcoming(b) || awaitingLog(b);

const M = (o: Partial<Milestones> = {}): Milestones => ({ registered: false, mvp: false, firstRevenue: false, grant: false, graduated: false, ...o });
const DEFAULT_RUBRIC: RubricRow[] = [
  { label: "Business Registration", weight: 15 }, { label: "Market Validation (≥50 interviews)", weight: 20 },
  { label: "Revenue Milestone", weight: 25 }, { label: "Session Attendance", weight: 15 },
  { label: "Goal Completion Rate", weight: 15 }, { label: "Mentor Satisfaction", weight: 10 },
];

// Same four matched pairs as Pairing & Matching's sample data
const PAIRS: Pair[] = [
  { id: "p1", programId: SAMPLE_CORE, menteeId: "APP-001", mentorId: "MNT-017", introDate: sh("2025-07-30"), mentee: "Chisomo Banda", mentor: "Dr. Tiwonge Banda", venture: "AgroConnect Malawi", sector: "AgriTech", stage: "Validation", expertise: "AgriTech and Finance", matchScore: 91, cohortId: 1, startDate: sh("2025-05-12"), milestones: M() },
  { id: "p2", programId: SAMPLE_CORE, menteeId: "APP-025", mentorId: "MNT-018", introDate: sh("2025-07-30"), mentee: "Kondwani Phiri", mentor: "Prof. Patrick Likoswe", venture: "EduBridge", sector: "EdTech", stage: "MVP", expertise: "EdTech & Curriculum", matchScore: 86, cohortId: 1, startDate: sh("2025-05-12"), milestones: M({ registered: true, mvp: true, firstRevenue: true }) },
  { id: "p3", programId: SAMPLE_SHE, menteeId: "APP-026", mentorId: "MNT-019", mentee: "Tadala Chirwa", mentor: "Limbani Gondwe", venture: "CleanHeat", sector: "CleanEnergy", stage: "Idea", expertise: "CleanEnergy and Hardware", matchScore: 79, cohortId: 4, startDate: sh("2025-05-19"), milestones: M() },
  { id: "p6", programId: SAMPLE_CORE, menteeId: "APP-027", mentorId: "MNT-018", mentee: "Yamikani Mwale", mentor: "Prof. Patrick Likoswe", venture: "LearnLoop", sector: "EdTech", stage: "Idea", expertise: "EdTech & Curriculum", matchScore: 74, cohortId: 1, startDate: sh("2025-05-12"), milestones: M() },
  { id: "p5", programId: SAMPLE_SHE, menteeId: "APP-028", mentorId: "MNT-020", introDate: sh("2025-07-31"), mentee: "Grace Kamwendo", mentor: "Dr. Chimwemwe Phiri", venture: "HealthTrack", sector: "HealthTech", stage: "MVP", expertise: "HealthTech & UX", matchScore: 88, cohortId: 4, startDate: sh("2025-05-12"), milestones: M({ registered: true, mvp: true, grant: true }) },
  // Confirmed in the admin Matching pipeline, so they exist as real pairs (no sessions yet → "New" until the first one is logged)
  { id: "p7", programId: SAMPLE_SHE, menteeId: "APP-005", mentorId: "MNT-005", introDate: sh("2025-08-01"), mentee: "Lusungu Nyirenda", mentor: "Mrs. Faith Nyirenda", venture: "Nyirenda Logistics", sector: "Services", stage: "MVP", expertise: "Marketing", matchScore: 94, cohortId: 4, startDate: sh("2025-07-21"), matchedAt: sh("2025-07-21"), milestones: M() },
  { id: "p8", programId: SAMPLE_CORE, menteeId: "APP-022", mentorId: "MNT-003", mentee: "Dalitso Mvula", mentor: "Ms. Rejoice Mwale", venture: "GreenSprout Hydroponics", sector: "Agri-Business", stage: "MVP", expertise: "Agriculture", matchScore: 95, cohortId: 1, startDate: sh("2025-07-21"), matchedAt: sh("2025-07-21"), milestones: M() },
  { id: "p9", programId: SAMPLE_SHE, menteeId: "APP-024", mentorId: "MNT-010", mentee: "Enelesi Phiri", mentor: "Mr. Charles Nkosi", venture: "Zomba Weavers Co-op", sector: "Creative Arts", stage: "Early Traction", expertise: "Business Strategy", matchScore: 86, cohortId: 4, startDate: sh("2025-07-21"), matchedAt: sh("2025-07-21"), milestones: M() },
  { id: "p10", programId: SAMPLE_SHE, menteeId: "APP-010", mentorId: "MNT-007", mentee: "Alinafe Gondwe", mentor: "Ms. Miriam Kamwana", venture: "Lakeside Hospitality Solutions", sector: "Services", stage: "Early Traction", expertise: "Social Enterprise", matchScore: 89, cohortId: 4, startDate: sh("2025-07-21"), matchedAt: sh("2025-07-21"), milestones: M() },
];

const S = (pairId: string, date: string, durationMin: number, mode: Session["mode"], topics: string[], tasks: string[], rating: number | null, notes = ""): Session =>
  ({ id: `s${++TS}`, pairId, date, durationMin, mode, topics, tasks, notes, rating });
const WAITING: Waiting[] = [
  { id: "w1", programId: SAMPLE_CORE, menteeId: "APP-029", mentee: "Madalitso Chiumia", venture: "FarmLink", sector: "AgriTech", stage: "Idea" },
  { id: "w2", programId: SAMPLE_SHE, menteeId: "APP-015", mentee: "Tamara Kachingwe", venture: "FinLit Mobile", sector: "Financial Services", stage: "MVP / Prototype" },
  { id: "w3", programId: SAMPLE_CORE, menteeId: "APP-023", mentee: "Brian Kumwenda", venture: "Mzuzu Coders Hub", sector: "Technology", stage: "MVP / Prototype" },
];
const SESSIONS: Session[] = [
  S("p1", sh("2025-07-24"), 55, "Virtual", ["Pricing model", "Competitor analysis"], ["Survey 10 more farmers", "Draft pricing deck"], 5, "Discussed tiered pricing. Tiwonge shared template for competitive landscape mapping."),
  S("p1", sh("2025-07-10"), 60, "Virtual", ["Business registration", "Grant research"], ["File registration docs", "Apply to Malawi Agri Grant"], 4, "Mapped out registration timeline. Identified 3 grant opportunities matching our stage."),
  S("p1", sh("2025-06-26"), 45, "In-person", ["Product feedback", "Pilot expansion"], ["Pilot 5 new farmers"], 5, "Deep dive into pilot feedback — strong product signal. Agreed to expand to 15 farmers."),
  S("p2", sh("2025-07-21"), 60, "Virtual", ["School partnership pitch"], ["Send MOU template to schools in Lilongwe"], 4),
  S("p2", sh("2025-07-07"), 50, "Virtual", ["Pricing for schools"], ["Draft school pricing tiers"], 5),
  S("p2", sh("2025-06-23"), 45, "Virtual", ["Pilot review"], ["Collect teacher feedback"], 4),
  S("p3", sh("2025-07-18"), 45, "In-person", ["Prototype scoping", "Co-founder profile"], ["Post co-founder listing on StartHub Malawi"], 3),
  S("p3", sh("2025-06-30"), 40, "Virtual", ["Cookstove cost model"], ["Get 3 supplier quotes"], 3),
  S("p6", sh("2025-05-30"), 30, "Virtual", ["Idea validation"], ["Interview 10 teachers"], 2),
  S("p6", sh("2025-05-16"), 30, "Virtual", ["Problem framing"], ["Write problem statement"], 3),
  S("p5", sh("2025-07-22"), 50, "Virtual", ["User research", "Clinic pilot"], ["Interview 5 clinic staff"], 5),
  S("p5", sh("2025-07-08"), 45, "Virtual", ["MVP scope"], ["Finalise MVP feature list"], 4),
];

const GOALS: Goal[] = [
  { id: "g1", pairId: "p1", title: "Validate product-market fit with 50 farmers", category: "Market", pct: 64, due: dd("Aug 15"), status: "on-track", smart: { S: "Conduct 50 structured interviews", M: "50 completed surveys", A: "Fieldwork in Mzimba district", R: "Core to revenue model", T: tt("Aug 15") } },
  { id: "g2", pairId: "p1", title: "Register business with Malawi Registrar General", category: "Legal", pct: 90, due: dd("Jul 30"), status: "on-track", smart: { S: "File registration docs with Malawi Registrar General", M: "Certificate received", A: "Paperwork ready", R: "Unlocks grant eligibility", T: tt("Jul 30") } },
  { id: "g3", pairId: "p1", title: "Reach MWK 500,000 MRR milestone", category: "Revenue", pct: 28, due: dd("Sep 30"), status: "at-risk", smart: { S: "Acquire 20 paying farmers", M: "MWK 500,000/month", A: "Pilot 5 farmers already", R: "Proves monetisation model", T: tt("Sep 30") } },
  { id: "g4", pairId: "p1", title: "Complete AgriFinance Fundamentals course", category: "Learning", pct: 75, due: dd("Aug 1"), status: "on-track", smart: { S: "Finish 4 remaining modules", M: "Certificate earned", A: "3 hrs/week available", R: "Strengthens investor pitch", T: tt("Aug 1") } },
  { id: "g5", pairId: "p2", title: "3 school MOU partnerships", category: "Market", pct: 60, due: dd("Aug 10"), status: "on-track" },
  { id: "g6", pairId: "p2", title: "Reach 200 active learners", category: "Revenue", pct: 45, due: dd("Sep 15"), status: "on-track" },
  { id: "g7", pairId: "p3", title: "Prototype concept validation", category: "Product", pct: 25, due: dd("Aug 20"), status: "at-risk" },
  { id: "g8", pairId: "p3", title: "Find technical co-founder", category: "Team", pct: 20, due: dd("Aug 30"), status: "at-risk" },
  { id: "g11", pairId: "p6", title: "Validate problem with 10 teachers", category: "Market", pct: 10, due: dd("Jul 15"), status: "at-risk" },
  { id: "g12", pairId: "p6", title: "Draft lean canvas", category: "Product", pct: 20, due: dd("Jul 30"), status: "at-risk" },
  { id: "g9", pairId: "p5", title: "Pilot in 3 clinics", category: "Market", pct: 70, due: dd("Aug 25"), status: "on-track" },
  { id: "g10", pairId: "p5", title: "Register business", category: "Legal", pct: 100, due: dd("Jun 30"), status: "complete" },
];

const TASKS: Task[] = [
  { id: "t1", pairId: "p1", title: "Survey 10 more farmers in Mzimba district", due: dd("Jul 31"), status: "in-progress", from: "Mentor" },
  { id: "t2", pairId: "p1", title: "Draft tiered pricing deck (3 tiers)", due: dd("Aug 2"), status: "pending", from: "Mentor" },
  { id: "t3", pairId: "p1", title: "File business registration documents with BRS", due: dd("Jul 30"), status: "done", from: "Mentor" },
  { id: "t4", pairId: "p1", title: "Complete Module 4: AgriFinance Fundamentals", due: dd("Aug 1"), status: "in-progress", from: "Learning Academy" },
  { id: "t5", pairId: "p1", title: "Apply to Malawi Agri-Enterprise Grant (Round 2)", due: dd("Aug 5"), status: "pending", from: "Self" },
  { id: "t13", pairId: "p1", title: "Map 3 competitor pricing models", due: dd("Jul 12"), status: "done", from: "Mentor" },
  { id: "t14", pairId: "p1", title: "Share farmer interview script with field team", due: dd("Jul 5"), status: "done", from: "Mentor" },
  { id: "t6", pairId: "p2", title: "Send MOU template to schools in Lilongwe", due: dd("Jul 28"), status: "done", from: "Mentor" },
  { id: "t7", pairId: "p2", title: "Draft school pricing tiers", due: dd("Jul 20"), status: "done", from: "Mentor" },
  { id: "t8", pairId: "p3", title: "Post co-founder listing on StartHub Malawi", due: dd("Jul 25"), status: "pending", from: "Mentor" },
  { id: "t9", pairId: "p3", title: "Get 3 supplier quotes", due: dd("Jul 15"), status: "pending", from: "Mentor" },
  { id: "t10", pairId: "p3", title: "Sketch prototype BOM", due: dd("Aug 2"), status: "in-progress", from: "Mentor" },
  { id: "t15", pairId: "p6", title: "Interview 10 teachers", due: dd("Jun 10"), status: "pending", from: "Mentor" },
  { id: "t16", pairId: "p6", title: "Write problem statement", due: dd("May 30"), status: "pending", from: "Mentor" },
  { id: "t11", pairId: "p5", title: "Interview 5 clinic staff", due: dd("Jul 30"), status: "in-progress", from: "Mentor" },
  { id: "t12", pairId: "p5", title: "Finalise MVP feature list", due: dd("Jul 20"), status: "done", from: "Mentor" },
];

const BOOKINGS: Booking[] = [
  { id: "b1", pairId: "p1", date: sh("2025-07-31"), time: "10:00", durationMin: 60, mode: "Virtual", proposedBy: "mentor", status: "confirmed" },
  { id: "b2", pairId: "p2", date: sh("2025-08-01"), time: "14:00", durationMin: 60, mode: "Virtual", proposedBy: "mentor", status: "confirmed" },
  { id: "b3", pairId: "p3", date: sh("2025-08-04"), time: "11:00", durationMin: 45, mode: "In-person", proposedBy: "mentor", status: "confirmed" },
  { id: "b4", pairId: "p5", date: sh("2025-08-05"), time: "09:00", durationMin: 45, mode: "Virtual", proposedBy: "mentee", status: "confirmed" },
];
const MSG = (pairId: string, from: Role, text: string, time: string, read = true): Message => ({ id: `m${++TS}`, pairId, from, text, time, ts: TS, read });
const MESSAGES: Message[] = [
  MSG("p1", "mentor", "Great work on the survey progress! Keep at it — you are so close to the target.", "10:24 AM"),
  MSG("p1", "mentee", "Thanks Dr. Tiwonge! I should hit 50 by Friday. I also drafted the pricing tiers — will share tonight.", "10:31 AM"),
  MSG("p1", "mentor", "Perfect. Also check your email — I shared a competitive analysis template that might save you time.", "10:35 AM"),
  MSG("p1", "mentee", "Got it, thank you! See you at our session on Thursday.", "10:42 AM", false),
  MSG("p2", "mentor", "How did the school meeting go?", "Yesterday"),
  MSG("p2", "mentee", "MOU template sent to 2 schools in Lilongwe!", "Yesterday"),
  MSG("p3", "mentee", "Found a potential co-founder on StartHub Malawi!", ml("Jul 20"), false),
  MSG("p3", "mentor", "Excellent! Set up a coffee chat. I will share a co-founder alignment checklist.", ml("Jul 20")),
  MSG("p6", "mentor", "Checking in. I have not heard from you in a while. Can we book a session?", ml("Jun 12"), false),
  MSG("p5", "mentee", "Clinic pilot kicks off next week. Can we review the interview script?", ml("Jul 23"), false),
];

const COURSES: Course[] = [
  { id: "c1", pairId: "p1", title: "AgriFinance Fundamentals", done: 6, total: 8, goalId: "g4" },
  { id: "c2", pairId: "p1", title: "Market Entry Strategy for AgriTech", done: 5, total: 5 },
  { id: "c3", pairId: "p1", title: "Impact Investing & Pitch Readiness", done: 2, total: 6 },
  { id: "c4", pairId: "p2", title: "EdTech Product Design", done: 3, total: 6 },
  { id: "c5", pairId: "p3", title: "Clean Energy Business Basics", done: 1, total: 5 },
  { id: "c6", pairId: "p5", title: "HealthTech Regulation Essentials", done: 4, total: 6 },
  { id: "c7", pairId: "p6", title: "Curriculum Design 101", done: 0, total: 4 },
];
export const RESOURCES: Resource[] = [
  { id: "r1", title: "Startup Pricing Frameworks", type: "Template", tag: "Finance" },
  { id: "r2", title: "Competitive Landscape Canvas", type: "Guide", tag: "Strategy" },
  { id: "r3", title: "Partnership MOU Template", type: "Template", tag: "Legal" },
  { id: "r4", title: "Customer Interview Playbook", type: "Guide", tag: "Research" },
  { id: "r5", title: "Pitch Deck Formula (Seed Stage)", type: "Template", tag: "Funding" },
  { id: "r6", title: "Co-founder Alignment Checklist", type: "Checklist", tag: "Team" },
  { id: "r7", title: "Malawi Business Registration Checklist", type: "Checklist", tag: "Legal" },
  { id: "r8", title: "SMART Goal Workbook v2", type: "Workbook", tag: "Planning" },
  // Stage recommendations on the entrepreneur dashboard point at these
  { id: "r9", title: "Business Model Canvas", type: "Template", tag: "Strategy" },
  { id: "r10", title: "Customer Discovery Toolkit", type: "Toolkit", tag: "Research" },
  { id: "r11", title: "MVP Guide", type: "Guide", tag: "Product" },
];
export const downloadResource = (r: Resource) => {
  const url = URL.createObjectURL(new Blob([`${r.title}\n${r.type} · ${r.tag}\n\n(Sample content. Replace with the real file when the backend is connected.)\n`], { type: "text/plain" }));
  Object.assign(document.createElement("a"), { href: url, download: `${r.title.replace(/[^a-z0-9]+/gi, "-")}.txt` }).click();
  URL.revokeObjectURL(url);
};

const COHORTS: Cohort[] = [
  { id: 1, programId: SAMPLE_CORE, name: "Cohort 5 — 2025", status: "Active", startDate: "Jan 2025", endDate: "Dec 2025", sector: "Mixed", enrolled: 9, rubric: DEFAULT_RUBRIC },
  { id: 2, programId: SAMPLE_CORE, name: "Cohort 4 — 2024", status: "Completed", startDate: "Jan 2024", endDate: "Dec 2024", sector: "AgriTech", enrolled: 22, rubric: DEFAULT_RUBRIC, snapshot: { mentees: 22, mentors: 10, avgProgress: 100 } },
  { id: 3, programId: SAMPLE_CORE, name: "Cohort 3 — 2023", status: "Completed", startDate: "Jan 2023", endDate: "Dec 2023", sector: "CleanEnergy", enrolled: 16, rubric: DEFAULT_RUBRIC, snapshot: { mentees: 16, mentors: 7, avgProgress: 100 } },
  { id: 4, programId: SAMPLE_SHE, name: "Cohort 1 — 2025", status: "Active", startDate: "Aug 2025", endDate: "Jan 2026", sector: "Women-led", enrolled: 8, rubric: DEFAULT_RUBRIC },
];

const INTEGRATIONS: Integration[] = [
  { name: "Google Calendar", category: "Scheduling", status: "Connected", desc: "Sync session scheduling and availability across mentor and mentee calendars", lastSync: "2 min ago" },
  { name: "Microsoft Outlook", category: "Scheduling", status: "Connected", desc: "Email and calendar integration for programme staff and mentors", lastSync: "5 min ago" },
  { name: "Zoom", category: "Video Calls", status: "Connected", desc: "Launch video calls directly from session management, auto-log attendance", lastSync: "Active" },
  { name: "Google Meet", category: "Video Calls", status: "Not Connected", desc: "Alternative video platform for sessions", lastSync: "—" },
  { name: "LMS (Moodle)", category: "Learning", status: "Connected", desc: "Course module visibility for mentors, track mentee course completions and certificates", lastSync: "10 min ago" },
  { name: "Salesforce CRM", category: "CRM", status: "Not Connected", desc: "Sync entrepreneur profiles and programme data with CRM for stakeholder reporting", lastSync: "—" },
  { name: "HubSpot CRM", category: "CRM", status: "Not Connected", desc: "Alternative CRM integration for partner reporting and pipeline tracking", lastSync: "—" },
  { name: "Typeform / Registration", category: "Intake", status: "Connected", desc: "Pull applicant data from intake forms directly into the platform", lastSync: "1 hr ago" },
  { name: "Slack", category: "Communication", status: "Configurable", desc: "Nudges, session reminders and cohort announcements via Slack workspace", lastSync: "—" },
];

// ── Derived metrics (pure functions, so admin + dashboards agree) ──────────────
export interface PairStats {
  health: Health; sessionsTotal: number; sessions7d: number; lastSession: string | null; daysSince: number | null;
  satisfaction: number | null; goalPct: number; taskPct: number | null; openTasks: number;
  goalsOnTrack: number; goalsAtRisk: number; trend: "up" | "down" | "stable"; reasons: string[];
}
export function computePairStats(pair: Pair, sessions: Session[], goals: Goal[], tasks: Task[]): PairStats {
  const today = todayISO();
  const ss = sessions.filter(s => s.pairId === pair.id).sort((a, b) => b.date.localeCompare(a.date));
  const gs = goals.filter(g => g.pairId === pair.id && g.status !== "proposed");
  const ts = tasks.filter(t => t.pairId === pair.id && t.from === "Mentor");
  const rated = ss.filter(s => s.rating != null);
  const last3 = rated.slice(0, 3);
  const satisfaction = last3.length ? Math.round((last3.reduce((a, s) => a + (s.rating as number), 0) / last3.length) * 20) : null;
  const daysSince = ss.length ? daysBetween(ss[0].date, today) : null;
  const goalPct = gs.length ? Math.round(gs.reduce((a, g) => a + g.pct, 0) / gs.length) : 0;
  const taskPct = ts.length ? Math.round((ts.filter(t => t.status === "done").length / ts.length) * 100) : null;
  const relStart = pair.matchedAt ?? pair.startDate;
  const overdueBase = daysSince ?? daysBetween(relStart, today);

  // Thresholds follow spec §5.2 (stalled ≥45 days, satisfaction <3.0 twice) plus softer at-risk signals
  const stalled: string[] = [];
  if (overdueBase >= 45) stalled.push(`No session in ${overdueBase} days`);
  if (rated.length >= 2 && rated[0].rating! < 3 && rated[1].rating! < 3) stalled.push("Satisfaction below 3.0 for 2 sessions");
  const risk: string[] = [];
  if (overdueBase > 14) risk.push(`${overdueBase} days since last session`);
  if (taskPct != null && taskPct < 50) risk.push(`Task completion ${taskPct}%`);
  if (satisfaction != null && satisfaction < 70) risk.push(`Satisfaction ${satisfaction}%`);
  if (gs.length && goalPct < 30) risk.push(`Goal progress ${goalPct}%`);

  let health: Health = stalled.length ? "Stalled" : risk.length ? "At Risk" : "Healthy";
  if (!ss.length && daysBetween(relStart, today) <= 21) health = "New";
  const trend = rated.length >= 2 ? (rated[0].rating! > rated[1].rating! ? "up" : rated[0].rating! < rated[1].rating! ? "down" : "stable") : "stable";
  return {
    health, sessionsTotal: ss.length, sessions7d: ss.filter(s => daysBetween(s.date, today) <= 7).length,
    lastSession: ss[0]?.date ?? null, daysSince, satisfaction, goalPct, taskPct,
    openTasks: tasks.filter(t => t.pairId === pair.id && t.status !== "done").length,
    goalsOnTrack: gs.filter(g => g.status !== "at-risk").length, goalsAtRisk: gs.filter(g => g.status === "at-risk").length,
    trend, reasons: [...stalled, ...risk],
  };
}

export function effectiveMilestones(p: Pair, goals: Goal[]): Milestones {
  const done = (cat: string) => goals.some(g => g.pairId === p.id && g.category === cat && g.status === "complete");
  // Saved or synced records can predate milestones; treat a missing set as "none reached"
  const base: Milestones = { registered: false, mvp: false, firstRevenue: false, grant: false, graduated: false, ...p.milestones };
  return { ...base, registered: base.registered || done("Legal"), firstRevenue: base.firstRevenue || done("Revenue") };
}

export const PERIODS = { month: { days: 30, label: "Last 30 days" }, quarter: { days: 90, label: "Last 90 days" }, year: { days: 365, label: "Last 12 months" } } as const;
export type Period = keyof typeof PERIODS;

// ── Context ───────────────────────────────────────────────────────────────────
export interface Ctx {
  pairs: Pair[]; sessions: Session[]; goals: Goal[]; tasks: Task[]; cohorts: Cohort[];
  integrations: Integration[]; nudges: Nudge[]; interventions: Intervention[];
  stats: Record<string, PairStats>;
  courses: Course[]; shares: Share[];
  pastPairs: Pair[]; waiting: Waiting[];
  mentorLoad: (mentor: MentorRef) => number;
  /** How many mentees this mentor can take: the programme team's setting, else `fallback` (their application), else the default. */
  capacityOf: (mentorId?: string, fallback?: number) => number;
  /** Programme team only. The limit cannot go below the mentees the mentor already has. */
  setMentorCapacity: (mentorId: string, limit: number, mentorName?: string) => BookingResult;
  declineRematch: (id: string) => void;
  addWaiting: (w: Omit<Waiting, "id">) => void;
  removeWaiting: (mentee: string, menteeId?: string) => void;
  /** Set (or clear with "") the introductory-call date for a pair. */
  scheduleIntro: (pairId: string, date: string) => void;
  /** Ends a live pair (archives it, cancels open bookings/rematches, notifies both sides) and puts the mentee back in the waiting list. */
  endPair: (pairId: string, reason: string, opts?: { requeue?: boolean }) => void;
  completeModule: (courseId: string) => void;
  /** Mentee attaches a file to one of their tasks as proof. The mentor is told. Resolves with the reason when it is refused. */
  attachEvidence: (taskId: string, file: File, note?: string) => Promise<BookingResult>;
  removeEvidence: (taskId: string, evidenceId: string) => void;
  downloads: Download[];
  recordDownload: (resourceId: string, pairId: string) => void;
  posts: Post[];
  addPost: (pairId: string, text: string) => BookingResult;
  addReply: (postId: string, pairId: string, text: string) => BookingResult;
  fundingInterests: FundingInterest[];
  toggleFundingInterest: (oppId: string, oppTitle: string, pairId: string) => BookingResult;
  shareResource: (resourceId: string, pairIds: string[]) => void;
  resetDemo: () => void;
  bookings: Booking[]; messages: Message[]; events: AppEvent[]; rematches: Rematch[]; privateNotes: PrivateNote[];
  currentUser: CurrentUser | null;
  /** Sets who is signed in on this tab (null signs out). Proving who someone is happens in auth.ts, not here. */
  signIn: (user: CurrentUser | null) => void;
  /** Projects (admin programmes). Pairs, waiting mentees and cohorts each belong to one via programId. */
  projects: Project[];
  registerProjects: (projects: Project[]) => void;
  projectName: (id?: string) => string | undefined;
  nextBooking: (pairId: string) => Booking | undefined;
  /** Refuses a slot that overlaps another session (proposed or confirmed) of the same mentor. */
  proposeBooking: (i: { pairId: string; date: string; time: string; durationMin: number; mode: Booking["mode"]; by: Role }) => BookingResult;
  /** Accepting is refused if the mentor has meanwhile been booked for an overlapping slot. */
  respondBooking: (id: string, accept: boolean) => BookingResult;
  cancelBooking: (id: string) => void;
  sendMessage: (pairId: string, from: Role, text: string) => void;
  markRead: (pairId: string, reader: Role) => void;
  unread: (pairId: string, reader: Role) => number;
  proposeGoal: (i: { pairId: string; title: string; category: string; due: string; by: Role }) => void;
  approveGoal: (id: string) => void;
  /** Mentee reports progress with a note; it waits for the mentor and does not count until confirmed. */
  submitProgress: (id: string, pct: number, note: string) => BookingResult;
  /** Mentor answers a pending progress update: confirm as reported, confirm with a different %, or decline. */
  reviewProgress: (id: string, decision: "confirm" | "adjust" | "decline", opts?: { pct?: number; comment?: string }) => BookingResult;
  assignTask: (pairId: string, title: string, due: string) => BookingResult;
  requestRematch: (pairId: string, reason: string, by?: "mentee" | "admin") => void;
  resolveRematch: (id: string) => void;
  addPrivateNote: (pairId: string, text: string) => BookingResult;
  eventsFor: (role: Role, pairIds: string[]) => AppEvent[];
  cohortName: (id: number) => string;
  integrationOn: (name: string) => boolean;
  videoProvider: string | null; calendarProvider: string | null;
  /** Logs a session that took place. Pass `bookingId` for a scheduled slot (it is then marked completed and takes the booking's date);
   *  without it the session is logged for `date` (default today), and a confirmed booking of the same pair on that day is closed automatically. */
  logSession: (i: { pairId: string; durationMin: number; mode: Session["mode"]; topics: string[]; notes: string; task?: string; date?: string; bookingId?: string }) => BookingResult;
  rateSession: (id: string, rating: number) => BookingResult;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  signOffGoal: (id: string) => void;
  sendNudge: (pairId: string) => Nudge;
  openIntervention: (pairId: string) => void;
  resolveIntervention: (pairId: string) => void;
  addCohort: (c: { name: string; startDate: string; endDate: string; sector: string; enrolled: number; programId?: string }) => void;
  setRubric: (cohortId: number, rubric: RubricRow[]) => void;
  /** New mentee → creates a pair. Mentee already paired → re-match: archives the old pair and carries goals, open tasks, courses and milestones over. */
  addPair: (i: { menteeId?: string; mentorId?: string; programId?: string; mentee: string; mentor: string; venture: string; sector: string; expertise: string; matchScore: number; stage?: string; /** the mentor's own limit; defaults to DEFAULT_MENTOR_CAPACITY */ capacity?: number }) => BookingResult;
  connectIntegration: (name: string) => void;
  disconnectIntegration: (name: string) => void;
  syncIntegration: (name: string) => void;
}
const KEY = "emerge.programme.v4";
const OLD_KEY = "emerge.programme.v3"; // saved while the clock was frozen at 28 Jul 2025
const USER_KEY = "emerge.user.v3";
type Saved = Partial<{ pairs: Pair[]; sessions: Session[]; goals: Goal[]; tasks: Task[]; cohorts: Cohort[]; integrations: Integration[]; nudges: Nudge[]; interventions: Intervention[]; bookings: Booking[]; messages: Message[]; events: AppEvent[]; rematches: Rematch[]; privateNotes: PrivateNote[]; courses: Course[]; shares: Share[]; pastPairs: Pair[]; waiting: Waiting[]; mentorCapacity: Record<string, number>; downloads: Download[]; posts: Post[]; fundingInterests: FundingInterest[]; ts: number }>;

/** Data saved by the old build was dated against the frozen 28 Jul 2025 clock. Shift it so it sits at today and keeps ageing from here. */
function migrateV3(o: Saved): Saved {
  const g = (iso?: string) => (iso && isIso(iso) ? sh(iso) : iso);
  const lbl = (due: string) => { const m = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(due); return m && MONTH_NUM[m[1]] ? dd(due) : due; };
  const pair = (p: Pair): Pair => ({ ...p, startDate: g(p.startDate)!, matchedAt: g(p.matchedAt), introDate: g(p.introDate), endedAt: g(p.endedAt) });
  return {
    ...o,
    pairs: o.pairs?.map(pair), pastPairs: o.pastPairs?.map(pair),
    sessions: o.sessions?.map(x => ({ ...x, date: g(x.date)! })),
    bookings: o.bookings?.map(x => ({ ...x, date: g(x.date)! })),
    tasks: o.tasks?.map(x => ({ ...x, due: lbl(x.due) })),
    goals: o.goals?.map(x => ({ ...x, due: lbl(x.due) })),
    rematches: o.rematches?.map(x => ({ ...x, at: g(x.at)! })),
    privateNotes: o.privateNotes?.map(x => ({ ...x, at: g(x.at)! })),
    nudges: o.nudges?.map(x => ({ ...x, at: g(x.at)! })),
    interventions: o.interventions?.map(x => ({ ...x, openedAt: g(x.openedAt)! })),
    shares: o.shares?.map(x => ({ ...x, at: g(x.at)! })),
    // Sample pairs and cohorts gained a project in this version
    cohorts: o.cohorts && !o.cohorts.some(c => c.id === 4) ? [...o.cohorts.map(c => (c.programId ? c : { ...c, programId: SAMPLE_CORE })), COHORTS.find(c => c.id === 4)!] : o.cohorts,
  };
}
function loadSaved(): Saved {
  try {
    const r = localStorage.getItem(KEY);
    let s: Saved;
    if (r) s = JSON.parse(r);
    else {
      const old = localStorage.getItem(OLD_KEY);
      s = old ? migrateV3(JSON.parse(old)) : {};
      // Old sample pairs/waiting records get their project from the new seed (matched by id)
      s.pairs = s.pairs?.map(p => ({ ...p, ...(p.programId ? {} : seedProject(p.id, p.menteeId)) }));
      s.waiting = s.waiting?.map(w => ({ ...w, programId: w.programId ?? WAITING.find(x => x.menteeId === w.menteeId)?.programId }));
      s.pastPairs = s.pastPairs?.map(p => ({ ...p, ...(p.programId ? {} : seedProject(p.id, p.menteeId)) }));
    }
    TS = Math.max(TS, s.ts ?? 0); return s;
  } catch { return {}; }
}
/** programId + cohortId for a sample pair that was saved before projects existed */
function seedProject(pairId: string, menteeId?: string): Partial<Pair> {
  const seed = PAIRS.find(x => x.id === pairId || (!!menteeId && x.menteeId === menteeId));
  return seed ? { programId: seed.programId, cohortId: seed.cohortId } : {};
}
const ProgrammeCtx = createContext<Ctx | null>(null);
export const useProgramme = () => {
  const c = useContext(ProgrammeCtx);
  if (!c) throw new Error("useProgramme must be used inside <ProgrammeDataProvider>");
  return c;
};

export function ProgrammeDataProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(loadSaved);
  const [pairs, setPairs] = useState<Pair[]>(saved.pairs ?? PAIRS);
  const [sessions, setSessions] = useState<Session[]>(saved.sessions ?? SESSIONS);
  const [goals, setGoals] = useState<Goal[]>(saved.goals ?? GOALS);
  const [tasks, setTasks] = useState<Task[]>(saved.tasks ?? TASKS);
  const [cohorts, setCohorts] = useState<Cohort[]>(saved.cohorts ?? COHORTS);
  const [integrations, setIntegrations] = useState<Integration[]>(saved.integrations ?? INTEGRATIONS);
  const [nudges, setNudges] = useState<Nudge[]>(saved.nudges ?? []);
  const [interventions, setInterventions] = useState<Intervention[]>(saved.interventions ?? []);
  const [bookings, setBookings] = useState<Booking[]>(saved.bookings ?? BOOKINGS);
  const [messages, setMessages] = useState<Message[]>(saved.messages ?? MESSAGES);
  const [events, setEvents] = useState<AppEvent[]>(saved.events ?? []);
  const [rematches, setRematches] = useState<Rematch[]>(saved.rematches ?? []);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>(saved.privateNotes ?? []);
  /** Mentee limits the programme team has set per mentor ID; overrides the limit on the mentor's application. */
  const [mentorCapacity, setMentorCapacityMap] = useState<Record<string, number>>(saved.mentorCapacity ?? {});
  const [courses, setCourses] = useState<Course[]>(saved.courses ?? COURSES);
  const [shares, setShares] = useState<Share[]>(saved.shares ?? []);
  const [pastPairs, setPastPairs] = useState<Pair[]>(saved.pastPairs ?? []);
  const [downloads, setDownloads] = useState<Download[]>(saved.downloads ?? []);
  const [posts, setPosts] = useState<Post[]>(saved.posts ?? []);
  const [fundingInterests, setFundingInterests] = useState<FundingInterest[]>(saved.fundingInterests ?? []);
  const [waiting, setWaiting] = useState<Waiting[]>(saved.waiting ?? WAITING);
  // The signed-in user is per browser TAB (sessionStorage) so two tabs can be two different people.
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try { const u = JSON.parse(sessionStorage.getItem(USER_KEY) ?? "null"); return u && u.id && u.name && (u.role === "mentor" || u.role === "mentee") ? u : null; } catch { return null; }
  });
  // Projects are owned by the admin page (Program Setup); App registers them here so pairs and cohorts can belong to one.
  const [projects, setProjects] = useState<Project[]>([]);

  // Persist shared data on every change
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, bookings, messages, events, rematches, privateNotes, courses, shares, pastPairs, waiting, mentorCapacity, downloads, posts, fundingInterests, ts: TS })); } catch { /* storage full or blocked */ }
  }, [pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, bookings, messages, events, rematches, privateNotes, courses, shares, pastPairs, waiting, mentorCapacity, downloads, posts, fundingInterests]);

  // Live sync: another tab wrote new data → adopt it (this is the "two-person" test path)
  const live = useRef({ events, pairs, pastPairs, currentUser });
  live.current = { events, pairs, pastPairs, currentUser };
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      let s: Saved; try { s = JSON.parse(e.newValue); } catch { return; }
      TS = Math.max(TS, s.ts ?? 0);
      const u = live.current.currentUser;
      if (u && s.events) {
        const known = new Set(live.current.events.map(x => x.id));
        const mine = new Set([...(s.pairs ?? live.current.pairs), ...(s.pastPairs ?? live.current.pastPairs)].filter(p => (u.role === "mentor" ? (p.mentorId === u.id || (!p.mentorId && p.mentor === u.name)) : (p.menteeId === u.id || (!p.menteeId && p.mentee === u.name)))).map(p => p.id));
        s.events.filter(x => !known.has(x.id) && x.to === u.role && mine.has(x.pairId)).slice(0, 3).forEach(x => toast(x.text));
      }
      s.pairs && setPairs(s.pairs); s.sessions && setSessions(s.sessions); s.goals && setGoals(s.goals); s.tasks && setTasks(s.tasks);
      s.cohorts && setCohorts(s.cohorts); s.integrations && setIntegrations(s.integrations); s.nudges && setNudges(s.nudges);
      s.interventions && setInterventions(s.interventions); s.bookings && setBookings(s.bookings); s.messages && setMessages(s.messages);
      s.events && setEvents(s.events); s.rematches && setRematches(s.rematches); s.privateNotes && setPrivateNotes(s.privateNotes);
      s.courses && setCourses(s.courses); s.shares && setShares(s.shares);
      s.pastPairs && setPastPairs(s.pastPairs); s.waiting && setWaiting(s.waiting); s.mentorCapacity && setMentorCapacityMap(s.mentorCapacity);
      s.downloads && setDownloads(s.downloads); s.posts && setPosts(s.posts); s.fundingInterests && setFundingInterests(s.fundingInterests);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const emit = (to: Role, pairId: string, text: string, tone: AppEvent["tone"] = "info") =>
    setEvents(p => [{ id: `e${++TS}`, to, pairId, text, time: nowLabel(), ts: TS, tone }, ...p]);
  const other = (r: Role): Role => (r === "mentor" ? "mentee" : "mentor");
  const who = (pairId: string) => pairs.find(x => x.id === pairId);
  // Ownership guards. A signed-in mentor may only act on their own pairs and a mentee only on their own pairing. With nobody signed in
  // (admin and demo tooling have no CurrentUser) the call is allowed, as before. The backend must enforce this again once it exists.
  const NOT_YOURS = { ok: false, reason: "That pairing is not yours." } as const;
  const mayAct = (pairId: string, as: "mentor" | "mentee"): boolean => {
    const u = live.current.currentUser, p = who(pairId); if (!p) return false;
    if (!u) return true;
    if (u.role !== as) return false;
    return as === "mentor" ? isMentorOf(p, { id: u.id, name: u.name }) : (p.menteeId ? p.menteeId === u.id : p.mentee === u.name);
  };
  /** Which side of this pairing the signed-in user is, or null (not theirs). With nobody signed in (admin, demo tooling) callers decide. */
  const sideOf = (pairId: string): Role | null => {
    const u = live.current.currentUser, p = who(pairId); if (!u || !p) return null;
    if (u.role === "mentor") return isMentorOf(p, { id: u.id, name: u.name }) ? "mentor" : null;
    return (p.menteeId ? p.menteeId === u.id : p.mentee === u.name) ? "mentee" : null;
  };
  /** Either participant of the pairing may act (or nobody is signed in: admin/demo). */
  const inPair = (pairId: string) => !live.current.currentUser || sideOf(pairId) !== null;
  /** Programme-team actions: only when no mentor or mentee is signed in. */
  const adminOnly = () => !live.current.currentUser;
  const ADMIN_ONLY = { ok: false, reason: "Only the programme team can do that." } as const;
  /** Another live session of the same mentor that overlaps this slot (ignores the booking being answered). */
  const mentorClash = (pairId: string, slot: { date: string; time: string; durationMin: number }, ignoreId?: string) => {
    const me = who(pairId); if (!me) return undefined;
    const ids = new Map(pairs.filter(p => isMentorOf(p, { id: me.mentorId, name: me.mentor })).map(p => [p.id, p.mentee] as [string, string]));
    const hit = bookings.find(x => x.id !== ignoreId && ids.has(x.pairId) && (x.status === "confirmed" || x.status === "proposed") && overlaps(slot, x));
    return hit ? { mentee: ids.get(hit.pairId) as string } : undefined;
  };

  const today = todayISO(); // health, overdue and "days since" age with the calendar
  const stats = useMemo(() => Object.fromEntries(pairs.map(p => [p.id, computePairStats(p, sessions, goals, tasks)])), [pairs, sessions, goals, tasks, today]);
  const integrationOn = useCallback((n: string) => integrations.some(i => i.name === n && i.status === "Connected"), [integrations]);
  const videoProvider = ["Zoom", "Google Meet"].find(integrationOn) ?? null;
  const calendarProvider = ["Google Calendar", "Microsoft Outlook"].find(integrationOn) ?? null;
  const uid = () => Math.random().toString(36).slice(2, 9);

  const value: Ctx = {
    pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, stats,
    cohortName: id => cohorts.find(c => c.id === id)?.name ?? "—",
    integrationOn, videoProvider, calendarProvider,
    // Mentor logs a session that happened → the booking it came from is completed, the mentee can rate it, health/reports recompute.
    logSession: ({ pairId, durationMin, mode, topics, notes, task, date, bookingId }) => {
      const pair = who(pairId); if (!pair) return { ok: false, reason: "This pairing no longer exists." };
      if (!mayAct(pairId, "mentor")) return NOT_YOURS;
      const t = todayISO();
      const linked = bookingId
        ? bookings.find(b => b.id === bookingId && b.pairId === pairId)
        : bookings.find(b => b.pairId === pairId && b.status === "confirmed" && b.date === (date ?? t));
      if (bookingId && !linked) return { ok: false, reason: "That scheduled session could not be found." };
      if (linked && linked.status === "completed") return { ok: false, reason: "That session has already been logged." };
      if (linked && linked.status !== "confirmed") return { ok: false, reason: "Only a confirmed session can be logged." };
      const when = linked?.date ?? date ?? t;
      if (!isIso(when)) return { ok: false, reason: "Choose the date the session took place." };
      if (when > t) return { ok: false, reason: "A session can only be logged once it has taken place. Schedule it instead." };
      if (when < (pair.matchedAt ?? pair.startDate)) return { ok: false, reason: "That date is before this pairing began." };
      if (!(durationMin > 0)) return { ok: false, reason: "Enter how long the session lasted." };
      const session = S(pairId, when, durationMin, mode, topics, task ? [task] : [], null, notes);
      if (linked) session.bookingId = linked.id;
      setSessions(p => [session, ...p]);
      if (linked) setBookings(p => p.map(b => (b.id === linked.id ? { ...b, status: "completed", sessionId: session.id } : b)));
      emit("mentee", pairId, `${pair.mentor} logged your session. Please rate it.`, "info");
      if (task) { emit("mentee", pairId, `New task from ${pair.mentor}: ${task}`, "warn"); setTasks(p => [...p, { id: uid(), pairId, title: task, due: "Next session", status: "pending", from: "Mentor" }]); }
      return { ok: true };
    },
    rateSession: (id, rating) => {
      const s = sessions.find(x => x.id === id); if (!s) return { ok: false, reason: "That session could not be found." };
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, reason: "Choose a rating from 1 to 5." };
      if (!mayAct(s.pairId, "mentee")) return { ok: false, reason: "Only the mentee of this session can rate it." };
      if (s.rating != null) return { ok: false, reason: "This session has already been rated." };
      setSessions(p => p.map(x => (x.id === id ? { ...x, rating } : x)));
      emit("mentor", s.pairId, `${who(s.pairId)?.mentee} rated your ${fmtDate(s.date)} session ${"★".repeat(rating)}`, rating >= 4 ? "good" : "warn");
      return { ok: true };
    },
    setTaskStatus: (id, status) => {
      const t = tasks.find(x => x.id === id);
      if (!t || !inPair(t.pairId)) return;
      setTasks(p => p.map(x => (x.id === id ? { ...x, status } : x)));
      if (t && status === "done" && t.from === "Mentor") emit("mentor", t.pairId, `${who(t.pairId)?.mentee} completed: ${t.title}`, "good");
    },
    signOffGoal: id => {
      const g = goals.find(x => x.id === id);
      if (!g || !mayAct(g.pairId, "mentor")) return;
      setGoals(p => p.map(x => (x.id === id ? { ...x, pct: 100, status: "complete", pending: undefined, log: [{ at: todayISO(), from: x.pct, to: 100, note: "Signed off by mentor" }, ...(x.log ?? [])] } : x)));
      if (g) emit("mentee", g.pairId, `Goal signed off: ${g.title}`, "good");
    },
    sendNudge: pairId => {
      const pair = pairs.find(x => x.id === pairId)!;
      const slack = integrationOn("Slack");
      const n: Nudge = { id: uid(), pairId, at: todayISO(), channel: slack ? "In-app + Slack" : "In-app", text: `Programme team: no recent session between ${pair.mentee} and ${pair.mentor}. Please book your next session.` };
      setNudges(p => [n, ...p]);
      emit("mentor", pairId, n.text, "warn"); emit("mentee", pairId, n.text, "warn");
      return n;
    },
    openIntervention: pairId => setInterventions(p => [...p.filter(i => i.pairId !== pairId), { pairId, openedAt: todayISO(), resolved: false }]),
    resolveIntervention: pairId => setInterventions(p => p.map(i => (i.pairId === pairId ? { ...i, resolved: true } : i))),
    addCohort: c => setCohorts(p => [{ id: Math.max(0, ...p.map(x => x.id)) + 1, status: "Active", rubric: DEFAULT_RUBRIC, ...c }, ...p]),
    setRubric: (cohortId, rubric) => setCohorts(p => p.map(c => (c.id === cohortId ? { ...c, rubric } : c))),
    // Called from Pairing & Matching when a pairing is confirmed → appears in Health, Cohorts, dashboards.
    addPair: i => {
      if (!adminOnly()) return ADMIN_ONLY;
      const old = pairs.find(x => sameMentee(x, i));
      if (old && isMentorOf(old, { id: i.mentorId, name: i.mentor })) return { ok: true }; // already matched with this mentor
      // Capacity: the mentor's current mentees (not counting the pair being replaced) must be under their limit.
      const cap = (i.mentorId && mentorCapacity[i.mentorId]) || i.capacity || DEFAULT_MENTOR_CAPACITY;
      const load = pairs.filter(x => x.id !== old?.id && isMentorOf(x, { id: i.mentorId, name: i.mentor })).length;
      if (load >= cap) return { ok: false, reason: `${i.mentor} already has ${load} mentee${load === 1 ? "" : "s"} (limit ${cap}). Choose another mentor or raise their limit.` };
      const wait = waiting.find(w => sameMentee(w, i));
      const projectId = i.programId ?? old?.programId ?? wait?.programId;
      // The cohort comes from the pair's own project; a project that has none yet gets one the first time someone is matched in it.
      let cohort = old ? cohorts.find(c => c.id === old.cohortId) : undefined;
      cohort = cohort ?? (projectId ? cohorts.find(c => c.status === "Active" && c.programId === projectId) : undefined);
      if (!cohort && projectId) {
        const nm = projects.find(x => x.id === projectId)?.name;
        cohort = { id: Math.max(0, ...cohorts.map(x => x.id)) + 1, programId: projectId, name: `${nm ?? "Project"} — Cohort 1`, status: "Active", startDate: fmtDateY(todayISO()), endDate: "—", sector: i.sector || "Mixed", enrolled: 0, rubric: DEFAULT_RUBRIC };
        setCohorts(p => [cohort!, ...p]);
      }
      cohort = cohort ?? cohorts.find(c => c.status === "Active" && !c.programId) ?? cohorts.find(c => c.status === "Active");
      const active = cohort;
      const id = `p-${uid()}`;
      const next: Pair = {
        id, mentee: i.mentee, mentor: i.mentor, menteeId: i.menteeId ?? old?.menteeId ?? wait?.menteeId, mentorId: i.mentorId, programId: projectId, expertise: i.expertise, matchScore: i.matchScore,
        venture: old?.venture ?? wait?.venture ?? i.venture, sector: old?.sector ?? wait?.sector ?? i.sector,
        stage: old?.stage ?? i.stage ?? wait?.stage ?? "Idea",
        cohortId: old?.cohortId ?? active?.id ?? 1, startDate: old?.startDate ?? todayISO(), matchedAt: todayISO(), milestones: old?.milestones ?? M(),
        ...(old ? { predecessorId: old.id } : {}),
      };
      setPairs(p => [...p.filter(x => x.id !== old?.id), next]);
      setWaiting(w => w.filter(x => !sameMentee(x, i)));
      setRematches(r => r.map(x => (old && x.pairId === old.id ? { ...x, status: "handled" } : x)));
      if (old) {
        const reason = rematches.find(r => r.pairId === old.id && r.status === "open")?.reason ?? "Re-matched by the programme team";
        setPastPairs(p => [{ ...old, endedAt: todayISO(), endReason: reason, successorId: id }, ...p]);
        // The mentee's own record moves with them; the old mentor's sessions, messages and private notes stay with the archived pair.
        setGoals(p => p.map(g => (g.pairId === old.id ? { ...g, pairId: id } : g)));
        setTasks(p => p.map(x => (x.pairId === old.id && x.status !== "done" ? { ...x, pairId: id } : x)));
        setCourses(p => p.map(c => (c.pairId === old.id ? { ...c, pairId: id } : c)));
        setBookings(p => p.map(b => (b.pairId === old.id && (b.status === "confirmed" || b.status === "proposed") ? { ...b, status: "cancelled" } : b)));
        setInterventions(p => p.filter(x => x.pairId !== old.id));
        emit("mentor", old.id, `Your mentoring pair with ${old.mentee} has ended (re-matched to ${i.mentor}). Your ${sessions.filter(s => s.pairId === old.id).length} sessions stay on your record.`, "warn");
        emit("mentee", id, `You have been matched with ${i.mentor}, replacing ${old.mentor}. Your goals, tasks and courses have moved with you.`, "good");
      } else {
        emit("mentee", id, `You have been matched with ${i.mentor}`, "good");
      }
      emit("mentor", id, `New mentee matched: ${i.mentee} (${next.venture})`, "good");
      return { ok: true };
    },
    connectIntegration: name => setIntegrations(p => p.map(i => (i.name === name ? { ...i, status: "Connected", lastSync: "Just now" } : i))),
    disconnectIntegration: name => setIntegrations(p => p.map(i => (i.name === name ? { ...i, status: "Not Connected", lastSync: "—" } : i))),
    bookings, messages, events, rematches, privateNotes, currentUser,
    signIn: user => {
      setCurrentUser(user);
      try { user ? sessionStorage.setItem(USER_KEY, JSON.stringify(user)) : sessionStorage.removeItem(USER_KEY); } catch { /* ignore */ }
    },
    projects, projectName: id => (id ? projects.find(x => x.id === id)?.name : undefined),
    registerProjects: list => setProjects(prev => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list)),
    courses, shares, pastPairs, waiting,
    mentorLoad: m => pairs.filter(p => isMentorOf(p, m)).length,
    capacityOf: (id, fallback) => (id && mentorCapacity[id]) || fallback || DEFAULT_MENTOR_CAPACITY,
    setMentorCapacity: (id, limit, name) => {
      if (!adminOnly()) return ADMIN_ONLY;
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_MENTOR_CAPACITY) return { ok: false, reason: `Enter a whole number from 1 to ${MAX_MENTOR_CAPACITY}.` };
      const load = pairs.filter(p => isMentorOf(p, { id, name: name ?? "" })).length;
      if (limit < load) return { ok: false, reason: `This mentor already has ${load} mentees. Re-match one first, or set the limit to ${load} or more.` };
      setMentorCapacityMap(m => ({ ...m, [id]: limit }));
      return { ok: true };
    },
    addWaiting: w => setWaiting(p => (p.some(x => sameMentee(x, w)) ? p : [...p, { id: `w${++TS}`, ...w }])),
    scheduleIntro: (pairId, date) => setPairs(p => p.map(x => (x.id === pairId ? { ...x, introDate: date || undefined } : x))),
    removeWaiting: (mentee, menteeId) => setWaiting(p => p.filter(x => !sameMentee(x, { mentee, menteeId }))),
    endPair: (pairId, reason, opts) => {
      const old = pairs.find(x => x.id === pairId); if (!old || !adminOnly()) return;
      const requeue = opts?.requeue ?? true;
      setPairs(p => p.filter(x => x.id !== pairId));
      setPastPairs(p => [{ ...old, endedAt: todayISO(), endReason: reason }, ...p]);
      setRematches(r => r.map(x => (x.pairId === pairId && x.status === "open" ? { ...x, status: "handled" } : x)));
      setBookings(p => p.map(b => (b.pairId === pairId && (b.status === "confirmed" || b.status === "proposed") ? { ...b, status: "cancelled" } : b)));
      setInterventions(p => p.filter(x => x.pairId !== pairId));
      if (requeue) setWaiting(w => (w.some(x => sameMentee(x, old)) ? w : [...w, { id: `w${++TS}`, menteeId: old.menteeId, mentee: old.mentee, venture: old.venture, sector: old.sector, stage: old.stage }]));
      emit("mentor", pairId, `Your mentoring pair with ${old.mentee} has ended. ${reason}`, "warn");
      emit("mentee", pairId, `Your pairing with ${old.mentor} has ended. The programme team will match you again.`, "info");
    },
    declineRematch: id => {
      if (!adminOnly()) return;
      const r = rematches.find(x => x.id === id); if (!r || r.status !== "open") return;
      setRematches(p => p.map(x => (x.id === id ? { ...x, status: "handled" } : x)));
      const p = who(r.pairId);
      if (p) { emit("mentee", p.id, `The programme team reviewed your re-match request and you will stay with ${p.mentor} for now. Please talk to them or the team about any concerns.`, "info"); emit("mentor", p.id, `The re-match request from ${p.mentee} was reviewed. You remain their mentor.`, "info"); }
    },
    completeModule: id => {
      const c = courses.find(x => x.id === id); if (!c || c.done >= c.total) return;
      const done = c.done + 1;
      setCourses(p => p.map(x => (x.id === id ? { ...x, done, ...(done >= x.total ? { completedAt: todayISO() } : {}) } : x)));
      if (c.goalId) setGoals(p => p.map(g => (g.id === c.goalId && g.status !== "complete" ? { ...g, pct: Math.min(99, Math.round((done / c.total) * 100)) } : g)));
      emit("mentor", c.pairId, `${who(c.pairId)?.mentee} completed module ${done}/${c.total} of ${c.title}`, "good");
    },
    attachEvidence: async (taskId, file, note) => {
      const t = tasks.find(x => x.id === taskId); if (!t) return { ok: false, reason: "That task could not be found." };
      if (!mayAct(t.pairId, "mentee")) return { ok: false, reason: "Only the founder this task belongs to can attach evidence." };
      const bad = evidenceProblem(file, t.evidence?.length ?? 0); if (bad) return { ok: false, reason: bad };
      const id = `ev${uid()}${uid()}`;
      if (!(await saveEvidenceFile(id, file))) return { ok: false, reason: "The file could not be saved in this browser." };
      const ev: Evidence = { id, name: file.name, size: file.size, at: todayISO(), ...(note?.trim() ? { note: note.trim() } : {}) };
      setTasks(p => p.map(x => (x.id === taskId ? { ...x, evidence: [...(x.evidence ?? []), ev] } : x)));
      emit("mentor", t.pairId, `${who(t.pairId)?.mentee} attached evidence to: ${t.title} (${file.name})`, "good");
      return { ok: true };
    },
    removeEvidence: (taskId, evidenceId) => {
      const t = tasks.find(x => x.id === taskId); if (!t || !mayAct(t.pairId, "mentee")) return;
      setTasks(p => p.map(x => (x.id === taskId ? { ...x, evidence: (x.evidence ?? []).filter(e => e.id !== evidenceId) } : x)));
      void deleteEvidenceFile(evidenceId);
    },
    downloads,
    recordDownload: (resourceId, pairId) => { if (mayAct(pairId, "mentee")) setDownloads(p => [{ id: `d${uid()}`, resourceId, pairId, at: todayISO() }, ...p]); },
    posts,
    addPost: (pairId, text) => {
      const p = who(pairId); if (!p) return { ok: false, reason: "This pairing no longer exists." };
      if (!mayAct(pairId, "mentee")) return NOT_YOURS;
      const t = text.trim(); if (!t) return { ok: false, reason: "Write something first." };
      if (t.length > 1000) return { ok: false, reason: "Keep a post under 1000 characters." };
      setPosts(l => [{ id: `po${uid()}`, cohortId: p.cohortId, authorId: p.menteeId ?? p.id, author: p.mentee, venture: p.venture, text: t, at: todayISO(), ts: ++TS, replies: [] }, ...l]);
      return { ok: true };
    },
    addReply: (postId, pairId, text) => {
      const p = who(pairId), post = posts.find(x => x.id === postId);
      if (!p || !post) return { ok: false, reason: "That post could not be found." };
      if (!mayAct(pairId, "mentee")) return NOT_YOURS;
      if (post.cohortId !== p.cohortId) return { ok: false, reason: "That post is in another cohort." };
      const t = text.trim(); if (!t) return { ok: false, reason: "Write something first." };
      if (t.length > 1000) return { ok: false, reason: "Keep a reply under 1000 characters." };
      setPosts(l => l.map(x => (x.id === postId ? { ...x, replies: [...x.replies, { id: `rp${uid()}`, authorId: p.menteeId ?? p.id, author: p.mentee, text: t, at: todayISO() }] } : x)));
      return { ok: true };
    },
    fundingInterests,
    toggleFundingInterest: (oppId, oppTitle, pairId) => {
      if (!who(pairId)) return { ok: false, reason: "This pairing no longer exists." };
      if (!mayAct(pairId, "mentee")) return NOT_YOURS;
      const had = fundingInterests.some(x => x.oppId === oppId && x.pairId === pairId);
      setFundingInterests(l => (had ? l.filter(x => !(x.oppId === oppId && x.pairId === pairId)) : [{ id: `fi${uid()}`, oppId, pairId, at: todayISO() }, ...l]));
      if (!had) emit("mentor", pairId, `${who(pairId)?.mentee} wants to apply for: ${oppTitle}. Offer to review the application.`, "info");
      return { ok: true };
    },
    shareResource: (resourceId, pairIds) => {
      const r = RESOURCES.find(x => x.id === resourceId); if (!r) return;
      const fresh = pairIds.filter(pid => mayAct(pid, "mentor") && !shares.some(s => s.resourceId === resourceId && s.pairId === pid));
      if (!fresh.length) return;
      setShares(p => [...fresh.map(pid => ({ id: `sh${++TS}`, resourceId, pairId: pid, by: who(pid)?.mentor ?? "Mentor", at: todayISO() })), ...p]);
      fresh.forEach(pid => emit("mentee", pid, `${who(pid)?.mentor} shared a resource: ${r.title}`, "info"));
    },
    resetDemo: () => { try { indexedDB.deleteDatabase("emerge.evidence"); } catch { /* none */ } try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); localStorage.removeItem("emerge.admin.v2"); localStorage.removeItem(DECISIONS_KEY); sessionStorage.removeItem(USER_KEY); sessionStorage.removeItem("emerge.page"); } catch { /* ignore */ } window.location.reload(); },
    nextBooking: pairId => bookings.filter(b => b.pairId === pairId && isUpcoming(b)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0],
    proposeBooking: ({ pairId, by, ...rest }) => {
      if (!mayAct(pairId, by)) return NOT_YOURS;
      if (!isIso(rest.date) || !/^\d{2}:\d{2}$/.test(rest.time)) return { ok: false, reason: "Choose a date and time." };
      if (!slotNotOver(rest)) return { ok: false, reason: "That time has already passed. Pick a future time." };
      if (!(rest.durationMin > 0)) return { ok: false, reason: "Enter how long the session will be." };
      const clash = mentorClash(pairId, rest);
      if (clash) return { ok: false, reason: by === "mentee" ? "Your mentor is not available at that time. Please pick another time." : `You already have a session with ${clash.mentee} at that time. Please pick another time.` };
      setBookings(p => [...p, { id: `b${++TS}`, pairId, proposedBy: by, status: "proposed", ...rest }]);
      emit(other(by), pairId, `${by === "mentor" ? who(pairId)?.mentor : who(pairId)?.mentee} proposed a session on ${fmtDate(rest.date)} at ${rest.time}. Accept or decline.`, "warn");
      return { ok: true };
    },
    respondBooking: (id, accept) => {
      const b = bookings.find(x => x.id === id);
      if (!b) return { ok: false, reason: "That session could not be found." };
      if (!mayAct(b.pairId, other(b.proposedBy))) return { ok: false, reason: "Only the other person can answer this proposal." };
      if (b && b.status !== "proposed") return { ok: false, reason: "This proposal was already answered." };
      if (b && isStaleProposal(b)) return { ok: false, reason: "That time has passed, so it can no longer be answered. Propose a new time." };
      if (b && accept) {
        const clash = mentorClash(b.pairId, b, id);
        if (clash) return { ok: false, reason: `This overlaps another session (${clash.mentee}). Decline it or ask for a different time.` };
      }
      setBookings(p => p.map(x => (x.id === id ? { ...x, status: accept ? "confirmed" : "declined" } : x)));
      if (b) emit(b.proposedBy, b.pairId, `Your proposed session on ${fmtDate(b.date)} was ${accept ? "confirmed" : "declined"}`, accept ? "good" : "warn");
      return { ok: true };
    },
    cancelBooking: id => {
      const b = bookings.find(x => x.id === id);
      if (b && !inPair(b.pairId)) return;
      setBookings(p => p.map(x => (x.id === id ? { ...x, status: "cancelled" } : x)));
      if (b) { emit("mentor", b.pairId, `Session on ${fmtDate(b.date)} was cancelled`, "warn"); emit("mentee", b.pairId, `Session on ${fmtDate(b.date)} was cancelled`, "warn"); }
    },
    sendMessage: (pairId, from, text) => !mayAct(pairId, from) ? undefined : setMessages(p => [...p, { id: `m${++TS}`, pairId, from, text, time: nowLabel(), date: todayISO(), ts: TS, read: false }]),
    markRead: (pairId, reader) => !mayAct(pairId, reader) ? undefined : setMessages(p => (p.some(m => m.pairId === pairId && m.from !== reader && !m.read) ? p.map(m => (m.pairId === pairId && m.from !== reader ? { ...m, read: true } : m)) : p)),
    unread: (pairId, reader) => messages.filter(m => m.pairId === pairId && m.from !== reader && !m.read).length,
    proposeGoal: ({ pairId, by, ...rest }) => {
      if (!mayAct(pairId, by)) return;
      setGoals(p => [...p, { id: `g${++TS}`, pairId, pct: 0, status: "proposed", proposedBy: by, ...rest }]);
      emit(other(by), pairId, `${by === "mentor" ? who(pairId)?.mentor : who(pairId)?.mentee} proposed a goal: ${rest.title}`, "warn");
    },
    approveGoal: id => {
      const g = goals.find(x => x.id === id);
      if (!g || g.status !== "proposed" || (g.proposedBy && !mayAct(g.pairId, other(g.proposedBy)))) return;
      setGoals(p => p.map(x => (x.id === id ? { ...x, status: "on-track" } : x)));
      if (g?.proposedBy) emit(g.proposedBy, g.pairId, `Goal approved: ${g.title}`, "good");
    },
    submitProgress: (id, pct, note) => {
      const g = goals.find(x => x.id === id); if (!g) return { ok: false, reason: "Goal not found." };
      if (g.status === "proposed" || g.status === "complete") return { ok: false, reason: g.status === "complete" ? "This goal is already complete." : "This goal has not been approved yet." };
      const v = Math.round(pct);
      if (!Number.isFinite(v) || v < 0 || v > 99) return { ok: false, reason: "Progress must be between 0% and 99%. Your mentor signs a goal off at 100%." };
      if (v === g.pct) return { ok: false, reason: "That is the same as the current progress." };
      if (!note.trim()) return { ok: false, reason: "Say what you did or achieved so your mentor can confirm it." };
      setGoals(p => p.map(x => (x.id === id ? { ...x, pending: { pct: v, note: note.trim(), at: todayISO() } } : x)));
      emit("mentor", g.pairId, `${who(g.pairId)?.mentee} reported "${g.title}" at ${v}% (was ${g.pct}%). Please review.`, "warn");
      return { ok: true };
    },
    reviewProgress: (id, decision, opts) => {
      const g = goals.find(x => x.id === id); if (!g || !g.pending) return { ok: false, reason: "There is no update waiting for review." };
      const pending = g.pending;
      if (decision === "decline") {
        setGoals(p => p.map(x => (x.id === id ? { ...x, pending: undefined } : x)));
        emit("mentee", g.pairId, `Your update on "${g.title}" was not confirmed.${opts?.comment?.trim() ? ` Mentor says: ${opts.comment.trim()}` : " Talk to your mentor about what is still needed."}`, "warn");
        return { ok: true };
      }
      const to = decision === "adjust" ? Math.round(opts?.pct ?? NaN) : pending.pct;
      if (!Number.isFinite(to) || to < 0 || to > 99) return { ok: false, reason: "Enter a percentage between 0 and 99. Use sign-off to complete a goal." };
      setGoals(p => p.map(x => (x.id === id ? { ...x, pct: to, pending: undefined, log: [{ at: todayISO(), from: g.pct, to, note: pending.note, adjusted: to !== pending.pct }, ...(x.log ?? [])] } : x)));
      emit("mentee", g.pairId, to === pending.pct ? `Your update on "${g.title}" was confirmed at ${to}%.` : `Your mentor set "${g.title}" to ${to}% (you reported ${pending.pct}%).${opts?.comment?.trim() ? ` ${opts.comment.trim()}` : ""}`, "good");
      return { ok: true };
    },
    assignTask: (pairId, title, due) => {
      if (!who(pairId)) return { ok: false, reason: "This pairing no longer exists." };
      if (!mayAct(pairId, "mentor")) return NOT_YOURS;
      setTasks(p => [...p, { id: `t${++TS}`, pairId, title, due, status: "pending", from: "Mentor" }]);
      emit("mentee", pairId, `New task from ${who(pairId)?.mentor}: ${title}`, "warn");
      return { ok: true };
    },
    requestRematch: (pairId, reason, by = "mentee") => {
      const p = who(pairId); if (!p) return;
      if (by === "admin" ? !adminOnly() : !mayAct(pairId, "mentee")) return;
      if (rematches.some(r => r.pairId === pairId && r.status === "open")) return;
      setRematches(r => [{ id: `r${++TS}`, pairId, mentee: p.mentee, reason, at: todayISO(), status: "open" }, ...r.filter(x => x.pairId !== pairId)]);
      if (by === "admin") {
        emit("mentor", pairId, `The programme team has started a re-match review for ${p.mentee}.`, "warn");
        emit("mentee", pairId, "The programme team has started a re-match review for your pairing. You will be told the outcome.", "info");
      } else emit("mentor", pairId, `${p.mentee} has requested a re-match. The programme team will review.`, "warn");
    },
    resolveRematch: id => !adminOnly() ? undefined : setRematches(r => r.map(x => (x.id === id ? { ...x, status: "handled" } : x))),
    addPrivateNote: (pairId, text) => {
      if (!who(pairId)) return { ok: false, reason: "This pairing no longer exists." };
      if (!mayAct(pairId, "mentor")) return NOT_YOURS;
      setPrivateNotes(p => [{ id: `n${++TS}`, pairId, text, at: todayISO() }, ...p]);
      return { ok: true };
    },
    eventsFor: (role, pairIds) => events.filter(e => e.to === role && pairIds.includes(e.pairId)),
    syncIntegration: name => setIntegrations(p => p.map(i => (i.name === name ? { ...i, lastSync: "Just now" } : i))),
  };
  return <ProgrammeCtx.Provider value={value}>{children}</ProgrammeCtx.Provider>;
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function buildReport(c: Ctx, period: Period, cohortId?: number) {
  const { days } = PERIODS[period];
  const ps = c.pairs.filter(p => cohortId == null || p.cohortId === cohortId);
  const ids = new Set(ps.map(p => p.id));
  // Archived pairs (after a re-match) still count toward what happened in the programme
  const past = c.pastPairs.filter(p => cohortId == null || p.cohortId === cohortId);
  const allPs = [...ps, ...past], allIds = new Set(allPs.map(p => p.id));
  const ss = c.sessions.filter(s => allIds.has(s.pairId));
  const today = todayISO();
  const inWin = (s: Session, from: number, to: number) => { const a = daysBetween(s.date, today); return a >= from && a < to; };
  const cur = ss.filter(s => inWin(s, 0, days + 1)), prev = ss.filter(s => inWin(s, days + 1, days * 2 + 2));
  const rated = cur.filter(s => s.rating != null);
  const gs = c.goals.filter(g => ids.has(g.pairId) && g.status !== "proposed"), ts = c.tasks.filter(t => allIds.has(t.pairId) && t.from === "Mentor");
  const ms = ps.map(p => effectiveMilestones(p, c.goals));
  const tasksDone = ts.filter(t => t.status === "done").length, goalsDone = gs.filter(g => g.status === "complete").length;
  const milestoneCount = ms.reduce((a, m) => a + Object.values(m).filter(Boolean).length, 0);
  const perMentor = Object.values(Object.fromEntries(allPs.map(p => [mentorKey(p), p]))).map(m => ({ mentor: m.mentor, sessions: cur.filter(s => { const q = allPs.find(p => p.id === s.pairId); return !!q && mentorKey(q) === mentorKey(m); }).length }));
  // Trailing 12 months ending this month, from the real session log
  const monthly: { month: string; year: number; sessions: number; current?: boolean }[] = [];
  for (let k = 11; k >= 0; k--) {
    const first = addMonths(today, -k), key = monthKey(first);
    monthly.push({ month: monthShort(first), year: Number(first.slice(0, 4)), sessions: ss.filter(x => monthKey(x.date) === key).length, current: k === 0 });
  }
  const n = ps.length || 1;
  const withRecent = ps.filter(p => c.stats[p.id]?.daysSince != null && c.stats[p.id].daysSince! <= 30).length;
  return {
    pairCount: ps.length, sessions: cur.length, sessionsPrev: prev.length,
    avgGoal: gs.length ? Math.round(gs.reduce((a, g) => a + g.pct, 0) / gs.length) : 0, goalsDone, goalsTotal: gs.length,
    satisfaction: rated.length ? Math.round((rated.reduce((a, s) => a + s.rating!, 0) / rated.length) * 20) : null,
    impact: cur.length * 10 + tasksDone * 5 + goalsDone * 15 + milestoneCount * 25, // sessions×10 + tasks×5 + goals×15 + milestones×25
    perSessionsPerWeek: +(cur.length / n / (days / 7)).toFixed(1),
    taskPct: ts.length ? Math.round((tasksDone / ts.length) * 100) : 0,
    activePairRate: Math.round((withRecent / n) * 100),
    coursePct: (() => { const cs = c.courses.filter(x => ids.has(x.pairId)); const tot = cs.reduce((a, x) => a + x.total, 0); return tot ? Math.round((cs.reduce((a, x) => a + x.done, 0) / tot) * 100) : 0; })(),
    onTrackPct: Math.round((ps.filter(p => { const h = c.stats[p.id]?.health; return h === "Healthy" || h === "New"; }).length / n) * 100),
    perMentor, monthly,
    outcomes: [
      { label: "Businesses Registered", val: ms.filter(m => m.registered).length },
      { label: "Reached MVP Stage", val: ms.filter(m => m.mvp).length },
      { label: "First Revenue", val: ms.filter(m => m.firstRevenue).length },
      { label: "Grant Applications", val: ms.filter(m => m.grant).length },
      { label: "Programme Graduation", val: ms.filter(m => m.graduated).length },
    ],
  };
}

/** Default number of mentees one mentor can take when the mentor has no capacity set. */
export const DEFAULT_MENTOR_CAPACITY = 4;
export const MAX_MENTOR_CAPACITY = 20;
/** Same person? By ID when both sides have one; name is only used for legacy records that never had an ID. */
export const sameMentee = (a: { menteeId?: string; mentee: string }, b: { menteeId?: string; mentee: string }) =>
  a.menteeId && b.menteeId ? a.menteeId === b.menteeId : a.mentee.trim().toLowerCase() === b.mentee.trim().toLowerCase();

/** A mentor is identified by ID. The name is only a fallback for legacy pairs that never recorded a mentorId, so two mentors with the same name are never merged. */
export type MentorRef = { id?: string; name: string };
export const isMentorOf = (p: { mentorId?: string; mentor: string }, m: MentorRef) => (p.mentorId ? p.mentorId === m.id : p.mentor === m.name);
/** Stable key for grouping pairs by mentor: the ID, else a name-based key for legacy pairs. */
export const mentorKey = (p: { mentorId?: string; mentor: string }) => p.mentorId ?? `name:${p.mentor}`;
/** First name for greetings: skips titles like "Dr." or "Prof.", so "Dr. Tiwonge Banda" is "Tiwonge" and "Limbani Gondwe" is "Limbani". */
export const firstName = (full: string) => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  while (parts.length > 1 && /^(dr|prof|professor|mr|mrs|ms|miss|mx|eng|engr|hon|rev|pastor|sir|madam)\.?$/i.test(parts[0])) parts.shift();
  return parts[0] ?? "";
};

/** Same weighting as the admin Impact Score, scoped to one mentor. Sessions and tasks from pairs later re-matched still credit the mentor who did the work. */
export function mentorImpact(c: Ctx, mentor: MentorRef) {
  const ps = c.pairs.filter(p => isMentorOf(p, mentor)), ids = new Set(ps.map(p => p.id));
  const allIds = new Set([...ps, ...c.pastPairs.filter(p => isMentorOf(p, mentor))].map(p => p.id));
  return c.sessions.filter(s => allIds.has(s.pairId)).length * 10
    + c.tasks.filter(x => allIds.has(x.pairId) && x.from === "Mentor" && x.status === "done").length * 5
    + c.goals.filter(g => ids.has(g.pairId) && g.status === "complete").length * 15
    + ps.reduce((a, p) => a + Object.values(effectiveMilestones(p, c.goals)).filter(Boolean).length, 0) * 25;
}
