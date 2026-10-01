import { useState, useRef, useEffect } from "react";
import {
  Home, User, Target, Calendar, CheckSquare, BookOpen, LogOut,
  Bell, ChevronRight, MessageCircle, Star, Clock, Flag,
  TrendingUp, Award, AlertCircle, Send, Download, RefreshCw,
  Zap, CheckCircle, Circle, Play, X, Plus, BarChart2, Map
} from "lucide-react";
import { toast } from "sonner";
import { DemoTools } from "./DemoTools";
import { useProgramme, DEMO_MENTEE, AS_OF, RESOURCES as LIBRARY, mentorProfile, downloadResource, daysBetween, fmtDate, fmtBooking, countdown, isOverdue } from "../data/programmeStore";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
const GRAD = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";
const LOGO = "https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png";

const mdStyles = `
@keyframes md-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes md-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
@keyframes md-ring { 0%{stroke-dashoffset:220;} 100%{stroke-dashoffset:0;} }
@keyframes md-bar { from{width:0;} to{width:var(--w);} }
@keyframes md-countdown { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
@keyframes md-slide { from{opacity:0;transform:translateX(-12px);} to{opacity:1;transform:translateX(0);} }
.md-card { animation: md-fadeUp 0.4s ease both; }
.md-card:nth-child(2){animation-delay:.05s;} .md-card:nth-child(3){animation-delay:.1s;} .md-card:nth-child(4){animation-delay:.15s;}
.md-nav-item { transition: all 0.2s; }
.md-nav-item:hover { background: rgba(255,255,255,0.12) !important; }
.md-nav-item.active { background: rgba(255,255,255,0.18) !important; border-left: 3px solid #fff !important; }
`;

function RingProgress({ pct, size = 80, stroke = 7, color = TEAL, label = "" }: {
  pct: number; size?: number; stroke?: number; color?: string; label?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ animation: "md-ring 1s ease forwards", transition: "stroke-dashoffset 0.8s ease" }}
      />
      {label && (
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight="700">{label}</text>
      )}
    </svg>
  );
}

type NavSection = "overview" | "mentor" | "goals" | "sessions" | "tasks" | "resources" | "profile";

// Contact details are not part of the programme store yet; only the demo mentee has them.
const DEMO_CONTACT = { email: "gift.chimwendo@emergelivelihoods.org", phone: "+265 888 567 890", city: "Mzimba, Malawi" };
const TOTAL_WEEKS = 24;
const initials = (n: string) => n.replace(/^(Dr\.|Prof\.)\s*/, "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const TYPE_ICON: Record<string, typeof BookOpen> = { Template: BarChart2, Guide: Map, Checklist: CheckSquare, Workbook: BookOpen };

const STATUS_COLORS: Record<string, string> = { "on-track": "#059669", "at-risk": "#f59e0b", "stalled": "#ef4444", "complete": "#059669", "proposed": "#94a3b8" };
const STATUS_LABELS: Record<string, string> = { "on-track": "ON TRACK", "at-risk": "AT RISK", "complete": "COMPLETE ✓", "proposed": "PROPOSED" };
const TASK_STATUS_COLORS: Record<string, string> = { "done": "#059669", "in-progress": TEAL, "pending": "#9ca3af" };

export function MenteeDashboard({ onSignOut }: { onSignOut: () => void }) {
  const P = useProgramme();
  const myName = P.currentUser?.role === "mentee" ? P.currentUser.name : DEMO_MENTEE;
  const myPair = P.pairs.find(p => p.mentee === myName);
  const pid = myPair?.id;
  const cohortLabel = P.cohortName(myPair?.cohortId ?? 1);
  const mp = mentorProfile(myPair?.mentor ?? "", myPair?.expertise);
  const MENTOR = {
    name: myPair?.mentor ?? "Your mentor", title: mp.title, expertise: mp.expertise, avatar: initials(myPair?.mentor ?? "M"),
    matchScore: myPair?.matchScore ?? 0, location: mp.location, bio: mp.bio, responseTime: mp.responseTime,
    sessionCount: P.sessions.filter(s => s.pairId === pid).length,
  };
  const weekInProgram = myPair ? Math.min(TOTAL_WEEKS, Math.floor(daysBetween(myPair.startDate, AS_OF) / 7) + 1) : 1;
  const isDemo = myName === DEMO_MENTEE;
  const MENTEE = {
    name: myName, venture: myPair?.venture ?? "—", sector: myPair?.sector ?? "—", stage: myPair?.stage ?? "—", weekInProgram, totalWeeks: TOTAL_WEEKS,
    email: isDemo ? DEMO_CONTACT.email : "—", phone: isDemo ? DEMO_CONTACT.phone : "—", city: isDemo ? DEMO_CONTACT.city : "—",
  };
  const myCourses = P.courses.filter(c => c.pairId === pid);
  const sharedIds = new Set(P.shares.filter(s => s.pairId === pid).map(s => s.resourceId));
  const libraryRows = [...LIBRARY].sort((a, b) => Number(sharedIds.has(b.id)) - Number(sharedIds.has(a.id)));
  const GOALS = P.goals.filter(g => g.pairId === pid).map(g => ({ ...g, smart: g.smart ?? { S: "—", M: "—", A: "—", R: "—", T: g.due } }));
  const SESSIONS = P.sessions.filter(s => s.pairId === pid).sort((a, b) => b.date.localeCompare(a.date)).map(s => ({
    id: s.id, date: `${fmtDate(s.date)}, 2025`, duration: `${s.durationMin} min`, mode: s.mode, topics: s.topics, tasks: s.tasks, rating: s.rating, notes: s.notes || "No notes shared yet.",
  }));
  const lms = P.integrationOn("LMS (Moodle)");
  const TASKS = P.tasks.filter(t => t.pairId === pid && (lms || t.from !== "Learning Academy"));
    const joinCall = () => P.videoProvider ? toast.success(`Opening ${P.videoProvider}…`) : toast.error("No video tool connected. Ask the programme team to connect one.");
  const addToCal = () => toast.success(`Added to ${P.calendarProvider}`);
  const rateWidget = (id: string) => (
    <span onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "#888" }}>
      Rate: {[1, 2, 3, 4, 5].map(n => <span key={n} onClick={() => { P.rateSession(id, n); toast.success("Thanks for rating this session"); }} style={{ cursor: "pointer", color: "#f59e0b", fontSize: 14 }}>☆</span>)}
    </span>
  );
  const [nav, setNav] = useState<NavSection>("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandGoal, setExpandGoal] = useState<string | null>(null);
  const [expandSession, setExpandSession] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [showRematch, setShowRematch] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [P.messages]);

  const msgs = P.messages.filter(x => x.pairId === pid).map(x => ({ id: x.id, from: x.from === "mentee" ? "me" : "mentor", text: x.text, time: x.time }));
  const sendMsg = () => { if (!chatMsg.trim() || !pid) return; P.sendMessage(pid, "mentee", chatMsg.trim()); setChatMsg(""); };
  useEffect(() => { if (nav === "mentor" && pid) P.markRead(pid, "mentee"); }, [nav, pid, P.messages.length]);
  const unreadMsgs = pid ? P.unread(pid, "mentee") : 0;
  const nb = pid ? P.nextBooking(pid) : undefined;
  const cd = nb ? countdown(nb) : { days: 0, hrs: 0, min: 0 };
  const myBookings = P.bookings.filter(b => b.pairId === pid && (b.status === "proposed" || (b.status === "confirmed" && b.date >= "2025-07-28")));
  const [sched, setSched] = useState({ date: "2025-08-07", time: "10:00", mode: "Virtual" as "Virtual" | "In-person" });
  const [goalForm, setGoalForm] = useState({ title: "", due: "", category: "Market" });
  const [rematchReason, setRematchReason] = useState("");
  const openRematch = P.rematches.find(r => r.pairId === pid && r.status === "open");

  const prog = Math.round((MENTEE.weekInProgram / MENTEE.totalWeeks) * 100);

  const NAV_ITEMS: { key: NavSection; icon: React.ReactNode; label: string }[] = [
    { key: "overview", icon: <Home size={16} />, label: "Overview" },
    { key: "mentor", icon: <User size={16} />, label: unreadMsgs ? `My Mentor (${unreadMsgs})` : "My Mentor" },
    { key: "goals", icon: <Target size={16} />, label: "Goals & Milestones" },
    { key: "sessions", icon: <Calendar size={16} />, label: "Sessions" },
    { key: "tasks", icon: <CheckSquare size={16} />, label: "Tasks & Learning" },
    { key: "resources", icon: <BookOpen size={16} />, label: "Resources" },
    { key: "profile", icon: <User size={16} />, label: "My Profile" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Verdana, Geneva, Tahoma, sans-serif", overflow: "hidden" }}>
      <style>{mdStyles}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: GRAD, position: "relative", display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, overflowY: "auto" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <img src={LOGO} alt="Emerge Livelihoods" style={{ height: 36, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div style={{ marginTop: 10, background: "#4C808A", borderRadius: 3, padding: "8px 10px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} aria-label={`MENTEE PORTAL ${MENTEE.name} ${MENTEE.venture}`} title={`MENTEE PORTAL ${MENTEE.name} ${MENTEE.venture}`}>
              <span style={{ display: "none" }}>{MENTEE.name} {MENTEE.venture}</span>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 9, margin: 0, fontWeight: 700, letterSpacing: 0.5, textAlign: "center", width: "100%" }}>MENTEE PORTAL</p>
              <p style={{ color: "#fff", fontSize: 11, margin: "2px 0 0", fontWeight: 700, textAlign: "center", width: "100%" }}>{MENTEE.name}</p>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 9, margin: 0, textAlign: "center", width: "100%" }}>{MENTEE.venture}</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "10px 10px" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} className={`md-nav-item${nav === item.key ? " active" : ""}`}
                onClick={() => setNav(item.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "transparent", border: "none", borderLeft: "3px solid transparent", borderRadius: 3, color: nav === item.key ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 12, marginBottom: 2, textAlign: "left" }}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Program progress mini */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "0 0 5px" }}>PROGRAM PROGRESS</p>
            <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${prog}%`, background: "#fff", borderRadius: 3, transition: "width 1s ease" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, margin: "4px 0 0" }}>Week {MENTEE.weekInProgram} of {MENTEE.totalWeeks} {prog}%</p>
          </div>

          <DemoTools role="mentee" />
          {/* Sign Out */}
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
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: 0 }}>{cohortLabel}</p>
            <h1 style={{ color: "#fff", fontSize: 16, margin: 0, fontWeight: 700 }}>
              {NAV_ITEMS.find(n => n.key === nav)?.label}
            </h1>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14 }}>
            {/* Notifications */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)}
                style={{ background: "#4C808A", border: "1px solid #4C808A", borderRadius: 3, padding: "7px 10px", cursor: "pointer", color: "#fff", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={16} color="#fff" />
                <span style={{ position: "absolute", top: 4, right: 5, width: 7, height: 7, background: "#f59e0b", borderRadius: "50%", border: "2px solid #4C808A" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, width: 260, background: "#fff", borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.16)", zIndex: 999, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: NAVY }}>Notifications</p>
                  </div>
                  {(P.eventsFor("mentee", pid ? [pid] : []).length ? P.eventsFor("mentee", pid ? [pid] : []).map(e => ({ text: e.text, time: e.time, dot: e.tone === "good" ? "#059669" : e.tone === "warn" ? "#f59e0b" : TEAL })) : [{ text: "No new notifications", time: "", dot: "#ddd" }]).map((n, i) => (
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
            {/* Avatar */}
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
              {/* KPI Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Sessions Done", val: String(MENTOR.sessionCount), sub: `with ${MENTOR.name.split(" ").slice(0, 2).join(" ")}`, icon: <Calendar size={18} color="#fff" /> },
                  { label: "Goals On Track", val: `${GOALS.filter(g => g.status === "on-track" || g.status === "complete").length}/${GOALS.filter(g => g.status !== "proposed").length}`, sub: `${GOALS.filter(g => g.status === "at-risk").length} at risk`, icon: <Target size={18} color="#fff" /> },
                  { label: "Tasks Pending", val: String(TASKS.filter(t => t.status !== "done").length), sub: `${TASKS.filter(t => isOverdue(t)).length} overdue`, icon: <CheckSquare size={18} color="#fff" /> },
                  { label: "Next Session", val: nb ? (cd.days ? `${cd.days} Days` : `${cd.hrs} Hrs`) : "None", sub: nb ? fmtBooking(nb) : "Propose a time in Sessions", icon: <Clock size={18} color="#fff" /> },
                ].map((k, i) => (
                  <div key={i} className="md-card" style={{ background: "#4C808A", borderRadius: 3, padding: "14px 16px", boxShadow: "0 2px 8px rgba(76,128,138,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, margin: "0 0 4px", fontWeight: 500 }}>{k.label}</p>
                        <p style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, margin: 0 }}>{k.val}</p>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, margin: "2px 0 0" }}>{k.sub}</p>
                      </div>
                      <div style={{ color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>{k.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Session + Goal Progress */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Last Session Recap</p>
                  <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 12, marginBottom: 10 }}>
                    <p style={{ color: "#555", fontSize: 11, margin: "0 0 6px", lineHeight: 1.6 }}>{SESSIONS[0].notes}</p>
                    <p style={{ color: "#999", fontSize: 9, margin: 0 }}>{SESSIONS[0].date} {SESSIONS[0].duration}</p>
                  </div>
                  <p style={{ color: "#666", fontSize: 10, margin: "0 0 6px", fontWeight: 600 }}>Action items from that session:</p>
                  {SESSIONS[0].tasks.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <ChevronRight size={10} color={TEAL} />
                      <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{t}</p>
                    </div>
                  ))}
                </div>

                <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Goal Progress Snapshot</p>
                  {GOALS.map(g => (
                    <div key={g.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ color: "#444", fontSize: 10, margin: 0 }}>{g.title}</p>
                        <span style={{ fontSize: 9, color: STATUS_COLORS[g.status], fontWeight: 700 }}>{g.pct}%</span>
                      </div>
                      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${g.pct}%`, background: STATUS_COLORS[g.status], borderRadius: 3, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MY MENTOR ── */}
          {nav === "mentor" && (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Mentor Profile Card */}
              <div className="md-card" style={{ background: GRAD, borderRadius: 3, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={28} color="#fff" strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 3px", fontWeight: 700 }}>{MENTOR.name}</h2>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: "0 0 8px" }}>{MENTOR.title}</p>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: 0 }}>{MENTOR.location} Response time: {MENTOR.responseTime}</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <RingProgress pct={MENTOR.matchScore} size={70} stroke={6} color="#fff" label={`${MENTOR.matchScore}%`} />
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: "3px 0 0" }}>MATCH SCORE</p>
                      </div>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: "10px 0 12px", lineHeight: 1.7 }}>{MENTOR.bio}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {MENTOR.expertise.map(e => (
                        <span key={e} style={{ background: "#4C808A", border: "1px solid #4C808A", borderRadius: 3, padding: "3px 10px", color: "#fff", fontSize: 9, fontWeight: 600 }}>{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={() => setNav("mentor")}
                    style={{ flex: 1, background: "#4C808A", border: "1px solid #4C808A", borderRadius: 3, padding: "9px 14px", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600 }}>
                    <MessageCircle size={13} color="#fff" /> <span style={{ color: "#fff" }}>Message Mentor</span>
                  </button>
                  <button disabled={!!openRematch} onClick={() => setShowRematch(true)}
                    style={{ flex: 1, background: "#4C808A", border: "1px solid #4C808A", borderRadius: 3, padding: "9px 14px", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600 }}>
                    <RefreshCw size={13} color="#fff" /> <span style={{ color: "#fff" }}>{openRematch ? "Re-match requested" : "Request Re-match"}</span>
                  </button>
                </div>
              </div>

              {/* Match Score Breakdown + Message Panel */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
                <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Match Score Breakdown</p>
                  {[
                    { label: "Expertise Fit", pct: 95 },
                    { label: "Stage Alignment", pct: 88 },
                    { label: "Industry Overlap", pct: 92 },
                    { label: "Working Style", pct: 85 },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{m.label}</p>
                        <p style={{ color: TEAL, fontSize: 10, fontWeight: 700, margin: 0 }}>{m.pct}%</p>
                      </div>
                      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${m.pct}%`, background: TEAL, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: "10px", background: "#f8f9fb", borderRadius: 3 }}>
                    <p style={{ color: "#888", fontSize: 9, margin: "0 0 2px" }}>SESSIONS TOGETHER</p>
                    <p style={{ color: NAVY, fontSize: 20, fontWeight: 800, margin: 0 }}>{SESSIONS.length}</p>
                  </div>
                </div>

                {/* Message Panel */}
                <div className="md-card" style={{ background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                    <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: 0 }}>Direct Message {MENTOR.name}</p>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 220 }}>
                    {msgs.map(m => (
                      <div key={m.id} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "75%", padding: "8px 12px", borderRadius: 3,
                          background: m.from === "me" ? "#4C808A" : "#f0f4f7",
                          color: m.from === "me" ? "#ffffff" : "#333333", fontSize: 11, lineHeight: 1.5,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                        }}>
                          <p style={{ margin: "0 0 4px", color: m.from === "me" ? "#ffffff" : "#333333" }}>{m.text}</p>
                          <div style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", marginTop: 2 }}>
                            <span style={{ fontSize: 9, margin: 0, background: "#4C808A", color: "#ffffff", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>{m.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
                    <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMsg()}
                      placeholder="Type a message..." style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 12px", fontSize: 11, outline: "none" }} />
                    <button onClick={sendMsg} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "8px 12px", cursor: "pointer", color: "#fff", display: "flex" }}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Session History */}
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Session History</p>
                {SESSIONS.map((s, i) => (
                  <div key={s.id} style={{ borderBottom: i < SESSIONS.length - 1 ? "1px solid #f0f0f0" : "none", paddingBottom: 12, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setExpandSession(expandSession === s.id ? null : s.id)}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 3, background: `${TEAL}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Calendar size={14} color={TEAL} />
                        </div>
                        <div>
                          <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>{s.date} {s.duration}</p>
                          <p style={{ color: "#888", fontSize: 10, margin: 0 }}>{s.mode} {s.topics.join(", ")}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#f59e0b" }}>{s.rating ? "★".repeat(s.rating) : rateWidget(s.id)}</span>
                        <ChevronRight size={12} color="#bbb" style={{ transform: expandSession === s.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                      </div>
                    </div>
                    {expandSession === s.id && (
                      <div style={{ marginTop: 10, padding: 12, background: "#f8f9fb", borderRadius: 3, animation: "md-fadeUp 0.2s ease" }}>
                        <p style={{ color: "#555", fontSize: 11, margin: "0 0 8px", lineHeight: 1.6 }}>{s.notes}</p>
                        <p style={{ color: NAVY, fontSize: 10, fontWeight: 600, margin: "0 0 4px" }}>Action items assigned:</p>
                        {s.tasks.map((t, j) => (
                          <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                            <ChevronRight size={10} color={TEAL} />
                            <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{t}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GOALS ── */}
          {nav === "goals" && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: "0 0 3px" }}>SMART Goals & Milestones</h2>
                  <p style={{ color: "#888", fontSize: 11, margin: 0 }}>Goals co-set with {MENTOR.name} Tied to your venture journey</p>
                </div>
                <button onClick={() => setNewGoalOpen(true)} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "9px 16px", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus size={14} /> New Goal
                </button>
              </div>

              {GOALS.map(g => (
                <div key={g.id} className="md-card" style={{ background: "#fff", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpandGoal(expandGoal === g.id ? null : g.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span style={{ background: `${TEAL}18`, color: TEAL, fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{g.category}</span>
                          <span style={{ color: STATUS_COLORS[g.status], fontSize: 9, fontWeight: 700 }}>{STATUS_LABELS[g.status]}</span>
                        </div>
                        <p style={{ color: NAVY, fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>{g.title}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                        <p style={{ color: STATUS_COLORS[g.status], fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{g.pct}%</p>
                        <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>Due {g.due}</p>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${g.pct}%`, background: STATUS_COLORS[g.status], borderRadius: 3, transition: "width 1s ease" }} />
                    </div>
                  </div>
                  {expandGoal === g.id && (
                    <div style={{ padding: "0 18px 18px", animation: "md-fadeUp 0.2s ease" }}>
                      <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 14 }}>
                        <p style={{ color: NAVY, fontWeight: 700, fontSize: 11, margin: "0 0 10px" }}>SMART Framework Breakdown</p>
                        {Object.entries(g.smart).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                            <span style={{ background: NAVY, color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3, minWidth: 16, textAlign: "center", marginTop: 1 }}>{k}</span>
                            <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {g.status === "proposed" && g.proposedBy === "mentor" && <button onClick={() => { P.approveGoal(g.id); toast.success("Goal accepted"); }} style={{ background: "#f0fdf4", border: "none", borderRadius: 3, padding: "6px 12px", fontSize: 10, color: "#059669", cursor: "pointer", fontWeight: 700 }}>Accept goal</button>}
                        {g.status === "proposed" && g.proposedBy === "mentee" && <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700 }}>Awaiting mentor approval</span>}
                        {(g.status === "on-track" || g.status === "at-risk") && <>
                          <button onClick={() => P.updateGoalProgress(g.id, g.pct + 10)} style={{ background: `${TEAL}15`, border: "none", borderRadius: 3, padding: "6px 12px", fontSize: 10, color: TEAL, cursor: "pointer", fontWeight: 700 }}>+10% progress</button>
                          <span style={{ color: "#aaa", fontSize: 10, alignSelf: "center" }}>Your mentor signs off at 100%</span></>}
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
              {/* Scheduling */}
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Book a Session</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <input type="date" value={sched.date} onChange={e => setSched({ ...sched, date: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                  <input type="time" value={sched.time} onChange={e => setSched({ ...sched, time: e.target.value })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "7px 10px", fontSize: 11 }} />
                  <select value={sched.mode} onChange={e => setSched({ ...sched, mode: e.target.value as "Virtual" | "In-person" })} style={{ border: "1px solid #e0e0e0", borderRadius: 3, padding: "8px 10px", fontSize: 11 }}><option>Virtual</option><option>In-person</option></select>
                  <button disabled={!pid} onClick={() => { if (!pid) return; const r = P.proposeBooking({ pairId: pid, date: sched.date, time: sched.time, durationMin: 45, mode: sched.mode, by: "mentee" }); if (r.ok) toast.success("Request sent to your mentor"); else toast.error(r.reason); }} style={{ background: TEAL, border: "none", borderRadius: 3, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Request</button>
                </div>
                {myBookings.map(b => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #f5f5f5", fontSize: 11 }}>
                    <span style={{ color: "#555", display: "inline-flex", flexWrap: "wrap", columnGap: 10 }}><span>{fmtBooking(b)}</span><span>{b.mode}</span><b style={{ color: b.status === "confirmed" ? "#059669" : "#f59e0b" }}>{b.status === "confirmed" ? "Confirmed" : b.proposedBy === "mentee" ? "Awaiting mentor" : "Mentor proposed"}</b></span>
                    <span style={{ display: "flex", gap: 6 }}>
                      {b.status === "proposed" && b.proposedBy === "mentor" && <><button onClick={() => { const r = P.respondBooking(b.id, true); if (!r.ok) toast.error(r.reason); }} style={{ background: "#f0fdf4", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#059669", cursor: "pointer", fontWeight: 700 }}>Accept</button><button onClick={() => P.respondBooking(b.id, false)} style={{ background: "#fef2f2", border: "none", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Decline</button></>}
                      <button onClick={() => P.cancelBooking(b.id)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#888", cursor: "pointer" }}>Cancel</button>
                    </span>
                  </div>))}
              </div>

              {/* Next Session Countdown */}
              <div className="md-card" style={{ background: GRAD, borderRadius: 3, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: "0 0 4px", letterSpacing: 1 }}>NEXT SESSION WITH DR. TIWONGE</p>
                    <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{nb ? fmtBooking(nb) : "No session scheduled"}</h2>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "0 0 14px" }}>{nb ? <span style={{ display: "inline-flex", flexWrap: "wrap", columnGap: 10 }}><span>{nb.mode}</span>{nb.mode === "Virtual" ? <span>{P.videoProvider ?? "no video tool connected"}</span> : null}<span>{nb.durationMin} min</span></span> : "Propose a time below"}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={joinCall} style={{ background: "#fff", border: "none", borderRadius: 3, padding: "9px 16px", cursor: "pointer", fontSize: 11, color: NAVY, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: P.videoProvider ? 1 : 0.6 }}>
                        <Play size={13} /> {P.videoProvider ? `Join ${P.videoProvider}` : "Join Call"}
                      </button>
                      {P.calendarProvider ? <button onClick={addToCal} style={{ background: "#4C808A", border: "1px solid #4C808A", borderRadius: 3, padding: "9px 16px", cursor: "pointer", fontSize: 11, color: "#fff", fontWeight: 600 }}>Add to {P.calendarProvider}</button> : <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, alignSelf: "center" }}>No calendar connected</span>}
                    </div>
                  </div>
                  {/* Countdown */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[{ val: String(cd.days).padStart(2, "0"), label: "DAYS" }, { val: String(cd.hrs).padStart(2, "0"), label: "HRS" }, { val: String(cd.min).padStart(2, "0"), label: "MIN" }].map(c => (
                        <div key={c.label} style={{ background: "#4c808a", borderRadius: 3, padding: "12px 14px", textAlign: "center", border: "1px solid #4c808a" }}>
                          <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>{c.val}</p>
                          <p style={{ color: "#ffffff", fontSize: 8, margin: 0, fontWeight: 600 }}>{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prep Block */}
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>Session Preparation</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 12 }}>
                    <p style={{ color: TEAL, fontSize: 10, fontWeight: 700, margin: "0 0 6px" }}>WHAT TO BRING</p>
                    {["Updated survey results (38/50 done)", "Draft pricing tiers", "Business registration update"].map((i, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <ChevronRight size={10} color={TEAL} style={{ marginTop: 2 }} />
                        <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{i}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#f8f9fb", borderRadius: 3, padding: 12 }}>
                    <p style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, margin: "0 0 6px" }}>OPEN BLOCKERS</p>
                    {["Farmers resistant to digital payment", "Not sure which grant to prioritise"].map((i, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <AlertCircle size={10} color="#f59e0b" style={{ marginTop: 2 }} />
                        <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{i}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session History */}
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Past Sessions</p>
                {SESSIONS.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 14, marginBottom: 14, borderBottom: i < SESSIONS.length - 1 ? "1px solid #f0f0f0" : "none", paddingBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 3, background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Calendar size={16} color={TEAL} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>{s.date}</p>
                        <span style={{ color: "#f59e0b", fontSize: 12 }}>{s.rating ? "★".repeat(s.rating) : rateWidget(s.id)}</span>
                      </div>
                      <p style={{ color: "#888", fontSize: 10, margin: "0 0 4px" }}>{s.mode} {s.duration} {s.topics.join(", ")}</p>
                      <p style={{ color: "#555", fontSize: 10, margin: 0, lineHeight: 1.5 }}>{s.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TASKS ── */}
          {nav === "tasks" && (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Tasks & Assignments</p>
                {TASKS.map(t => (
                  <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, padding: "10px 12px", background: "#f8f9fb", borderRadius: 3 }}>
                    <div style={{ marginTop: 2, cursor: "pointer" }} title="Toggle done" onClick={() => P.setTaskStatus(t.id, t.status === "done" ? "pending" : "done")}>
                      {t.status === "done" ? <CheckCircle size={15} color="#059669" /> : <Circle size={15} color="#ccc" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: t.status === "done" ? "#aaa" : NAVY, fontSize: 12, fontWeight: 600, margin: "0 0 3px", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 9, color: "#999" }}>Due {t.due}</span>
                        <span style={{ fontSize: 9, color: TASK_STATUS_COLORS[t.status], fontWeight: 700, textTransform: "uppercase" }}>{t.status}</span>
                        <span style={{ fontSize: 9, color: "#bbb" }}>From: {t.from}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* LMS Courses */}
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Learning Modules</p>
                {myCourses.length === 0 && <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>No courses assigned yet.</p>}
                {myCourses.map(c => {
                  const pct = Math.round((c.done / c.total) * 100), done = c.done >= c.total;
                  return (
                    <div key={c.id} style={{ marginBottom: 14, padding: "12px 14px", background: "#f8f9fb", borderRadius: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                        <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: 0 }}>{c.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: done ? "#059669" : TEAL, fontSize: 9, fontWeight: 700 }}>{c.done}/{c.total} complete</span>
                          {!done && (
                            <button onClick={() => { P.completeModule(c.id); toast.success(`Module ${c.done + 1} of ${c.title} complete`); }}
                              style={{ background: TEAL, border: "none", borderRadius: 3, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <Play size={9} color="#fff" /> <span style={{ color: "#fff" }}>Complete next module</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 5, background: "#e0e0e0", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: done ? "#059669" : TEAL, borderRadius: 3, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RESOURCES ── */}
          {nav === "resources" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {libraryRows.map(r => {
                const Icon = TYPE_ICON[r.type] ?? BookOpen, shared = sharedIds.has(r.id);
                return (
                  <div key={r.id} className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: shared ? `1px solid ${TEAL}` : "1px solid transparent" }}>
                    <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Icon size={28} color="#4C808A" />
                      {shared && <span style={{ background: TEAL, color: "#fff", fontSize: 8, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>SHARED BY MENTOR</span>}
                    </div>
                    <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>{r.tag}</span>
                    <p style={{ color: NAVY, fontSize: 12, fontWeight: 600, margin: "8px 0 4px" }}>{r.title}</p>
                    <p style={{ color: "#aaa", fontSize: 10, margin: "0 0 12px" }}>{r.type}</p>
                    <button onClick={() => { downloadResource(r); toast.success(`Downloaded ${r.title}`); }} style={{ width: "100%", background: "#4C808A", border: "none", borderRadius: 3, padding: "8px", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}>
                      <Download size={11} color="#fff" /> <span style={{ color: "#fff" }}>Download</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PROFILE ── */}
          {nav === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={22} color="#fff" strokeWidth={1.8} /></div>
                  <div>
                    <p style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: "0 0 3px" }}>{MENTEE.name}</p>
                    <p style={{ color: "#888", fontSize: 11, margin: 0 }}>{cohortLabel}</p>
                  </div>
                </div>
                {[
                  { label: "Email", val: MENTEE.email },
                  { label: "Phone", val: MENTEE.phone },
                  { label: "City", val: MENTEE.city },
                  { label: "Stage", val: MENTEE.stage },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>{f.label}</p>
                    <p style={{ color: NAVY, fontSize: 11, fontWeight: 600, margin: 0 }}>{f.val}</p>
                  </div>
                ))}
              </div>
              <div className="md-card" style={{ background: "#fff", borderRadius: 3, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Venture Details</p>
                {[
                  { label: "Venture Name", val: MENTEE.venture },
                  { label: "Sector", val: MENTEE.sector },
                  { label: "Stage", val: MENTEE.stage },
                  { label: "Year Started", val: "2024" },
                  { label: "Team Size", val: "3" },
                  { label: "Revenue Status", val: "Pre-revenue" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>{f.label}</p>
                    <p style={{ color: NAVY, fontSize: 11, fontWeight: 600, margin: 0 }}>{f.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Re-match modal */}
      {newGoalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 3, padding: 28, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: 0 }}>Propose a Goal</h3>
              <button onClick={() => setNewGoalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={18} /></button>
            </div>
            <input value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="Goal title" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 3, padding: 10, fontSize: 11, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <select value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })} style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: 10, fontSize: 11 }}>{["Market", "Legal", "Revenue", "Product", "Team", "Learning"].map(c => <option key={c}>{c}</option>)}</select>
              <input value={goalForm.due} onChange={e => setGoalForm({ ...goalForm, due: e.target.value })} placeholder="Due e.g. Sep 15" style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 3, padding: 10, fontSize: 11 }} />
            </div>
            <p style={{ color: "#888", fontSize: 10, margin: "10px 0 0" }}>Your mentor will review and approve it before it counts toward your progress.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => setNewGoalOpen(false)} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#666" }}>Cancel</button>
              <button onClick={() => { if (!pid || !goalForm.title.trim()) return toast.error("Give the goal a title"); P.proposeGoal({ pairId: pid, title: goalForm.title.trim(), category: goalForm.category, due: goalForm.due || "TBD", by: "mentee" }); setGoalForm({ title: "", due: "", category: "Market" }); setNewGoalOpen(false); toast.success("Goal sent to your mentor"); }} style={{ flex: 1, background: TEAL, border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#fff", fontWeight: 700 }}>Send for approval</button>
            </div>
          </div>
        </div>
      )}

      {showRematch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 3, padding: 28, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: 0 }}>Request Re-matching</h3>
              <button onClick={() => setShowRematch(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={18} /></button>
            </div>
            <p style={{ color: "#666", fontSize: 12, margin: "0 0 14px", lineHeight: 1.7 }}>This request will be reviewed by your Programme Manager. Please briefly explain why you would like to be re-matched with a different mentor.</p>
            <textarea rows={4} value={rematchReason} onChange={e => setRematchReason(e.target.value)} placeholder="Reason for re-match request..." style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 3, padding: 12, fontSize: 11, outline: "none", resize: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => setShowRematch(false)} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#666" }}>Cancel</button>
              <button onClick={() => { if (!pid) return; if (!rematchReason.trim()) return toast.error("Please add a reason"); P.requestRematch(pid, rematchReason.trim()); setRematchReason(""); setShowRematch(false); toast.success("Re-match request sent to your Programme Manager"); }} style={{ flex: 1, background: TEAL, border: "none", borderRadius: 3, padding: 10, cursor: "pointer", fontSize: 11, color: "#fff", fontWeight: 700 }}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
