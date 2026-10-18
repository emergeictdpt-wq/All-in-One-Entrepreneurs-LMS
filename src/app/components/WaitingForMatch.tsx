import { Check, Clock, LogOut, Mail, Users } from "lucide-react";
import { useProgramme, fmtDateY } from "../data/programmeStore";
import type { Person } from "../data/directory";

const NAVY = "#3B4167", TEAL = "#4C808A";
const GRAD = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";

type Stage = { key: string; label: string; note: string };
const STAGES: Stage[] = [
  { key: "applied", label: "Applied", note: "Application received" },
  { key: "selected", label: "Selected", note: "Accepted into the programme" },
  { key: "matching", label: "Finding your mentor", note: "The team is choosing a mentor for you" },
  { key: "paired", label: "Paired", note: "Your mentor dashboard opens" },
];

/** Which stage is current, from the person's status and whether they are in the matching queue. */
function currentStage(status: string, inQueue: boolean) {
  if (status === "Matching" || inQueue) return 2;
  return 1; // Selected / Approved: in the programme, not yet sent to matching
}

const NEXT: Record<number, string[]> = {
  1: [
    "The programme team reviews selected entrepreneurs and moves them to mentor matching.",
    "You do not need to do anything now. This page updates by itself when your status changes.",
    "Keep your phone and email handy; the team may contact you for a short intro call.",
  ],
  2: [
    "The team looks for a mentor whose expertise fits your sector and stage.",
    "When a match is confirmed you get a notification and this page becomes your dashboard, with your mentor's profile, a goals plan and session booking.",
    "Matching depends on mentor availability, so it can take a little while. You will not lose your place in the queue.",
  ],
};

export function WaitingForMatch({ me, onSignOut }: { me: Person; onSignOut: () => void }) {
  const P = useProgramme();
  const queue = P.waiting;
  const idx = queue.findIndex(w => w.menteeId === me.id || (!w.menteeId && w.mentee === me.name));
  const inQueue = idx >= 0;
  const stage = currentStage(me.status, inQueue);
  const wasPaired = P.pastPairs.some(p => p.menteeId === me.id || (!p.menteeId && p.mentee === me.name));
  const project = P.projectName(me.programId) ?? me.programName;
  const first = me.name.split(" ")[0];

  const facts: [string, string | undefined][] = [
    ["Application ID", me.id],
    ["Business", me.businessName],
    ["Project", project],
    ["Applied on", me.appliedOn ? fmtDateY(me.appliedOn) : undefined],
    ["Status", me.status === "Matching" ? "In mentor matching" : me.status === "Approved" ? "Approved" : me.status],
    ["Matching queue", inQueue ? `Position ${idx + 1} of ${queue.length}` : undefined],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f9", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
      <style>{`@media (max-width: 640px) { .wf-steps { grid-template-columns: 1fr 1fr !important; } .wf-cols { grid-template-columns: 1fr !important; } }`}</style>
      <header style={{ background: NAVY, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>Emerge Livelihoods</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{me.name}</span>
          <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 3, padding: "7px 12px", fontSize: 11, cursor: "pointer" }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 60px" }}>
        <section style={{ background: GRAD, borderRadius: 4, padding: "28px 30px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Clock size={18} /><span style={{ fontSize: 11, letterSpacing: 1.2, opacity: 0.75 }}>WAITING TO BE MATCHED</span>
          </div>
          <h1 data-testid="waiting-title" style={{ fontSize: 24, margin: "0 0 8px", fontWeight: 800 }}>Welcome, {first}. Your mentor is not assigned yet.</h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, opacity: 0.85 }}>
            {wasPaired
              ? "Your previous pairing has ended and you are back in the matching queue. The team will find you a new mentor."
              : "You are in the programme. Your dashboard unlocks as soon as the programme team pairs you with a mentor."}
          </p>
        </section>

        <section style={{ background: "#fff", borderRadius: 4, padding: "24px 26px", marginTop: 18, border: "1px solid #eceef4" }}>
          <p style={{ margin: "0 0 18px", color: NAVY, fontWeight: 700, fontSize: 13 }}>Where your application is</p>
          <ol data-testid="waiting-stages" className="wf-steps" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {STAGES.map((s, i) => {
              const done = i < stage, current = i === stage;
              return (
                <li key={s.key} aria-current={current ? "step" : undefined} style={{ textAlign: "center" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? TEAL : current ? "#fff" : "#eef0f5", border: current ? `2px solid ${TEAL}` : "2px solid transparent", color: done ? "#fff" : current ? TEAL : "#a0a6b8", fontSize: 12, fontWeight: 700 }}>
                    {done ? <Check size={16} /> : i + 1}
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: current ? NAVY : done ? "#2f6169" : "#6b7280" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 9, color: "#6b7280", lineHeight: 1.4 }}>{s.note}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="wf-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <section style={{ background: "#fff", borderRadius: 4, padding: "22px 24px", border: "1px solid #eceef4" }}>
            <p style={{ margin: "0 0 14px", color: NAVY, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><Users size={15} color={TEAL} /> What happens next</p>
            <ol style={{ margin: 0, paddingLeft: 18, color: "#555", fontSize: 12, lineHeight: 1.7 }}>
              {NEXT[stage].map(t => <li key={t} style={{ marginBottom: 8 }}>{t}</li>)}
            </ol>
          </section>
          <section style={{ background: "#fff", borderRadius: 4, padding: "22px 24px", border: "1px solid #eceef4" }}>
            <p style={{ margin: "0 0 14px", color: NAVY, fontWeight: 700, fontSize: 13 }}>Your application</p>
            <dl style={{ margin: 0, fontSize: 12 }}>
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: "1px solid #f3f4f8" }}>
                  <dt style={{ color: "#8a90a6" }}>{k}</dt><dd style={{ margin: 0, color: NAVY, fontWeight: 600, textAlign: "right" }}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <p style={{ marginTop: 22, textAlign: "center", fontSize: 11, color: "#8a90a6", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Mail size={13} /> Questions? Email <a href={`mailto:hello@emergelivelihoods.org?subject=${encodeURIComponent(`Application ${me.id}`)}`} style={{ color: TEAL, fontWeight: 700 }}>hello@emergelivelihoods.org</a> and quote your application ID, {me.id}.
        </p>
      </main>
    </div>
  );
}
