import { useState, useEffect, useRef } from "react";
import type { AdminProgram } from "../types";
import { isUnassigned, managerNames, manages, type Manager } from "../data/managers";
import { SELECTED_PROJECT_KEY } from "../data/projectScope";
import {
  LayoutDashboard, Users, MapPin, FileText, Award,
  Globe, Bell, Settings, Search,
  ChevronRight, X, BarChart2, Briefcase, Filter,
  CheckCircle, UserCheck, GitMerge, Layers, GraduationCap,
  UserPlus, Shield, ChevronDown, TrendingUp, PieChart, LogOut,
} from "lucide-react";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
// Chart palette (bars & donuts)
const CHART_PALETTE = [
  "#F2EC32", // 1 Yellow
  "#FAC833", // 2 Gold / Amber
  "#F38629", // 3 Orange
  "#FF0101", // 4 Red
  "#F70252", // 5 Magenta
  "#DB457A", // 6 Rose / Deep Pink
  "#1D6CBF", // 7 Royal Blue
  "#3999BF", // 8 Teal
  "#46975D", // 9 Green
  "#78C41A", // 10 Lime
];
const GENDER_FEMALE = "#FF0101"; // Red
const GENDER_MALE   = "#1D6CBF"; // Royal Blue
const GENDER_YOUTH  = "#F2EC32"; // Yellow

// ── CSS ─────────────────────────────────────────────────────────────────────
const css = `
/* ── Responsive grid helpers ── */
.pm-grid-7 { display:grid; gap:12px; grid-template-columns:repeat(2,1fr); }
@media(min-width:480px){ .pm-grid-7{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:768px){ .pm-grid-7{ grid-template-columns:repeat(4,1fr); } }
@media(min-width:1280px){ .pm-grid-7{ grid-template-columns:repeat(7,1fr); } }

.pm-ent-stages{ display:grid; gap:10px; grid-template-columns:repeat(2,1fr); }
@media(min-width:480px){ .pm-ent-stages{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:768px){ .pm-ent-stages{ grid-template-columns:repeat(4,1fr); } }
@media(min-width:1280px){ .pm-ent-stages{ grid-template-columns:repeat(7,1fr); } }


.pm-mentor-grid{ display:grid; gap:16px; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .pm-mentor-grid{ grid-template-columns:repeat(4,1fr); } }

.pm-title-row{ display:flex; flex-direction:column; gap:16px; }
@media(min-width:768px){ .pm-title-row{ flex-direction:row; align-items:flex-start; justify-content:space-between; } }

.pm-search-input::placeholder{ color:rgba(255,255,255,0.65); }

/* sidebar hidden on mobile */
.pm-sidebar-desktop{ display:none !important; }
@media(min-width:768px){ .pm-sidebar-desktop{ display:flex !important; } }

/* mobile top-bar hamburger */
.pm-hamburger{ display:flex; }
@media(min-width:768px){ .pm-hamburger{ display:none; } }

@keyframes pm-drawer {
  from { transform:translateX(-100%); }
  to   { transform:translateX(0); }
}
.pm-drawer{ animation:pm-drawer 0.28s ease both; }

@keyframes pm-up {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes pm-in {
  from { opacity:0; transform:scale(0.93) translateY(8px); }
  to   { opacity:1; transform:scale(1)    translateY(0);   }
}
@keyframes pm-flow {
  0%   { stroke-dashoffset: 200; opacity:0; }
  40%  { opacity:1; }
  100% { stroke-dashoffset: 0;   opacity:0.45; }
}
@keyframes pm-ring {
  from { stroke-dashoffset: 251; }
  to   { stroke-dashoffset: var(--dash-target); }
}
@keyframes pm-pulse-dot {
  0%,100% { transform:scale(1);   opacity:1;   }
  50%      { transform:scale(1.6); opacity:0.5; }
}
@keyframes pm-shimmer {
  0%   { background-position:-300% center; }
  100% { background-position: 300% center; }
}
@keyframes pm-glow {
  0%,100% { box-shadow:0 0 0 0 rgba(76,128,138,0);    }
  50%      { box-shadow:0 0 18px 4px rgba(76,128,138,0.3); }
}
@keyframes pm-countup {
  from { opacity:0; transform:scale(0.75); }
  to   { opacity:1; transform:scale(1);    }
}
@keyframes pm-dropdown {
  from { opacity:0; transform:translateY(-8px) scale(0.97); }
  to   { opacity:1; transform:translateY(0)    scale(1);    }
}
.pm-up    { animation: pm-up   0.5s ease both; }
.pm-in    { animation: pm-in   0.4s ease both; }
.pm-glow  { animation: pm-glow 2.5s ease-in-out infinite; }
.pm-shimmer-txt {
  background: linear-gradient(90deg,#a8d8df,#fff,#9ab5d4,#fff,#a8d8df);
  background-size:300% auto;
  animation: pm-shimmer 4s linear infinite;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}
`;

// ── Data ─────────────────────────────────────────────────────────────────────
const PROJECTS = [
  "All Projects",
  "ARISE Youth Incubation",
  "AgriStart Malawi",
  "Tech4Good Programme",
  "Scale-Up Malawi",
  "GrowBiz Accelerator",
  "She Leads Malawi",
  "Export Ready Programme",
];

interface SectorItem {
  name: string;
  count: number;
  pct: number;
}

interface DistrictItem {
  name: string;
  count: number;
  pct: number;
}

interface D {
  programs:number; entrepreneurs:number; implemented:number;
  mentors:number; districts:number; sectors:number; partners:number;
  e_total:number; e_selected:number; e_approved:number; e_matching:number;
  e_incubation:number; e_acceleration:number; e_alumni:number;
  m_total:number; m_selected:number; m_approved:number; m_matching:number;
  female:number; male:number; youth:number;
  topSectors: SectorItem[];
  topDistricts: DistrictItem[];
}

const DATA: Record<string,D> = {
  "All Projects": {
    programs:6,entrepreneurs:742,implemented:12,mentors:312,districts:18,sectors:9,partners:24,
    e_total:742,e_selected:380,e_approved:245,e_matching:198,e_incubation:142,e_acceleration:88,e_alumni:56,
    m_total:312,m_selected:168,m_approved:124,m_matching:98,
    female:416,male:297,youth:29,
    topSectors: [
      { name: "Agriculture & Agribusiness", count: 254, pct: 34 },
      { name: "Technology & ICT", count: 178, pct: 24 },
      { name: "Renewable Energy & Climate", count: 118, pct: 16 },
      { name: "Manufacturing & Crafts", count: 89, pct: 12 },
      { name: "Trade & Financial Services", count: 60, pct: 8 },
      { name: "Healthcare & Sanitation", count: 43, pct: 6 },
    ],
    topDistricts: [
      { name: "Lilongwe", count: 215, pct: 29 },
      { name: "Blantyre", count: 185, pct: 25 },
      { name: "Zomba", count: 96, pct: 13 },
      { name: "Mzuzu", count: 89, pct: 12 },
      { name: "Kasungu", count: 59, pct: 8 },
      { name: "Salima", count: 51, pct: 7 },
      { name: "Mangochi", count: 47, pct: 6 },
    ]
  },
  "ARISE Youth Incubation": {
    programs:1,entrepreneurs:98,implemented:2,mentors:42,districts:7,sectors:4,partners:6,
    e_total:98,e_selected:52,e_approved:38,e_matching:31,e_incubation:28,e_acceleration:0,e_alumni:8,
    m_total:42,m_selected:24,m_approved:18,m_matching:14,
    female:53,male:39,youth:6,
    topSectors: [
      { name: "Technology & Digital", count: 39, pct: 40 },
      { name: "Agri-Enterprise", count: 29, pct: 30 },
      { name: "Renewable Energy", count: 18, pct: 18 },
      { name: "Creative Arts & Trade", count: 12, pct: 12 },
    ],
    topDistricts: [
      { name: "Lilongwe", count: 35, pct: 36 },
      { name: "Blantyre", count: 28, pct: 29 },
      { name: "Zomba", count: 16, pct: 16 },
      { name: "Mzuzu", count: 12, pct: 12 },
      { name: "Salima", count: 7, pct: 7 },
    ]
  },
  "AgriStart Malawi": {
    programs:1,entrepreneurs:87,implemented:2,mentors:38,districts:8,sectors:3,partners:5,
    e_total:87,e_selected:44,e_approved:30,e_matching:24,e_incubation:22,e_acceleration:0,e_alumni:6,
    m_total:38,m_selected:20,m_approved:15,m_matching:11,
    female:48,male:35,youth:4,
    topSectors: [
      { name: "Crop Production & Processing", count: 41, pct: 47 },
      { name: "Livestock & Aquaculture", count: 24, pct: 28 },
      { name: "AgriTech & Cold Storage", count: 14, pct: 16 },
      { name: "Agro-forestry & Inputs", count: 8, pct: 9 },
    ],
    topDistricts: [
      { name: "Lilongwe", count: 28, pct: 32 },
      { name: "Kasungu", count: 21, pct: 24 },
      { name: "Salima", count: 15, pct: 17 },
      { name: "Mzuzu", count: 13, pct: 15 },
      { name: "Zomba", count: 10, pct: 12 },
    ]
  },
  "Tech4Good Programme": {
    programs:1,entrepreneurs:62,implemented:1,mentors:28,districts:6,sectors:3,partners:4,
    e_total:62,e_selected:32,e_approved:22,e_matching:18,e_incubation:14,e_acceleration:0,e_alumni:4,
    m_total:28,m_selected:14,m_approved:11,m_matching:8,
    female:28,male:31,youth:3,
    topSectors: [
      { name: "Software & Web Platforms", count: 26, pct: 42 },
      { name: "FinTech & Payments", count: 18, pct: 29 },
      { name: "HealthTech & EduTech", count: 11, pct: 18 },
      { name: "Hardware & IoT", count: 7, pct: 11 },
    ],
    topDistricts: [
      { name: "Blantyre", count: 26, pct: 42 },
      { name: "Lilongwe", count: 22, pct: 35 },
      { name: "Zomba", count: 8, pct: 13 },
      { name: "Mzuzu", count: 6, pct: 10 },
    ]
  },
  "Scale-Up Malawi": {
    programs:1,entrepreneurs:72,implemented:2,mentors:34,districts:6,sectors:5,partners:7,
    e_total:72,e_selected:38,e_approved:26,e_matching:20,e_incubation:0,e_acceleration:18,e_alumni:10,
    m_total:34,m_selected:18,m_approved:14,m_matching:10,
    female:39,male:30,youth:3,
    topSectors: [
      { name: "Manufacturing & FMCG", count: 27, pct: 38 },
      { name: "Commercial Agriculture", count: 20, pct: 28 },
      { name: "Clean Energy Solutions", count: 14, pct: 19 },
      { name: "Logistics & Distribution", count: 11, pct: 15 },
    ],
    topDistricts: [
      { name: "Blantyre", count: 28, pct: 39 },
      { name: "Lilongwe", count: 24, pct: 33 },
      { name: "Mzuzu", count: 11, pct: 15 },
      { name: "Zomba", count: 9, pct: 13 },
    ]
  },
  "GrowBiz Accelerator": {
    programs:1,entrepreneurs:68,implemented:2,mentors:30,districts:7,sectors:4,partners:5,
    e_total:68,e_selected:34,e_approved:24,e_matching:19,e_incubation:0,e_acceleration:16,e_alumni:9,
    m_total:30,m_selected:16,m_approved:12,m_matching:9,
    female:36,male:29,youth:3,
    topSectors: [
      { name: "Retail & Trade Distribution", count: 25, pct: 37 },
      { name: "Agri-Processing", count: 19, pct: 28 },
      { name: "Services & Hospitality", count: 14, pct: 21 },
      { name: "Clean Tech & Waste", count: 10, pct: 14 },
    ],
    topDistricts: [
      { name: "Lilongwe", count: 25, pct: 37 },
      { name: "Blantyre", count: 22, pct: 32 },
      { name: "Zomba", count: 12, pct: 18 },
      { name: "Mangochi", count: 9, pct: 13 },
    ]
  },
  "She Leads Malawi": {
    programs:1,entrepreneurs:130,implemented:2,mentors:58,districts:10,sectors:5,partners:8,
    e_total:130,e_selected:70,e_approved:48,e_matching:38,e_incubation:30,e_acceleration:12,e_alumni:14,
    m_total:58,m_selected:32,m_approved:24,m_matching:18,
    female:115,male:12,youth:3,
    topSectors: [
      { name: "Agri-Processing & Nutrition", count: 48, pct: 37 },
      { name: "Textile & Craft Manufacturing", count: 32, pct: 25 },
      { name: "Tech & Digital Services", count: 25, pct: 19 },
      { name: "Health, Beauty & Wellbeing", count: 16, pct: 12 },
      { name: "Eco-Packaging & Green Energy", count: 9, pct: 7 },
    ],
    topDistricts: [
      { name: "Lilongwe", count: 42, pct: 32 },
      { name: "Blantyre", count: 36, pct: 28 },
      { name: "Zomba", count: 20, pct: 15 },
      { name: "Mzuzu", count: 18, pct: 14 },
      { name: "Salima", count: 14, pct: 11 },
    ]
  },
  "Export Ready Programme": {
    programs:1,entrepreneurs:43,implemented:1,mentors:22,districts:5,sectors:3,partners:4,
    e_total:43,e_selected:22,e_approved:16,e_matching:12,e_incubation:0,e_acceleration:8,e_alumni:5,
    m_total:22,m_selected:12,m_approved:9,m_matching:7,
    female:24,male:17,youth:2,
    topSectors: [
      { name: "Specialty Tea & Macadamia", count: 18, pct: 42 },
      { name: "Textiles & Garments", count: 12, pct: 28 },
      { name: "Processed Foods", count: 8, pct: 19 },
      { name: "Artisan & Handcrafts", count: 5, pct: 11 },
    ],
    topDistricts: [
      { name: "Blantyre", count: 18, pct: 42 },
      { name: "Thyolo & Mulanje", count: 12, pct: 28 },
      { name: "Lilongwe", count: 8, pct: 19 },
      { name: "Mzuzu", count: 5, pct: 11 },
    ]
  },
};

// ── Animated counter ──────────────────────────────────────────────────────────
function useCount(target: number) {
  const [v, setV] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(() => {
    setV(0);
    if (timer.current) clearInterval(timer.current);
    const steps = 40, ms = 900;
    let cur = 0;
    timer.current = setInterval(() => {
      cur += target / steps;
      if (cur >= target) { setV(target); clearInterval(timer.current!); }
      else setV(Math.floor(cur));
    }, ms / steps);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [target]);
  return v;
}

// ── Overview card — #4C808A background, centred layout ───────────────────────
function OCard({ icon: Icon, label, value, accent, delay=0 }: {
  icon:React.ElementType; label:string; value:number; accent:string; delay?:number;
}) {
  const v = useCount(value);
  return (
    <div className="pm-in rounded-md p-4 relative overflow-hidden flex flex-col items-center justify-center gap-2 group cursor-default text-center"
      style={{
        animationDelay:`${delay}ms`,
        background:"#4C808A",
        border:"1px solid rgba(255,255,255,0.18)",
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
        transition:"transform 0.2s, box-shadow 0.2s",
        minHeight:110,
      }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-3px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 8px 32px rgba(76,128,138,0.45)`;}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.2)";}}
    >
      <div className="flex items-center justify-center">
        <Icon size={20} color="#fff"/>
      </div>

      <div className="text-white font-black leading-none" style={{fontSize:26,
        animation:`pm-countup 0.6s ease ${delay+200}ms both`}}>
        {v.toLocaleString()}
      </div>

      <div className="text-white/80 leading-tight px-1" style={{fontSize:9,fontWeight:700,
        textTransform:"uppercase",letterSpacing:"0.07em"}}>
        {label}
      </div>
    </div>
  );
}

// ── Dropdown filter ───────────────────────────────────────────────────────────
function ProjectDropdown({ projects, value, onChange }: {
  projects:string[]; value:string; onChange:(v:string)=>void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e:MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full" style={{minWidth:0}}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-bold text-white transition-all shadow-md"
        style={{
          background: TEAL,
          border:"1px solid rgba(255,255,255,0.22)",
          boxShadow:"0 4px 20px rgba(76,128,138,0.35)",
        }}
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{background: TEAL, border:"none"}}>
          <Filter size={13} color="#fff"/>
        </div>
        <span className="flex-1 text-left truncate">{value}</span>
        <div className="flex items-center gap-1.5">
          {value !== "All Projects" && (
            <button onClick={e=>{e.stopPropagation();onChange("All Projects");}}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={9} color="rgba(255,255,255,0.85)"/>
            </button>
          )}
          <ChevronDown size={15} color="rgba(255,255,255,0.9)"
            style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.25s"}}/>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-md overflow-hidden z-50"
          style={{
            background: TEAL,
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
            animation: "pm-dropdown 0.2s ease both",
          }}>
          {/* Header */}
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{borderBottom:"1px solid rgba(255,255,255,0.18)"}}>
            <div className="flex items-center gap-2">
              <Search size={11} color="rgba(255,255,255,0.7)"/>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                style={{background: TEAL, border: "1px solid rgba(255,255,255,0.3)"}}>
                Select Project
              </span>
            </div>
            <span className="text-[10px] text-white/75">{projects.length} available</span>
          </div>
          {projects.map((p) => {
            const active = value === p;
            return (
              <button key={p} onClick={()=>{onChange(p);setOpen(false);}}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-left transition-all"
                style={{
                  background: active ? TEAL : "transparent",
                  color: "#ffffff",
                  borderLeft: active ? `3px solid #fff` : "3px solid transparent",
                }}
                onMouseEnter={e=>{ if (!active) (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.14)";}}
                onMouseLeave={e=>{ if (!active) (e.currentTarget as HTMLElement).style.background="transparent";}}
              >
                <span>{p}</span>
                {active && <CheckCircle size={12} color="#fff" className="shrink-0"/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  {icon:LayoutDashboard, label:"Dashboard"},
  {icon:FileText,        label:"Applications"},
  {icon:Users,           label:"Participants"},
  {icon:BarChart2,       label:"Reports"},
  {icon:Award,           label:"Programmes"},
  {icon:Globe,           label:"Impact Map"},
  {icon:Settings,        label:"Settings"},
];

// ── Shared sidebar internals ──────────────────────────────────────────────────
function SidebarContents({ sidebarOpen, activeNav, setActiveNav, onBack, onToggle, isMobile=false }: {
  sidebarOpen:boolean; activeNav:string; setActiveNav:(l:string)=>void;
  onBack:()=>void; onToggle:()=>void; isMobile?:boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-5"
        style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <img src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
          alt="Emerge Livelihoods" className="h-7 brightness-0 invert shrink-0"/>
        {isMobile && (
          <button onClick={onToggle} className="ml-auto text-white/40 hover:text-white transition-colors">
            <X size={16}/>
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {NAV.map(({icon:Icon,label})=>{
          const active = activeNav===label;
          return (
            <button key={label} onClick={()=>setActiveNav(label)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all"
              style={{
                background:active?`linear-gradient(135deg,${NAVY}bb,${TEAL}55)`:"transparent",
                color:active?"#fff":"rgba(255,255,255,0.38)",
                border:active?`1px solid ${TEAL}35`:"1px solid transparent",
              }}>
              <Icon size={15}/>
              {(sidebarOpen || isMobile) && <span className="text-xs font-semibold">{label}</span>}
              {(sidebarOpen || isMobile) && active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{background:TEAL}}/>}
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-4" style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
        {(sidebarOpen || isMobile) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-1"
            style={{background:"rgba(255,255,255,0.04)"}}>
            {/* Photo placeholder */}
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)"}}>
              <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
                <circle cx="14" cy="10" r="4.5" fill="rgba(255,255,255,0.75)"/>
                <ellipse cx="14" cy="23" rx="8.5" ry="5" fill="rgba(255,255,255,0.75)"/>
              </svg>
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-[10px] font-bold truncate">Program Manager</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Profile dropdown menu ─────────────────────────────────────────────────────
function ProfileMenu({ onSignOut, name = "Program Manager", title = "My Profile" }: { onSignOut?: () => void; name?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:ring-2 hover:ring-white/40"
        style={{background:"rgba(255,255,255,0.15)", border:"2px solid #fff"}}
      >
        <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <circle cx="16" cy="12" r="5" fill="rgba(255,255,255,0.85)"/>
          <ellipse cx="16" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.85)"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-md overflow-hidden z-50"
          style={{
            background:"rgba(15,18,40,0.98)",
            border:`1px solid ${TEAL}55`,
            boxShadow:"0 16px 40px rgba(0,0,0,0.5)",
            animation:"pm-dropdown 0.2s ease both",
            backdropFilter:"blur(20px)",
          }}>
          {/* Profile header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{borderBottom:`1px solid rgba(255,255,255,0.07)`}}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{background:`linear-gradient(135deg,${NAVY},${TEAL})`,border:"1px solid rgba(255,255,255,0.2)"}}>
              <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
                <circle cx="14" cy="10" r="4.5" fill="rgba(255,255,255,0.9)"/>
                <ellipse cx="14" cy="23" rx="8.5" ry="5" fill="rgba(255,255,255,0.9)"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate">{name}</div>
              <div className="text-[10px] truncate" style={{color:`${TEAL}`}}>{title}</div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {[
              { icon: UserCheck, label: "My Profile" },
              { icon: Settings,  label: "Settings" },
            ].map(({ icon: Icon, label }) => (
              <button key={label}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold transition-all text-left"
                style={{color:"rgba(255,255,255,0.65)"}}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(76,128,138,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{background:NAVY}}>
                  <Icon size={11} color={TEAL}/>
                </div>
                {label}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
            <button
              onClick={() => { setOpen(false); onSignOut?.(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold transition-all text-left"
              style={{color:"#fca5a5"}}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,38,38,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{background:"rgba(239,68,68,0.25)"}}>
                <LogOut size={11} color="#fca5a5"/>
              </div>
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Gender Donut Chart Card ───────────────────────────────────────────────────
function GenderDonutCard({ female, male, youth, project }: {
  female: number; male: number; youth: number; project: string;
}) {
  const [hovered, setHovered] = useState<"female" | "male" | "youth" | null>(null);

  const total = female + male + youth || 1;
  const femPct = Math.round((female / total) * 100);
  const malPct = Math.round((male / total) * 100);
  const ythPct = Math.max(0, 100 - femPct - malPct);

  // Donut geometry: viewBox 420 260, center (210, 130), radius 72, strokeWidth 22
  const cx = 210, cy = 130, r = 72, sw = 22;
  const circ = 2 * Math.PI * r;
  const gap = total > 1 ? 4 : 0;

  const femFrac = female / total;
  const malFrac = male / total;
  const ythFrac = Math.max(0, 1 - femFrac - malFrac);

  const fLen = Math.max(0, femFrac * circ - gap);
  const mLen = Math.max(0, malFrac * circ - gap);
  const yLen = Math.max(0, ythFrac * circ - gap);

  // Angle calculations starting at 12 o'clock (-90 deg)
  const deltaF = femFrac * 360;
  const thetaF = -90 + deltaF / 2;

  const deltaM = malFrac * 360;
  const alphaM = -90 + deltaF;
  const thetaM = alphaM + deltaM / 2;

  const deltaY = ythFrac * 360;
  const alphaY = alphaM + deltaM;
  const thetaY = alphaY + deltaY / 2;

  const slices = [
    {
      key: "female" as const,
      label: "Female",
      count: female,
      pct: femPct,
      color: GENDER_FEMALE,
      theta: thetaF,
      len: fLen,
      offset: 0,
    },
    {
      key: "male" as const,
      label: "Male",
      count: male,
      pct: malPct,
      color: GENDER_MALE,
      theta: thetaM,
      len: mLen,
      offset: -(fLen + gap),
    },
    {
      key: "youth" as const,
      label: "Youth",
      count: youth,
      pct: ythPct,
      color: GENDER_YOUTH,
      theta: thetaY,
      len: yLen,
      offset: -(fLen + gap + mLen + gap),
    },
  ];

  // Active highlighted info in center
  const activeLabel = hovered === "female" ? "Female" : hovered === "male" ? "Male" : hovered === "youth" ? "Youth" : "";
  const activeCount = hovered === "female" ? female : hovered === "male" ? male : hovered === "youth" ? youth : total;
  const activePct = hovered === "female" ? `${femPct}%` : hovered === "male" ? `${malPct}%` : hovered === "youth" ? `${ythPct}%` : `${femPct}% Female`;
  const activeColor = hovered === "female" ? GENDER_FEMALE : hovered === "male" ? GENDER_MALE : hovered === "youth" ? GENDER_YOUTH : GENDER_FEMALE;

  return (
    <div className="pm-up rounded-md p-6 flex flex-col justify-between" style={{
      animationDelay: "120ms",
      background: "#fff",
      border: "1px solid rgba(76,128,138,0.18)",
      boxShadow: "0 2px 16px rgba(76,128,138,0.08)",
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm"
            style={{background:NAVY,border:"1px solid rgba(255,255,255,0.15)"}}>
            <PieChart size={17} color="#fff"/>
          </div>
          <div>
            <div className="font-black text-base" style={{color:TEAL}}>Gender Distribution</div>
            <div className="text-[11px] font-semibold text-gray-500">
              Participant representation by gender
            </div>
          </div>
        </div>
      </div>

      {/* Donut Chart with Line Pointers */}
      <div className="my-2 flex items-center justify-center">
        <svg
          className="w-full max-w-[440px] h-auto overflow-visible select-none"
          viewBox="0 0 420 260"
        >
          {/* Donut Arcs (rotated -90deg around center so they start at 12 o'clock) */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {/* Background track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(76,128,138,0.08)" strokeWidth={sw} />

            {slices.map(s => (
              <circle
                key={s.key}
                cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                strokeWidth={hovered === s.key ? sw + 5 : sw}
                strokeDasharray={`${s.len} ${circ}`}
                strokeDashoffset={s.offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300"
                style={{
                  filter: hovered === s.key ? `drop-shadow(0 0 8px ${s.color}88)` : "none",
                  opacity: hovered && hovered !== s.key ? 0.35 : 1,
                }}
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </g>

          {/* Center text */}
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.06em"
          >
            {activeLabel ? activeLabel.toUpperCase() : "TOTAL"}
          </text>
          <text
            x={cx}
            y={cy + 9}
            textAnchor="middle"
            fill={activeColor}
            fontSize="24"
            fontWeight="900"
          >
            {activeCount.toLocaleString()}
          </text>
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            fill={activeColor}
            fontSize="12"
            fontWeight="700"
          >
            {activePct}
          </text>

          {/* Line Pointers & Values */}
          {slices.filter(s => s.count > 0).map(s => {
            const rad = (s.theta * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const p1 = {
              x: cx + (r + sw / 2 + 2) * cos,
              y: cy + (r + sw / 2 + 2) * sin,
            };

            const p2 = {
              x: cx + (r + sw / 2 + 18) * cos,
              y: cy + (r + sw / 2 + 18) * sin,
            };

            const isRight = cos >= 0;
            const p3 = {
              x: isRight ? p2.x + 24 : p2.x - 24,
              y: p2.y,
            };

            const textX = isRight ? p3.x + 6 : p3.x - 6;
            const anchor = isRight ? "start" : "end";

            return (
              <g
                key={`pointer-${s.key}`}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  opacity: hovered && hovered !== s.key ? 0.35 : 1,
                }}
              >
                {/* Outer anchor dot on slice arc */}
                <circle cx={p1.x} cy={p1.y} r={3.5} fill={s.color} />

                {/* Line pointer */}
                <polyline
                  points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hovered === s.key ? 2.8 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Values at pointer */}
                <text
                  x={textX}
                  y={p3.y - 3}
                  textAnchor={anchor}
                  fill="#111827"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {s.count.toLocaleString()}
                </text>
                <text
                  x={textX}
                  y={p3.y + 12}
                  textAnchor={anchor}
                  fill={s.color}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {s.pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Center Legends */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setHovered(hovered === "female" ? null : "female")}
          onMouseEnter={() => setHovered("female")}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer"
          style={{
            background: hovered === "female" ? "rgba(255,1,1,0.12)" : "transparent",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: GENDER_FEMALE }} />
          <span className="text-xs font-bold text-gray-700">Female</span>
        </button>

        <button
          type="button"
          onClick={() => setHovered(hovered === "male" ? null : "male")}
          onMouseEnter={() => setHovered("male")}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer"
          style={{
            background: hovered === "male" ? "rgba(29,108,191,0.12)" : "transparent",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: GENDER_MALE }} />
          <span className="text-xs font-bold text-gray-700">Male</span>
        </button>

        <button
          type="button"
          onClick={() => setHovered(hovered === "youth" ? null : "youth")}
          onMouseEnter={() => setHovered("youth")}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer"
          style={{
            background: hovered === "youth" ? "rgba(242,236,50,0.18)" : "transparent",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: GENDER_YOUTH }} />
          <span className="text-xs font-bold text-gray-700">Youth</span>
        </button>
      </div>
    </div>
  );
}

// ── Sector & District Representation Card ─────────────────────────────────────
function SectorDistrictCard({ sectors, districts, project }: {
  sectors: SectorItem[]; districts: DistrictItem[]; project: string;
}) {
  const [view, setView] = useState<"sectors" | "districts">("sectors");
  const [showPct, setShowPct] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setShowPct(prev => !prev);
        setAnimating(false);
      }, 250);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const topDistrict = districts[0] ?? { name: "Lilongwe", count: 0, pct: 0 };

  const barColors = CHART_PALETTE;

  return (
    <div className="pm-up rounded-md p-6 flex flex-col justify-between" style={{
      animationDelay: "180ms",
      background: "#fff",
      border: "1px solid rgba(76,128,138,0.18)",
      boxShadow: "0 2px 16px rgba(76,128,138,0.08)",
    }}>
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm"
            style={{background:NAVY,border:"1px solid rgba(255,255,255,0.15)"}}>
            {view === "sectors" ? <BarChart2 size={17} color="#fff"/> : <MapPin size={17} color="#fff"/>}
          </div>
          <div>
            <div className="font-black text-base" style={{color:TEAL}}>
              {view === "sectors" ? "Sector Representation" : "District Reach"}
            </div>
            <div className="text-[11px] font-semibold text-gray-500">
              {view === "sectors" ? "Enterprise focus by industry sector" : "Geographic distribution across districts"}
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-md self-start sm:self-auto">
          <button
            onClick={() => setView("sectors")}
            className="px-3 py-1 rounded text-xs font-bold transition-all"
            style={{
              background: view === "sectors" ? TEAL : "transparent",
              color: view === "sectors" ? "#fff" : "#4b5563",
              boxShadow: view === "sectors" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
            }}
          >
            Sectors
          </button>
          <button
            onClick={() => setView("districts")}
            className="px-3 py-1 rounded text-xs font-bold transition-all"
            style={{
              background: view === "districts" ? TEAL : "transparent",
              color: view === "districts" ? "#fff" : "#4b5563",
              boxShadow: view === "districts" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
            }}
          >
            Districts
          </button>
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="flex flex-col gap-3 my-1">
        {view === "sectors" ? (
          sectors.slice(0, 5).map((sec, idx) => (
            <div key={sec.name} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-700 truncate pr-2">{sec.name}</span>
                <span
                  className="font-black shrink-0 text-gray-900 text-xs inline-block transition-all duration-300 ease-out"
                  style={{
                    minWidth: 44,
                    textAlign: "right",
                    opacity: animating ? 0 : 1,
                    transform: animating ? "translateY(-3px) scale(0.96)" : "translateY(0) scale(1)",
                  }}
                >
                  {showPct ? `${sec.pct}%` : sec.count}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${sec.pct}%`,
                    background: barColors[idx % barColors.length],
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          districts.slice(0, 5).map((dist, idx) => (
            <div key={dist.name} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-700 flex items-center gap-1.5 truncate pr-2">
                  <MapPin size={11} className="text-gray-400 shrink-0"/> {dist.name}
                </span>
                <span
                  className="font-black shrink-0 text-gray-900 text-xs inline-block transition-all duration-300 ease-out"
                  style={{
                    minWidth: 44,
                    textAlign: "right",
                    opacity: animating ? 0 : 1,
                    transform: animating ? "translateY(-3px) scale(0.96)" : "translateY(0) scale(1)",
                  }}
                >
                  {showPct ? `${dist.pct}%` : dist.count}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${dist.pct * 2.5}%`,
                    background: barColors[idx % barColors.length],
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Banner */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <div className="text-gray-600 truncate pr-2">
          {view === "districts" && (
            <span><strong>Lead Hub:</strong> {topDistrict.name} — {topDistrict.pct}% of cohort</span>
          )}
        </div>
        <div className="font-bold shrink-0 ml-auto" style={{color:TEAL}}>
          {view === "sectors" ? `${sectors.length} Sectors` : `${districts.length} Districts`}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
/** Every implemented project, whoever champions it. A manager can open the ones they champion in Incubation Management. */
function ProjectsDirectory({ programs, manager, onOpen, onClaim }: { programs: AdminProgram[]; manager: Manager | null; onOpen: (id: string) => void; onClaim?: (id: string) => void }) {
  const list = programs.filter(p => p.published);
  if (!list.length) return null;
  const mine = list.filter(p => manages(p, manager?.id)).length;
  return (
    <div data-testid="projects-directory">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{color:TEAL}}>All Projects ({list.length})</span>
        <span className="text-[11px]" style={{color:"#6b7280"}}>You champion {mine} of {list.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map(p => {
          const mineP = manages(p, manager?.id), none = isUnassigned(p), names = managerNames(p);
          return (
            <div key={p.id} data-testid={`project-${p.id}`} className="rounded-md bg-white p-4 flex flex-col gap-2" style={{border: mineP ? `1.5px solid ${TEAL}` : "1px solid #e5e7eb"}}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black" style={{color:NAVY}}>{p.name}</p>
              </div>
              <p className="text-[11px]" style={{color:"#6b7280"}}>{p.status}{p.sector ? ` · ${p.sector}` : ""}</p>
              <p className="text-[11px]" style={{color:"#374151"}}>{none ? "No manager yet" : `Managed by ${names.join(", ")}`}</p>
              <div className="mt-auto pt-2">
                {mineP && <button onClick={()=>onOpen(p.id)} className="text-[11px] font-bold px-3 py-1.5 rounded-md text-white" style={{background:TEAL}}>Open in Incubation Management</button>}
                {none && onClaim && <button onClick={()=>onClaim(p.id)} className="text-[11px] font-bold px-3 py-1.5 rounded-md" style={{background:"#f3f4f6",color:NAVY}}>Take on this project</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProgramManagersPage({ onBack, onNavigate, onSignOut, manager = null, programs = [], onClaimProgram }: {
  onBack:()=>void; onNavigate?:(page:string)=>void; onSignOut?:()=>void;
  /** The signed-in programme manager. */
  manager?: Manager | null;
  /** Every program (all managers'). Incubation Management only shows the ones this manager champions. */
  programs?: AdminProgram[];
  onClaimProgram?: (programId: string) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [project, setProject] = useState("All Projects");

  const d = DATA[project] ?? DATA["All Projects"];

  const overviewCards = [
    {icon:Layers,    label:"Total Programs",           value:d.programs,      accent:TEAL},
    {icon:Users,     label:"Entrepreneurs Reached",    value:d.entrepreneurs, accent:TEAL},
    {icon:Briefcase, label:"Projects Implemented",     value:d.implemented,   accent:TEAL},
    {icon:UserCheck, label:"Mentors Reached",          value:d.mentors,       accent:TEAL},
    {icon:MapPin,    label:"Districts Reached",        value:d.districts,     accent:TEAL},
    {icon:Globe,     label:"Sectors Reached",          value:d.sectors,       accent:TEAL},
    {icon:Shield,    label:"Project Partners Engaged", value:d.partners,      accent:TEAL},
  ];

  return (
    <div className="min-h-screen flex" style={{
      fontFamily:"Verdana, Geneva, Tahoma, sans-serif",
      background:"#f5f5f5",
    }}>
      <style>{css}</style>

      {/* ── Mobile sidebar overlay ── */}
      {/* {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setMobileNavOpen(false)}/>
          <aside className="pm-drawer relative flex flex-col w-64 h-full z-10"
            style={{background:"rgba(10,13,30,0.98)",backdropFilter:"blur(20px)",borderRight:"1px solid rgba(255,255,255,0.08)"}}>
            <SidebarContents
              sidebarOpen={true} activeNav={activeNav}
              setActiveNav={(l)=>{setActiveNav(l);setMobileNavOpen(false);}}
              onBack={onBack} onToggle={()=>setMobileNavOpen(false)} isMobile />
          </aside>
        </div>
      )} */}

      {/* ── Desktop Sidebar ── */}
      {/* <aside className="pm-sidebar-desktop shrink-0 flex-col relative z-20 transition-all duration-300" style={{
        width:sidebarOpen?210:64,
        background:"rgba(10,13,30,0.9)",
        backdropFilter:"blur(20px)",
        borderRight:"1px solid rgba(255,255,255,0.06)",
      }}>
        <SidebarContents sidebarOpen={sidebarOpen} activeNav={activeNav}
          setActiveNav={setActiveNav} onBack={onBack} onToggle={()=>setSidebarOpen(!sidebarOpen)}/>

        <button onClick={()=>setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center border hover:scale-110 transition-all"
          style={{background:"#1a1e38",borderColor:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)"}}>
          {sidebarOpen?<X size={10}/>:<ChevronRight size={10}/>}
        </button>
      </aside> */}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar — sticky, #3B4167 */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3.5 shrink-0"
          style={{background:NAVY,borderBottom:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>
          {/* Hamburger — mobile only */}
          {/* <button className="pm-hamburger w-8 h-8 rounded-md items-center justify-center shrink-0"
            style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.18)"}}
            onClick={()=>setMobileNavOpen(true)}>
            <BarChart2 size={14} color="#fff"/>
          </button> */}

          {/* Left — Logo */}
          <div className="shrink-0">
            <img
              src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods" className="h-7 brightness-0 invert"/>
          </div>
          <div className="flex-1"/>

          {/* Notification */}
          <button className="w-8 h-8 rounded-md flex items-center justify-center relative shrink-0"
            style={{background:"transparent",border:"none"}}>
            <Bell size={13} color="#fff"/>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:"#e85454"}}/>
          </button>

          {/* Profile menu */}
          <ProfileMenu onSignOut={onSignOut ?? onBack} name={manager?.name} title={manager?.title} />
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7 space-y-8">

          {/* Title */}
          <div>
            <h2 className="font-black text-xl sm:text-2xl" style={{color:TEAL}}>Projects Overview</h2>
          </div>

          {/* ── Overview cards (7) ── */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider" style={{color:TEAL}}>Summary Metrics</span>
            </div>
            <div className="pm-grid-7">
              {overviewCards.map((c,i)=>(
                <OCard key={c.label} {...c} delay={i*55}/>
              ))}
            </div>
          </div>

          {/* All projects, with who champions each */}
          <ProjectsDirectory programs={programs} manager={manager}
            onOpen={(id)=>{ try { sessionStorage.setItem(SELECTED_PROJECT_KEY, id); } catch { /* ignore */ } onNavigate?.("incubation-management"); }}
            onClaim={onClaimProgram} />

          {/* ── Analytics Visualizations: Gender Distribution & Sector/District Representation ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GenderDonutCard female={d.female} male={d.male} youth={d.youth} project={project} />
            <SectorDistrictCard sectors={d.topSectors} districts={d.topDistricts} project={project} />
          </div>

          <div className="h-4"/>
        </div>
      </main>
    </div>
  );
}
