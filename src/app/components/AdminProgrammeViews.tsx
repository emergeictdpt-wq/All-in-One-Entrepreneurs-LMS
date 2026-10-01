// Programme Admin: Cohort Management, Relationship Health, Reports & Analytics, Integration Hub.
// All four read from useProgramme(); nothing here owns sample data.
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Download, Plus, X } from "lucide-react";
import { useProgramme, cohortEnrolled, buildReport, PERIODS, AS_OF, fmtDate, daysBetween, type Health, type Period } from "../data/programmeStore";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
const HC: Record<Health, string> = { Healthy: "#059669", "At Risk": "#f59e0b", Stalled: "#ef4444", New: "#6366f1" };
const HB: Record<Health, string> = { Healthy: "#f0fdf4", "At Risk": "#fffbeb", Stalled: "#fef2f2", New: "#eef2ff" };
const card = { background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } as const;
const btn = (bg: string, color = "#fff", border = "none") => ({ background: bg, color, border, borderRadius: 3, padding: "6px 12px", fontSize: 10, cursor: "pointer", fontWeight: 700 }) as const;
const Head = ({ t, s, right }: { t: string; s: string; right?: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div><h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{t}</h2><p style={{ color: "#888", fontSize: 12, margin: 0 }}>{s}</p></div>{right}
  </div>
);

// ─────────────────────────── Relationship Health ───────────────────────────
export function AdminRelHealthView() {
  const P = useProgramme();
  const [filter, setFilter] = useState<Health | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const rows = P.pairs.map(p => ({ p, s: P.stats[p.id] }));
  const shown = filter ? rows.filter(r => r.s.health === filter) : rows;
  const count = (h: Health) => rows.filter(r => r.s.health === h).length;
  const flagged = rows.filter(r => r.s.health === "At Risk" || r.s.health === "Stalled");
  const nudge = (id: string) => { const n = P.sendNudge(id); toast.success(`Nudge sent via ${n.channel}`); };

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <Head t="Relationship Health Dashboard" s={`Computed live from session logs, tasks, goals and mentee ratings (as of ${fmtDate(AS_OF)})`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {([["Healthy", "Session in last 14 days, tasks ≥ 50%, satisfaction ≥ 70%"], ["At Risk", "> 14 days since session, tasks < 50%, satisfaction < 70% or goals < 30%"], ["Stalled", "45+ days without a session, or rated < 3.0 twice in a row"], ["New", "Matched in last 21 days, no session yet"]] as [Health, string][]).map(([h, desc]) => (
          <button key={h} onClick={() => setFilter(filter === h ? null : h)} style={{ ...card, padding: "16px 18px", cursor: "pointer", textAlign: "left", border: `2px solid ${filter === h ? HC[h] : "transparent"}` }}>
            <p style={{ color: "#888", fontSize: 10, margin: "0 0 6px" }}>{h} Pairs</p>
            <p style={{ color: HC[h], fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>{count(h)}<span style={{ fontSize: 14, fontWeight: 400, color: "#bbb" }}>/{rows.length}</span></p>
            <div style={{ height: 4, background: "#f0f0f0", borderRadius: 3, marginBottom: 6 }}><div style={{ height: "100%", width: `${rows.length ? (count(h) / rows.length) * 100 : 0}%`, background: HC[h], borderRadius: 3 }} /></div>
            <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>{desc}</p>
          </button>
        ))}
      </div>

      {flagged.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3, padding: "12px 16px", display: "flex", gap: 10 }}>
          <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: "#92600a", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{flagged.length} pair{flagged.length > 1 ? "s" : ""} need attention</p>
            {flagged.map(({ p, s }) => <p key={p.id} style={{ color: "#a16207", fontSize: 11, margin: "2px 0 0" }}>{p.mentee} & {p.mentor}: {s.reasons.join("; ")}</p>)}
          </div>
          <button style={btn("#f59e0b")} onClick={() => { flagged.forEach(f => P.sendNudge(f.p.id)); toast.success(`Nudged ${flagged.length} pair(s)`); }}>Nudge All</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {shown.map(({ p, s }) => {
          const iv = P.interventions.find(i => i.pairId === p.id && !i.resolved);
          const lastNudge = P.nudges.find(n => n.pairId === p.id);
          const rematch = P.rematches.find(r => r.pairId === p.id && r.status === "open");
          const notes = P.privateNotes.filter(n => n.pairId === p.id);
          const needs = s.health === "At Risk" || s.health === "Stalled";
          return (
            <div key={p.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ background: HB[s.health], color: HC[s.health], fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>{s.health}</span>
                    {iv && <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>INTERVENTION OPEN since {fmtDate(iv.openedAt)}</span>}
                    {rematch && <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>RE-MATCH REQUESTED</span>}
                    {notes.length > 0 && <span style={{ background: "#f5f3ff", color: "#6d28d9", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>{notes.length} mentor note{notes.length > 1 ? "s" : ""}</span>}
                    {lastNudge && <span style={{ background: "#f0f9ff", color: "#0369a1", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>Nudged {fmtDate(lastNudge.at)} · {lastNudge.channel}</span>}
                  </div>
                  <p style={{ color: NAVY, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{p.mentee} <span style={{ color: "#aaa", fontWeight: 400 }}>with</span> {p.mentor}</p>
                  <p style={{ color: "#aaa", fontSize: 10, margin: 0 }}>{p.venture} · {P.cohortName(p.cohortId)}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btn("#f8f9fb", "#666", "1px solid #e0e0e0")} onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Hide" : "View Pair"}</button>
                  {needs && <button style={btn("#fffbeb", "#b45309", "1px solid #fde68a")} onClick={() => nudge(p.id)}>Send Nudge</button>}
                  {needs && !iv && <button style={btn("#fef2f2", "#ef4444", "1px solid #fecaca")} onClick={() => { P.openIntervention(p.id); toast("Intervention opened"); }}>Intervene</button>}
                  {iv && <button style={btn("#f0fdf4", "#059669", "1px solid #bbf7d0")} onClick={() => { P.resolveIntervention(p.id); toast.success("Intervention resolved"); }}>Resolve</button>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
                {[
                  { label: "Last session", val: s.daysSince == null ? "None" : `${s.daysSince}d ago`, good: s.daysSince != null && s.daysSince <= 14 },
                  { label: "Sessions (7 days)", val: s.sessions7d, good: s.sessions7d >= 1 },
                  { label: "Satisfaction", val: s.satisfaction == null ? "—" : `${s.satisfaction}%`, good: (s.satisfaction ?? 100) >= 70 },
                  { label: "Goal Progress", val: `${s.goalPct}%`, good: s.goalPct >= 30 },
                  { label: "Tasks done", val: s.taskPct == null ? "—" : `${s.taskPct}%`, good: (s.taskPct ?? 100) >= 50 },
                ].map(m => (
                  <div key={m.label} style={{ background: "#f8f9fb", borderRadius: 3, padding: "10px 12px" }}>
                    <p style={{ color: "#aaa", fontSize: 9, margin: "0 0 4px" }}>{m.label}</p>
                    <p style={{ color: m.good ? "#059669" : "#ef4444", fontSize: 16, fontWeight: 700, margin: 0 }}>{m.val}</p>
                  </div>
                ))}
              </div>
              {open === p.id && (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 11, color: "#555" }}>
                  <div><p style={{ fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>Sessions ({s.sessionsTotal})</p>
                    {P.sessions.filter(x => x.pairId === p.id).sort((a, b) => b.date.localeCompare(a.date)).map(x => (
                      <p key={x.id} style={{ margin: "0 0 3px" }}>{fmtDate(x.date)} · {x.durationMin} min · {x.topics.join(", ")} · {x.rating ? "★".repeat(x.rating) : "awaiting rating"}</p>))}</div>
                  <div><p style={{ fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>Goals & tasks</p>
                    {P.goals.filter(g => g.pairId === p.id).map(g => <p key={g.id} style={{ margin: "0 0 3px" }}>{g.title} — {g.pct}% ({g.status})</p>)}
                    <p style={{ margin: "6px 0 0", color: "#888" }}>{s.openTasks} open task(s)</p>
                    {P.bookings.filter(b => b.pairId === p.id && b.status === "confirmed" && b.date >= AS_OF).slice(0, 1).map(b => <p key={b.id} style={{ margin: "4px 0 0", color: "#059669" }}>Next session: {fmtDate(b.date)} {b.time}</p>)}
                    {rematch && <div style={{ marginTop: 8, background: "#fef2f2", borderRadius: 3, padding: 8 }}><b style={{ color: "#ef4444" }}>Re-match reason:</b> {rematch.reason}<div><button style={{ ...btn("#fff", "#ef4444", "1px solid #fecaca"), marginTop: 6 }} onClick={() => { P.resolveRematch(rematch.id); toast("Re-match marked as handled"); }}>Mark handled</button></div></div>}
                    {notes.length > 0 && <div style={{ marginTop: 8, background: "#f5f3ff", borderRadius: 3, padding: 8 }}><b style={{ color: "#6d28d9" }}>Mentor private notes:</b>{notes.map(n => <p key={n.id} style={{ margin: "3px 0 0" }}>{fmtDate(n.at)}: {n.text}</p>)}</div>}</div>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p style={{ color: "#aaa", fontSize: 12, textAlign: "center" }}>No pairs in this state.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────── Cohort Management ───────────────────────────
export function AdminCohortView({ programmeByCohort = {} }: { programmeByCohort?: Record<number, string> }) {
  const P = useProgramme();
  const [sel, setSel] = useState(P.cohorts[0].id);
  const [form, setForm] = useState<null | { name: string; startDate: string; endDate: string; sector: string; enrolled: number }>(null);
  const cohort = P.cohorts.find(c => c.id === sel) ?? P.cohorts[0];
  const ps = P.pairs.filter(p => p.cohortId === cohort.id);
  const live = ps.length > 0;
  const hs = (h: Health) => ps.filter(p => P.stats[p.id].health === h).length;
  const mentors = live ? new Set(ps.map(p => p.mentor)).size : cohort.snapshot?.mentors ?? 0;
  const avgProg = live ? Math.round(ps.reduce((a, p) => a + P.stats[p.id].goalPct, 0) / ps.length) : cohort.snapshot?.avgProgress ?? 0;
  // Enrolled can never be lower than the mentees actually in the cohort (paired + still waiting, who join the active cohort)
  const enrolled = cohortEnrolled(cohort, P.pairs, P.waiting.length);
  const total = rubricTotal(cohort.rubric);
  const buckets = live
    ? [["Active (healthy / new)", hs("Healthy") + hs("New"), "#059669"], ["At Risk", hs("At Risk"), "#f59e0b"], ["Stalled", hs("Stalled"), "#ef4444"], ["Awaiting match", Math.max(0, enrolled - ps.length), "#94a3b8"]]
    : [["Graduated", enrolled, "#059669"]];

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <Head t="Cohort and Programme Management" s="Cohorts group pairs; enrollment, mentors and progress are counted from the pairs inside them"
        right={<button style={{ ...btn(TEAL), display: "flex", gap: 6, alignItems: "center", padding: "8px 14px" }} onClick={() => setForm({ name: "", startDate: "", endDate: "", sector: "Mixed", enrolled: 0 })}><Plus size={13} /> New Cohort</button>} />

      {form && (
        <div style={{ ...card, padding: 16, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          {(["name", "startDate", "endDate", "sector"] as const).map(k => (
            <label key={k} style={{ fontSize: 10, color: "#888" }}>{k === "name" ? "Name" : k === "startDate" ? "Start" : k === "endDate" ? "End" : "Sector"}
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={k === "name" ? "Cohort 6 — 2026" : k === "sector" ? "Mixed" : "Jan 2026"} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 9px", fontSize: 11, marginTop: 3 }} /></label>))}
          <label style={{ fontSize: 10, color: "#888" }}>Target mentees
            <input type="number" value={form.enrolled} onChange={e => setForm({ ...form, enrolled: +e.target.value })} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 9px", fontSize: 11, marginTop: 3 }} /></label>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btn(TEAL)} onClick={() => { if (!form.name.trim()) return toast.error("Give the cohort a name"); P.addCohort(form); setForm(null); toast.success("Cohort created"); }}>Create</button>
            <button style={btn("#f5f5f5", "#666")} onClick={() => setForm(null)}><X size={11} /></button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {P.cohorts.map(c => {
          const cp = P.pairs.filter(p => p.cohortId === c.id);
          return (
            <button key={c.id} onClick={() => setSel(c.id)} style={{ ...card, padding: 16, textAlign: "left", cursor: "pointer", border: `2px solid ${cohort.id === c.id ? TEAL : "transparent"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: NAVY, fontSize: 12, fontWeight: 700 }}>{c.name}</span>
                <span style={{ background: c.status === "Active" ? "#f0fdf4" : "#f3f4f6", color: c.status === "Active" ? "#059669" : "#6b7280", fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>{c.status}</span>
              </div>
              <p style={{ color: "#888", fontSize: 10, margin: 0 }}>{c.startDate} – {c.endDate}<span style={{ marginLeft: 12 }}>{c.sector}</span></p>
              <p style={{ color: "#888", fontSize: 10, margin: "4px 0 0" }}>{cp.length ? `${cp.length} paired of ${cohortEnrolled(c, P.pairs, P.waiting.length)}` : `${cohortEnrolled(c, P.pairs, P.waiting.length)} mentees`}{programmeByCohort[c.id] ? <span style={{ marginLeft: 12 }}>{programmeByCohort[c.id]}</span> : null}</p>
            </button>
          );
        })}
      </div>

      <div style={{ ...card, padding: 20 }}>
        <p style={{ color: NAVY, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>{cohort.name}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[["Enrolled", enrolled], ["Paired", live ? ps.length : enrolled], ["Mentors", mentors], ["Avg Goal Progress", `${avgProg}%`]].map(([l, v]) => (
            <div key={l as string} style={{ background: "#f8f9fb", borderRadius: 3, padding: "10px 12px" }}><p style={{ color: "#aaa", fontSize: 9, margin: "0 0 4px" }}>{l}</p><p style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: 0 }}>{v}</p></div>))}
        </div>
        <p style={{ color: "#888", fontSize: 10, fontWeight: 700, margin: "0 0 8px" }}>ENROLLMENT STATUS {live ? "(from Relationship Health)" : ""}</p>
        <div style={{ display: "grid", gap: 6, marginBottom: 18 }}>
          {buckets.map(([l, n, c]) => (
            <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
              <span style={{ width: 150, color: "#555" }}>{l}</span>
              <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3 }}><div style={{ height: "100%", width: `${enrolled ? ((n as number) / enrolled) * 100 : 0}%`, background: c as string, borderRadius: 3 }} /></div>
              <span style={{ width: 24, textAlign: "right", color: NAVY, fontWeight: 700 }}>{n}</span>
            </div>))}
        </div>
        {live && (<>
          <p style={{ color: "#888", fontSize: 10, fontWeight: 700, margin: "0 0 8px" }}>PAIRS IN THIS COHORT</p>
          {ps.map(p => <p key={p.id} style={{ fontSize: 11, color: "#555", margin: "0 0 4px" }}><span style={{ color: HC[P.stats[p.id].health], fontWeight: 700 }}>●</span> {p.mentee} → {p.mentor}<span style={{ marginLeft: 12 }}>{P.stats[p.id].goalPct}% goals</span></p>)}
        </>)}
        <p style={{ color: "#888", fontSize: 10, fontWeight: 700, margin: "18px 0 8px" }}>SCORING RUBRIC — total <span style={{ color: total === 100 ? "#059669" : "#ef4444" }}>{total}%</span></p>
        <div style={{ display: "grid", gap: 6 }}>
          {cohort.rubric.map((r, i) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#555" }}>
              <span style={{ flex: 1 }}>{r.label}</span>
              <input type="number" min={0} max={100} value={r.weight} onChange={e => P.setRubric(cohort.id, cohort.rubric.map((x, j) => (j === i ? { ...x, weight: +e.target.value } : x)))} style={{ width: 56, border: "1px solid #e0e0e0", borderRadius: 3, padding: "4px 6px", fontSize: 11 }} /> %
            </div>))}
        </div>
      </div>
    </div>
  );
}
const rubricTotal = (r: { weight: number }[]) => r.reduce((a, x) => a + x.weight, 0);

// ─────────────────────────── Reports & Analytics ───────────────────────────
export function AdminReportingView() {
  const P = useProgramme();
  const [period, setPeriod] = useState<Period>("quarter");
  const [cohortId, setCohortId] = useState<number | undefined>(P.cohorts[0].id);
  const r = buildReport(P, period, cohortId);
  const delta = r.sessionsPrev ? Math.round(((r.sessions - r.sessionsPrev) / r.sessionsPrev) * 100) : null;
  const maxM = Math.max(1, ...r.monthly.map(m => m.sessions)), maxS = Math.max(1, ...r.perMentor.map(m => m.sessions));

  const exportCsv = () => {
    const rows = [["Metric", "Value"], ["Period", PERIODS[period].label], ["Cohort", cohortId ? P.cohortName(cohortId) : "All"], ["Pairs", r.pairCount], ["Sessions", r.sessions], ["Avg goal progress %", r.avgGoal], ["Satisfaction %", r.satisfaction ?? ""], ["Impact score", r.impact], ["Task completion %", r.taskPct], ["Active pair rate %", r.activePairRate], ...r.outcomes.map(o => [o.label, o.val]), ...r.perMentor.map(m => [`Sessions – ${m.mentor}`, m.sessions])];
    const url = URL.createObjectURL(new Blob([rows.map(x => x.join(",")).join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `programme-report-${AS_OF}.csv` }).click();
    URL.revokeObjectURL(url); toast.success("Report exported");
  };

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <Head t="Reports & Analytics" s="Aggregated from logged sessions, goals, tasks and ratings"
        right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={cohortId ?? ""} onChange={e => setCohortId(e.target.value ? +e.target.value : undefined)} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "6px 8px", fontSize: 10 }}>
            <option value="">All cohorts</option>{P.cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {(Object.keys(PERIODS) as Period[]).map(k => <button key={k} onClick={() => setPeriod(k)} style={btn(period === k ? TEAL : "#f5f5f5", period === k ? "#fff" : "#666")}>{k[0].toUpperCase() + k.slice(1)}</button>)}
          <button style={{ ...btn(NAVY), display: "flex", gap: 5, alignItems: "center" }} onClick={exportCsv}><Download size={12} /> Export CSV</button>
        </div>} />
      <p style={{ color: "#aaa", fontSize: 10, margin: "-8px 0 0" }}>Window: {PERIODS[period].label} to {fmtDate(AS_OF)}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { l: "Sessions Conducted", v: r.sessions, sub: delta == null ? "no prior period" : `${delta >= 0 ? "+" : ""}${delta}% vs previous`, c: TEAL },
          { l: "Avg Goal Progress", v: `${r.avgGoal}%`, sub: `${r.goalsDone}/${r.goalsTotal} goals complete`, c: "#059669" },
          { l: "Mentee Satisfaction", v: r.satisfaction == null ? "—" : `${r.satisfaction}%`, sub: "avg rating in window", c: "#f59e0b" },
          { l: "Impact Score", v: r.impact, sub: "sessions×10 + tasks×5 + goals×15 + milestones×25", c: NAVY },
        ].map(k => (
          <div key={k.l} style={{ ...card, padding: "16px 18px" }}>
            <p style={{ color: "#888", fontSize: 10, margin: "0 0 6px" }}>{k.l}</p>
            <p style={{ color: k.c, fontSize: 26, fontWeight: 800, margin: "0 0 2px" }}>{k.v}</p>
            <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>{k.sub}</p>
          </div>))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...card, padding: 18 }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Sessions by Mentor ({PERIODS[period].label.toLowerCase()})</p>
          {r.perMentor.map(m => (
            <div key={m.mentor} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}><span style={{ color: "#555" }}>{m.mentor}</span><span style={{ color: m.sessions ? TEAL : "#ef4444", fontWeight: 700 }}>{m.sessions}</span></div>
              <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}><div style={{ height: "100%", width: `${(m.sessions / maxS) * 100}%`, background: m.sessions ? TEAL : "#ef4444", borderRadius: 3 }} /></div>
            </div>))}
        </div>
        <div style={{ ...card, padding: 18 }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Monthly Sessions, 2025</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {r.monthly.map(m => (
              <div key={m.month} style={{ flex: 1, textAlign: "center" }}>
                <p style={{ color: m.current ? TEAL : "#aaa", fontSize: 9, margin: "0 0 2px", fontWeight: m.current ? 700 : 400 }}>{m.sessions}</p>
                <div style={{ height: `${(m.sessions / maxM) * 70}px`, minHeight: 2, background: m.current ? TEAL : `${TEAL}40`, borderRadius: "3px 3px 0 0" }} />
                <p style={{ color: "#aaa", fontSize: 8, margin: "3px 0 0" }}>{m.month}</p>
              </div>))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...card, padding: 18 }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Engagement</p>
          {[["Avg sessions / pair / week", r.perSessionsPerWeek], ["Task completion", `${r.taskPct}%`], ["Pairs with a session in last 30 days", `${r.activePairRate}%`], ["Pairs on track", `${r.onTrackPct}%`]].map(([l, v]) => (
            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}><span style={{ color: "#666" }}>{l}</span><b style={{ color: NAVY }}>{v}</b></div>))}
        </div>
        <div style={{ ...card, padding: 18 }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Business Outcomes (of {r.pairCount} pairs)</p>
          {r.outcomes.map(o => (
            <div key={o.label} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}><span style={{ color: "#555" }}>{o.label}</span><b style={{ color: NAVY }}>{o.val}</b></div>
              <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3 }}><div style={{ height: "100%", width: `${r.pairCount ? (o.val / r.pairCount) * 100 : 0}%`, background: TEAL, borderRadius: 3 }} /></div>
            </div>))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Integration Hub ───────────────────────────
const EFFECTS: Record<string, string> = {
  "Google Calendar": "Mentee 'Add to Calendar' button", "Microsoft Outlook": "Mentee 'Add to Calendar' button",
  Zoom: "'Join Call' / 'Start Video Call' in both dashboards", "Google Meet": "'Join Call' / 'Start Video Call' in both dashboards",
  "LMS (Moodle)": "Course tasks shown in mentee 'Tasks & Learning'", Slack: "Nudges also posted to Slack",
};
export function AdminIntegrationView() {
  const P = useProgramme();
  const connected = P.integrations.filter(i => i.status === "Connected").length;
  const cats = [...new Set(P.integrations.map(i => i.category))];
  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <Head t="Integration Hub" s={`${connected} of ${P.integrations.length} connected. Toggling one changes what mentors and mentees see`} />
      {cats.map(cat => (
        <div key={cat}>
          <p style={{ color: "#888", fontSize: 10, fontWeight: 700, margin: "0 0 8px" }}>{cat.toUpperCase()}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            {P.integrations.filter(i => i.category === cat).map(i => {
              const on = i.status === "Connected";
              return (
                <div key={i.name} style={{ ...card, padding: 16, borderLeft: `4px solid ${on ? "#059669" : "#e5e7eb"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: NAVY, fontSize: 12, fontWeight: 700 }}>{i.name}</span>
                    <span style={{ color: on ? "#059669" : "#9ca3af", fontSize: 9, fontWeight: 700 }}>{on ? "● Connected" : "○ " + (i.status === "Configurable" ? "Not configured" : "Not connected")}</span>
                  </div>
                  <p style={{ color: "#888", fontSize: 10, margin: "0 0 6px" }}>{i.desc}</p>
                  {EFFECTS[i.name] && <p style={{ color: TEAL, fontSize: 9, margin: "0 0 8px" }}>Feeds: {EFFECTS[i.name]}</p>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {on ? (<>
                      <button style={btn("#f8f9fb", "#666", "1px solid #e0e0e0")} onClick={() => { P.syncIntegration(i.name); toast.success(`${i.name} synced`); }}>Sync now</button>
                      <button style={btn("#fef2f2", "#ef4444", "1px solid #fecaca")} onClick={() => { P.disconnectIntegration(i.name); toast(`${i.name} disconnected`); }}>Disconnect</button>
                      <span style={{ color: "#bbb", fontSize: 9, marginLeft: "auto" }}>Last sync: {i.lastSync}</span>
                    </>) : <button style={btn(TEAL)} onClick={() => { P.connectIntegration(i.name); toast.success(`${i.name} connected`); }}>Connect</button>}
                  </div>
                </div>);
            })}
          </div>
        </div>))}
    </div>
  );
}
void daysBetween;
