// The entrepreneur dashboard sections from the spec. They only display what MenteePortal works out
// from the programme store (see data/journey.ts); where there is no data they say so.
import { useState, type ReactNode } from "react";
import { Award, Check, ChevronRight, Download, Lightbulb, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, fmtDue, daysBetween, todayISO, type Post, type Pair } from "../data/programmeStore";
import type { ActionItem, Priority, Recommendation, StepState } from "../data/journey";
import type { FundingOpportunity } from "../data/announcements";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
const GRAD = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";
const CARD = { background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } as const;

export type Go = "overview" | "mentor" | "goals" | "sessions" | "tasks" | "resources" | "community" | "funding" | "profile";

export const Card = ({ title, sub, children, action }: { title: string; sub?: string; children: ReactNode; action?: ReactNode }) => (
  <section className="md-card" style={CARD} aria-label={title}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "0 0 12px", gap: 10 }}>
      <div>
        <h2 style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: 0 }}>{title}</h2>
        {sub && <p style={{ color: "#777", fontSize: 10, margin: "2px 0 0" }}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);
const Empty = ({ children }: { children: ReactNode }) => <p style={{ color: "#666", fontSize: 11, margin: 0, lineHeight: 1.6 }}>{children}</p>;
const barColor = (v: number) => (v >= 70 ? "#059669" : v >= 40 ? TEAL : "#f59e0b");

/** A labelled bar. With no value it says there is not enough data rather than drawing an empty bar as 0%. */
export function Meter({ label, value, sub, why }: { label: string; value: number | null; sub?: string; why?: string }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, gap: 8 }}>
        <span style={{ color: "#333", fontSize: 11 }}>{label}</span>
        <span style={{ color: value == null ? "#777" : NAVY, fontSize: 11, fontWeight: 700 }}>{value == null ? "Not enough data yet" : `${value}%`}</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined} aria-valuetext={value == null ? "Not enough data yet" : `${value}%`} style={{ height: 6, background: "#eceff3", borderRadius: 3, overflow: "hidden" }}>
        {value != null && <div style={{ height: "100%", width: `${value}%`, background: barColor(value), borderRadius: 3, transition: "width 0.8s ease" }} />}
      </div>
      {(sub || why) && <p style={{ color: "#777", fontSize: 9, margin: "3px 0 0" }}>{sub}{sub && why ? " · " : ""}{why}</p>}
    </div>
  );
}

export function WelcomeBanner({ greeting, first, cohort, overall, nextMilestone, canLearn, onGo }: { greeting: string; first: string; cohort: string; overall: number | null; nextMilestone: string | null; canLearn: boolean; onGo: (g: Go) => void }) {
  return (
    <section className="md-card" aria-label="Welcome" style={{ background: GRAD, borderRadius: 3, padding: "20px 24px", color: "#fff" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{greeting}, {first}!</h2>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{cohort ? `Welcome to ${cohort}.` : "Welcome to your programme."}</p>
      <p style={{ margin: "0 0 4px", fontSize: 12 }}>{overall == null ? "Your journey progress appears here once you have goals, tasks or sessions." : `You have completed ${overall}% of your journey.`}</p>
      {nextMilestone && <p style={{ margin: "0 0 14px", fontSize: 12 }}>Next milestone: <b>{nextMilestone}</b></p>}
      <button onClick={() => onGo("tasks")} style={{ background: "#fff", color: NAVY, border: "none", borderRadius: 3, padding: "9px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
        {canLearn ? "Continue Learning" : "View my tasks"} <ChevronRight size={12} aria-hidden="true" />
      </button>
    </section>
  );
}

export function ProgrammeStatus({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <Card title="Programme status">
      <dl className="md-r4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: 0 }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: "#f8f9fb", borderRadius: 3, padding: "9px 11px" }}>
            <dt style={{ color: "#777", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</dt>
            <dd style={{ color: NAVY, fontSize: 12, fontWeight: 700, margin: "2px 0 0" }}>{r.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function ProgressOverview({ items }: { items: { label: string; value: number | null; sub?: string; why?: string }[] }) {
  return <Card title="Progress overview" sub="Worked out from your goals, tasks, courses, sessions and milestones.">{items.map(i => <Meter key={i.label} {...i} />)}</Card>;
}

const PRI: Record<Priority, { bg: string; fg: string }> = { High: { bg: "#fef2f2", fg: "#b91c1c" }, Medium: { bg: "#fffbeb", fg: "#92600a" }, Low: { bg: "#f0f4f7", fg: "#4b5563" } };
/** "Your next steps": each with priority, due date and status. */
export function ActionTable({ items, onGo }: { items: ActionItem[]; onGo: (g: Go) => void }) {
  return (
    <Card title="Your next steps" sub={items.length ? "What to do today, most urgent first." : undefined}>
      {items.length === 0 ? <Empty>You are all caught up. Propose a session time or a new goal when you are ready.</Empty> : (
        <div>
          {items.slice(0, 6).map(i => (
            <button key={i.key} onClick={() => onGo(i.go)} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center", textAlign: "left", background: "#f8f9fb", border: "none", borderLeft: `3px solid ${PRI[i.priority].fg}`, borderRadius: 3, padding: "9px 12px", marginBottom: 6, cursor: "pointer" }}>
              <span style={{ color: NAVY, fontSize: 11, fontWeight: 600 }}>{i.text}</span>
              <span style={{ background: PRI[i.priority].bg, color: PRI[i.priority].fg, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 3 }}>{i.priority} priority</span>
              <span style={{ color: "#555", fontSize: 10 }}>{i.due === "—" ? "No due date" : `Due ${fmtDue(i.due)}`}</span>
              <span style={{ color: i.status === "Overdue" ? "#b91c1c" : "#555", fontSize: 10, fontWeight: i.status === "Overdue" ? 700 : 500 }}>{i.status}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

const STEP_COLOR: Record<StepState, string> = { done: "#059669", current: "#2563eb", upcoming: "#9ca3af" };
const STEP_WORD: Record<StepState, string> = { done: "completed", current: "current stage", upcoming: "upcoming" };
export function RoadmapCard({ steps, current }: { steps: { label: string; state: StepState }[]; current: string | null }) {
  return (
    <Card title="Incubation roadmap" sub={current ? `You are at ${current}.` : "Your stage has not been recorded, so no step is marked as current."}>
      <ol style={{ display: "flex", listStyle: "none", margin: 0, padding: 0, overflowX: "auto" }}>
        {steps.map((s, i) => (
          <li key={s.label} aria-label={`${s.label}: ${STEP_WORD[s.state]}`} style={{ flex: 1, minWidth: 84, textAlign: "center", position: "relative" }}>
            {i > 0 && <span aria-hidden="true" style={{ position: "absolute", top: 13, left: "-50%", width: "100%", height: 3, background: steps[i - 1].state === "done" ? "#059669" : "#e5e7eb" }} />}
            <span aria-hidden="true" style={{ position: "relative", zIndex: 1, width: 28, height: 28, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", background: s.state === "upcoming" ? "#fff" : STEP_COLOR[s.state], border: `3px solid ${STEP_COLOR[s.state]}`, color: "#fff" }}>
              {s.state === "done" ? <Check size={14} /> : s.state === "current" ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> : null}
            </span>
            <span style={{ display: "block", fontSize: 10, fontWeight: s.state === "current" ? 700 : 500, color: s.state === "upcoming" ? "#6b7280" : NAVY, padding: "0 3px" }}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p style={{ display: "flex", gap: 14, margin: "12px 0 0", fontSize: 9, color: "#555" }}>
        {(["done", "current", "upcoming"] as StepState[]).map(k => <span key={k}><span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: STEP_COLOR[k], marginRight: 4 }} />{k === "done" ? "Completed" : k === "current" ? "Current" : "Upcoming"}</span>)}
      </p>
    </Card>
  );
}

export function LearningProgress({ course, enrolled, completed, rate, onContinue }: {
  course: { title: string; done: number; total: number } | null; enrolled: number; completed: number; rate: number | null; onContinue: () => void;
}) {
  const pct = course ? Math.round((course.done / course.total) * 100) : null;
  return (
    <Card title="Learning progress">
      {!course ? <Empty>{enrolled ? "You have finished every course you were given. Well done." : "No courses have been assigned yet. Your mentor or the programme team assigns them."}</Empty> : (<>
        <p style={{ margin: "0 0 2px", color: NAVY, fontSize: 12, fontWeight: 700 }}>{course.title}</p>
        <Meter label="Completion" value={pct} />
        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "0 0 12px" }}>
          {[["Next lesson", `Module ${course.done + 1} of ${course.total}`], ["Assessment score", "Not assessed yet"], ["Certificate", `After ${course.total - course.done} more module${course.total - course.done === 1 ? "" : "s"}`]].map(([k, v]) => (
            <div key={k} style={{ background: "#f8f9fb", borderRadius: 3, padding: "8px 10px" }}><dt style={{ fontSize: 9, color: "#777" }}>{k}</dt><dd style={{ margin: "2px 0 0", fontSize: 11, color: NAVY, fontWeight: 600 }}>{v}</dd></div>
          ))}
        </dl>
        <button onClick={onContinue} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Continue learning</button>
      </>)}
      <p style={{ margin: "12px 0 0", fontSize: 10, color: "#555", borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
        Courses enrolled: <b>{enrolled}</b> · Completed: <b>{completed}</b> · Completion rate: <b>{rate == null ? "—" : `${rate}%`}</b>
      </p>
    </Card>
  );
}

export function CertificatesCard({ certs, onDownload }: { certs: { id: string; title: string; modules: number; completedOn?: string }[]; onDownload: (id: string) => void }) {
  return (
    <Card title="Certificates" sub="Issued when you finish every module of a course.">
      {certs.length === 0 ? <Empty>No certificates yet. Finish all the modules of a course to earn one.</Empty> : certs.map(c => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f8f9fb", borderRadius: 3, marginBottom: 6 }}>
          <Award size={18} color="#b45309" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: NAVY, fontSize: 11, fontWeight: 600 }}>{c.title}</p>
            <p style={{ margin: "1px 0 0", color: "#777", fontSize: 9 }}>{c.modules} modules{c.completedOn ? ` · completed ${fmtDate(c.completedOn)}` : ""}</p>
          </div>
          <button onClick={() => onDownload(c.id)} aria-label={`Download certificate: ${c.title}`} style={{ display: "flex", alignItems: "center", gap: 5, background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Download size={11} aria-hidden="true" /> Download</button>
        </div>
      ))}
    </Card>
  );
}

export function RecommendationsCard({ items, onGo }: { items: Recommendation[]; onGo: (g: Go) => void }) {
  return (
    <Card title="Smart recommendations" sub="Suggested from your own goals, tasks, sessions and stage. Each says why.">
      {items.length === 0 ? <Empty>Nothing needs your attention right now. Keep going.</Empty> : items.map(r => (
        <button key={r.key} onClick={() => onGo(r.go)} style={{ width: "100%", display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", background: "#f8f9fb", border: "none", borderRadius: 3, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}>
          <Lightbulb size={14} color={r.tone === "warn" ? "#f59e0b" : TEAL} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", color: NAVY, fontSize: 11, fontWeight: 600 }}>{r.text}</span>
            <span style={{ display: "block", color: "#666", fontSize: 10, marginTop: 1 }}>{r.why}</span>
          </span>
          <ChevronRight size={12} color="#999" aria-hidden="true" style={{ marginTop: 2 }} />
        </button>
      ))}
    </Card>
  );
}

export function AnnouncementsCard({ items }: { items: { id: string; kind: string; title: string; body: string; at: string }[] }) {
  return (
    <Card title="Announcements">
      {items.length === 0 ? <Empty>No announcements yet.</Empty> : items.map(a => (
        <article key={a.id} style={{ borderBottom: "1px solid #f3f4f6", padding: "8px 0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
            <span style={{ background: `${TEAL}18`, color: TEAL, fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 3 }}>{a.kind}</span>
            <span style={{ color: "#888", fontSize: 9 }}>{fmtDate(a.at)}</span>
          </div>
          <p style={{ margin: 0, color: NAVY, fontSize: 11, fontWeight: 600 }}>{a.title}</p>
          <p style={{ margin: "2px 0 0", color: "#555", fontSize: 10, lineHeight: 1.5 }}>{a.body}</p>
        </article>
      ))}
    </Card>
  );
}

export function QuickStats({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <Card title="Quick statistics">
      <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: 0 }}>
        {stats.map(s => <div key={s.label} style={{ background: "#f8f9fb", borderRadius: 3, padding: "8px 10px" }}><dd style={{ margin: 0, color: NAVY, fontSize: 18, fontWeight: 800 }}>{s.value}</dd><dt style={{ color: "#666", fontSize: 9 }}>{s.label}</dt></div>)}
      </dl>
    </Card>
  );
}

export function QuickActions({ onGo }: { onGo: (g: Go) => void }) {
  const A: [string, Go][] = [["Apply for Funding", "funding"], ["Book Mentor", "sessions"], ["Join Discussion", "community"], ["Upload Evidence", "tasks"], ["Continue Learning", "tasks"], ["Update Startup Profile", "profile"]];
  return (
    <Card title="Quick actions">
      <div style={{ display: "grid", gap: 6 }}>
        {A.map(([l, g]) => <button key={l} onClick={() => onGo(g)} style={{ textAlign: "left", background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>)}
      </div>
    </Card>
  );
}

export function HealthScore({ h }: { h: { readiness: number | null; learning: number | null; validation: number | null; documentation: number | null; investment: number | null } }) {
  return (
    <Card title="Business health score" sub="Each reading says where it comes from.">
      <Meter label="Business readiness" value={h.readiness} why="average of the four below" />
      <Meter label="Learning" value={h.learning} why="modules finished" />
      <Meter label="Validation" value={h.validation} why="progress on Market goals" />
      <Meter label="Documentation" value={h.documentation} why="finished tasks with evidence" />
      <Meter label="Investment readiness" value={h.investment} why="registered, MVP, first revenue, grant" />
    </Card>
  );
}

export function CommunityHighlights({ posts, popular, peers, onGo }: { posts: Post[]; popular: { id: string; title: string; n: number }[]; peers: number; onGo: (g: Go) => void }) {
  return (
    <Card title="Community highlights" action={<button onClick={() => onGo("community")} style={{ background: "none", border: "none", color: TEAL, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Open</button>}>
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: NAVY }}>Recent discussions</p>
      {posts.length === 0 ? <Empty>No posts yet. Start the first discussion in your cohort.</Empty> : posts.slice(0, 3).map(p => (
        <p key={p.id} style={{ margin: "0 0 5px", fontSize: 10, color: "#444", lineHeight: 1.4 }}><b>{p.author}</b>: {p.text.length > 70 ? `${p.text.slice(0, 70)}…` : p.text}</p>
      ))}
      <p style={{ margin: "10px 0 4px", fontSize: 10, fontWeight: 700, color: NAVY }}>Popular resources</p>
      {popular.length === 0 ? <Empty>Nothing downloaded or shared yet.</Empty> : popular.map(r => <p key={r.id} style={{ margin: "0 0 3px", fontSize: 10, color: "#444" }}>{r.title} · used {r.n} time{r.n === 1 ? "" : "s"}</p>)}
      <p style={{ margin: "10px 0 0", fontSize: 10, color: "#555" }}>{peers} peer founder{peers === 1 ? "" : "s"} in your cohort</p>
    </Card>
  );
}

/** Cohort discussion board: founders in the same cohort post and reply. */
export function CommunityBoard({ posts, peers, me, onPost, onReply }: {
  posts: Post[]; peers: Pair[]; me: string; onPost: (t: string) => boolean; onReply: (id: string, t: string) => boolean;
}) {
  const [text, setText] = useState("");
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  return (
    <div className="md-r12" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <Card title="Start a discussion" sub="Only founders in your cohort can see this board.">
          <label htmlFor="new-post" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Write a post</label>
          <textarea id="new-post" rows={3} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder="Ask a question, share what worked, or look for help…" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 3, padding: 10, fontSize: 11, resize: "vertical" }} />
          <button onClick={() => { if (onPost(text)) setText(""); }} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Send size={12} aria-hidden="true" /> Post</button>
        </Card>
        {posts.length === 0 && <Card title="Discussions"><Empty>No posts yet. Be the first to write one.</Empty></Card>}
        {posts.map(p => (
          <article key={p.id} className="md-card" style={CARD} aria-label={`Post by ${p.author}`}>
            <p style={{ margin: 0, fontSize: 11, color: NAVY, fontWeight: 700 }}>{p.author}{p.author === me ? " (you)" : ""} <span style={{ color: "#777", fontWeight: 400 }}>· {p.venture} · {fmtDate(p.at)}</span></p>
            <p style={{ margin: "6px 0 10px", fontSize: 12, color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.text}</p>
            {p.replies.map(r => (
              <p key={r.id} style={{ margin: "0 0 6px", padding: "6px 10px", background: "#f8f9fb", borderRadius: 3, fontSize: 11, color: "#444", whiteSpace: "pre-wrap" }}><b>{r.author}</b>: {r.text}</p>
            ))}
            {replying === p.id ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input autoFocus value={reply} onChange={e => setReply(e.target.value)} aria-label={`Reply to ${p.author}`} maxLength={1000} onKeyDown={e => { if (e.key === "Enter" && onReply(p.id, reply)) { setReply(""); setReplying(null); } }} placeholder="Write a reply" style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                <button onClick={() => { if (onReply(p.id, reply)) { setReply(""); setReplying(null); } }} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reply</button>
              </div>
            ) : <button onClick={() => { setReplying(p.id); setReply(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: TEAL, fontSize: 10, fontWeight: 700, cursor: "pointer", padding: 0 }}><MessageSquare size={11} aria-hidden="true" /> Reply</button>}
          </article>
        ))}
      </div>
      <Card title="Peer founders" sub="In your cohort">
        {peers.length === 0 ? <Empty>You are the only matched founder in your cohort so far.</Empty> : peers.map(p => (
          <div key={p.id} style={{ padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ margin: 0, fontSize: 11, color: NAVY, fontWeight: 600 }}>{p.mentee}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#666" }}>{p.venture} · {p.sector}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

const TYPE_COLOR: Record<string, string> = { Grant: "#059669", Loan: "#b45309", Competition: "#7c3aed", Investor: "#2563eb" };
export function FundingPage({ opps, stepNow, interested, onToggle, investment, checklist, templates }: {
  opps: FundingOpportunity[]; stepNow: number | null; interested: Set<string>; onToggle: (o: FundingOpportunity) => void; investment: number | null;
  checklist: { label: string; done: boolean }[]; templates: ReactNode;
}) {
  const today = todayISO();
  const open = opps.filter(o => o.deadline >= today).sort((a, b) => a.deadline.localeCompare(b.deadline));
  return (
    <div className="md-r12" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <Card title="Funding opportunities" sub="Grants, loans, competitions and investor introductions. These are sample listings until the programme team publishes real ones.">
          {open.length === 0 && <Empty>No open opportunities right now.</Empty>}
          {open.map(o => {
            const days = daysBetween(today, o.deadline), fits = stepNow != null && stepNow >= o.fromStep, on = interested.has(o.id);
            return (
              <article key={o.id} aria-label={o.title} style={{ border: "1px solid #e5e7eb", borderRadius: 3, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, color: NAVY, fontSize: 12, fontWeight: 700 }}>{o.title}</p>
                  <span style={{ color: TYPE_COLOR[o.type], fontSize: 9, fontWeight: 700 }}>{o.type.toUpperCase()}</span>
                </div>
                <p style={{ margin: "2px 0 6px", color: "#666", fontSize: 10 }}>{o.funder} · {o.amount}</p>
                <p style={{ margin: "0 0 6px", color: "#444", fontSize: 10, lineHeight: 1.5 }}>{o.eligibility}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: days <= 14 ? "#b91c1c" : "#555", fontWeight: days <= 14 ? 700 : 400 }}>Closes {fmtDate(o.deadline)} ({days} day{days === 1 ? "" : "s"} left) · {fits ? "Fits your stage" : "Better once you reach a later stage"}</span>
                  <button onClick={() => onToggle(o)} aria-pressed={on} style={{ background: on ? "#f0fdf4" : TEAL, color: on ? "#059669" : "#fff", border: on ? "1px solid #059669" : "none", borderRadius: 3, padding: "6px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{on ? "Interest sent to your mentor ✓" : "I want to apply"}</button>
                </div>
              </article>
            );
          })}
        </Card>
        <Card title="Pitch deck and financial templates">{templates}</Card>
      </div>
      <Card title="Investor readiness" sub="Counts what you have actually reached.">
        <Meter label="Investment readiness" value={investment} />
        {checklist.map(c => (
          <p key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px", fontSize: 11, color: c.done ? "#059669" : "#555" }}>
            <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${c.done ? "#059669" : "#cbd5e1"}`, background: c.done ? "#059669" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c.done && <Check size={9} color="#fff" />}</span>
            {c.label}<span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{c.done ? ": done" : ": not yet"}</span>
          </p>
        ))}
      </Card>
    </div>
  );
}
