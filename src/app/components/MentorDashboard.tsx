import { useState, useRef, useEffect } from "react";
import {
  Home, Users, Calendar, Target, MessageCircle, BookOpen,
  TrendingUp, User, LogOut, Bell, ChevronRight, CheckCircle,
  Circle, Play, Send, Download, Star, Clock, Flag, Award,
  AlertTriangle, BarChart2, Zap, X, Plus, CheckSquare, Video, Map
} from "lucide-react";
import { toast } from "sonner";
import { useProgramme, RESOURCES as LIBRARY, mentorImpact, mentorKey, isMentorOf, firstName, effectiveMilestones, downloadResource, fmtDate, fmtDateY, fmtDue, todayISO, fmtBooking, isOverdue, isLiveBooking, awaitingLog, isUpcoming } from "../data/programmeStore";
import { addDays, addMonths, monthKey, monthShort } from "../data/clock";
import { useDirectory } from "../data/directory";
import { DemoTools } from "./DemoTools";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
const GRAD = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";
const LOGO = "https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png";

const mdorStyles = `
@keyframes mdor-up { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
@keyframes mdor-ring { 0%{stroke-dashoffset:280;} 100%{stroke-dashoffset:0;} }
@keyframes mdor-pulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
@keyframes mdor-bar { from{width:0;} to{width:var(--w);} }
@keyframes mdor-count { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
.mdor-card { animation: mdor-up 0.4s ease both; }
.mdor-card:nth-child(2){animation-delay:.06s;} .mdor-card:nth-child(3){animation-delay:.12s;} .mdor-card:nth-child(4){animation-delay:.18s;}
.mdor-nav { transition: all 0.2s; }
.mdor-nav:hover { background: rgba(255,255,255,0.12) !important; }
.mdor-nav.active { background: rgba(255,255,255,0.18) !important; border-left: 3px solid #fff !important; }
.mdor-chip { transition: all 0.15s; }
.mdor-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
`;

function RingGauge({ pct, size = 90, stroke = 8, color = TEAL, label = "", sub = "" }: {
  pct: number; size?: number; stroke?: number; color?: string; label?: string; sub?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#ffffff", fontSize: label.length > 4 ? 13 : 16, fontWeight: 800, lineHeight: 1 }}>{label}</span>
        {sub && <span style={{ color: "#ffffff", fontSize: 8, marginTop: 2, opacity: 0.95 }}>{sub}</span>}
      </div>
    </div>
  );
}

type NavSection = "overview" | "mentees" | "sessions" | "goals" | "tasks" | "messages" | "impact" | "resources" | "profile";

const TYPE_ICON: Record<string, typeof BookOpen> = { Template: BarChart2, Guide: Map, Checklist: CheckSquare, Workbook: BookOpen };

const LIFECYCLE = ["Idea", "Validation", "MVP", "Revenue", "Scaling"];

const SC: Record<string, string> = { "on-track": "#059669", "at-risk": "#f59e0b", "stalled": "#ef4444", "complete": "#059669", "proposed": "#94a3b8" };

/** A progress update the mentee reported. The mentor confirms it, corrects the number, or declines it. */
function ReviewProgress({ goal }: { goal: { id: string; pct: number; pending?: { pct: number; note: string; at: string } } }) {
  const P = useProgramme();
  const [adjust, setAdjust] = useState(false);
  const [val, setVal] = useState(String(goal.pending?.pct ?? goal.pct));
  const [comment, setComment] = useState("");
  if (!goal.pending) return null;
  const act = (decision: "confirm" | "adjust" | "decline") => {
    const r = P.reviewProgress(goal.id, decision, { pct: Number(val), comment });
    if (!r.ok) return toast.error(r.reason);
    toast.success(decision === "decline" ? "Update declined" : "Progress confirmed");
  };
  const btn = (bg: string, color: string) => ({ background: bg, color, border: "none", borderRadius: 3, padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" } as const);
  return (
    <div style={{ marginTop: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3, padding: "10px 12px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#92400e" }}>Mentee reports {goal.pending.pct}% (was {goal.pct}%) · {fmtDate(goal.pending.at)}</p>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#555" }}>"{goal.pending.note}"</p>
      {adjust && <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input type="number" min={0} max={99} value={val} onChange={e => setVal(e.target.value)} aria-label="Confirmed percentage" style={{ width: 64, border: "1px solid #e0e0e0", borderRadius: 3, padding: "5px 8px", fontSize: 11 }} />
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional note to the mentee" style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "5px 8px", fontSize: 11 }} />
      </div>}
      <div style={{ display: "flex", gap: 6 }}>
        {adjust ? <button onClick={() => act("adjust")} style={btn("#059669", "#fff")}>Confirm {Number(val) || 0}%</button> : <button onClick={() => act("confirm")} style={btn("#059669", "#fff")}>Confirm {goal.pending.pct}%</button>}
        {!adjust && <button onClick={() => setAdjust(true)} style={btn("#f1f5f9", "#475569")}>Set a different %</button>}
        <button onClick={() => (adjust ? setAdjust(false) : act("decline"))} style={btn("#fef2f2", "#dc2626")}>{adjust ? "Back" : "Decline"}</button>
      </div>
    </div>
  );
}

export function MentorDashboard({ onSignOut }: { onSignOut: () => void }) {
  const P = useProgramme();
  const dir = useDirectory();
  const me = P.currentUser?.role === "mentor" ? P.currentUser : null;
  const myName = me?.name ?? "";
  const myId = me?.id ?? "";
  const meP = dir.mentor(myId, myName);
  const isMine = (p: { mentorId?: string; mentor: string }) => isMentorOf(p, { id: myId, name: myName });
  const myPairs = P.pairs.filter(isMine);
  // The overdue flags, countdowns and "awaiting log" follow the clock; re-render every 30s.
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t); }, []);
  const myIds = new Set(myPairs.map(p => p.id));
  // Pairs re-matched away still hold this mentor's sessions and notifications
  const allMyIds = new Set([...myIds, ...P.pastPairs.filter(isMine).map(p => p.id)]);
  const MENTEES = myPairs.map((p, i) => {
    const prof = dir.mentee(p.menteeId, p.mentee); const s = P.stats[p.id]; const nb = P.nextBooking(p.id);
    return {
      id: i + 1, pairId: p.id, name: p.mentee, venture: p.venture, sector: p.sector,
      avatar: p.mentee.split(" ").map(w => w[0]).join(""), stage: p.stage, matchScore: p.matchScore,
      lastSession: s.lastSession ? fmtDate(s.lastSession) : "None yet", nextSession: nb ? fmtBooking(nb) : "Not scheduled",
      overallProgress: s.goalPct, metrics: prof?.metrics ?? { surveys: "N/A", MRR: "Pre-revenue", teamSize: 1 },
      blockers: prof?.blockers ?? [], openTasks: s.openTasks, goalsOnTrack: s.goalsOnTrack, goalsAtRisk: s.goalsAtRisk,
      bio: prof?.bio ?? `${p.venture} (${p.sector}). ${s.lastSession ? "" : "Newly matched. Book your introductory session."}`,
    };
  });
  const SESSIONS_LOG = P.sessions.filter(s => allMyIds.has(s.pairId)).sort((a, b) => b.date.localeCompare(a.date)).map(s => ({
    id: s.id, mentee: [...myPairs, ...P.pastPairs].find(p => p.id === s.pairId)!.mentee, date: fmtDateY(s.date), duration: `${s.durationMin} min`,
    mode: s.mode, topics: s.topics, tasks: s.tasks, rating: s.rating,
  }));
  const GOALS_MENTOR = P.goals.filter(g => myIds.has(g.pairId)).map(g => ({ id: g.id, pairId: g.pairId, title: g.title, pct: g.pct, status: g.status, due: g.due, proposedBy: g.proposedBy, pending: g.pending, log: g.log }));
  const myTasksDone = P.tasks.filter(t => myIds.has(t.pairId) && t.status === "done").length;
  // Mentors are grouped by ID (name only for legacy pairs without one), so two mentors who share a name stay separate.
  const allMentors = Object.values(Object.fromEntries(P.pairs.map(p => [mentorKey(p), { id: p.mentorId, name: p.mentor }])));
  const scores = allMentors.map(m => ({ m, s: mentorImpact(P, m) })).sort((a, b) => b.s - a.s);
  const myImpact = mentorImpact(P, { id: myId, name: myName });
  // Gauge scale follows the programme: 25% headroom above the top mentor, rounded-md up to 50
  const scoreMax = Math.max(100, Math.ceil(((scores[0]?.s ?? 0) * 1.25) / 50) * 50);
  const rank = Math.max(1, scores.findIndex(x => isMentorOf({ mentorId: x.m.id, mentor: x.m.name }, { id: myId, name: myName })) + 1);
  const milestonesUnlocked = myPairs.reduce((a, p) => a + Object.values(effectiveMilestones(p, P.goals)).filter(Boolean).length, 0);
  const nextAny = myPairs.map(p => P.nextBooking(p.id)).filter((b): b is NonNullable<typeof b> => !!b).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const MU = {
    name: myName, title: meP?.title ?? "Programme mentor", avatar: myName.replace(/^(Dr\.|Prof\.)\s*/, "").split(" ").map(w => w[0]).slice(0, 2).join(""),
    location: meP?.location ?? "Malawi", email: meP?.email || "—",
    expertise: meP?.expertiseAreas?.length ? meP.expertiseAreas : (meP?.expertise ?? "").split(/,| and | & /).map(x => x.trim()).filter(Boolean),
    cohort: myPairs[0] ? [P.projectName(myPairs[0].programId), P.cohortName(myPairs[0].cohortId)].filter(Boolean).join(" · ") : (P.projectName(meP?.programId) ?? "No pairing yet"), menteesActive: MENTEES.length,
    sessionsCompleted: SESSIONS_LOG.length, hoursContributed: Math.round(P.sessions.filter(s => allMyIds.has(s.pairId)).reduce((a, s) => a + s.durationMin, 0) / 60),
    impactScore: myImpact, milestonesUnlocked, rankLabel: `Ranked ${rank} of ${allMentors.length} mentors`,
    nextSession: nextAny ? fmtBooking(nextAny) : "None scheduled",
    stages: meP?.preferredStages?.length ? meP.preferredStages.join(", ") : "Not set",
    industries: meP?.industries?.length ? meP.industries.join(", ") : "Not set",
    hours: meP?.hoursPerMonth ? (/hour|hr/i.test(meP.hoursPerMonth) ? meP.hoursPerMonth : `${meP.hoursPerMonth} hrs`) : "Not set",
  };
  // Sessions per month: this month and the five before it, from the real session log
  const monthly = Array.from({ length: 6 }, (_, i) => { const first = addMonths(todayISO(), i - 5); return { label: monthShort(first)[0], v: P.sessions.filter(s => allMyIds.has(s.pairId) && monthKey(s.date) === monthKey(first)).length }; });
  const monthMax = Math.max(4, ...monthly.map(x => x.v));
  const sessionsThisMonth = monthly[5].v;
  const upcoming = P.bookings.filter(b => myIds.has(b.pairId) && isUpcoming(b)).length;
  const toLog = P.bookings.filter(b => myIds.has(b.pairId) && awaitingLog(b));
  const mentorAssigned = P.tasks.filter(x => myIds.has(x.pairId) && x.from === "Mentor");
  const atRisk = MENTEES.filter(m => ["At Risk", "Stalled"].includes(P.stats[m.pairId]?.health));
  const [shareFor, setShareFor] = useState<string | null>(null); // resource id being shared
  const [sharePairs, setSharePairs] = useState<string[]>([]);
  const [chatShareOpen, setChatShareOpen] = useState(false);
  const [logForm, setLogForm] = useState({ pairId: "", bookingId: null as string | null, date: todayISO(), duration: 45, mode: "Virtual" as "Virtual" | "In-person", discussed: "", advice: "", decisions: "", blockers: "" });
  const startVideo = () => P.videoProvider ? toast.success(`Opening ${P.videoProvider}…`) : toast.error("No video tool connected. Ask the programme team to connect Zoom or Google Meet in Integration Hub.");
  const [nav, setNav] = useState<NavSection>("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeChatPair, setActiveChatPair] = useState(MENTEES[0]?.pairId ?? "");
  const [chatMsg, setChatMsg] = useState("");
  const [expandMentee, setExpandMentee] = useState<number | null>(1);
  const [noteOpen, setNoteOpen] = useState(false);
  // The mentee the log form is for. A stale or empty choice falls back to the first mentee, but every entry point below passes the mentee it was clicked on.
  const logPairId = MENTEES.some(m => m.pairId === logForm.pairId) ? logForm.pairId : (MENTEES[0]?.pairId ?? "");
  const openNote = (pairId?: string, bookingId: string | null = null) => { setLogForm(f => ({ ...f, pairId: pairId ?? f.pairId, bookingId })); setNoteOpen(true); };
  const [noteText, setNoteText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);


  const activeMentee = MENTEES.find(m => m.pairId === activeChatPair) ?? MENTEES[0];
  const chatPairId = activeMentee?.pairId ?? "";
  const activeChat = activeMentee?.name ?? "";
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [P.messages, chatPairId]);
  const chatMsgs = P.messages.filter(x => x.pairId === chatPairId);
  const THREADS = MENTEES.map(m => { const last = P.messages.filter(x => x.pairId === m.pairId).slice(-1)[0]; return { id: m.id, pairId: m.pairId, mentee: m.name, text: last?.text ?? "No messages yet", time: last?.time ?? "", unread: P.unread(m.pairId, "mentor") }; });
  const totalUnread = THREADS.reduce((a, x) => a + x.unread, 0);
  useEffect(() => { if (nav === "messages" && chatPairId) P.markRead(chatPairId, "mentor"); }, [nav, chatPairId, P.messages.length]);
  const sendMsg = () => { if (!chatMsg.trim() || !chatPairId) return; P.sendMessage(chatPairId, "mentor", chatMsg.trim()); setChatMsg(""); };
  const [goalDraft, setGoalDraft] = useState<{ pairId: string; title: string; due: string } | null>(null);
  const [noteFor, setNoteFor] = useState("");
  const [assign, setAssign] = useState({ pairId: "", title: "", due: "" });
  const [sched, setSched] = useState({ pairId: "", date: addDays(todayISO(), 7), time: "10:00", mode: "Virtual" as "Virtual" | "In-person", duration: 45 });
  const myBookings = P.bookings.filter(b => myIds.has(b.pairId) && isLiveBooking(b));
  const menteeOf = (pairId: string) => myPairs.find(p => p.id === pairId)?.mentee ?? "";
  const myTasks = P.tasks.filter(t => myIds.has(t.pairId));
  const overdueCount = myTasks.filter(isOverdue).length;

  const NAV_ITEMS: { key: NavSection; icon: React.ReactNode; label: string }[] = [
    { key: "overview", icon: <Home size={15} />, label: "Overview" },
    { key: "mentees", icon: <Users size={15} />, label: "My Mentees" },
    { key: "sessions", icon: <Calendar size={15} />, label: "Sessions" },
    { key: "goals", icon: <Target size={15} />, label: "Goals & Milestones" },
    { key: "tasks", icon: <CheckSquare size={15} />, label: overdueCount ? `Tasks (${overdueCount} overdue)` : "Tasks" },
    { key: "messages", icon: <MessageCircle size={15} />, label: totalUnread ? `Messages (${totalUnread})` : "Messages" },
    { key: "resources", icon: <BookOpen size={15} />, label: "Resource Library" },
    { key: "impact", icon: <TrendingUp size={15} />, label: "Impact & Recognition" },
    { key: "profile", icon: <User size={15} />, label: "My Profile" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Verdana, Geneva, Tahoma, sans-serif", overflow: "hidden" }}>
      <style>{mdorStyles}</style>

      {/* SIDEBAR */}
      <div style={{ width: 226, background: GRAD, position: "relative", display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, overflowY: "auto" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <img src={LOGO} alt="Emerge Livelihoods" style={{ height: 36, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div style={{
              marginTop: 10,
              background: "#4C808A",
              borderRadius: 3,
              padding: "10px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 9, margin: 0, fontWeight: 700, letterSpacing: "0.06em" }}>MENTOR PORTAL</p>
              <p style={{ color: "#fff", fontSize: 13, margin: "3px 0 2px", fontWeight: 800 }}>{MU.name}</p>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 9, margin: "0 0 6px", fontWeight: 600 }}>{[MU.title, MU.expertise.slice(0, 2).join(" & ")].filter(Boolean).join(" · ")}</p>
              <div style={{ marginTop: 2, padding: "3px 8px", background: "rgba(255,255,255,0.16)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.22)" }}>
                <p style={{ color: "#fff", fontSize: 9, margin: 0, fontWeight: 700 }}>Next session: {MU.nextSession}</p>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "10px 10px" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} className={`mdor-nav${nav === item.key ? " active" : ""}`}
                onClick={() => setNav(item.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "transparent", border: "none", borderLeft: "3px solid transparent", borderRadius: 3, color: nav === item.key ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 11, marginBottom: 2, textAlign: "left" }}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* Impact Score mini */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "0 0 4px" }}>IMPACT SCORE</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>{MU.impactScore}</p>
              <div style={{ flex: 1 }}>
                <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (MU.impactScore / scoreMax) * 100)}%`, background: "#fff", borderRadius: 3 }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, margin: "3px 0 0" }}>of {scoreMax} pts</p>
              </div>
            </div>
          </div>

          <DemoTools role="mentor" />
          <button onClick={onSignOut}
            style={{ margin: "0 10px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 12px", background: "#dc2626", border: "1px solid #b91c1c", borderRadius: 3, color: "#ffffff", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}>
            <LogOut size={14} color="#ffffff" /> <span style={{ color: "#ffffff" }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#f0f4f7" }}>
        {/* TOPBAR */}
        <div style={{ background: GRAD, position: "relative", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: 0 }}>{MU.cohort}</p>
            <h1 style={{ color: "#fff", fontSize: 16, margin: 0, fontWeight: 700 }}>
              {NAV_ITEMS.find(n => n.key === nav)?.label}
            </h1>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14 }}>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)}
                style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 3, padding: "7px 10px", cursor: "pointer", color: "#fff", position: "relative", display: "flex" }}>
                <Bell size={16} />
                <span style={{ position: "absolute", top: 4, right: 5, width: 7, height: 7, background: "#f59e0b", borderRadius: "50%" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, width: 270, background: "#fff", borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.16)", zIndex: 999, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: NAVY }}>Notifications</p>
                  </div>
                  {(P.eventsFor("mentor", [...allMyIds]).length ? P.eventsFor("mentor", [...allMyIds]).map(e => ({ text: e.text, time: e.time, dot: e.tone === "good" ? "#059669" : e.tone === "warn" ? "#f59e0b" : TEAL })) : [{ text: "No new notifications", time: "", dot: "#ddd" }]).map((n, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #f7f7f7", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: n.dot, marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: "#333" }}>{n.text}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#999" }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={18} color="#fff" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* ── OVERVIEW ── */}
          {nav === "overview" && (
            <div style={{ display: "grid", gap: 16 }}>
              {!MENTEES.length && (
                <div data-testid="no-mentees" style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${TEAL}`, borderRadius: 3, padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 4px", color: NAVY, fontWeight: 700, fontSize: 13 }}>You are approved, and waiting for your first mentee</p>
                  <p style={{ margin: 0, color: "#666", fontSize: 11, lineHeight: 1.6 }}>The programme team pairs mentors with entrepreneurs based on sector and stage. When a match is confirmed you will be notified and your mentee will appear here.</p>
                </div>
              )}
              {/* Hero Banner */}
              <div className="mdor-card" style={{ background: GRAD, borderRadius: 3, padding: "18px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={24} color="#fff" strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px", fontWeight: 700 }}>Welcome back, {firstName(MU.name)}.</h2>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: 0 }}>{MU.title}, {MU.location}</p>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      { label: "Sessions Done", val: MU.sessionsCompleted },
                      { label: "Hours Given", val: MU.hoursContributed },
                      { label: "Active Mentees", val: MU.menteesActive },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>{s.val}</p>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, margin: 0 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* KPI Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Impact Score", val: MU.impactScore.toString(), sub: MU.rankLabel, icon: <Star size={18} /> },
                  { label: "Sessions This Month", val: String(sessionsThisMonth), sub: `${upcoming} upcoming`, icon: <Calendar size={18} /> },
                  { label: "Tasks Assigned", val: String(mentorAssigned.length), sub: `${mentorAssigned.filter(x => x.status === "done").length} completed`, icon: <CheckSquare size={18} /> },
                  { label: "Mentees At Risk", val: String(atRisk.length), sub: atRisk.length ? atRisk.map(m => firstName(m.name)).join(", ") : "All on track", icon: <AlertTriangle size={18} /> },
                ].map((k, i) => (
                  <div key={i} className="mdor-card" style={{ background: "#4C808A", borderRadius: 3, padding: "14px 16px", boxShadow: "0 2px 8px rgba(76,128,138,0.22)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, margin: "0 0 4px", fontWeight: 600 }}>{k.label}</p>
                        <p style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>{k.val}</p>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, margin: "2px 0 0" }}>{k.sub}</p>
                      </div>
                      <div style={{ color: "#fff", opacity: 0.9 }}>{k.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mentee Snapshot Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {MENTEES.map(m => (
                  <div key={m.id} className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }} onClick={() => { setNav("mentees"); }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={16} color="#fff" strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: NAVY, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{m.name}</p>
                        <p style={{ color: "#888", fontSize: 10, margin: 0 }}>{m.venture}</p>
                      </div>
                      <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 7px", borderRadius: 3, fontWeight: 700 }}>{m.stage}</span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ color: "#888", fontSize: 9, margin: 0 }}>Overall Progress</p>
                        <p style={{ color: TEAL, fontSize: 9, fontWeight: 700, margin: 0 }}>{m.overallProgress}%</p>
                      </div>
                      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${m.overallProgress}%`, background: TEAL, borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
                      <span>Last session: {m.lastSession}</span>
                      <span style={{ color: m.openTasks > 2 ? "#f59e0b" : "#059669" }}>{m.openTasks} open tasks</span>
                    </div>
                    {m.blockers.length > 0 && (
                      <div style={{ marginTop: 8, padding: "6px 8px", background: "#fff8eb", borderRadius: 3, display: "flex", gap: 5, alignItems: "flex-start" }}>
                        <AlertTriangle size={10} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ color: "#92600a", fontSize: 9, margin: 0 }}>{m.blockers[0]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MY MENTEES ── */}
          {nav === "mentees" && (
            <div style={{ display: "grid", gap: 14 }}>
              {MENTEES.map(m => (
                <div key={m.id} className="mdor-card" style={{ background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start" }}
                    onClick={() => setExpandMentee(expandMentee === m.id ? null : m.id)}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={20} color="#fff" strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ color: NAVY, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{m.name}</h3>
                          <p style={{ color: "#888", fontSize: 11, margin: "0 0 6px" }}>{m.venture}  {m.sector}</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{m.stage}</span>
                            <span style={{ background: "#f0fdf4", color: "#059669", fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>Match {m.matchScore}%</span>
                            <span style={{ background: "#f8f9fb", color: "#888", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>{m.goalsOnTrack} goals on track</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ color: TEAL, fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{m.overallProgress}%</p>
                            <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>Progress</p>
                          </div>
                          <ChevronRight size={14} color="#bbb" style={{ transform: expandMentee === m.id ? "rotate(90deg)" : "none", transition: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandMentee === m.id && (
                    <div style={{ padding: "0 18px 18px", animation: "mdor-up 0.2s ease", borderTop: "1px solid #f5f5f5" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
                        {/* Bio + Metrics */}
                        <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 14 }}>
                          <p style={{ color: NAVY, fontWeight: 700, fontSize: 11, margin: "0 0 8px" }}>Venture Snapshot</p>
                          <p style={{ color: "#555", fontSize: 10, margin: "0 0 10px", lineHeight: 1.6 }}>{m.bio}</p>
                          {Object.entries(m.metrics).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #eee" }}>
                              <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>{k}</p>
                              <p style={{ color: NAVY, fontSize: 10, fontWeight: 600, margin: 0 }}>{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Blockers */}
                        <div style={{ background: "#fff8eb", borderRadius: 3, padding: 14 }}>
                          <p style={{ color: "#92600a", fontWeight: 700, fontSize: 11, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={12} color="#f59e0b" /> Current Blockers</p>
                          {m.blockers.map((b, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <Flag size={10} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                              <p style={{ color: "#7a4f00", fontSize: 10, margin: 0 }}>{b}</p>
                            </div>
                          ))}
                          <div style={{ marginTop: 10, background: "#fff", borderRadius: 3, padding: 8 }}>
                            <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>Next session: <strong style={{ color: NAVY }}>{m.nextSession}</strong></p>
                          </div>
                        </div>

                        {/* Lifecycle + Quick Actions */}
                        <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 14 }}>
                          <p style={{ color: NAVY, fontWeight: 700, fontSize: 11, margin: "0 0 10px" }}>Stage & Actions</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                            {LIFECYCLE.map((s, i) => {
                              const idx = LIFECYCLE.indexOf(m.stage);
                              return (
                                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: i < idx ? TEAL : i === idx ? NAVY : "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {i <= idx ? <CheckCircle size={10} color="#fff" /> : <Circle size={10} color="#bbb" />}
                                  </div>
                                  <p style={{ color: i === idx ? NAVY : i < idx ? TEAL : "#bbb", fontSize: 10, fontWeight: i === idx ? 700 : 400, margin: 0 }}>{s}</p>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {[
                              { label: "Log Session Note", icon: <CheckSquare size={11} />, fn: () => openNote(m.pairId) },
                              { label: "Send Message", icon: <MessageCircle size={11} />, fn: () => { setActiveChatPair(m.pairId); setNav("messages"); } },
                              { label: P.videoProvider ? `Start ${P.videoProvider} Call` : "Start Video Call", icon: <Video size={11} />, fn: startVideo },
                            ].map(a => (
                              <button key={a.label} onClick={a.fn}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: "#fff", border: `1px solid ${TEAL}30`, borderRadius: 3, cursor: "pointer", fontSize: 10, color: TEAL, fontWeight: 600 }}>
                                {a.icon} {a.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── SESSIONS ── */}
          {nav === "sessions" && (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Upcoming Sessions */}
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Upcoming Sessions</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {MENTEES.map(m => (
                    <div key={m.id} style={{ background: GRAD, borderRadius: 3, padding: 14, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: "0 0 4px" }}>{m.name}</p>
                        <p style={{ color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 6px" }}>{m.nextSession}</p>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: "0 0 12px" }}>{P.videoProvider ?? "No video tool"}</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={startVideo} style={{ flex: 1, background: "#fff", border: "none", borderRadius: 3, padding: "6px 8px", fontSize: 9, color: NAVY, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <Play size={9} /> Join
                          </button>
                          <button onClick={() => openNote(m.pairId)} style={{ flex: 1, background: "#4C808A", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 3, padding: "6px 8px", fontSize: 9, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                            Notes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduling */}
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Schedule a Session</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <select value={sched.pairId || MENTEES[0]?.pairId || ""} onChange={e => setSched({ ...sched, pairId: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}>{MENTEES.map(m => <option key={m.pairId} value={m.pairId}>{m.name}</option>)}</select>
                  <input type="date" value={sched.date} onChange={e => setSched({ ...sched, date: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                  <input type="time" value={sched.time} onChange={e => setSched({ ...sched, time: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                  <select value={sched.mode} onChange={e => setSched({ ...sched, mode: e.target.value as "Virtual" | "In-person" })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}><option>Virtual</option><option>In-person</option></select>
                  <button disabled={!MENTEES.length} onClick={() => { const pairId = sched.pairId || MENTEES[0]?.pairId; if (!pairId) return; const r = P.proposeBooking({ pairId, date: sched.date, time: sched.time, durationMin: sched.duration, mode: sched.mode, by: "mentor" }); if (r.ok) toast.success("Proposal sent. Waiting for the mentee to confirm."); else toast.error(r.reason); }} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Propose</button>
                </div>
                {myBookings.map(b => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #f5f5f5", fontSize: 11 }}>
                    <span style={{ color: "#555", display: "inline-flex", flexWrap: "wrap", columnGap: 10 }}><span>{menteeOf(b.pairId)}</span><span>{fmtBooking(b)}</span><span>{b.mode}</span><b style={{ color: awaitingLog(b) ? "#b45309" : b.status === "confirmed" ? "#059669" : "#f59e0b" }}>{awaitingLog(b) ? "Took place? Log it" : b.status === "proposed" ? (b.proposedBy === "mentor" ? "Awaiting mentee" : "Mentee proposed") : "Confirmed"}</b></span>
                    <span style={{ display: "flex", gap: 6 }}>
                      {b.status === "proposed" && b.proposedBy === "mentee" && <><button onClick={() => { const r = P.respondBooking(b.id, true); if (!r.ok) toast.error(r.reason); }} style={{ background: "#f0fdf4", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#059669", cursor: "pointer", fontWeight: 700 }}>Accept</button><button onClick={() => P.respondBooking(b.id, false)} style={{ background: "#fef2f2", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Decline</button></>}
                      {awaitingLog(b) && <button onClick={() => { openNote(b.pairId, b.id); }} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Log session</button>}
                      <button onClick={() => P.cancelBooking(b.id)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#888", cursor: "pointer" }}>{awaitingLog(b) ? "Did not happen" : "Cancel"}</button>
                    </span>
                  </div>))}
              </div>

              {/* Session Log */}
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: 0 }}>Session Log</p>
                  <button onClick={() => openNote()} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                    <Plus size={13} /> Log Session
                  </button>
                </div>
                {SESSIONS_LOG.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: i < SESSIONS_LOG.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 3, background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Calendar size={16} color={TEAL} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{s.mentee}  {s.date}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#f59e0b", fontSize: 11 }}>{s.rating ? "★".repeat(s.rating) : "Awaiting mentee rating"}</span>
                          <span style={{ background: "#f0fdf4", color: "#059669", fontSize: 9, padding: "2px 6px", borderRadius: 3 }}>Completed</span>
                        </div>
                      </div>
                      <p style={{ color: "#888", fontSize: 10, margin: "0 0 6px" }}>{s.mode}  {s.duration}  {s.topics.join(", ")}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {s.tasks.map(t => (
                          <span key={t} style={{ background: `${NAVY}10`, color: NAVY, fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>Task: {t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Private Reflection */}
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>Private Reflection <span style={{ color: "#aaa", fontSize: 10, fontWeight: 400 }}>(visible to admin only)</span></p>
                <p style={{ color: "#888", fontSize: 10, margin: "0 0 10px" }}>Log concerns, early warnings, or pairing mismatch notes privately.</p>
                <select value={noteFor || MENTEES[0]?.pairId || ""} onChange={e => setNoteFor(e.target.value)} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11, marginBottom: 8 }}>{MENTEES.map(m => <option key={m.pairId} value={m.pairId}>{m.name}</option>)}</select>
                <textarea rows={3} value={privateNote} onChange={e => setPrivateNote(e.target.value)}
                  placeholder="E.g. Tadala may need a technical mentor — she is struggling with prototype scoping beyond my expertise..."
                  style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 3, padding: "10px 12px", fontSize: 11, outline: "none", resize: "none", boxSizing: "border-box", color: "#333" }} />
                <button onClick={() => { const pid = noteFor || MENTEES[0]?.pairId; if (!pid || !privateNote.trim()) return; const r = P.addPrivateNote(pid, privateNote.trim()); if (!r.ok) return toast.error(r.reason); setPrivateNote(""); toast.success("Saved. Visible to programme admins only."); }} style={{ marginTop: 8, background: NAVY, border: "none", borderRadius: 3, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 11 }}>Save Note</button>
                {P.privateNotes.filter(n => myIds.has(n.pairId)).map(n => <p key={n.id} style={{ fontSize: 10, color: "#777", margin: "8px 0 0" }}><span style={{ marginRight: 10 }}>{fmtDate(n.at)}</span>{menteeOf(n.pairId)}: {n.text}</p>)}
              </div>
            </div>
          )}

          {/* ── GOALS ── */}
          {nav === "goals" && (
            <div style={{ display: "grid", gap: 14 }}>
              {MENTEES.map(m => {
                const mGoals = GOALS_MENTOR.filter(g => g.pairId === m.pairId);
                return (
                  <div key={m.id} className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={14} color="#fff" strokeWidth={1.8} /></div>
                      <div>
                        <p style={{ color: NAVY, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{m.name}</p>
                        <p style={{ color: "#888", fontSize: 10, margin: 0 }}>{m.venture}  {m.stage}</p>
                      </div>
                    </div>
                    {mGoals.map(g => (
                      <div key={g.id} style={{ marginBottom: 12, padding: "10px 14px", background: "#f8f9fb", borderRadius: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <p style={{ color: NAVY, fontSize: 11, fontWeight: 600, margin: 0 }}>{g.title}</p>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ color: SC[g.status], fontSize: 9, fontWeight: 700 }}>{g.pct}%</span>
                            <span style={{ color: "#aaa", fontSize: 9 }}>Due {fmtDue(g.due)}</span>
                            {g.status === "proposed" ? (g.proposedBy === "mentor" ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 700 }}>Awaiting mentee approval</span> : <button onClick={() => { P.approveGoal(g.id); toast.success("Goal approved"); }} style={{ background: "#f0fdf4", border: "none", borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontSize: 9, color: "#059669", fontWeight: 700 }}>Approve goal</button>) : g.status === "complete" ? <span style={{ color: "#059669", fontSize: 9, fontWeight: 700 }}>Signed off ✓</span> : <button onClick={() => { P.signOffGoal(g.id); toast.success("Goal signed off"); }} style={{ background: `${TEAL}15`, border: "none", borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontSize: 9, color: TEAL, fontWeight: 600 }}>Sign Off</button>}
                          </div>
                        </div>
                        <div style={{ height: 5, background: "#e0e0e0", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${g.pct}%`, background: SC[g.status], borderRadius: 3, transition: "width 0.8s" }} />
                        </div>
                        {g.pending && <ReviewProgress goal={g} />}
                      </div>
                    ))}
                    {goalDraft?.pairId === m.pairId ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input autoFocus value={goalDraft.title} onChange={e => setGoalDraft({ ...goalDraft, title: e.target.value })} placeholder="Goal title" style={{ flex: 2, minWidth: 160, border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                        <input type="date" min={todayISO()} aria-label="Goal due date" value={goalDraft.due} onChange={e => setGoalDraft({ ...goalDraft, due: e.target.value })} style={{ flex: 1, minWidth: 90, border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                        <button onClick={() => { if (!goalDraft.title.trim()) return; P.proposeGoal({ pairId: m.pairId, title: goalDraft.title.trim(), category: "Custom", due: goalDraft.due || "TBD", by: "mentor" }); setGoalDraft(null); toast.success("Goal proposed to mentee"); }} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "7px 12px", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>Propose</button>
                        <button onClick={() => setGoalDraft(null)} style={{ background: "#f5f5f5", border: "none", borderRadius: 3, padding: "7px 10px", fontSize: 10, color: "#666", cursor: "pointer" }}>Cancel</button>
                      </div>
                    ) : (
                    <button onClick={() => setGoalDraft({ pairId: m.pairId, title: "", due: "" })} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px dashed ${TEAL}`, borderRadius: 3, padding: "7px 12px", cursor: "pointer", fontSize: 10, color: TEAL }}>
                      <Plus size={11} /> Co-set new goal with {firstName(m.name)}
                    </button>)}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TASKS ── */}
          {nav === "tasks" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>Assign a Task</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={assign.pairId || MENTEES[0]?.pairId || ""} onChange={e => setAssign({ ...assign, pairId: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}>{MENTEES.map(m => <option key={m.pairId} value={m.pairId}>{m.name}</option>)}</select>
                  <input value={assign.title} onChange={e => setAssign({ ...assign, title: e.target.value })} placeholder="Task description" style={{ flex: 1, minWidth: 200, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }} />
                  <input type="date" min={todayISO()} aria-label="Task due date" value={assign.due} onChange={e => setAssign({ ...assign, due: e.target.value })} style={{ width: 120, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }} />
                  <button onClick={() => { const pid = assign.pairId || MENTEES[0]?.pairId; if (!pid || !assign.title.trim()) return; const r = P.assignTask(pid, assign.title.trim(), assign.due || "Next session"); if (!r.ok) return toast.error(r.reason); setAssign({ pairId: assign.pairId, title: "", due: "" }); toast.success("Task assigned"); }} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Assign</button>
                </div>
              </div>
              {MENTEES.map(m => {
                const list = myTasks.filter(t => t.pairId === m.pairId);
                return (
                  <div key={m.id} className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <p style={{ color: NAVY, fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>{m.name} <span style={{ color: "#aaa", fontWeight: 400, fontSize: 10 }}>· {list.filter(t => t.status === "done").length}/{list.length} done</span></p>
                    {list.length === 0 && <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>No tasks yet.</p>}
                    {list.map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #f5f5f5", fontSize: 11 }}>
                        {t.status === "done" ? <CheckCircle size={14} color="#059669" /> : <Circle size={14} color={isOverdue(t) ? "#ef4444" : "#ccc"} />}
                        <span style={{ flex: 1, color: t.status === "done" ? "#aaa" : "#333", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                        <span style={{ color: isOverdue(t) ? "#ef4444" : "#999", fontSize: 10, fontWeight: isOverdue(t) ? 700 : 400 }}>{isOverdue(t) ? <span style={{ marginRight: 10 }}>OVERDUE</span> : null}Due {fmtDue(t.due)}</span>
                        <span style={{ color: "#bbb", fontSize: 9 }}>{t.from}</span>
                        {isOverdue(t) && <button onClick={() => { P.sendMessage(m.pairId, "mentor", `Reminder: "${t.title}" was due ${fmtDue(t.due)}. Can you update me?`); toast.success("Reminder sent in Messages"); }} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3, padding: "3px 8px", fontSize: 9, color: "#b45309", cursor: "pointer", fontWeight: 700 }}>Nudge</button>}
                      </div>))}
                  </div>);
              })}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {nav === "messages" && (
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14, height: "calc(100vh - 160px)" }}>
              {/* Thread List */}
              <div style={{ background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: 0 }}>Conversations</p>
                </div>
                {THREADS.map(thread => (
                  <div key={thread.id} onClick={() => setActiveChatPair(thread.pairId)}
                    style={{ padding: "12px 16px", borderBottom: "1px solid #f8f8f8", cursor: "pointer", background: chatPairId === thread.pairId ? `${TEAL}10` : "transparent", display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={14} color="#fff" strokeWidth={1.8} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: NAVY, fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>{thread.mentee}</p>
                      <p style={{ color: "#aaa", fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.text}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ background: "#4C808A", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>{thread.time}</span>
                      {thread.unread > 0 && (
                        <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#4C808A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>{thread.unread}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Window */}
              <div style={{ background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: 0 }}>{activeChat}</p>
                  <div style={{ position: "relative" }}>
                    <button disabled={!chatPairId} onClick={() => setChatShareOpen(o => !o)} style={{ background: "none", border: `1px solid ${TEAL}`, borderRadius: 3, padding: "5px 12px", cursor: "pointer", fontSize: 10, color: TEAL, display: "flex", alignItems: "center", gap: 5 }}>
                      <BookOpen size={11} /> Share Resource
                    </button>
                    {chatShareOpen && (
                      <div style={{ position: "absolute", right: 0, top: 30, width: 260, background: "#fff", borderRadius: 3, boxShadow: "0 6px 24px rgba(0,0,0,0.18)", zIndex: 20, maxHeight: 260, overflowY: "auto" }}>
                        {LIBRARY.map(r => {
                          const already = P.shares.some(s => s.resourceId === r.id && s.pairId === chatPairId);
                          return (
                            <button key={r.id} disabled={already} onClick={() => { P.shareResource(r.id, [chatPairId]); P.sendMessage(chatPairId, "mentor", `I shared a resource with you: ${r.title}`); toast.success(`Shared "${r.title}" with ${activeChat}`); setChatShareOpen(false); }}
                              style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", borderBottom: "1px solid #f5f5f5", cursor: already ? "default" : "pointer", fontSize: 11, color: already ? "#bbb" : NAVY }}>
                              {r.title} {already && "· shared"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {chatMsgs.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.from === "mentor" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "70%", padding: "10px 14px",
                        borderRadius: 3,
                        background: msg.from === "mentor" ? "#4C808A" : "#f0f4f7",
                        color: msg.from === "mentor" ? "#fff" : "#333", fontSize: 11, lineHeight: 1.5,
                        boxShadow: msg.from === "mentor" ? "0 2px 6px rgba(76,128,138,0.25)" : "none",
                      }}>
                        <p style={{ margin: "0 0 4px" }}>{msg.text}</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
                          <span style={{
                            background: msg.from === "mentor" ? "rgba(255,255,255,0.22)" : "#4C808A",
                            color: "#fff",
                            fontSize: 9,
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontWeight: 600,
                          }}>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMsg()}
                    placeholder={`Message ${activeChat}...`}
                    style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "9px 12px", fontSize: 11, outline: "none" }} />
                  <button onClick={sendMsg} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "9px 13px", cursor: "pointer", color: "#fff", display: "flex" }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RESOURCES ── */}
          {nav === "resources" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {LIBRARY.map(r => {
                const Icon = TYPE_ICON[r.type] ?? BookOpen, sharedWith = P.shares.filter(s => s.resourceId === r.id && myIds.has(s.pairId)).length;
                return (
                  <div key={r.id} className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ marginBottom: 10 }}><Icon size={28} color="#4C808A" /></div>
                    <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{r.tag}</span>
                    <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: "8px 0 4px" }}>{r.title}</p>
                    <p style={{ color: "#aaa", fontSize: 10, margin: "0 0 14px" }}>{r.type}{sharedWith ? <span style={{ marginLeft: 10 }}>{`shared with ${sharedWith} mentee${sharedWith > 1 ? "s" : ""}`}</span> : null}</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { downloadResource(r); toast.success(`Downloaded ${r.title}`); }} style={{ flex: 1, background: "#4C808A", border: "none", borderRadius: 3, padding: "7px", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}>
                        <Download size={10} color="#fff" /> Download
                      </button>
                      <button disabled={!MENTEES.length} onClick={() => { setShareFor(r.id); setSharePairs([]); }} style={{ flex: 1, background: `${TEAL}15`, border: "none", borderRadius: 3, padding: "7px", color: TEAL, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Send size={10} /> Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shareFor && (
            <div onClick={() => setShareFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 3, padding: 22, width: 340 }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>Share resource</p>
                <p style={{ color: "#888", fontSize: 11, margin: "0 0 12px" }}>{LIBRARY.find(r => r.id === shareFor)?.title}</p>
                {MENTEES.map(m => {
                  const already = P.shares.some(s => s.resourceId === shareFor && s.pairId === m.pairId);
                  return (
                    <label key={m.pairId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: already ? "#bbb" : NAVY, padding: "6px 0" }}>
                      <input type="checkbox" disabled={already} checked={already || sharePairs.includes(m.pairId)} onChange={e => setSharePairs(p => e.target.checked ? [...p, m.pairId] : p.filter(x => x !== m.pairId))} />
                      {m.name} {already && "· already shared"}
                    </label>
                  );
                })}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => setShareFor(null)} style={{ flex: 1, background: "#f0f0f0", border: "none", borderRadius: 3, padding: 8, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                  <button disabled={!sharePairs.length} onClick={() => { P.shareResource(shareFor, sharePairs); toast.success(`Shared with ${sharePairs.length} mentee${sharePairs.length > 1 ? "s" : ""}`); setShareFor(null); }}
                    style={{ flex: 1, background: TEAL, border: "none", borderRadius: 3, padding: 8, fontSize: 11, color: "#fff", cursor: sharePairs.length ? "pointer" : "not-allowed", opacity: sharePairs.length ? 1 : 0.5 }}>Share</button>
                </div>
              </div>
            </div>
          )}

          {/* ── IMPACT ── */}
          {nav === "impact" && (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Impact Score Hero */}
              <div className="mdor-card" style={{ background: GRAD, borderRadius: 3, padding: "22px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 30, alignItems: "center" }}>
                  <RingGauge pct={Math.min(100, Math.round((MU.impactScore / scoreMax) * 100))} size={100} stroke={9} color="#fff" label={`${MU.impactScore}`} sub={`/ ${scoreMax}`} />
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: "0 0 4px", letterSpacing: 1 }}>YOUR IMPACT SCORE</p>
                    <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>{MU.impactScore} pts</h2>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "0 0 12px" }}>{MU.rankLabel} in the programme</p>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "Sessions Done", val: MU.sessionsCompleted },
                        { label: "Hours Contributed", val: `${MU.hoursContributed}h` },
                        { label: "Milestones Unlocked", val: MU.milestonesUnlocked },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: "center" }}>
                          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{s.val}</p>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: 0 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Sessions Per Month</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                    {monthly.map((x, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <p style={{ color: TEAL, fontSize: 9, fontWeight: 700, margin: 0 }}>{x.v}</p>
                        <div style={{ width: "100%", height: `${Math.max(2, (x.v / monthMax) * 70)}px`, background: i === 5 ? TEAL : `${TEAL}40`, borderRadius: "3px 3px 0 0", transition: "height 0.8s ease" }} />
                        <p style={{ color: "#bbb", fontSize: 8, margin: 0 }}>{x.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Mentee Progress Summary</p>
                  {MENTEES.map(m => (
                    <div key={m.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{m.name}</p>
                        <p style={{ color: TEAL, fontSize: 10, fontWeight: 700, margin: 0 }}>{m.overallProgress}%</p>
                      </div>
                      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${m.overallProgress}%`, background: TEAL, borderRadius: 3, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate */}
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={28} color={TEAL} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>Certificate of Contribution</p>
                  <p style={{ color: "#888", fontSize: 11, margin: "0 0 12px" }}>{MU.sessionsCompleted ? `Recognising ${MU.name}'s contribution to ${MU.cohort}: ${MU.sessionsCompleted} session${MU.sessionsCompleted === 1 ? "" : "s"} and ${MU.hoursContributed}h of mentoring.` : `Awarded once you have started mentoring in ${MU.cohort}.`}</p>
                  <button style={{ background: "#4C808A", border: "none", borderRadius: 3, padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                    <Download size={13} color="#fff" /> Download Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {nav === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={22} color="#fff" strokeWidth={1.8} /></div>
                  <div>
                    <p style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: "0 0 3px" }}>{MU.name}</p>
                    <p style={{ color: "#888", fontSize: 11, margin: 0 }}>{MU.title}</p>
                  </div>
                </div>
                {[
                  { label: "Email", val: MU.email },
                  { label: "Location", val: MU.location },
                  { label: "Cohort", val: MU.cohort },
                  { label: "Impact Score", val: `${MU.impactScore} pts` },
                  { label: "Sessions Completed", val: `${MU.sessionsCompleted}` },
                  { label: "Hours Contributed", val: `${MU.hoursContributed}h` },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>{f.label}</p>
                    <p style={{ color: NAVY, fontSize: 11, fontWeight: 600, margin: 0 }}>{f.val}</p>
                  </div>
                ))}
              </div>
              <div className="mdor-card" style={{ background: "#fff", borderRadius: 3, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Expertise & Matching Preferences</p>
                {MU.expertise.map(e => (
                  <span key={e} className="mdor-chip" style={{ display: "inline-block", background: `${TEAL}15`, color: TEAL, fontSize: 10, padding: "4px 12px", borderRadius: 3, fontWeight: 600, margin: "0 6px 6px 0", cursor: "pointer" }}>{e}</span>
                ))}
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 11, margin: "0 0 10px" }}>Matching Preferences</p>
                  {[
                    { label: "Preferred Stages", val: MU.stages },
                    { label: "Industries", val: MU.industries },
                    { label: "Hours/Month Available", val: MU.hours },
                    { label: "Location", val: MU.location },
                  ].map(f => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>{f.label}</p>
                      <p style={{ color: NAVY, fontSize: 11, fontWeight: 600, margin: 0 }}>{f.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Note Modal */}
      {noteOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 3, padding: 28, width: 500, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ color: NAVY, fontSize: 15, fontWeight: 700, margin: 0 }}>Log Session Notes</h3>
              <button onClick={() => setNoteOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={18} /></button>
            </div>
            {(() => {
              const pairId = logPairId;
              const open = P.bookings.filter(b => b.pairId === pairId && (awaitingLog(b) || (b.status === "confirmed" && b.date === todayISO()))).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
              const chosen = logForm.bookingId === null ? (open[0]?.id ?? "") : logForm.bookingId; // default: the oldest scheduled slot still waiting for a log
              return (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: "#555", fontSize: 11, fontWeight: 600, margin: "0 0 5px" }}>Which session is this?</p>
                  <select aria-label="Scheduled session" value={chosen} onChange={e => setLogForm({ ...logForm, bookingId: e.target.value })} style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11, marginBottom: 8 }}>
                    {open.map(b => <option key={b.id} value={b.id}>Scheduled: {fmtBooking(b)}</option>)}
                    <option value="">Not on the calendar (ad-hoc)</option>
                  </select>
                  {!chosen && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Date it took place</span>
                    <input type="date" aria-label="Session date" max={todayISO()} value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "6px 8px", fontSize: 11 }} />
                  </div>}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <select aria-label="Mentee" value={logPairId} onChange={e => setLogForm({ ...logForm, pairId: e.target.value, bookingId: null })} style={{ flex: 2, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}>
                {MENTEES.map(m => <option key={m.pairId} value={m.pairId}>{m.name}</option>)}
              </select>
              <input type="number" min={10} step={5} value={logForm.duration} onChange={e => setLogForm({ ...logForm, duration: +e.target.value })} title="Minutes" style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }} />
              <select value={logForm.mode} onChange={e => setLogForm({ ...logForm, mode: e.target.value as "Virtual" | "In-person" })} style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}>
                <option>Virtual</option><option>In-person</option>
              </select>
            </div>
            {([
              { key: "discussed", label: "What was discussed? (comma-separated topics)", rows: 3 },
              { key: "advice", label: "Key advice given", rows: 2 },
              { key: "decisions", label: "Decisions made", rows: 2 },
              { key: "blockers", label: "Blockers identified", rows: 2 },
            ] as const).map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <p style={{ color: "#555", fontSize: 11, fontWeight: 600, margin: "0 0 5px" }}>{f.label}</p>
                <textarea rows={f.rows} value={logForm[f.key]} onChange={e => setLogForm({ ...logForm, [f.key]: e.target.value })} style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 3, padding: "9px 12px", fontSize: 11, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: "#555", fontSize: 11, fontWeight: 600, margin: "0 0 5px" }}>Assign task to mentee</p>
              <input value={taskText} onChange={e => setTaskText(e.target.value)} placeholder="Task description with deadline..." style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 3, padding: "9px 12px", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNoteOpen(false)} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#666" }}>Cancel</button>
              <button disabled={!MENTEES.length} onClick={() => {
                const pairId = logPairId; if (!pairId) return;
                const open = P.bookings.filter(b => b.pairId === pairId && (awaitingLog(b) || (b.status === "confirmed" && b.date === todayISO()))).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
                const chosen = logForm.bookingId === null ? (open[0]?.id ?? "") : logForm.bookingId;
                const r = P.logSession({ pairId, bookingId: chosen || undefined, date: chosen ? undefined : logForm.date, durationMin: logForm.duration, mode: logForm.mode, topics: logForm.discussed.split(",").map(x => x.trim()).filter(Boolean).length ? logForm.discussed.split(",").map(x => x.trim()).filter(Boolean) : ["General check-in"], notes: [logForm.advice, logForm.decisions, logForm.blockers].filter(Boolean).join(" | "), task: taskText.trim() || undefined });
                if (!r.ok) return toast.error(r.reason);
                setLogForm({ ...logForm, bookingId: null, date: todayISO(), discussed: "", advice: "", decisions: "", blockers: "" }); setTaskText(""); setNoteOpen(false); toast.success("Session logged. The mentee can now rate it.");
              }} style={{ flex: 1, background: TEAL, border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#fff", fontWeight: 700 }}>Save Session Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
