import type { EntrepreneurApplication, MentorApplication } from "../types";

export type AnyApplication = EntrepreneurApplication | MentorApplication;
export const isMentorApp = (a: AnyApplication) => a.id.startsWith("MNT") || "expertise" in a;

/** Same key the admin page writes status changes to, so the public tracker reads what admin decides. */
export const ADMIN_KEY = "emerge.admin.v2";
export const APPS_KEY = "emerge.applications.v1";
export const MENTOR_APPS_KEY = "emerge.mentorApplications.v1";

export type TrackerStage = { id: string; label: string; desc: string };

const INCUBATION_STAGES: TrackerStage[] = [
  { id: "received", label: "Received", desc: "We have your application." },
  { id: "review", label: "Under review", desc: "Our team is reviewing your application." },
  { id: "decision", label: "Decision", desc: "A selection decision has been made." },
  { id: "matching", label: "Mentor matching", desc: "You are being matched with a mentor." },
  { id: "onboarded", label: "Onboarded", desc: "You are in the programme." },
];
const ACCELERATION_STAGES: TrackerStage[] = [
  { id: "received", label: "Received", desc: "We have your application." },
  { id: "review", label: "Under review", desc: "Our team is reviewing your application." },
  { id: "decision", label: "Decision", desc: "A selection decision has been made." },
];

const MENTOR_STAGES: TrackerStage[] = [
  { id: "received", label: "Received", desc: "We have your mentor registration." },
  { id: "review", label: "Under review", desc: "Our team is reviewing your profile." },
  { id: "decision", label: "Decision", desc: "A decision on your registration has been made." },
  { id: "matching", label: "Mentee matching", desc: "You are in the pool to be matched with a mentee." },
];

export const stagesFor = (app: AnyApplication) =>
  isMentorApp(app) ? MENTOR_STAGES : app.program === "Acceleration" ? ACCELERATION_STAGES : INCUBATION_STAGES;

export type TrackerResult = {
  app: AnyApplication;
  label: string;
  tone: "neutral" | "good" | "bad" | "warn";
  stageIndex: number;
  message: string;
  reason?: string;
};

type Override = { status: string; reason?: string; date?: string };

function readJSON<T>(key: string, fallback: T): T {
  try { const v = JSON.parse(localStorage.getItem(key) ?? ""); return v ?? fallback; } catch { return fallback; }
}

const readList = (key: string): AnyApplication[] => {
  const v = readJSON<unknown>(key, []);
  return Array.isArray(v) ? (v as AnyApplication[]) : [];
};
export function loadMentorApplications(): MentorApplication[] { return readList(MENTOR_APPS_KEY) as MentorApplication[]; }
export function loadAllApplications(): AnyApplication[] { return [...readList(APPS_KEY), ...readList(MENTOR_APPS_KEY)]; }

export function loadOverrides(): Record<string, Override> {
  const v = readJSON<{ statusOverrides?: Record<string, Override> }>(ADMIN_KEY, {});
  return v.statusOverrides ?? {};
}

export function describe(app: AnyApplication, ov?: Override): TrackerResult {
  const status = ov?.status ?? app.status;
  const mentor = isMentorApp(app);
  const acc = !mentor && app.program === "Acceleration";
  const base = { app, reason: ov?.reason };
  switch (status) {
    case "Rejected":
      return { ...base, label: "Not selected", tone: "bad", stageIndex: 2, message: mentor
        ? "Thank you for offering to mentor with us. Unfortunately your registration was not successful this time."
        : "Thank you for applying. Unfortunately your application was not successful this time." };
    case "Selected":
      return { ...base, label: "Selected", tone: "good", stageIndex: 2, message: mentor
        ? "Congratulations, you have been approved as a mentor. Mentee matching comes next."
        : acc ? "Congratulations, you have been selected." : "Congratulations, you have been selected. Mentor matching comes next." };
    case "Matching":
      return { ...base, label: mentor ? "Mentee matching" : "Mentor matching", tone: "good", stageIndex: 3, message: mentor ? "You are in the mentee matching pool." : "You are in the mentor matching pool." };
    case "Dropouts":
      return { ...base, label: "Withdrawn", tone: "warn", stageIndex: 2, message: "This application has been closed." };
    default:
      return { ...base, label: acc ? "Received" : "Under review", tone: "neutral", stageIndex: acc ? 0 : 1, message: acc ? "We have received your application and will be in touch." : mentor ? "Your mentor registration is being reviewed." : "Your application is being reviewed." };
  }
}

/** Look up by reference number, or by email (returns the most recent match). */
export function findApplication(query: string): TrackerResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const apps = loadAllApplications();
  const hits = apps.filter(a => a.id.toLowerCase() === q || (a.email ?? "").toLowerCase() === q);
  if (!hits.length) return null;
  const app = hits[hits.length - 1];
  return describe(app, loadOverrides()[app.id]);
}

/** A ready-to-send email for a selection / rejection decision. Opens in the admin's mail app (there is no mail server behind this site). */
export function decisionMailto(app: AnyApplication, status: "Selected" | "Rejected", reason?: string): string | null {
  if (!app.email) return null;
  const mentor = isMentorApp(app);
  const first = (app.name || "").split(" ")[0] || "Applicant";
  const what = mentor ? "mentor registration" : "application";
  const subject = status === "Selected" ? `Your Emerge Livelihoods ${what}: selected` : `Your Emerge Livelihoods ${what}: update`;
  const body = status === "Selected"
    ? `Dear ${first},\n\nCongratulations. Your ${what} (reference ${app.id}) has been successful.${reason ? `\n\n${reason}` : ""}\n\n${mentor ? "We will be in touch about matching you with a mentee." : "We will be in touch about the next steps."} You can follow your status any time under "Track Application" on our website using your reference number or this email address.\n\nKind regards,\nEmerge Livelihoods`
    : `Dear ${first},\n\nThank you for your ${what} (reference ${app.id}). After careful review we are unable to take it forward this time.${reason ? `\n\n${reason}` : ""}\n\nYou can see this update any time under "Track Application" on our website using your reference number or this email address.\n\nKind regards,\nEmerge Livelihoods`;
  return `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
