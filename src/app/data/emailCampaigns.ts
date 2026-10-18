// Batch email to applicants by decision (Selected / Rejected), plus the campaign log the Email Dashboard shows.
//
// IMPORTANT: front-end prototype. There is no mail server behind this site, so "sending" a campaign records it
// (who, what, when) and prepares the messages; it does not deliver them. Delivery today is the admin's own mail
// app (BCC / mail-merge CSV). When a mail service exists, call it where `sendCampaign` is used and store the real
// delivery status; open/click rates can only come from that service, so they are blank for campaigns made here.
import { isEmail, normEmail } from "./auth";

export type EmailAudience = "Selected" | "Rejected";
export type RecipientKind = "entrepreneur" | "mentor";

export interface BatchRecipient { id: string; name: string; email: string; kind: RecipientKind; programId?: string; programName?: string; reason?: string }
export interface Campaign {
  id: string; subject: string; body: string; audience?: EmailAudience;
  recipients: number; opened: number | null; clicked: number | null; sent: string;
  /** Queued = recorded here, not yet handed to a mail app. Sent = the admin marked it as delivered from their own mail app. Delivered = confirmed by a mail service (none yet). */
  status: "Queued" | "Sent" | "Delivered" | "Scheduled";
  /** date the admin marked a Queued campaign as sent */
  sentOn?: string;
  /** programmes the recipients belong to (decides which manager sees the campaign) */
  programIds: string[]; programId?: string;
  /** who got it; absent on the built-in sample campaigns */
  log?: { id: string; name: string; email: string; kind: RecipientKind }[];
  sample?: boolean;
}

export const CAMPAIGNS_KEY = "emerge.emailCampaigns.v1";
export const loadCampaigns = (): Campaign[] => {
  try { const v = JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
export const saveCampaigns = (list: Campaign[]) => { try { localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list)); return true; } catch { return false; } };

/** Applications as the admin page sees them (decisions already applied). */
type AppLike = { id: string; name: string; email?: string; status: string; programId?: string; programName?: string; rejectionReason?: string; selectionReason?: string };

export const SELECTED_STATUSES = ["Selected"];
/** People selected earlier who have since moved on (mentors: Approved; both: Matching). */
export const SELECTED_LATER_STATUSES = ["Approved", "Matching"];

export interface AudienceOptions {
  audience: EmailAudience; includeEntrepreneurs: boolean; includeMentors: boolean;
  /** Selected only: also include people already Approved / in Matching */
  includeMovedOn: boolean;
  /** leave out people who already got a campaign for this decision */
  skipAlreadyEmailed: boolean;
}
export interface AudienceResult { recipients: BatchRecipient[]; noEmail: number; duplicates: number; alreadyEmailed: number }

/** Who a batch for this decision would go to. Missing/invalid addresses and repeat addresses are counted, not silently dropped. */
export function buildAudience(ent: AppLike[], mnt: AppLike[], opts: AudienceOptions, past: Campaign[]): AudienceResult {
  const statuses = opts.audience === "Rejected" ? ["Rejected"] : opts.includeMovedOn ? [...SELECTED_STATUSES, ...SELECTED_LATER_STATUSES] : SELECTED_STATUSES;
  const emailed = new Set(past.filter(c => c.audience === opts.audience).flatMap(c => (c.log ?? []).map(l => `${l.kind}:${normEmail(l.email)}`)));
  const seen = new Set<string>(); const recipients: BatchRecipient[] = [];
  let noEmail = 0, duplicates = 0, alreadyEmailed = 0;
  const take = (list: AppLike[], kind: RecipientKind) => {
    for (const a of list) {
      if (!statuses.includes(a.status)) continue;
      if (!a.email || !isEmail(a.email)) { noEmail++; continue; }
      const key = `${kind}:${normEmail(a.email)}`;
      if (seen.has(key)) { duplicates++; continue; }
      seen.add(key);
      if (opts.skipAlreadyEmailed && emailed.has(key)) { alreadyEmailed++; continue; }
      recipients.push({ id: a.id, name: a.name, email: a.email.trim(), kind, programId: a.programId, programName: a.programName,
        reason: (opts.audience === "Rejected" ? a.rejectionReason : a.selectionReason) || undefined });
    }
  };
  if (opts.includeEntrepreneurs) take(ent, "entrepreneur");
  if (opts.includeMentors) take(mnt, "mentor");
  return { recipients, noEmail, duplicates, alreadyEmailed };
}

export const PLACEHOLDERS = ["{{firstName}}", "{{reference}}", "{{type}}", "{{programme}}", "{{reason}}"] as const;

export const defaultTemplate = (audience: EmailAudience) => audience === "Selected"
  ? { subject: "Your Emerge Livelihoods {{type}}: selected",
      body: "Dear {{firstName}},\n\nCongratulations. Your {{type}} (reference {{reference}}) has been successful.\n\n{{reason}}\n\nWe will be in touch about the next steps. You can follow your status any time under \"Track Application\" on our website using your reference number or this email address.\n\nKind regards,\nEmerge Livelihoods" }
  : { subject: "Your Emerge Livelihoods {{type}}: update",
      body: "Dear {{firstName}},\n\nThank you for your {{type}} (reference {{reference}}). After careful review we are unable to take it forward this time.\n\n{{reason}}\n\nYou can see this update any time under \"Track Application\" on our website using your reference number or this email address.\n\nKind regards,\nEmerge Livelihoods" };

/** Fills the placeholders for one person. An empty {{reason}} removes its paragraph instead of leaving a gap. */
export function renderFor(r: BatchRecipient, template: { subject: string; body: string }) {
  const first = r.name.replace(/^(dr|prof|mr|mrs|ms|miss)\.?\s+/i, "").split(/\s+/)[0] || "Applicant";
  const vars: Record<string, string> = {
    firstName: first, reference: r.id, type: r.kind === "mentor" ? "mentor registration" : "application",
    programme: r.programName ?? "our programme", reason: r.reason ?? "",
  };
  const fill = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  return { subject: fill(template.subject).trim(), body: fill(template.body).replace(/\n{3,}/g, "\n\n").trim() };
}

/** Records the campaign. Nothing is delivered from the browser (see the note at the top of this file). */
export function sendCampaign(i: { audience: EmailAudience; recipients: BatchRecipient[]; subject: string; body: string }, existing: Campaign[]): { campaign: Campaign; all: Campaign[]; saved: boolean } {
  const programIds = [...new Set(i.recipients.map(r => r.programId).filter((x): x is string => !!x))];
  const campaign: Campaign = {
    id: `CMP-${Date.now()}`, subject: i.subject, body: i.body, audience: i.audience, recipients: i.recipients.length, opened: null, clicked: null,
    sent: new Date().toISOString().split("T")[0], status: "Queued", programIds, programId: programIds.length === 1 ? programIds[0] : undefined,
    log: i.recipients.map(r => ({ id: r.id, name: r.name, email: r.email, kind: r.kind })),
  };
  const all = [campaign, ...existing];
  // `saved` is false when the browser would not store it (storage full or blocked); the caller must say so.
  return { campaign, all, saved: saveCampaigns(all) };
}

/** The admin delivered a Queued campaign from their own mail app: record that. Nothing changes if it cannot be saved. */
export function markCampaignSent(id: string, list: Campaign[], today = new Date().toISOString().split("T")[0]): { all: Campaign[]; saved: boolean } {
  const all = list.map(c => (c.id === id && c.status === "Queued" ? { ...c, status: "Sent" as const, sentOn: today } : c));
  const saved = saveCampaigns(all);
  return { all: saved ? all : list, saved };
}

/** Can this admin see this campaign? Samples follow the project filter; real ones follow the projects their recipients belong to. */
export function campaignVisible(c: Campaign, scope: { project: { id: string } | null; allowed?: string[] }) {
  if (c.sample) return scope.project ? c.programId === scope.project.id : !scope.allowed || !c.programId || scope.allowed.includes(c.programId);
  if (scope.project) return c.programIds.includes(scope.project.id);
  return !scope.allowed || c.programIds.every(id => scope.allowed!.includes(id));
}

// ── Hand-off helpers (delivery through the admin's own mail app until a mail service exists) ───────────────
/** One message to everyone in BCC. Browsers cap mailto links at roughly 2,000 characters, so big batches are split. */
export function bccLinks(recipients: BatchRecipient[], subject: string, body: string, maxLen = 1800): string[] {
  const head = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&bcc=`;
  const links: string[] = []; let cur: string[] = [];
  const len = (xs: string[]) => head.length + encodeURIComponent(xs.join(",")).length;
  for (const r of recipients) {
    if (cur.length && len([...cur, r.email]) > maxLen) { links.push(head + encodeURIComponent(cur.join(","))); cur = []; }
    cur.push(r.email);
  }
  if (cur.length) links.push(head + encodeURIComponent(cur.join(",")));
  return links;
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
/** Mail-merge file: one row per person with their personalised subject and message. */
export function mailMergeCsv(recipients: BatchRecipient[], template: { subject: string; body: string }) {
  const rows = recipients.map(r => { const m = renderFor(r, template); return [r.email, r.name, r.id, m.subject, m.body].map(csvCell).join(","); });
  return ["email,name,reference,subject,message", ...rows].join("\r\n");
}
