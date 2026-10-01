// Shared programme store (frontend sample data).
// Mentor dashboard, mentee dashboard and the four Programme Admin pages all read/write here,
// so a change made in one place (log a session, rate it, sign off a goal, connect Zoom)
// shows up everywhere. Swap the seed + actions for API calls when the backend exists.
import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";

// The sample world "today". Replace with `new Date()` when real data arrives.
export const AS_OF = "2025-07-28";
let TS = 0; // shared id counter (persisted so ids stay unique across reloads)
const DAY = 86400000;
const d = (iso: string) => new Date(iso + "T00:00:00Z").getTime();
export const daysBetween = (a: string, b: string) => Math.round((d(b) - d(a)) / DAY);
export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// Demo logins (the dashboards have no auth yet)
export const DEMO_MENTOR = "Dr. Tiwonge Banda";
export const DEMO_MENTEE = "Chisomo Banda";

export type Role = "mentor" | "mentee";
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
  /** Introductory call date (ISO). Undefined = not scheduled yet. */
  introDate?: string;
  /** only on archived pairs (see pastPairs) */
  endedAt?: string; endReason?: string; successorId?: string;
}
/** A mentee who is enrolled and waiting for a mentor (no Pair exists yet). */
export interface Waiting { id: string; menteeId?: string; mentee: string; venture: string; sector: string; stage: string }
export interface Session {
  id: string; pairId: string; date: string; durationMin: number; mode: "Virtual" | "In-person";
  topics: string[]; tasks: string[]; notes: string; rating: number | null;
}
export interface Goal {
  id: string; pairId: string; title: string; category: string; pct: number; due: string;
  status: "on-track" | "at-risk" | "complete" | "proposed";
  proposedBy?: Role;
  smart?: { S: string; M: string; A: string; R: string; T: string };
}
export interface Task { id: string; pairId: string; title: string; due: string; status: "pending" | "in-progress" | "done"; from: string }
export interface RubricRow { label: string; weight: number }
export interface Cohort {
  id: number; name: string; status: "Active" | "Completed"; startDate: string; endDate: string; sector: string;
  enrolled: number; rubric: RubricRow[];
  snapshot?: { mentees: number; mentors: number; avgProgress: number }; // completed cohorts have no live pairs
}
/** Single source for "how many are enrolled" (Cohort Management, Program Setup and the public card all use this).
 *  Never lower than the mentees actually in the cohort: paired + still waiting (who join the active cohort). */
export const cohortEnrolled = (c: Cohort, pairs: Pair[], waitingCount: number) => {
  const ps = pairs.filter(p => p.cohortId === c.id);
  return ps.length > 0
    ? Math.max(c.enrolled, ps.length + (c.status === "Active" ? waitingCount : 0))
    : c.snapshot?.mentees ?? c.enrolled;
};
export interface Booking { id: string; pairId: string; date: string; time: string; durationMin: number; mode: "Virtual" | "In-person"; proposedBy: Role; status: "proposed" | "confirmed" | "declined" | "cancelled" }
export interface Message { id: string; pairId: string; from: Role; text: string; time: string; ts: number; read: boolean }
export interface AppEvent { id: string; to: Role; pairId: string; text: string; time: string; ts: number; tone: "info" | "warn" | "good" }
export interface Rematch { id: string; pairId: string; mentee: string; reason: string; at: string; status: "open" | "handled" }
export interface PrivateNote { id: string; pairId: string; text: string; at: string }
export interface Course { id: string; pairId: string; title: string; done: number; total: number; goalId?: string }
export interface Resource { id: string; title: string; type: string; tag: string }
export interface Share { id: string; resourceId: string; pairId: string; by: string; at: string }
export interface MentorProfile { title: string; expertise: string[]; bio: string; location: string; responseTime: string; email: string }
export interface Nudge { id: string; pairId: string; at: string; text: string; channel: string }
export interface Intervention { pairId: string; openedAt: string; resolved: boolean }
export interface Integration {
  name: string; category: string; status: "Connected" | "Not Connected" | "Configurable"; desc: string; lastSync: string;
}

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
/** "Jul 31" → "2025-07-31"; free text such as "Next session" → null */
export const dueIso = (due: string) => { const m = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(due); return m && MONTHS[m[1]] ? `2025-${MONTHS[m[1]]}-${m[2].padStart(2, "0")}` : null; };
export const isOverdue = (t: Task) => { const iso = dueIso(t.due); return t.status !== "done" && !!iso && iso < AS_OF; };
export type BookingResult = { ok: true } | { ok: false; reason: string };
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
/** Same mentor, same day, overlapping time range (a 60-min session at 10:00 blocks 10:00–11:00). */
export const overlaps = (a: { date: string; time: string; durationMin: number }, b: { date: string; time: string; durationMin: number }) =>
  a.date === b.date && toMin(a.time) < toMin(b.time) + b.durationMin && toMin(b.time) < toMin(a.time) + a.durationMin;
export const fmtBooking = (b: Booking) => `${new Date(b.date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}, ${b.time}`;
/** Countdown from the sample "now" (AS_OF 08:00) */
export const countdown = (b: Booking) => { const ms = Math.max(0, new Date(`${b.date}T${b.time}:00Z`).getTime() - new Date(`${AS_OF}T08:00:00Z`).getTime()); return { days: Math.floor(ms / DAY), hrs: Math.floor((ms % DAY) / 3600000), min: Math.floor((ms % 3600000) / 60000) }; };

const M = (o: Partial<Milestones> = {}): Milestones => ({ registered: false, mvp: false, firstRevenue: false, grant: false, graduated: false, ...o });
const DEFAULT_RUBRIC: RubricRow[] = [
  { label: "Business Registration", weight: 15 }, { label: "Market Validation (≥50 interviews)", weight: 20 },
  { label: "Revenue Milestone", weight: 25 }, { label: "Session Attendance", weight: 15 },
  { label: "Goal Completion Rate", weight: 15 }, { label: "Mentor Satisfaction", weight: 10 },
];

// Same four matched pairs as Pairing & Matching's sample data
const PAIRS: Pair[] = [
  { id: "p1", menteeId: "APP-001", mentorId: "MNT-017", introDate: "2025-07-30", mentee: "Chisomo Banda", mentor: "Dr. Tiwonge Banda", venture: "AgroConnect Malawi", sector: "AgriTech", stage: "Validation", expertise: "AgriTech and Finance", matchScore: 91, cohortId: 1, startDate: "2025-05-12", milestones: M() },
  { id: "p2", menteeId: "APP-025", mentorId: "MNT-018", introDate: "2025-07-30", mentee: "Kondwani Phiri", mentor: "Prof. Patrick Likoswe", venture: "EduBridge", sector: "EdTech", stage: "MVP", expertise: "EdTech & Curriculum", matchScore: 86, cohortId: 1, startDate: "2025-05-12", milestones: M({ registered: true, mvp: true, firstRevenue: true }) },
  { id: "p3", menteeId: "APP-026", mentorId: "MNT-019", mentee: "Tadala Chirwa", mentor: "Limbani Gondwe", venture: "CleanHeat", sector: "CleanEnergy", stage: "Idea", expertise: "CleanEnergy and Hardware", matchScore: 79, cohortId: 1, startDate: "2025-05-19", milestones: M() },
  { id: "p6", menteeId: "APP-027", mentorId: "MNT-018", mentee: "Yamikani Mwale", mentor: "Prof. Patrick Likoswe", venture: "LearnLoop", sector: "EdTech", stage: "Idea", expertise: "EdTech & Curriculum", matchScore: 74, cohortId: 1, startDate: "2025-05-12", milestones: M() },
  { id: "p5", menteeId: "APP-028", mentorId: "MNT-020", introDate: "2025-07-31", mentee: "Grace Kamwendo", mentor: "Dr. Chimwemwe Phiri", venture: "HealthTrack", sector: "HealthTech", stage: "MVP", expertise: "HealthTech & UX", matchScore: 88, cohortId: 1, startDate: "2025-05-12", milestones: M({ registered: true, mvp: true, grant: true }) },
  // Confirmed in the admin Matching pipeline, so they exist as real pairs (no sessions yet → "New" until the first one is logged)
  { id: "p7", menteeId: "APP-005", mentorId: "MNT-005", introDate: "2025-08-01", mentee: "Lusungu Nyirenda", mentor: "Mrs. Faith Nyirenda", venture: "Nyirenda Logistics", sector: "Services", stage: "MVP", expertise: "Marketing", matchScore: 94, cohortId: 1, startDate: "2025-07-21", matchedAt: "2025-07-21", milestones: M() },
  { id: "p8", menteeId: "APP-022", mentorId: "MNT-003", mentee: "Dalitso Mvula", mentor: "Ms. Rejoice Mwale", venture: "GreenSprout Hydroponics", sector: "Agri-Business", stage: "MVP", expertise: "Agriculture", matchScore: 95, cohortId: 1, startDate: "2025-07-21", matchedAt: "2025-07-21", milestones: M() },
  { id: "p9", menteeId: "APP-024", mentorId: "MNT-010", mentee: "Enelesi Phiri", mentor: "Mr. Charles Nkosi", venture: "Zomba Weavers Co-op", sector: "Creative Arts", stage: "Early Traction", expertise: "Business Strategy", matchScore: 86, cohortId: 1, startDate: "2025-07-21", matchedAt: "2025-07-21", milestones: M() },
  { id: "p10", menteeId: "APP-010", mentorId: "MNT-007", mentee: "Alinafe Gondwe", mentor: "Ms. Miriam Kamwana", venture: "Lakeside Hospitality Solutions", sector: "Services", stage: "Early Traction", expertise: "Social Enterprise", matchScore: 89, cohortId: 1, startDate: "2025-07-21", matchedAt: "2025-07-21", milestones: M() },
];

const S = (pairId: string, date: string, durationMin: number, mode: Session["mode"], topics: string[], tasks: string[], rating: number | null, notes = ""): Session =>
  ({ id: `s${++TS}`, pairId, date, durationMin, mode, topics, tasks, notes, rating });
const WAITING: Waiting[] = [
  { id: "w1", menteeId: "APP-029", mentee: "Madalitso Chiumia", venture: "FarmLink", sector: "AgriTech", stage: "Idea" },
  { id: "w2", menteeId: "APP-015", mentee: "Tamara Kachingwe", venture: "FinLit Mobile", sector: "Financial Services", stage: "MVP / Prototype" },
  { id: "w3", menteeId: "APP-023", mentee: "Brian Kumwenda", venture: "Mzuzu Coders Hub", sector: "Technology", stage: "MVP / Prototype" },
];
const SESSIONS: Session[] = [
  S("p1", "2025-07-24", 55, "Virtual", ["Pricing model", "Competitor analysis"], ["Survey 10 more farmers", "Draft pricing deck"], 5, "Discussed tiered pricing. Tiwonge shared template for competitive landscape mapping."),
  S("p1", "2025-07-10", 60, "Virtual", ["Business registration", "Grant research"], ["File registration docs", "Apply to Malawi Agri Grant"], 4, "Mapped out registration timeline. Identified 3 grant opportunities matching our stage."),
  S("p1", "2025-06-26", 45, "In-person", ["Product feedback", "Pilot expansion"], ["Pilot 5 new farmers"], 5, "Deep dive into pilot feedback — strong product signal. Agreed to expand to 15 farmers."),
  S("p2", "2025-07-21", 60, "Virtual", ["School partnership pitch"], ["Send MOU template to schools in Lilongwe"], 4),
  S("p2", "2025-07-07", 50, "Virtual", ["Pricing for schools"], ["Draft school pricing tiers"], 5),
  S("p2", "2025-06-23", 45, "Virtual", ["Pilot review"], ["Collect teacher feedback"], 4),
  S("p3", "2025-07-18", 45, "In-person", ["Prototype scoping", "Co-founder profile"], ["Post co-founder listing on StartHub Malawi"], 3),
  S("p3", "2025-06-30", 40, "Virtual", ["Cookstove cost model"], ["Get 3 supplier quotes"], 3),
  S("p6", "2025-05-30", 30, "Virtual", ["Idea validation"], ["Interview 10 teachers"], 2),
  S("p6", "2025-05-16", 30, "Virtual", ["Problem framing"], ["Write problem statement"], 3),
  S("p5", "2025-07-22", 50, "Virtual", ["User research", "Clinic pilot"], ["Interview 5 clinic staff"], 5),
  S("p5", "2025-07-08", 45, "Virtual", ["MVP scope"], ["Finalise MVP feature list"], 4),
];

const GOALS: Goal[] = [
  { id: "g1", pairId: "p1", title: "Validate product-market fit with 50 farmers", category: "Market", pct: 64, due: "Aug 15", status: "on-track", smart: { S: "Conduct 50 structured interviews", M: "50 completed surveys", A: "Fieldwork in Mzimba district", R: "Core to revenue model", T: "Aug 15, 2025" } },
  { id: "g2", pairId: "p1", title: "Register business with Malawi Registrar General", category: "Legal", pct: 90, due: "Jul 30", status: "on-track", smart: { S: "File registration docs with Malawi Registrar General", M: "Certificate received", A: "Paperwork ready", R: "Unlocks grant eligibility", T: "Jul 30, 2025" } },
  { id: "g3", pairId: "p1", title: "Reach MWK 500,000 MRR milestone", category: "Revenue", pct: 28, due: "Sep 30", status: "at-risk", smart: { S: "Acquire 20 paying farmers", M: "MWK 500,000/month", A: "Pilot 5 farmers already", R: "Proves monetisation model", T: "Sep 30, 2025" } },
  { id: "g4", pairId: "p1", title: "Complete AgriFinance Fundamentals course", category: "Learning", pct: 75, due: "Aug 1", status: "on-track", smart: { S: "Finish 4 remaining modules", M: "Certificate earned", A: "3 hrs/week available", R: "Strengthens investor pitch", T: "Aug 1, 2025" } },
  { id: "g5", pairId: "p2", title: "3 school MOU partnerships", category: "Market", pct: 60, due: "Aug 10", status: "on-track" },
  { id: "g6", pairId: "p2", title: "Reach 200 active learners", category: "Revenue", pct: 45, due: "Sep 15", status: "on-track" },
  { id: "g7", pairId: "p3", title: "Prototype concept validation", category: "Product", pct: 25, due: "Aug 20", status: "at-risk" },
  { id: "g8", pairId: "p3", title: "Find technical co-founder", category: "Team", pct: 20, due: "Aug 30", status: "at-risk" },
  { id: "g11", pairId: "p6", title: "Validate problem with 10 teachers", category: "Market", pct: 10, due: "Jul 15", status: "at-risk" },
  { id: "g12", pairId: "p6", title: "Draft lean canvas", category: "Product", pct: 20, due: "Jul 30", status: "at-risk" },
  { id: "g9", pairId: "p5", title: "Pilot in 3 clinics", category: "Market", pct: 70, due: "Aug 25", status: "on-track" },
  { id: "g10", pairId: "p5", title: "Register business", category: "Legal", pct: 100, due: "Jun 30", status: "complete" },
];

const TASKS: Task[] = [
  { id: "t1", pairId: "p1", title: "Survey 10 more farmers in Mzimba district", due: "Jul 31", status: "in-progress", from: "Mentor" },
  { id: "t2", pairId: "p1", title: "Draft tiered pricing deck (3 tiers)", due: "Aug 2", status: "pending", from: "Mentor" },
  { id: "t3", pairId: "p1", title: "File business registration documents with BRS", due: "Jul 30", status: "done", from: "Mentor" },
  { id: "t4", pairId: "p1", title: "Complete Module 4: AgriFinance Fundamentals", due: "Aug 1", status: "in-progress", from: "Learning Academy" },
  { id: "t5", pairId: "p1", title: "Apply to Malawi Agri-Enterprise Grant (Round 2)", due: "Aug 5", status: "pending", from: "Self" },
  { id: "t13", pairId: "p1", title: "Map 3 competitor pricing models", due: "Jul 12", status: "done", from: "Mentor" },
  { id: "t14", pairId: "p1", title: "Share farmer interview script with field team", due: "Jul 5", status: "done", from: "Mentor" },
  { id: "t6", pairId: "p2", title: "Send MOU template to schools in Lilongwe", due: "Jul 28", status: "done", from: "Mentor" },
  { id: "t7", pairId: "p2", title: "Draft school pricing tiers", due: "Jul 20", status: "done", from: "Mentor" },
  { id: "t8", pairId: "p3", title: "Post co-founder listing on StartHub Malawi", due: "Jul 25", status: "pending", from: "Mentor" },
  { id: "t9", pairId: "p3", title: "Get 3 supplier quotes", due: "Jul 15", status: "pending", from: "Mentor" },
  { id: "t10", pairId: "p3", title: "Sketch prototype BOM", due: "Aug 2", status: "in-progress", from: "Mentor" },
  { id: "t15", pairId: "p6", title: "Interview 10 teachers", due: "Jun 10", status: "pending", from: "Mentor" },
  { id: "t16", pairId: "p6", title: "Write problem statement", due: "May 30", status: "pending", from: "Mentor" },
  { id: "t11", pairId: "p5", title: "Interview 5 clinic staff", due: "Jul 30", status: "in-progress", from: "Mentor" },
  { id: "t12", pairId: "p5", title: "Finalise MVP feature list", due: "Jul 20", status: "done", from: "Mentor" },
];

const BOOKINGS: Booking[] = [
  { id: "b1", pairId: "p1", date: "2025-07-31", time: "10:00", durationMin: 60, mode: "Virtual", proposedBy: "mentor", status: "confirmed" },
  { id: "b2", pairId: "p2", date: "2025-08-01", time: "14:00", durationMin: 60, mode: "Virtual", proposedBy: "mentor", status: "confirmed" },
  { id: "b3", pairId: "p3", date: "2025-08-04", time: "11:00", durationMin: 45, mode: "In-person", proposedBy: "mentor", status: "confirmed" },
  { id: "b4", pairId: "p5", date: "2025-08-05", time: "09:00", durationMin: 45, mode: "Virtual", proposedBy: "mentee", status: "confirmed" },
];
const MSG = (pairId: string, from: Role, text: string, time: string, read = true): Message => ({ id: `m${++TS}`, pairId, from, text, time, ts: TS, read });
const MESSAGES: Message[] = [
  MSG("p1", "mentor", "Great work on the survey progress! Keep at it — you are so close to the target.", "10:24 AM"),
  MSG("p1", "mentee", "Thanks Dr. Tiwonge! I should hit 50 by Friday. I also drafted the pricing tiers — will share tonight.", "10:31 AM"),
  MSG("p1", "mentor", "Perfect. Also check your email — I shared a competitive analysis template that might save you time.", "10:35 AM"),
  MSG("p1", "mentee", "Got it, thank you! See you at our session on Thursday.", "10:42 AM", false),
  MSG("p2", "mentor", "How did the school meeting go?", "Yesterday"),
  MSG("p2", "mentee", "MOU template sent to 2 schools in Lilongwe!", "Yesterday"),
  MSG("p3", "mentee", "Found a potential co-founder on StartHub Malawi!", "Jul 20", false),
  MSG("p3", "mentor", "Excellent! Set up a coffee chat. I will share a co-founder alignment checklist.", "Jul 20"),
  MSG("p6", "mentor", "Checking in. I have not heard from you since May. Can we book a session?", "Jun 12", false),
  MSG("p5", "mentee", "Clinic pilot kicks off next week. Can we review the interview script?", "Jul 23", false),
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
];
const MENTOR_PROFILES: Record<string, MentorProfile> = {
  "Dr. Tiwonge Banda": { title: "Serial Entrepreneur & AgriTech Advisor", expertise: ["Agricultural Finance", "Market Entry", "Product-Market Fit", "Impact Investing"], bio: "15+ years scaling agri-ventures across Africa. Founded 3 successful startups, exited 2. Passionate about food-system innovation.", location: "Mzimba, Malawi", responseTime: "< 2 hours", email: "tiwonge.banda@example.com" },
  "Prof. Patrick Likoswe": { title: "EdTech & Curriculum Specialist", expertise: ["Curriculum Design", "School Partnerships", "EdTech Sales"], bio: "Former head of curriculum development. Helps education ventures win public-school partnerships.", location: "Blantyre, Malawi", responseTime: "< 4 hours", email: "patrick.likoswe@example.com" },
  "Limbani Gondwe": { title: "CleanEnergy & Hardware Engineer", expertise: ["Cookstove Design", "Hardware Prototyping", "Supply Chains"], bio: "Hardware engineer who has shipped clean-energy products to rural households across Central Malawi.", location: "Lilongwe, Malawi", responseTime: "< 1 day", email: "limbani.gondwe@example.com" },
  "Dr. Chimwemwe Phiri": { title: "HealthTech & UX Lead", expertise: ["Health Systems", "User Research", "Clinical Pilots"], bio: "Leads digital-health pilots with district hospitals; strong on user research and product usability.", location: "Zomba, Malawi", responseTime: "< 3 hours", email: "chimwemwe.phiri@example.com" },
};
export const mentorProfile = (name: string, expertise = "Business"): MentorProfile =>
  MENTOR_PROFILES[name] ?? { title: "Programme Mentor", expertise: [expertise], bio: "Programme mentor.", location: "Malawi", responseTime: "< 1 day", email: "" };
export const downloadResource = (r: Resource) => {
  const url = URL.createObjectURL(new Blob([`${r.title}\n${r.type} · ${r.tag}\n\n(Sample content. Replace with the real file when the backend is connected.)\n`], { type: "text/plain" }));
  Object.assign(document.createElement("a"), { href: url, download: `${r.title.replace(/[^a-z0-9]+/gi, "-")}.txt` }).click();
  URL.revokeObjectURL(url);
};

const COHORTS: Cohort[] = [
  { id: 1, name: "Cohort 5 — 2025", status: "Active", startDate: "Jan 2025", endDate: "Dec 2025", sector: "Mixed", enrolled: 9, rubric: DEFAULT_RUBRIC },
  { id: 2, name: "Cohort 4 — 2024", status: "Completed", startDate: "Jan 2024", endDate: "Dec 2024", sector: "AgriTech", enrolled: 22, rubric: DEFAULT_RUBRIC, snapshot: { mentees: 22, mentors: 10, avgProgress: 100 } },
  { id: 3, name: "Cohort 3 — 2023", status: "Completed", startDate: "Jan 2023", endDate: "Dec 2023", sector: "CleanEnergy", enrolled: 16, rubric: DEFAULT_RUBRIC, snapshot: { mentees: 16, mentors: 7, avgProgress: 100 } },
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

// Jan–Apr session counts from before the tracked sample window (Sessions before May are not seeded individually)
const ARCHIVED_MONTHLY: Record<string, number> = { "2025-01": 3, "2025-02": 5, "2025-03": 6, "2025-04": 8 };

// ── Derived metrics (pure functions, so admin + dashboards agree) ──────────────
export interface PairStats {
  health: Health; sessionsTotal: number; sessions7d: number; lastSession: string | null; daysSince: number | null;
  satisfaction: number | null; goalPct: number; taskPct: number | null; openTasks: number;
  goalsOnTrack: number; goalsAtRisk: number; trend: "up" | "down" | "stable"; reasons: string[];
}
export function computePairStats(pair: Pair, sessions: Session[], goals: Goal[], tasks: Task[]): PairStats {
  const ss = sessions.filter(s => s.pairId === pair.id).sort((a, b) => b.date.localeCompare(a.date));
  const gs = goals.filter(g => g.pairId === pair.id && g.status !== "proposed");
  const ts = tasks.filter(t => t.pairId === pair.id && t.from === "Mentor");
  const rated = ss.filter(s => s.rating != null);
  const last3 = rated.slice(0, 3);
  const satisfaction = last3.length ? Math.round((last3.reduce((a, s) => a + (s.rating as number), 0) / last3.length) * 20) : null;
  const daysSince = ss.length ? daysBetween(ss[0].date, AS_OF) : null;
  const goalPct = gs.length ? Math.round(gs.reduce((a, g) => a + g.pct, 0) / gs.length) : 0;
  const taskPct = ts.length ? Math.round((ts.filter(t => t.status === "done").length / ts.length) * 100) : null;
  const relStart = pair.matchedAt ?? pair.startDate;
  const overdueBase = daysSince ?? daysBetween(relStart, AS_OF);

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
  if (!ss.length && daysBetween(relStart, AS_OF) <= 21) health = "New";
  const trend = rated.length >= 2 ? (rated[0].rating! > rated[1].rating! ? "up" : rated[0].rating! < rated[1].rating! ? "down" : "stable") : "stable";
  return {
    health, sessionsTotal: ss.length, sessions7d: ss.filter(s => daysBetween(s.date, AS_OF) <= 7).length,
    lastSession: ss[0]?.date ?? null, daysSince, satisfaction, goalPct, taskPct,
    openTasks: tasks.filter(t => t.pairId === pair.id && t.status !== "done").length,
    goalsOnTrack: gs.filter(g => g.status !== "at-risk").length, goalsAtRisk: gs.filter(g => g.status === "at-risk").length,
    trend, reasons: [...stalled, ...risk],
  };
}

export function effectiveMilestones(p: Pair, goals: Goal[]): Milestones {
  const done = (cat: string) => goals.some(g => g.pairId === p.id && g.category === cat && g.status === "complete");
  return { ...p.milestones, registered: p.milestones.registered || done("Legal"), firstRevenue: p.milestones.firstRevenue || done("Revenue") };
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
  mentorLoad: (mentor: string) => number;
  declineRematch: (id: string) => void;
  addWaiting: (w: Omit<Waiting, "id">) => void;
  removeWaiting: (mentee: string) => void;
  /** Set (or clear with "") the introductory-call date for a pair. */
  scheduleIntro: (pairId: string, date: string) => void;
  /** Ends a live pair (archives it, cancels open bookings/rematches, notifies both sides) and puts the mentee back in the waiting list. */
  endPair: (pairId: string, reason: string, opts?: { requeue?: boolean }) => void;
  completeModule: (courseId: string) => void;
  shareResource: (resourceId: string, pairIds: string[]) => void;
  resetDemo: () => void;
  bookings: Booking[]; messages: Message[]; events: AppEvent[]; rematches: Rematch[]; privateNotes: PrivateNote[];
  currentUser: { role: Role; name: string } | null;
  signIn: (role: Role | null, name?: string) => void;
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
  updateGoalProgress: (id: string, pct: number) => void;
  assignTask: (pairId: string, title: string, due: string) => void;
  requestRematch: (pairId: string, reason: string, by?: "mentee" | "admin") => void;
  resolveRematch: (id: string) => void;
  addPrivateNote: (pairId: string, text: string) => void;
  eventsFor: (role: Role, pairIds: string[]) => AppEvent[];
  cohortName: (id: number) => string;
  integrationOn: (name: string) => boolean;
  videoProvider: string | null; calendarProvider: string | null;
  logSession: (i: { pairId: string; durationMin: number; mode: Session["mode"]; topics: string[]; notes: string; task?: string }) => void;
  rateSession: (id: string, rating: number) => void;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  signOffGoal: (id: string) => void;
  sendNudge: (pairId: string) => Nudge;
  openIntervention: (pairId: string) => void;
  resolveIntervention: (pairId: string) => void;
  addCohort: (c: { name: string; startDate: string; endDate: string; sector: string; enrolled: number }) => void;
  setRubric: (cohortId: number, rubric: RubricRow[]) => void;
  /** New mentee → creates a pair. Mentee already paired → re-match: archives the old pair and carries goals, open tasks, courses and milestones over. */
  addPair: (i: { menteeId?: string; mentorId?: string; mentee: string; mentor: string; venture: string; sector: string; expertise: string; matchScore: number; stage?: string }) => void;
  connectIntegration: (name: string) => void;
  disconnectIntegration: (name: string) => void;
  syncIntegration: (name: string) => void;
}
const KEY = "emerge.programme.v3";
const USER_KEY = "emerge.user.v2";
type Saved = Partial<{ pairs: Pair[]; sessions: Session[]; goals: Goal[]; tasks: Task[]; cohorts: Cohort[]; integrations: Integration[]; nudges: Nudge[]; interventions: Intervention[]; bookings: Booking[]; messages: Message[]; events: AppEvent[]; rematches: Rematch[]; privateNotes: PrivateNote[]; courses: Course[]; shares: Share[]; pastPairs: Pair[]; waiting: Waiting[]; ts: number }>;
function loadSaved(): Saved {
  try { const r = localStorage.getItem(KEY); const s: Saved = r ? JSON.parse(r) : {}; TS = Math.max(TS, s.ts ?? 0); return s; } catch { return {}; }
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
  const [courses, setCourses] = useState<Course[]>(saved.courses ?? COURSES);
  const [shares, setShares] = useState<Share[]>(saved.shares ?? []);
  const [pastPairs, setPastPairs] = useState<Pair[]>(saved.pastPairs ?? []);
  const [waiting, setWaiting] = useState<Waiting[]>(saved.waiting ?? WAITING);
  // The signed-in user is per browser TAB (sessionStorage) so two tabs can be two different people.
  const [currentUser, setCurrentUser] = useState<{ role: Role; name: string } | null>(() => { try { const r = sessionStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; } });

  // Persist shared data on every change
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, bookings, messages, events, rematches, privateNotes, courses, shares, pastPairs, waiting, ts: TS })); } catch { /* storage full or blocked */ }
  }, [pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, bookings, messages, events, rematches, privateNotes, courses, shares, pastPairs, waiting]);

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
        const mine = new Set([...(s.pairs ?? live.current.pairs), ...(s.pastPairs ?? live.current.pastPairs)].filter(p => (u.role === "mentor" ? p.mentor : p.mentee) === u.name).map(p => p.id));
        s.events.filter(x => !known.has(x.id) && x.to === u.role && mine.has(x.pairId)).slice(0, 3).forEach(x => toast(x.text));
      }
      s.pairs && setPairs(s.pairs); s.sessions && setSessions(s.sessions); s.goals && setGoals(s.goals); s.tasks && setTasks(s.tasks);
      s.cohorts && setCohorts(s.cohorts); s.integrations && setIntegrations(s.integrations); s.nudges && setNudges(s.nudges);
      s.interventions && setInterventions(s.interventions); s.bookings && setBookings(s.bookings); s.messages && setMessages(s.messages);
      s.events && setEvents(s.events); s.rematches && setRematches(s.rematches); s.privateNotes && setPrivateNotes(s.privateNotes);
      s.courses && setCourses(s.courses); s.shares && setShares(s.shares);
      s.pastPairs && setPastPairs(s.pastPairs); s.waiting && setWaiting(s.waiting);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const emit = (to: Role, pairId: string, text: string, tone: AppEvent["tone"] = "info") =>
    setEvents(p => [{ id: `e${++TS}`, to, pairId, text, time: nowLabel(), ts: TS, tone }, ...p]);
  const other = (r: Role): Role => (r === "mentor" ? "mentee" : "mentor");
  const who = (pairId: string) => pairs.find(x => x.id === pairId);
  /** Another live session of the same mentor that overlaps this slot (ignores the booking being answered). */
  const mentorClash = (pairId: string, slot: { date: string; time: string; durationMin: number }, ignoreId?: string) => {
    const mentor = who(pairId)?.mentor; if (!mentor) return undefined;
    const ids = new Map(pairs.filter(p => p.mentor === mentor).map(p => [p.id, p.mentee] as [string, string]));
    const hit = bookings.find(x => x.id !== ignoreId && ids.has(x.pairId) && (x.status === "confirmed" || x.status === "proposed") && overlaps(slot, x));
    return hit ? { mentee: ids.get(hit.pairId) as string } : undefined;
  };

  const stats = useMemo(() => Object.fromEntries(pairs.map(p => [p.id, computePairStats(p, sessions, goals, tasks)])), [pairs, sessions, goals, tasks]);
  const integrationOn = useCallback((n: string) => integrations.some(i => i.name === n && i.status === "Connected"), [integrations]);
  const videoProvider = ["Zoom", "Google Meet"].find(integrationOn) ?? null;
  const calendarProvider = ["Google Calendar", "Microsoft Outlook"].find(integrationOn) ?? null;
  const uid = () => Math.random().toString(36).slice(2, 9);

  const value: Ctx = {
    pairs, sessions, goals, tasks, cohorts, integrations, nudges, interventions, stats,
    cohortName: id => cohorts.find(c => c.id === id)?.name ?? "—",
    integrationOn, videoProvider, calendarProvider,
    // Mentor logs a session → mentee sees it, can rate it; health/reports recompute.
    logSession: ({ pairId, durationMin, mode, topics, notes, task }) => {
      setSessions(p => [S(pairId, AS_OF, durationMin, mode, topics, task ? [task] : [], null, notes), ...p]);
      emit("mentee", pairId, `${who(pairId)?.mentor} logged your session. Please rate it.`, "info");
      if (task) emit("mentee", pairId, `New task from ${who(pairId)?.mentor}: ${task}`, "warn");
      if (task) setTasks(p => [...p, { id: uid(), pairId, title: task, due: "Next session", status: "pending", from: "Mentor" }]);
    },
    rateSession: (id, rating) => {
      const s = sessions.find(x => x.id === id);
      setSessions(p => p.map(x => (x.id === id ? { ...x, rating } : x)));
      if (s) emit("mentor", s.pairId, `${who(s.pairId)?.mentee} rated your ${fmtDate(s.date)} session ${"★".repeat(rating)}`, rating >= 4 ? "good" : "warn");
    },
    setTaskStatus: (id, status) => {
      const t = tasks.find(x => x.id === id);
      setTasks(p => p.map(x => (x.id === id ? { ...x, status } : x)));
      if (t && status === "done" && t.from === "Mentor") emit("mentor", t.pairId, `${who(t.pairId)?.mentee} completed: ${t.title}`, "good");
    },
    signOffGoal: id => {
      const g = goals.find(x => x.id === id);
      setGoals(p => p.map(x => (x.id === id ? { ...x, pct: 100, status: "complete" } : x)));
      if (g) emit("mentee", g.pairId, `Goal signed off: ${g.title}`, "good");
    },
    sendNudge: pairId => {
      const pair = pairs.find(x => x.id === pairId)!;
      const slack = integrationOn("Slack");
      const n: Nudge = { id: uid(), pairId, at: AS_OF, channel: slack ? "In-app + Slack" : "In-app", text: `Programme team: no recent session between ${pair.mentee} and ${pair.mentor}. Please book your next session.` };
      setNudges(p => [n, ...p]);
      emit("mentor", pairId, n.text, "warn"); emit("mentee", pairId, n.text, "warn");
      return n;
    },
    openIntervention: pairId => setInterventions(p => [...p.filter(i => i.pairId !== pairId), { pairId, openedAt: AS_OF, resolved: false }]),
    resolveIntervention: pairId => setInterventions(p => p.map(i => (i.pairId === pairId ? { ...i, resolved: true } : i))),
    addCohort: c => setCohorts(p => [{ id: Math.max(0, ...p.map(x => x.id)) + 1, status: "Active", rubric: DEFAULT_RUBRIC, ...c }, ...p]),
    setRubric: (cohortId, rubric) => setCohorts(p => p.map(c => (c.id === cohortId ? { ...c, rubric } : c))),
    // Called from Pairing & Matching when a pairing is confirmed → appears in Health, Cohorts, dashboards.
    addPair: i => {
      const old = pairs.find(x => x.mentee.toLowerCase() === i.mentee.toLowerCase());
      if (old && old.mentor === i.mentor) return; // already matched with this mentor
      const wait = waiting.find(w => w.mentee.toLowerCase() === i.mentee.toLowerCase());
      const active = cohorts.find(c => c.status === "Active");
      const id = `p-${uid()}`;
      const next: Pair = {
        id, mentee: i.mentee, mentor: i.mentor, menteeId: i.menteeId ?? old?.menteeId ?? wait?.menteeId, mentorId: i.mentorId, expertise: i.expertise, matchScore: i.matchScore,
        venture: old?.venture ?? wait?.venture ?? i.venture, sector: old?.sector ?? wait?.sector ?? i.sector,
        stage: old?.stage ?? i.stage ?? wait?.stage ?? "Idea",
        cohortId: old?.cohortId ?? active?.id ?? 1, startDate: old?.startDate ?? AS_OF, matchedAt: AS_OF, milestones: old?.milestones ?? M(),
        ...(old ? { predecessorId: old.id } : {}),
      };
      setPairs(p => [...p.filter(x => x.id !== old?.id), next]);
      setWaiting(w => w.filter(x => x.mentee.toLowerCase() !== i.mentee.toLowerCase()));
      setRematches(r => r.map(x => (x.mentee.toLowerCase() === i.mentee.toLowerCase() ? { ...x, status: "handled" } : x)));
      if (old) {
        const reason = rematches.find(r => r.pairId === old.id && r.status === "open")?.reason ?? "Re-matched by the programme team";
        setPastPairs(p => [{ ...old, endedAt: AS_OF, endReason: reason, successorId: id }, ...p]);
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
    },
    connectIntegration: name => setIntegrations(p => p.map(i => (i.name === name ? { ...i, status: "Connected", lastSync: "Just now" } : i))),
    disconnectIntegration: name => setIntegrations(p => p.map(i => (i.name === name ? { ...i, status: "Not Connected", lastSync: "—" } : i))),
    bookings, messages, events, rematches, privateNotes, currentUser,
    signIn: (role, name) => {
      const u = role ? { role, name: name ?? (role === "mentor" ? DEMO_MENTOR : DEMO_MENTEE) } : null;
      setCurrentUser(u);
      try { u ? sessionStorage.setItem(USER_KEY, JSON.stringify(u)) : sessionStorage.removeItem(USER_KEY); } catch { /* ignore */ }
    },
    courses, shares, pastPairs, waiting,
    mentorLoad: m => pairs.filter(p => p.mentor === m).length,
    addWaiting: w => setWaiting(p => (p.some(x => x.mentee.toLowerCase() === w.mentee.toLowerCase()) ? p : [...p, { id: `w${++TS}`, ...w }])),
    scheduleIntro: (pairId, date) => setPairs(p => p.map(x => (x.id === pairId ? { ...x, introDate: date || undefined } : x))),
    removeWaiting: mentee => setWaiting(p => p.filter(x => x.mentee.toLowerCase() !== mentee.toLowerCase())),
    endPair: (pairId, reason, opts) => {
      const old = pairs.find(x => x.id === pairId); if (!old) return;
      const requeue = opts?.requeue ?? true;
      setPairs(p => p.filter(x => x.id !== pairId));
      setPastPairs(p => [{ ...old, endedAt: AS_OF, endReason: reason }, ...p]);
      setRematches(r => r.map(x => (x.pairId === pairId && x.status === "open" ? { ...x, status: "handled" } : x)));
      setBookings(p => p.map(b => (b.pairId === pairId && (b.status === "confirmed" || b.status === "proposed") ? { ...b, status: "cancelled" } : b)));
      setInterventions(p => p.filter(x => x.pairId !== pairId));
      if (requeue) setWaiting(w => (w.some(x => x.mentee.toLowerCase() === old.mentee.toLowerCase()) ? w : [...w, { id: `w${++TS}`, mentee: old.mentee, venture: old.venture, sector: old.sector, stage: old.stage }]));
      emit("mentor", pairId, `Your mentoring pair with ${old.mentee} has ended. ${reason}`, "warn");
      emit("mentee", pairId, `Your pairing with ${old.mentor} has ended. The programme team will match you again.`, "info");
    },
    declineRematch: id => {
      const r = rematches.find(x => x.id === id); if (!r || r.status !== "open") return;
      setRematches(p => p.map(x => (x.id === id ? { ...x, status: "handled" } : x)));
      const p = who(r.pairId);
      if (p) { emit("mentee", p.id, `The programme team reviewed your re-match request and you will stay with ${p.mentor} for now. Please talk to them or the team about any concerns.`, "info"); emit("mentor", p.id, `The re-match request from ${p.mentee} was reviewed. You remain their mentor.`, "info"); }
    },
    completeModule: id => {
      const c = courses.find(x => x.id === id); if (!c || c.done >= c.total) return;
      const done = c.done + 1;
      setCourses(p => p.map(x => (x.id === id ? { ...x, done } : x)));
      if (c.goalId) setGoals(p => p.map(g => (g.id === c.goalId && g.status !== "complete" ? { ...g, pct: Math.min(99, Math.round((done / c.total) * 100)) } : g)));
      emit("mentor", c.pairId, `${who(c.pairId)?.mentee} completed module ${done}/${c.total} of ${c.title}`, "good");
    },
    shareResource: (resourceId, pairIds) => {
      const r = RESOURCES.find(x => x.id === resourceId); if (!r) return;
      const fresh = pairIds.filter(pid => !shares.some(s => s.resourceId === resourceId && s.pairId === pid));
      if (!fresh.length) return;
      setShares(p => [...fresh.map(pid => ({ id: `sh${++TS}`, resourceId, pairId: pid, by: who(pid)?.mentor ?? "Mentor", at: AS_OF })), ...p]);
      fresh.forEach(pid => emit("mentee", pid, `${who(pid)?.mentor} shared a resource: ${r.title}`, "info"));
    },
    resetDemo: () => { try { localStorage.removeItem(KEY); localStorage.removeItem("emerge.admin.v2"); sessionStorage.removeItem(USER_KEY); sessionStorage.removeItem("emerge.page"); } catch { /* ignore */ } window.location.reload(); },
    nextBooking: pairId => bookings.filter(b => b.pairId === pairId && b.status === "confirmed" && b.date >= AS_OF).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0],
    proposeBooking: ({ pairId, by, ...rest }) => {
      const clash = mentorClash(pairId, rest);
      if (clash) return { ok: false, reason: by === "mentee" ? "Your mentor is not available at that time. Please pick another time." : `You already have a session with ${clash.mentee} at that time. Please pick another time.` };
      setBookings(p => [...p, { id: `b${++TS}`, pairId, proposedBy: by, status: "proposed", ...rest }]);
      emit(other(by), pairId, `${by === "mentor" ? who(pairId)?.mentor : who(pairId)?.mentee} proposed a session on ${fmtDate(rest.date)} at ${rest.time}. Accept or decline.`, "warn");
      return { ok: true };
    },
    respondBooking: (id, accept) => {
      const b = bookings.find(x => x.id === id);
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
      setBookings(p => p.map(x => (x.id === id ? { ...x, status: "cancelled" } : x)));
      if (b) { emit("mentor", b.pairId, `Session on ${fmtDate(b.date)} was cancelled`, "warn"); emit("mentee", b.pairId, `Session on ${fmtDate(b.date)} was cancelled`, "warn"); }
    },
    sendMessage: (pairId, from, text) => setMessages(p => [...p, { id: `m${++TS}`, pairId, from, text, time: nowLabel(), ts: TS, read: false }]),
    markRead: (pairId, reader) => setMessages(p => (p.some(m => m.pairId === pairId && m.from !== reader && !m.read) ? p.map(m => (m.pairId === pairId && m.from !== reader ? { ...m, read: true } : m)) : p)),
    unread: (pairId, reader) => messages.filter(m => m.pairId === pairId && m.from !== reader && !m.read).length,
    proposeGoal: ({ pairId, by, ...rest }) => {
      setGoals(p => [...p, { id: `g${++TS}`, pairId, pct: 0, status: "proposed", proposedBy: by, ...rest }]);
      emit(other(by), pairId, `${by === "mentor" ? who(pairId)?.mentor : who(pairId)?.mentee} proposed a goal: ${rest.title}`, "warn");
    },
    approveGoal: id => {
      const g = goals.find(x => x.id === id);
      setGoals(p => p.map(x => (x.id === id ? { ...x, status: "on-track" } : x)));
      if (g?.proposedBy) emit(g.proposedBy, g.pairId, `Goal approved: ${g.title}`, "good");
    },
    updateGoalProgress: (id, pct) => {
      const g = goals.find(x => x.id === id); const v = Math.max(0, Math.min(99, pct));
      setGoals(p => p.map(x => (x.id === id ? { ...x, pct: v } : x)));
      if (g) emit("mentor", g.pairId, `${who(g.pairId)?.mentee} updated "${g.title}" to ${v}%`, "info");
    },
    assignTask: (pairId, title, due) => {
      setTasks(p => [...p, { id: `t${++TS}`, pairId, title, due, status: "pending", from: "Mentor" }]);
      emit("mentee", pairId, `New task from ${who(pairId)?.mentor}: ${title}`, "warn");
    },
    requestRematch: (pairId, reason, by = "mentee") => {
      const p = who(pairId); if (!p) return;
      if (rematches.some(r => r.pairId === pairId && r.status === "open")) return;
      setRematches(r => [{ id: `r${++TS}`, pairId, mentee: p.mentee, reason, at: AS_OF, status: "open" }, ...r.filter(x => x.pairId !== pairId)]);
      if (by === "admin") {
        emit("mentor", pairId, `The programme team has started a re-match review for ${p.mentee}.`, "warn");
        emit("mentee", pairId, "The programme team has started a re-match review for your pairing. You will be told the outcome.", "info");
      } else emit("mentor", pairId, `${p.mentee} has requested a re-match. The programme team will review.`, "warn");
    },
    resolveRematch: id => setRematches(r => r.map(x => (x.id === id ? { ...x, status: "handled" } : x))),
    addPrivateNote: (pairId, text) => setPrivateNotes(p => [{ id: `n${++TS}`, pairId, text, at: AS_OF }, ...p]),
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
  const inWin = (s: Session, from: number, to: number) => { const a = daysBetween(s.date, AS_OF); return a >= from && a < to; };
  const cur = ss.filter(s => inWin(s, 0, days + 1)), prev = ss.filter(s => inWin(s, days + 1, days * 2 + 2));
  const rated = cur.filter(s => s.rating != null);
  const gs = c.goals.filter(g => ids.has(g.pairId) && g.status !== "proposed"), ts = c.tasks.filter(t => allIds.has(t.pairId) && t.from === "Mentor");
  const ms = ps.map(p => effectiveMilestones(p, c.goals));
  const tasksDone = ts.filter(t => t.status === "done").length, goalsDone = gs.filter(g => g.status === "complete").length;
  const milestoneCount = ms.reduce((a, m) => a + Object.values(m).filter(Boolean).length, 0);
  const perMentor = [...new Set(allPs.map(p => p.mentor))].map(mentor => ({ mentor, sessions: cur.filter(s => allPs.find(p => p.id === s.pairId)?.mentor === mentor).length }));
  const monthly: { month: string; sessions: number; current?: boolean }[] = [];
  for (let m = 1; m <= Number(AS_OF.slice(5, 7)); m++) {
    const key = `2025-${String(m).padStart(2, "0")}`;
    monthly.push({ month: new Date(2025, m - 1, 1).toLocaleString("en-GB", { month: "short" }), sessions: ARCHIVED_MONTHLY[key] ?? ss.filter(s => s.date.startsWith(key)).length, current: key === AS_OF.slice(0, 7) });
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
    onTrackPct: Math.round((ps.filter(p => c.stats[p.id]?.health === "Healthy").length / n) * 100),
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

/** Same weighting as the admin Impact Score, scoped to one mentor. Sessions and tasks from pairs later re-matched still credit the mentor who did the work. */
export function mentorImpact(c: Ctx, mentor: string) {
  const ps = c.pairs.filter(p => p.mentor === mentor), ids = new Set(ps.map(p => p.id));
  const allIds = new Set([...ps, ...c.pastPairs.filter(p => p.mentor === mentor)].map(p => p.id));
  return c.sessions.filter(s => allIds.has(s.pairId)).length * 10
    + c.tasks.filter(x => allIds.has(x.pairId) && x.from === "Mentor" && x.status === "done").length * 5
    + c.goals.filter(g => ids.has(g.pairId) && g.status === "complete").length * 15
    + ps.reduce((a, p) => a + Object.values(effectiveMilestones(p, c.goals)).filter(Boolean).length, 0) * 25;
}
