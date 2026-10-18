import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X, Send, Download, Copy, Mail, AlertCircle, Check } from "lucide-react";
import type { EntrepreneurApplication, MentorApplication } from "../types";
import {
  PLACEHOLDERS, bccLinks, buildAudience, defaultTemplate, mailMergeCsv, renderFor, sendCampaign,
  type BatchRecipient, type Campaign, type EmailAudience,
} from "../data/emailCampaigns";

const TEAL = "#4C808A", NAVY = "#3B4167";

type Props = {
  entApps: EntrepreneurApplication[]; mntApps: MentorApplication[];
  campaigns: Campaign[]; scopeName?: string;
  initialAudience?: EmailAudience;
  onSent: (all: Campaign[]) => void; onClose: () => void;
};

/** Compose one email and send it to everyone Selected, or everyone Rejected, in a single step. */
export function BatchEmailModal({ entApps, mntApps, campaigns, scopeName, initialAudience = "Selected", onSent, onClose }: Props) {
  const [audience, setAudience] = useState<EmailAudience>(initialAudience);
  const [ent, setEnt] = useState(true), [mnt, setMnt] = useState(true);
  const [movedOn, setMovedOn] = useState(false), [skip, setSkip] = useState(true);
  const [tpl, setTpl] = useState(defaultTemplate(initialAudience));
  const [edited, setEdited] = useState(false);
  // Snapshot taken at send time: once sent, these people count as "already emailed", so the live audience no longer lists them.
  const [done, setDone] = useState<{ campaign: Campaign; recipients: BatchRecipient[]; tpl: { subject: string; body: string } } | null>(null);

  const pickAudience = (a: EmailAudience) => { setAudience(a); if (!edited) setTpl(defaultTemplate(a)); };
  const aud = useMemo(() => buildAudience(entApps, mntApps, { audience, includeEntrepreneurs: ent, includeMentors: mnt, includeMovedOn: movedOn, skipAlreadyEmailed: skip }, campaigns),
    [entApps, mntApps, audience, ent, mnt, movedOn, skip, campaigns]);
  const first = aud.recipients[0];
  const preview = first ? renderFor(first, tpl) : null;
  const problem = !ent && !mnt ? "Choose entrepreneurs, mentors or both."
    : !aud.recipients.length ? "Nobody to send to with these choices."
    : !tpl.subject.trim() ? "Add a subject." : !tpl.body.trim() ? "Write the message." : "";

  const send = () => {
    if (problem) return;
    const { campaign, all } = sendCampaign({ audience, recipients: aud.recipients, subject: tpl.subject, body: tpl.body }, campaigns);
    onSent(all); setDone({ campaign, recipients: aud.recipients, tpl: { ...tpl } });
    toast.success(`Batch recorded for ${campaign.recipients} ${audience.toLowerCase()} applicant${campaign.recipients === 1 ? "" : "s"}.`);
  };

  const out = done ?? { recipients: aud.recipients, tpl };
  const download = () => {
    const url = URL.createObjectURL(new Blob([mailMergeCsv(out.recipients, out.tpl)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `emerge-${(done?.campaign.audience ?? audience).toLowerCase()}-mail-merge.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(out.recipients.map(r => r.email).join(", ")); toast.success("Addresses copied."); }
    catch { toast.error("Could not copy. Use the CSV download instead."); }
  };
  const links = useMemo(() => bccLinks(out.recipients, out.tpl.subject, out.tpl.body), [done, aud.recipients, tpl]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = (t: string) => <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>{t}</label>;
  const box = "w-full rounded-md px-3 py-2 text-xs border focus:outline-none";
  const check = (checked: boolean, set: (v: boolean) => void, text: string) => (
    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: NAVY }}>
      <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)} /> {text}
    </label>
  );

  return (
    <div role="dialog" aria-label="Send batch email" className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(15,21,40,0.55)" }}>
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[92vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <h3 className="font-black text-sm" style={{ color: NAVY }}>Send batch email{scopeName ? ` · ${scopeName}` : ""}</h3>
          <button onClick={onClose} aria-label="Close"><X size={16} color="#6b7280" /></button>
        </div>

        {done ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 rounded-md p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <Check size={18} color="#059669" className="shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: "#065f46" }}>
                <b>{done.campaign.recipients} {done.campaign.audience?.toLowerCase()} applicant{done.campaign.recipients === 1 ? "" : "s"} recorded</b> in the Email Dashboard as "Queued".
                No mail server is connected to this site yet, so nothing has left the browser. Deliver this batch with one of the options below.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {links.map((l, i) => (
                <a key={i} href={l} className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-md" style={{ background: TEAL }}>
                  <Mail size={12} /> {links.length > 1 ? `Open in mail app (part ${i + 1} of ${links.length})` : "Open in mail app (BCC)"}
                </a>
              ))}
              <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-md border" style={{ color: NAVY, borderColor: "#d1d5db" }}><Copy size={12} /> Copy addresses</button>
              <button onClick={download} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-md border" style={{ color: NAVY, borderColor: "#d1d5db" }}><Download size={12} /> Mail-merge CSV</button>
            </div>
            <p className="text-[11px]" style={{ color: "#6b7280" }}>The BCC email sends the same text to everyone. The mail-merge CSV has each person's own name, reference and reason filled in.</p>
            <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-md text-white" style={{ background: NAVY }}>Done</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              {label("Send to")}
              <div className="flex gap-2">
                {(["Selected", "Rejected"] as EmailAudience[]).map(a => (
                  <button key={a} onClick={() => pickAudience(a)} aria-pressed={audience === a}
                    className="flex-1 text-xs font-bold px-3 py-2.5 rounded-md border"
                    style={{ background: audience === a ? (a === "Selected" ? "#2563eb" : "#dc2626") : "#fff", color: audience === a ? "#fff" : NAVY, borderColor: audience === a ? "transparent" : "#d1d5db" }}>
                    All {a.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {check(ent, setEnt, "Entrepreneurs")}
              {check(mnt, setMnt, "Mentors")}
              {audience === "Selected" && check(movedOn, setMovedOn, "Also those already Approved / in Matching")}
              {check(skip, setSkip, "Skip people already emailed this decision")}
            </div>

            <div className="rounded-md p-3 text-xs" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: NAVY }}>
              <b>{aud.recipients.length}</b> recipient{aud.recipients.length === 1 ? "" : "s"}
              {aud.noEmail > 0 && <span className="ml-2" style={{ color: "#b45309" }}>· {aud.noEmail} without a valid email (left out)</span>}
              {aud.duplicates > 0 && <span className="ml-2" style={{ color: "#6b7280" }}>· {aud.duplicates} repeat address{aud.duplicates === 1 ? "" : "es"} merged</span>}
              {aud.alreadyEmailed > 0 && <span className="ml-2" style={{ color: "#6b7280" }}>· {aud.alreadyEmailed} already emailed (skipped)</span>}
              {aud.recipients.length > 0 && <div className="mt-1.5 text-[11px] max-h-20 overflow-y-auto" style={{ color: "#6b7280" }}>{aud.recipients.map(r => r.name).join(", ")}</div>}
            </div>

            <div>
              {label("Subject")}
              <input className={box} style={{ borderColor: "#d1d5db" }} value={tpl.subject} onChange={e => { setEdited(true); setTpl({ ...tpl, subject: e.target.value }); }} />
            </div>
            <div>
              {label("Message")}
              <textarea className={box} style={{ borderColor: "#d1d5db", minHeight: 170 }} value={tpl.body} onChange={e => { setEdited(true); setTpl({ ...tpl, body: e.target.value }); }} />
              <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
                Filled in for each person: {PLACEHOLDERS.join("  ")}. {audience === "Rejected" ? "{{reason}} is the reason recorded on that person's rejection." : "{{reason}} is the selection note recorded for that person, if any."}
              </p>
            </div>

            {preview && (
              <div className="rounded-md p-3 text-xs" style={{ border: "1px dashed #d1d5db", color: NAVY }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Preview for {first.name}</div>
                <div className="font-bold mb-1">{preview.subject}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{preview.body}</div>
              </div>
            )}

            {problem && <p role="alert" className="flex items-center gap-1.5 text-xs" style={{ color: "#b45309" }}><AlertCircle size={13} /> {problem}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-md border" style={{ color: NAVY, borderColor: "#d1d5db" }}>Cancel</button>
              <button onClick={send} disabled={!!problem} className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: TEAL }}>
                <Send size={12} /> Send to {aud.recipients.length}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
