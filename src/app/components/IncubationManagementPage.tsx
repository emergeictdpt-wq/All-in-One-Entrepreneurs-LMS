import { useState, useRef, useEffect, useMemo, createContext, useContext } from "react";
import { toast } from "sonner";
import {
  LayoutGrid, FileText, CheckCircle, ThumbsUp, GitMerge,
  XCircle, Settings, Mail, Activity, Users,
  ChevronDown, ChevronRight, ChevronLeft, Bell, Search, User,
  Eye, Download, MoreHorizontal, Share2,
  PlusCircle, MapPin, Edit2, Trash2 as TrashIcon,
  TrendingUp, AlertCircle, Clock,
  Send, Inbox, Star, Trash2, Sliders,
  GraduationCap, Award, BookOpen, CheckSquare, UserCheck, Plus,
  Calendar, Video, Cloud, Link2, MessageSquare, ClipboardList, Image as ImageIcon, Camera,
  Filter, X, Layers, FileCheck, Lightbulb, RotateCcw, FileX, Phone, Sparkles, CheckCheck, BellRing, Folder, Check,
} from "lucide-react";
import type { AdminProgram, TimelineEntry, EntrepreneurApplication, MentorApplication } from "../types";
import { useProgramme, fmtDate, sameMentee, isMentorOf, MAX_MENTOR_CAPACITY } from "../data/programmeStore";
import { DECISIONS_KEY } from "../data/applicationTracker";
import { SAMPLE_CORE, SAMPLE_SHE } from "../data/directory";
import type { Manager } from "../data/managers";
import { ALL_PROJECTS, ALL_SCOPE, SELECTED_PROJECT_KEY, inScope, mentorInScope, isCompletedProject, splitProjects, type ProjectScope } from "../data/projectScope";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
// ── Chart palette (bars & donuts) ────────────────────────────────────────────
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
const GENDER_MALE   = "#1D6CBF"; // Royal Blue
const GENDER_FEMALE = "#FF0101"; // Red
const BAR_TOTAL     = "#46975D"; // Green
// Pick readable label colour (dark on light fills like yellow/lime/amber)
const labelOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#1f2937" : "#ffffff";
};

const PANEL_BG = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";

// ── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@keyframes im-fadeIn {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes im-slideIn {
  from { opacity:0; transform:translateX(-16px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes im-dropdown {
  from { opacity:0; transform:translateY(-8px) scale(0.97); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}
.im-fade { animation: im-fadeIn 0.35s ease both; }
.im-slide { animation: im-slideIn 0.3s ease both; }
.im-dd { animation: im-dropdown 0.2s ease both; }

/* Table row hover */
.im-row:hover td { background: rgba(76,128,138,0.06); }

/* sidebar scroll */
.im-sidebar { overflow-y: auto; overflow-x: hidden; }
.im-sidebar::-webkit-scrollbar { width: 3px; }
.im-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

/* main scroll */
.im-main { overflow-y: auto; }
.im-main::-webkit-scrollbar { width: 5px; }
.im-main::-webkit-scrollbar-thumb { background: rgba(76,128,138,0.3); border-radius: 4px; }

/* status badge */
.im-badge { display:inline-flex; align-items:center; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:700; }

@keyframes im-spin {
  to { transform: rotate(360deg); }
}
`;

// ── Sidebar nav structure ────────────────────────────────────────────────────
export type NavKey =
  | "Applications" | "Selection" | "Rejected" | "Matching" | "Dropouts"
  | "Email Dashboard" | "Program Health" | "Alumni" | "Program Setup"
  | "Pairing & Matching" | "Relationship Health" | "Cohort Management" | "Reports & Analytics" | "Integration Hub"
  | "Settings";

export interface PairHealthRow {
  pairId: string; programId?: string; mentee: string; mentor: string;
  health: "Healthy" | "At Risk" | "Stalled" | "New";
  sessions7d: number; satisfaction: number | null; goalPct: number;
  flagged: boolean; trend: "up" | "down" | "stable"; reasons: string[]; intervention: boolean;
}

export interface MentorPair {
  id: string | number;
  /** open re-match request in the programme store, if any */
  rematchId?: string;
  mentee: string;
  menteeVenture: string;
  mentor: string;
  expertise: string;
  stage: string;
  matchScore: number;
  status: "Active" | "Pending" | "Completed" | "Terminated";
  sessions: number;
  lastSession: string;
  reMatchReq: boolean;
  /** project this pair belongs to */
  programId?: string;
}

export interface IncubationNotification {
  id: string;
  section: "Applications" | "Selection" | "Rejected" | "Matching" | "Dropouts" | "General";
  title: string;
  message: string;
  candidateName?: string;
  candidateId?: string;
  timestamp: string;
  createdAt: number;
  read: boolean;
  type: "success" | "warning" | "danger" | "info";
  actionTarget?: NavKey;
  /** project the notification is about (unset = general) */
  programId?: string;
}

// ── Application data context ──────────────────────────────────────────────────
const AppDataCtx = createContext<{
  entApps: EntrepreneurApplication[];
  mntApps: MentorApplication[];
  setStatusOverride: (id: string, status: string, reason?: string) => void;
  confirmPairing: (
    entId: string,
    mentorId: string,
    mentorName: string,
    mentorExpertise: string,
    matchScore: number,
    entName: string,
    entSector: string
  ) => void;
  setActiveNav?: (key: NavKey) => void;
  matchPairs: MentorPair[];
  /** programme-wide pair count (not filtered by project) */
  totalPairs: number;
  /** relationship health per pair, computed from the shared programme store */
  pairHealth: PairHealthRow[];
  pairings?: Record<string, {
    partnerName: string;
    matchScore: number;
    matchingStage: string;
    introSession: string;
    approvalStatus: "Approved" | "Pending Approval" | "Re-match Requested";
  }>;
  reassignPartner: (app: EntrepreneurApplication | MentorApplication, isEnt: boolean) => void;
  notifications: IncubationNotification[];
  addNotification: (notif: Omit<IncubationNotification, "id" | "createdAt" | "read" | "timestamp"> & { timestamp?: string }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  /** which project the admin is looking at; every section filters its data with this */
  scope: ProjectScope;
}>({
  entApps: [],
  mntApps: [],
  setStatusOverride: () => {},
  confirmPairing: () => {},
  matchPairs: [],
  totalPairs: 0,
  pairHealth: [],
  pairings: {},
  reassignPartner: () => {},
  notifications: [],
  addNotification: () => {},
  markNotificationAsRead: () => {},
  markAllNotificationsAsRead: () => {},
  clearNotifications: () => {},
  removeNotification: () => {},
  scope: ALL_SCOPE,
});


// ── Sample data (MOCKUP — replace with backend data when ready) ───────────────
const MOCK_MNT_APPS_RAW: MentorApplication[] = [
  { id: "MNT-001", name: "Dr. Thoko Banda",       gender: "Male",   district: "Lilongwe",   phone: "+265 991 100 001", expertise: "Business Strategy",  date: "2026-01-06", status: "Approved",  score: 95, program: "Incubation", isMockup: true, email: "t.banda@univ.ac.mw", title: "Senior Business Advisor", employer: "Banda Strategy Partners" },
  { id: "MNT-002", name: "Mr. Chikumbe Phiri",    gender: "Male",   district: "Blantyre",   phone: "+265 888 200 002", expertise: "Finance & Accounts", date: "2026-01-07", status: "Matching",  score: 88, program: "Incubation", isMockup: true, email: "cphiri@fincorp.mw", title: "Chartered Accountant & CFO", employer: "Apex Financial Advisory", matchedMentee: "Tamara Kachingwe (Financial Services)", matchScore: 91, matchingStage: "Awaiting Confirmation", introSession: "Pending Mentor Acceptance", approvalStatus: "Pending Approval" },
  { id: "MNT-003", name: "Ms. Rejoice Mwale",     gender: "Female", district: "Mzuzu",      phone: "+265 993 300 003", expertise: "Agriculture",        date: "2026-01-09", status: "Selected",  score: 80, program: "Incubation", isMockup: true, email: "rmwale@agridev.org", title: "Agri-Tech Consultant", employer: "Malawi AgriDev Hub", selectionReason: "High expertise in Agri-Tech value chains and exemplary mentorship capability", selectedDate: "2026-01-16" },
  { id: "MNT-004", name: "Mr. Patrick Tembo",     gender: "Male",   district: "Zomba",      phone: "+265 881 400 004", expertise: "Technology",         date: "2026-01-10", status: "Pending",   score: 72, program: "Incubation", isMockup: true, email: "ptembo@techmw.com", title: "Software Architect", employer: "InnoTech Solutions" },
  { id: "MNT-005", name: "Mrs. Faith Nyirenda",   gender: "Female", district: "Kasungu",    phone: "+265 992 500 005", expertise: "Marketing",          date: "2026-01-11", status: "Approved",  score: 91, program: "Incubation", isMockup: true, email: "fnyirenda@brandplus.mw", title: "Chief Marketing Strategist", employer: "BrandPlus Malawi" },
  { id: "MNT-006", name: "Dr. Samuel Chirwa",     gender: "Male",   district: "Dedza",      phone: "+265 889 600 006", expertise: "Legal & Compliance", date: "2026-01-12", status: "Rejected",  score: 45, program: "Incubation", isMockup: true, email: "schirwa@lawchamber.mw", title: "Corporate Counsel", employer: "Chirwa & Co Advocates", rejectionReason: "Weekly availability below required 4 hours/month minimum threshold", rejectedDate: "2026-01-18", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "MNT-007", name: "Ms. Miriam Kamwana",    gender: "Female", district: "Lilongwe",   phone: "+265 994 700 007", expertise: "Social Enterprise",  date: "2026-01-13", status: "Matching",  score: 85, program: "Incubation", isMockup: true, email: "mkamwana@impactmw.org", title: "Executive Director", employer: "Social Enterprise Alliance", matchedMentee: "Alinafe Gondwe (Services)", matchScore: 89, matchingStage: "—", introSession: "Monday 2:00 PM" },
  { id: "MNT-008", name: "Mr. Joseph Mkandawire", gender: "Male",   district: "Nkhotakota", phone: "+265 882 800 008", expertise: "Manufacturing",      date: "2026-01-14", status: "Dropouts",  score: 60, program: "Incubation", isMockup: true, email: "jmkandawire@mfg.mw", title: "Operations Director", employer: "Lakeside Industrial" },
  { id: "MNT-009", name: "Mrs. Grace Gondwe",     gender: "Female", district: "Salima",     phone: "+265 995 900 009", expertise: "Export & Trade",     date: "2026-01-15", status: "Selected",  score: 78, program: "Incubation", isMockup: true, email: "ggondwe@exportmw.com", title: "Trade Specialist", employer: "Malawi Export Bureau", selectionReason: "Regional cross-border trade leadership and proven business advisory experience", selectedDate: "2026-01-20" },
  { id: "MNT-010", name: "Mr. Charles Nkosi",     gender: "Male",   district: "Mulanje",    phone: "+265 883 010 010", expertise: "Business Strategy",  date: "2026-01-16", status: "Approved",  score: 93, program: "Incubation", isMockup: true, email: "cnkosi@nkosigroup.mw", title: "Managing Partner", employer: "Nkosi Group" },
  { id: "MNT-011", name: "Ms. Chimwemwe Banda",   gender: "Female", district: "Lilongwe",   phone: "+265 997 110 011", expertise: "Digital Marketing",  date: "2026-02-03", status: "Pending",   score: 74, program: "Incubation", isMockup: true, email: "cbanda@digitalscope.mw", title: "Growth Marketing Lead", employer: "DigitalScope" },
  { id: "MNT-012", name: "Dr. Felix Kaunda",      gender: "Male",   district: "Blantyre",   phone: "+265 885 220 012", expertise: "Investment & VC",    date: "2026-02-10", status: "Approved",  score: 97, program: "Incubation", isMockup: true, email: "fkaunda@seedfund.mw", title: "Principal Partner", employer: "SeedFund Capital" },
  { id: "MNT-013", name: "Ellen Chimwaza",        gender: "Female", district: "Blantyre",   phone: "+265 887 330 013", expertise: "General Management", date: "2026-02-04", status: "Rejected",  score: 47, program: "Incubation", isMockup: true, email: "echimwaza@mwmg.org", title: "Operations Supervisor", employer: "Southern Logistics", rejectionReason: "Mentorship track record and executive governance documentation incomplete", rejectedDate: "2026-02-14", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "MNT-014", name: "Andrew Mkuzi",          gender: "Male",   district: "Lilongwe",   phone: "+265 998 440 014", expertise: "Energy & Environment",date: "2026-02-06", status: "Rejected", score: 41, program: "Incubation", isMockup: true, email: "amkuzi@solarmw.com", title: "Renewables Engineer", employer: "EcoPower Malawi", rejectionReason: "Institutional conflict of interest with participating agribusiness incubatee", rejectedDate: "2026-02-16", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Remediation Required" },
  { id: "MNT-015", name: "Grace Manda",           gender: "Female", district: "Mzuzu",      phone: "+265 884 550 015", expertise: "Agri-Business",       date: "2026-02-09", status: "Matching",  score: 89, program: "Incubation", isMockup: true, email: "gmanda@agrilink.mw", title: "Commercial Agribusiness Director", employer: "Northern Agrilink", matchedMentee: "Dalitso Mvula (Agri-Business)", matchScore: 95, matchingStage: "Pairing Confirmed", introSession: "Wednesday 11:00 AM" },
  { id: "MNT-016", name: "Frank Kalua",           gender: "Male",   district: "Zomba",      phone: "+265 993 660 016", expertise: "Creative Arts",       date: "2026-02-12", status: "Matching",  score: 82, program: "Incubation", isMockup: true, email: "fkalua@creativemedia.mw", title: "Creative Director", employer: "Zomba Media Lab", matchedMentee: "Enelesi Phiri (Creative Arts)", matchScore: 86, matchingStage: "Pairing Confirmed", introSession: "Thursday 3:00 PM" },
];

const MOCK_ENT_APPS_RAW: EntrepreneurApplication[] = [
  { id: "APP-001", name: "Chisomo Banda",       gender: "Male",   district: "Lilongwe",   phone: "+265 991 234 567", sector: "Agri-Business",          date: "2026-01-08", status: "Matching",   score: 82, program: "Incubation", isMockup: true, businessName: "Banda Agri-Hub", stage: "Growth", email: "chisomo.banda@gmail.com" },
  { id: "APP-002", name: "Grace Phiri",         gender: "Female", district: "Blantyre",   phone: "+265 888 345 678", sector: "Technology",             date: "2026-01-09", status: "Approved",  score: 91, program: "Incubation", isMockup: true, businessName: "TechHub Malawi", stage: "Early Traction", email: "grace.phiri@outlook.com" },
  { id: "APP-003", name: "Takondwa Mwale",      gender: "Male",   district: "Mzuzu",      phone: "+265 993 456 789", sector: "Manufacturing",          date: "2026-01-10", status: "Selected",  score: 76, program: "Incubation", isMockup: true, businessName: "Mwale Processing", stage: "Idea Stage", email: "takondwa.mwale@gmail.com", selectionReason: "High manufacturing feasibility and robust local import-substitution value proposition", selectedDate: "2026-01-18" },
  { id: "APP-004", name: "Kondwani Tembo",      gender: "Male",   district: "Zomba",      phone: "+265 881 567 890", sector: "Trade",                  date: "2026-01-11", status: "Rejected",  score: 48, program: "Incubation", isMockup: true, businessName: "Tembo General Supplies", stage: "Idea Stage", email: "kondwani.tembo@yahoo.com", rejectionReason: "Evaluation score below 50-point cutoff threshold", rejectedDate: "2026-01-18", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "APP-005", name: "Lusungu Nyirenda",    gender: "Female", district: "Kasungu",    phone: "+265 992 678 901", sector: "Services",               date: "2026-01-12", status: "Matching",  score: 87, program: "Incubation", isMockup: true, businessName: "Nyirenda Logistics", stage: "MVP / Prototype", email: "lusungu.nyirenda@gmail.com", matchedMentor: "Mrs. Faith Nyirenda (Marketing)", matchScore: 94, matchingStage: "Pairing Confirmed", introSession: "Friday 10:00 AM" },
  { id: "APP-006", name: "Thandiwe Chirwa",     gender: "Female", district: "Lilongwe",   phone: "+265 889 789 012", sector: "Agri-Business",          date: "2026-01-13", status: "Pending",   score: 71, program: "Incubation", isMockup: true, businessName: "Chirwa Poultry Farm", stage: "Idea Stage", email: "thandiwe.chirwa@gmail.com" },
  { id: "APP-007", name: "Blessings Kamwana",   gender: "Male",   district: "Blantyre",   phone: "+265 994 890 123", sector: "Technology",             date: "2026-01-14", status: "Approved",  score: 88, program: "Incubation", isMockup: true, businessName: "CloudSolv Malawi", stage: "Early Traction", email: "bkamwana@cloudsolv.mw" },
  { id: "APP-008", name: "Esther Chikaonda",    gender: "Female", district: "Mzuzu",      phone: "+265 882 901 234", sector: "Creative Arts",          date: "2026-01-15", status: "Dropouts",  score: 62, program: "Incubation", isMockup: true, businessName: "Chikaonda Textiles", stage: "Idea Stage", email: "esther.chikaonda@gmail.com" },
  { id: "APP-009", name: "Moses Mkandawire",    gender: "Male",   district: "Dedza",      phone: "+265 995 012 345", sector: "Trade",                  date: "2026-01-16", status: "Selected",  score: 79, program: "Incubation", isMockup: true, businessName: "Dedza Agri-Trading", stage: "Growth", email: "moses.mkandawire@gmail.com", selectionReason: "Demonstrated local trade traction and strong job creation potential in Dedza", selectedDate: "2026-01-22" },
  { id: "APP-010", name: "Alinafe Gondwe",      gender: "Female", district: "Salima",     phone: "+265 883 123 456", sector: "Services",               date: "2026-01-17", status: "Matching",  score: 84, program: "Incubation", isMockup: true, businessName: "Lakeside Hospitality Solutions", stage: "Early Traction", email: "alinafe.gondwe@gmail.com", matchedMentor: "Ms. Miriam Kamwana (Social Enterprise)", matchScore: 89, matchingStage: "—", introSession: "Monday 2:00 PM" },
  { id: "APP-011", name: "Innocent Phiri",      gender: "Male",   district: "Nkhotakota", phone: "+265 996 234 567", sector: "Agri-Business",          date: "2026-01-18", status: "Pending",   score: 68, program: "Incubation", isMockup: true, businessName: "RicePro Malawi", stage: "Idea Stage", email: "innocent.phiri@gmail.com" },
  { id: "APP-012", name: "Vitumbiko Nkosi",     gender: "Male",   district: "Mulanje",    phone: "+265 884 345 678", sector: "Manufacturing",          date: "2026-01-19", status: "Approved",  score: 93, program: "Incubation", isMockup: true, businessName: "TeaCraft Agro", stage: "Growth", email: "vitumbiko.nkosi@gmail.com" },
  { id: "APP-013", name: "Patricia Nnensa",     gender: "Female", district: "Chiradzulu", phone: "+265 997 456 789", sector: "Health & Wellbeing",     date: "2026-02-02", status: "Pending",   score: 70, program: "Incubation", isMockup: true, businessName: "CarePlus Wellness", stage: "Idea Stage", email: "patricia.nnensa@gmail.com" },
  { id: "APP-014", name: "Daniel Chizala",      gender: "Male",   district: "Lilongwe",   phone: "+265 885 567 890", sector: "Energy & Environment",   date: "2026-02-05", status: "Approved",  score: 89, program: "Incubation", isMockup: true, businessName: "EcoBreeze Energy", stage: "Early Traction", email: "daniel.chizala@gmail.com" },
  { id: "APP-015", name: "Tamara Kachingwe",    gender: "Female", district: "Blantyre",   phone: "+265 992 678 012", sector: "Financial Services",     date: "2026-02-08", status: "Matching",  score: 77, program: "Incubation", isMockup: true, businessName: "FinLit Mobile", stage: "MVP / Prototype", email: "tamara.kachingwe@gmail.com", matchedMentor: "Mr. Chikumbe Phiri (Finance & Accounts)", matchScore: 91, matchingStage: "Awaiting Confirmation", introSession: "Pending Mentor Acceptance", approvalStatus: "Pending Approval" },
  { id: "APP-016", name: "Wisdom Chilambe",     gender: "Male",   district: "Mzuzu",      phone: "+265 883 789 123", sector: "Education & Training",   date: "2026-02-11", status: "Rejected",  score: 42, program: "Incubation", isMockup: true, businessName: "SkillBridge Edu", stage: "Idea Stage", email: "wisdom.chilambe@gmail.com", rejectionReason: "Early concept stage lacking proof-of-concept and market validation", rejectedDate: "2026-02-16", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "APP-017", name: "Olivia Gondwe",       gender: "Female", district: "Zomba",      phone: "+265 998 890 234", sector: "Tourism & Hospitality",  date: "2026-02-14", status: "Selected",  score: 81, program: "Incubation", isMockup: true, businessName: "Zomba Plateau Eco-Tours", stage: "Early Traction", email: "olivia.gondwe@gmail.com", selectionReason: "Sustainable eco-tourism business model with clear community socio-economic impact", selectedDate: "2026-02-19" },
  { id: "APP-018", name: "Elliot Phiri",        gender: "Male",   district: "Kasungu",    phone: "+265 886 901 345", sector: "Agri-Business",          date: "2026-02-17", status: "Pending",   score: 65, program: "Incubation", isMockup: true, businessName: "Kasungu Seedlings", stage: "Idea Stage", email: "elliot.phiri@gmail.com" },
  { id: "APP-019", name: "Mphatso Kazembe",     gender: "Female", district: "Lilongwe",   phone: "+265 995 789 012", sector: "Agri-Business",          date: "2026-02-18", status: "Rejected",  score: 46, program: "Incubation", isMockup: true, businessName: "Kazembe Agro Processors", stage: "Idea Stage", email: "mphatso.kazembe@gmail.com", rejectionReason: "Incomplete financial model canvas and market traction data", rejectedDate: "2026-02-22", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "APP-020", name: "Yamikani Banda",      gender: "Male",   district: "Blantyre",   phone: "+265 882 123 789", sector: "Manufacturing",          date: "2026-02-20", status: "Rejected",  score: 38, program: "Incubation", isMockup: true, businessName: "Banda Brickworks", stage: "Idea Stage", email: "yamikani.banda@gmail.com", rejectionReason: "Did not meet core incubation eligibility requirements (<40 score)", rejectedDate: "2026-02-24", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Remediation Required" },
  { id: "APP-021", name: "Chisomo Matenje",     gender: "Female", district: "Kasungu",    phone: "+265 994 456 012", sector: "Technology",             date: "2026-02-22", status: "Rejected",  score: 47, program: "Incubation", isMockup: true, businessName: "Kasungu Mobile Tech", stage: "Idea Stage", email: "cmatenje@techmw.com", rejectionReason: "Working prototype unavailable during technical evaluation session", rejectedDate: "2026-02-26", feedbackStatus: "Formal Notice Dispatched", reapplyEligible: "Eligible for Next Cohort" },
  { id: "APP-022", name: "Dalitso Mvula",       gender: "Male",   district: "Lilongwe",   phone: "+265 888 654 321", sector: "Agri-Business",          date: "2026-02-23", status: "Matching",  score: 86, program: "Incubation", isMockup: true, businessName: "GreenSprout Hydroponics", stage: "MVP / Prototype", email: "dalitso.mvula@greensprout.mw", matchedMentor: "Ms. Rejoice Mwale (Agriculture)", matchScore: 95, matchingStage: "Pairing Confirmed", introSession: "Wednesday 11:00 AM" },
  { id: "APP-023", name: "Brian Kumwenda",      gender: "Male",   district: "Mzuzu",      phone: "+265 991 765 432", sector: "Technology",             date: "2026-02-25", status: "Matching",  score: 82, program: "Incubation", isMockup: true, businessName: "Mzuzu Coders Hub", stage: "MVP / Prototype", email: "bkumwenda@codershub.mw", matchedMentor: "Mr. Patrick Tembo (Technology)", matchScore: 88, matchingStage: "Pairing Proposed", introSession: "Reviewing Profile" },
  { id: "APP-024", name: "Enelesi Phiri",       gender: "Female", district: "Zomba",      phone: "+265 884 876 543", sector: "Creative Arts",          date: "2026-02-26", status: "Matching",  score: 80, program: "Incubation", isMockup: true, businessName: "Zomba Weavers Co-op", stage: "Early Traction", email: "enelesi.phiri@gmail.com", matchedMentor: "Mr. Charles Nkosi (Business Strategy)", matchScore: 86, matchingStage: "Pairing Confirmed", introSession: "Thursday 3:00 PM" },
];

// Sample records are spread over the two seeded projects so each project shows its own data.
// Pairs stay together: a mentor sits in the same project as the mentee they are matched with.
const SHE_ENT_IDS = new Set(["APP-005", "APP-006", "APP-008", "APP-010", "APP-015", "APP-019", "APP-021", "APP-024"]);
const SHE_MNT_IDS = new Set(["MNT-002", "MNT-005", "MNT-007", "MNT-010", "MNT-011", "MNT-013", "MNT-016"]);
export const MOCK_ENT_APPS: EntrepreneurApplication[] = MOCK_ENT_APPS_RAW.map(a => ({ ...a, programId: SHE_ENT_IDS.has(a.id) ? SAMPLE_SHE : SAMPLE_CORE }));
export const MOCK_MNT_APPS: MentorApplication[] = MOCK_MNT_APPS_RAW.map(a => ({ ...a, programId: SHE_MNT_IDS.has(a.id) ? SAMPLE_SHE : SAMPLE_CORE }));

const EMAILS = [
  { id: 1, programId: SAMPLE_CORE, subject: "Welcome to ARISE Youth Incubation Programme", recipients: 98,  opened: 74, clicked: 42, sent: "2026-01-05", status: "Delivered" },
  { id: 2, programId: SAMPLE_CORE, subject: "Application Shortlist Notification — Round 1",  recipients: 52,  opened: 49, clicked: 31, sent: "2026-01-12", status: "Delivered" },
  { id: 3, programId: SAMPLE_SHE, subject: "Mentor Matching Update: Your Mentor is Ready",   recipients: 31,  opened: 28, clicked: 19, sent: "2026-01-20", status: "Delivered" },
  { id: 4, programId: SAMPLE_CORE, subject: "Monthly Progress Check-In — February 2026",      recipients: 98,  opened: 61, clicked: 29, sent: "2026-02-01", status: "Delivered" },
  { id: 5, programId: SAMPLE_SHE, subject: "Incubation Bootcamp Reminder — March 2026",       recipients: 142, opened: 0,  clicked: 0,  sent: "2026-03-01", status: "Scheduled"},
];

const ALUMNI = [
  { programId: SAMPLE_SHE, name: "Grace Phiri",       cohort: "2024", business: "FarmFresh Malawi",       sector: "Agri-Business", revenue: "MK 4.2M", district: "Blantyre",  award: true  },
  { programId: SAMPLE_CORE, name: "Blessings Kamwana", cohort: "2024", business: "TechHub Malawi",          sector: "Technology",    revenue: "MK 6.8M", district: "Blantyre",  award: false },
  { programId: SAMPLE_CORE, name: "Vitumbiko Nkosi",   cohort: "2023", business: "NkosiCraft Industries",   sector: "Manufacturing", revenue: "MK 3.1M", district: "Mulanje",   award: true  },
  { programId: SAMPLE_SHE, name: "Alinafe Gondwe",    cohort: "2023", business: "Gondwe Services Ltd",     sector: "Services",      revenue: "MK 2.4M", district: "Salima",    award: false },
  { programId: SAMPLE_CORE, name: "Innocent Phiri",    cohort: "2022", business: "GreenFields Agri Co.",    sector: "Agri-Business", revenue: "MK 5.0M", district: "Nkhotakota",award: false },
  { programId: SAMPLE_CORE, name: "Chisomo Banda",     cohort: "2022", business: "Banda Creative Studio",   sector: "Creative Arts", revenue: "MK 1.8M", district: "Lilongwe",  award: true  },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Pending:   { bg: "rgba(76,128,138,0.15)",  color: "#4C808A" },
  pending:   { bg: "rgba(76,128,138,0.15)",  color: "#4C808A" },
  Selected:  { bg: "rgba(59,130,246,0.15)",  color: "#2563eb" },
  Approved:  { bg: "rgba(16,185,129,0.15)",  color: "#059669" },
  "Pending Approval": { bg: "rgba(245,158,11,0.15)", color: "#d97706" },
  "Re-match Requested": { bg: "rgba(239,68,68,0.15)", color: "#dc2626" },
  Matching:  { bg: "rgba(139,92,246,0.15)",  color: "#7c3aed" },
  Rejected:  { bg: "rgba(239,68,68,0.15)",   color: "#dc2626" },
  Dropped:   { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  Dropouts:  { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  Delivered: { bg: "rgba(16,185,129,0.15)",  color: "#059669" },
  Scheduled: { bg: "rgba(245,158,11,0.15)",  color: "#d97706" },
};

const INITIAL_NOTIFICATIONS: IncubationNotification[] = [
  {
    id: "notif-1",
    section: "Selection",
    title: "Candidate Selected",
    message: "Tamara Kachingwe (APP-015) was selected by the evaluation committee for Incubation Stage 2.",
    candidateName: "Tamara Kachingwe",
    candidateId: "APP-015",
    programId: SAMPLE_SHE,
    timestamp: "12m ago",
    createdAt: Date.now() - 12 * 60 * 1000,
    read: false,
    type: "success",
    actionTarget: "Selection",
  },
  {
    id: "notif-2",
    section: "Matching",
    title: "Mentor Match Confirmed",
    message: "Pair match confirmed: Dalitso Mvula paired with Ms. Rejoice Mwale (95% compatibility).",
    candidateName: "Dalitso Mvula",
    candidateId: "APP-022",
    programId: SAMPLE_CORE,
    timestamp: "45m ago",
    createdAt: Date.now() - 45 * 60 * 1000,
    read: false,
    type: "success",
    actionTarget: "Matching",
  },
  {
    id: "notif-3",
    section: "Matching",
    title: "Partner Re-assignment Requested",
    message: "Grace Kamwendo partner re-assigned: Status changed to Pending Approval. Re-match request created in Pairing and Matching.",
    candidateName: "Grace Kamwendo",
    candidateId: "APP-020",
    programId: SAMPLE_CORE,
    timestamp: "2h ago",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    read: false,
    type: "warning",
    actionTarget: "Pairing & Matching",
  },
  {
    id: "notif-4",
    section: "Rejected",
    title: "Application Disqualified",
    message: "Enelesi Phiri (APP-024) disqualified by evaluation committee. Notice sent to applicant.",
    candidateName: "Enelesi Phiri",
    candidateId: "APP-024",
    programId: SAMPLE_SHE,
    timestamp: "4h ago",
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    read: true,
    type: "danger",
    actionTarget: "Rejected",
  },
  {
    id: "notif-5",
    section: "Dropouts",
    title: "Candidate Dropout Recorded",
    message: "Esther Chikaonda (APP-008) recorded as Dropout due to relocation outside pilot district.",
    candidateName: "Esther Chikaonda",
    candidateId: "APP-008",
    programId: SAMPLE_SHE,
    timestamp: "Yesterday",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    type: "warning",
    actionTarget: "Dropouts",
  },
  {
    id: "notif-6",
    section: "Applications",
    title: "New Application Received",
    message: "Lusungu Nyirenda (APP-005) submitted new Incubation application for Nyirenda Logistics.",
    candidateName: "Lusungu Nyirenda",
    candidateId: "APP-005",
    programId: SAMPLE_SHE,
    timestamp: "1d ago",
    createdAt: Date.now() - 28 * 60 * 60 * 1000,
    read: true,
    type: "info",
    actionTarget: "Applications",
  },
];

// ── Notification bell dropdown ──────────────────────────────────────────────
function NotificationBellDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onRemove,
  onNavigate,
}: {
  notifications: IncubationNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onRemove: (id: string) => void;
  onNavigate: (target: NavKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center relative transition-all hover:brightness-125 cursor-pointer"
        style={{ background: "transparent" }}
        title={`Incubation Activity Notifications (${unreadCount} unread)`}
      >
        <Bell size={13} color="#fff" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 px-1 min-w-[17px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md animate-pulse"
            style={{ background: "#e85454", border: "1.5px solid #3B4167" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl overflow-hidden z-50 im-dd shadow-2xl bg-white text-gray-800"
          style={{ border: "1px solid #e5e7eb", boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 text-white flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #2a3054 0%, #3B4167 60%, #4C808A 100%)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center">
                <Bell size={12} color="#4C808A" />
              </div>
              <div>
                <h4 className="font-bold text-xs leading-none">Notifications Tracker</h4>
                <p className="text-[10px] text-white/80 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All actions up to date"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={() => onMarkAllRead()}
                  className="px-2 py-1 rounded bg-white hover:bg-gray-100 text-[10px] font-bold text-[#4C808A] shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={11} color="#4C808A" /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => onClearAll()}
                  className="w-6 h-6 rounded-md bg-white hover:bg-gray-100 shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                  title="Clear all notifications"
                >
                  <Trash2 size={12} color="#4C808A" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Inbox size={26} className="mx-auto mb-2 opacity-40 text-gray-400" />
                <p className="text-xs font-bold text-gray-600">No notifications</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] mx-auto">
                  Notification actions taken across Applications, Selection, Rejected, Matching & Dropouts are tracked here.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) onMarkRead(notif.id);
                      if (notif.actionTarget) {
                        onNavigate(notif.actionTarget);
                        setOpen(false);
                      }
                    }}
                    className={`p-3 transition-colors cursor-pointer relative group ${
                      !notif.read ? "bg-teal-50/40 hover:bg-teal-50/70" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400 font-medium">{notif.timestamp}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-white hover:bg-gray-100 border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center justify-center"
                        title="Dismiss"
                      >
                        <X size={10} color="#4C808A" />
                      </button>
                    </div>

                    <h5 className={`text-xs font-bold mt-1 leading-snug ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                      {notif.title}
                    </h5>

                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.actionTarget && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#4C808A]">
                        <span>View in {notif.actionTarget}</span>
                        <ChevronRight size={10} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3.5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
            <span>Tracking active across 5 sections</span>
            <span className="font-semibold text-[#4C808A]">Click to navigate</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile dropdown ──────────────────────────────────────────────────────────

// ── "No data for this project" notice ────────────────────────────────────────
function ProjectEmptyNotice({ scope, what }: { scope: ProjectScope; what: string }) {
  return (
    <div className="rounded-md px-6 py-10 flex flex-col items-center text-center gap-2"
      style={{ background: "#fff", border: "1px dashed #d1d5db" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${TEAL}15` }}>
        <Folder size={18} color={TEAL} />
      </div>
      <div className="font-black text-sm" style={{ color: NAVY }}>
        No {what} yet{scope.project ? ` for ${scope.project.name}` : ""}
      </div>
      <div className="text-[11px] max-w-sm" style={{ color: "#6b7280" }}>
        {scope.project
          ? "This project has no records here so far. Data appears as soon as applicants apply to it, or switch to another project from All Projects in the top bar."
          : "Nothing has been recorded here yet."}
      </div>
    </div>
  );
}

// ── Navbar project switcher ("All Projects ▾") ───────────────────────────────
function ProjectSwitcher({ programs, selectedId, counts, onSelect, allLabel = "All Projects" }: {
  allLabel?: string;
  programs: AdminProgram[];
  selectedId: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const { current, completed } = splitProjects(programs);
  const needle = q.trim().toLowerCase();
  const hit = (p: AdminProgram) => !needle || p.name.toLowerCase().includes(needle);
  const cur = current.filter(hit);
  const done = completed.filter(hit);
  const total = current.length + completed.length;
  const selected = programs.find(p => p.id === selectedId && p.published);

  const pick = (id: string) => { onSelect(id); setOpen(false); setQ(""); };

  const Row = ({ id, name, sub, dot, active, count }: { id: string; name: string; sub?: string; dot?: string; active: boolean; count?: number }) => (
    <button onClick={() => pick(id)} role="option" aria-selected={active}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
      style={{ background: active ? `${TEAL}14` : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? `${TEAL}14` : "transparent"; }}>
      <span className="flex-1 min-w-0">
        <span className="block text-[12px] font-bold truncate" style={{ color: NAVY }}>{name}</span>
        {sub && <span className="block text-[10px] truncate" style={{ color: "#6b7280" }}>{sub}</span>}
      </span>
      {active && <Check size={13} color={TEAL} className="shrink-0" />}
    </button>
  );

  const Group = ({ title, items }: { title: string; items: AdminProgram[] }) => (
    <div>
      <div className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest" style={{ color: "#9ca3af" }}>
        {title}
      </div>
      {items.length === 0
        ? <div className="px-3 py-2 text-[11px]" style={{ color: "#9ca3af" }}>{needle ? "No match" : "None yet"}</div>
        : items.map(p => (
            <Row key={p.id} id={p.id} name={p.name || "Untitled project"}
              dot={PROG_STATUS_COLORS[p.status] ?? "#6b7280"} active={selectedId === p.id} />
          ))}
    </div>
  );

  return (
    <div ref={ref} className="relative z-10 min-w-0">
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-white transition-all max-w-[190px] sm:max-w-[280px]"
        style={{ background: TEAL, border: "1px solid rgba(255,255,255,0.35)", filter: open ? "brightness(0.92)" : "none" }}>
        <Folder size={13} color="#fff" className="shrink-0" />
        <span className="text-[11px] font-bold truncate">{selected ? selected.name : allLabel}</span>
        {selected && isCompletedProject(selected) && (
          <span className="hidden sm:inline text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "rgba(255,255,255,0.22)" }}>Completed</span>
        )}
        <ChevronDown size={13} color="#fff" className="shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div className="im-dd absolute left-0 mt-2 rounded-md overflow-hidden"
          style={{ width: 320, maxWidth: "calc(100vw - 32px)", background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 12px 32px rgba(0,0,0,0.22)", zIndex: 60 }}>
          {total > 6 && (
            <div className="p-2" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: "#f3f4f6" }}>
                <Search size={11} color="#6b7280" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Find a project\u2026"
                  className="bg-transparent text-[11px] w-full focus:outline-none" style={{ color: "#111827" }} />
              </div>
            </div>
          )}
          <div role="listbox" className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {!needle && (
              <Row id={ALL_PROJECTS} name={allLabel} active={selectedId === ALL_PROJECTS || !selected} dot={TEAL} />
            )}
            <Group title="Current projects" items={cur} />
            <div style={{ borderTop: "1px solid #f3f4f6" }}><Group title="Completed projects" items={done} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({ name = "Programme Manager", title = "Program Manager" }: { name?: string; title?: string }) {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all hover:brightness-110"
        style={{ background: "transparent" }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${NAVY}, ${TEAL})` }}>
          <svg viewBox="0 0 28 28" width="20" height="20" fill="none">
            <circle cx="14" cy="10" r="4.5" fill="rgba(255,255,255,0.9)" />
            <ellipse cx="14" cy="23" rx="8.5" ry="5" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>
        <span className="text-white text-[11px] font-bold hidden sm:block">{name}</span>
        <ChevronDown size={11} color="rgba(255,255,255,0.6)" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-md overflow-hidden z-50 im-dd"
          style={{ background: "#4C808A", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.18)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: NAVY, border: "1px solid rgba(255,255,255,0.25)" }}>
              <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
                <circle cx="14" cy="10" r="4.5" fill="rgba(255,255,255,0.95)" />
                <ellipse cx="14" cy="23" rx="8.5" ry="5" fill="rgba(255,255,255,0.95)" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate">{name}</div>
              <div className="text-[10px] truncate text-white/80 font-medium">{title}</div>
            </div>
          </div>
          <div className="py-1.5">
            {[{ icon: User, label: "My Profile" }, { icon: Settings, label: "Settings" }].map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold transition-all text-left"
                style={{ color: "#ffffff" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(27,54,93,0.35)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: NAVY }}>
                  <Icon size={11} color="#ffffff" />
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function NavItem({
  icon: Icon, label, active, onClick, indent = false, count, extra,
}: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void; indent?: boolean; count?: number; extra?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full text-left transition-all rounded-md px-3 py-2.5 group"
      style={{
        paddingLeft: indent ? 36 : 12,
        background: active ? "rgba(255,255,255,0.14)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.65)",
        fontWeight: active ? 700 : 500,
        fontSize: indent ? 11 : 12,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={indent ? 12 : 14} color={active ? "#fff" : "rgba(255,255,255,0.55)"} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)", color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
          {count}
        </span>
      )}
      {extra}
      {active && !indent && <div className="w-1 h-4 rounded-md shrink-0" style={{ background: "#fff" }} />}
    </button>
  );
}

// ── Dashboard data ────────────────────────────────────────────────────────────
const ENT_DISTRICT_DATA = [
  { district: "Lilongwe", male: 38, female: 34, total: 72 },
  { district: "Blantyre", male: 32, female: 28, total: 60 },
  { district: "Mzuzu",    male: 24, female: 20, total: 44 },
  { district: "Zomba",    male: 18, female: 16, total: 34 },
  { district: "Kasungu",  male: 14, female: 12, total: 26 },
  { district: "Dedza",    male: 12, female: 10, total: 22 },
  { district: "Salima",   male: 10, female: 8,  total: 18 },
  { district: "Nkhotakota", male: 8, female: 6, total: 14 },
  { district: "Mulanje",  male: 7,  female: 5,  total: 12 },
  { district: "Chiradzulu", male: 6, female: 4, total: 10 },
  { district: "Mangochi", male: 5,  female: 4,  total: 9  },
];
const ENT_GENDER  = { male: 138, female: 120 };
const ENT_TARGETS = { applications: 180, approval: 120, incubation: 90 };

const MNT_DISTRICT_DATA = [
  { district: "Lilongwe", male: 22, female: 18, total: 40 },
  { district: "Blantyre", male: 18, female: 14, total: 32 },
  { district: "Mzuzu",    male: 14, female: 10, total: 24 },
  { district: "Zomba",    male: 10, female: 8,  total: 18 },
  { district: "Kasungu",  male: 8,  female: 6,  total: 14 },
  { district: "Dedza",    male: 7,  female: 5,  total: 12 },
  { district: "Salima",   male: 6,  female: 4,  total: 10 },
  { district: "Nkhotakota", male: 5, female: 4, total: 9  },
  { district: "Mulanje",  male: 4,  female: 3,  total: 7  },
];
const MNT_GENDER  = { male: 72, female: 56 };
const MNT_TARGETS = { applications: 120, approval: 80, incubation: 55 };

// ── Custom SVG bar chart with horizontal scroll & sticky Y-axis ───────────────
function CustomBarChart({
  data, onFilter, activeDistrict,
}: {
  data: { district: string; male: number; female: number; total: number }[];
  onFilter?: (d: string | null) => void;
  activeDistrict?: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const BAR_W = 14, BAR_GAP = 3, GROUP_GAP = 18;
  const CHART_H = 112, PAD_T = 6, PAD_B = 22;
  const Y_AXIS_W = 26;
  const SERIES: { key: "male" | "female" | "total"; color: string }[] = [
    { key: "male",   color: GENDER_MALE },
    { key: "female", color: GENDER_FEMALE },
    { key: "total",  color: BAR_TOTAL },
  ];
  const groupW = 3 * BAR_W + 2 * BAR_GAP;
  const totalW = data.length * (groupW + GROUP_GAP) + 16;
  const svgH   = CHART_H + PAD_T + PAD_B;
  const maxVal = data.length > 0 ? Math.max(1, ...data.flatMap(d => [d.male, d.female, d.total])) : 5;
  const yMax   = Math.max(5, maxVal <= 10 ? Math.ceil(maxVal) + 1 : Math.ceil(maxVal / 10) * 10);
  const toBarH = (v: number) => (v / yMax) * CHART_H;
  const toY    = (v: number) => PAD_T + CHART_H - toBarH(v);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax));

  const handleScroll = (delta: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", flex: 1, minWidth: 0 }}>
      {/* Scroll controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginBottom: 2, padding: "0 2px" }}>
        <button
          type="button"
          onClick={() => handleScroll(-120)}
          title="Scroll left"
          style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "1px solid #d1d5db", background: "#f9fafb",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: NAVY, padding: 0,
          }}>
          <ChevronLeft size={10} />
        </button>
        <button
          type="button"
          onClick={() => handleScroll(120)}
          title="Scroll right"
          style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "1px solid #d1d5db", background: "#f9fafb",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: NAVY, padding: 0,
          }}>
          <ChevronRight size={10} />
        </button>
      </div>

      {/* Main chart row: Fixed Y-axis + Horizontally scrollable bars */}
      <div style={{ display: "flex", width: "100%", flex: 1, minWidth: 0, position: "relative" }}>
        {/* Fixed Y-Axis */}
        <div style={{ width: Y_AXIS_W, flexShrink: 0 }}>
          <svg width={Y_AXIS_W} height={svgH} style={{ display: "block" }}>
            {yTicks.map(v => {
              const y = toY(v);
              return (
                <g key={v}>
                  <text x={Y_AXIS_W - 5} y={y + 3} textAnchor="end" fontSize={7.5} fontWeight="600" fill="#9ca3af">{v}</text>
                  <line x1={Y_AXIS_W - 3} y1={y} x2={Y_AXIS_W} y2={y} stroke="#d1d5db" strokeWidth={1} />
                </g>
              );
            })}
            <line x1={Y_AXIS_W - 1} y1={PAD_T} x2={Y_AXIS_W - 1} y2={PAD_T + CHART_H} stroke="#d1d5db" strokeWidth={1} />
          </svg>
        </div>

        {/* Scrollable Bar Viewport */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "thin",
            scrollbarColor: `${TEAL} #f1f5f9`,
            WebkitOverflowScrolling: "touch",
            paddingBottom: 2,
          }}>
          <svg width={totalW} height={svgH} style={{ display: "block" }}>
            {yTicks.map(v => {
              const y = toY(v);
              return (
                <line key={v} x1={0} y1={y} x2={totalW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              );
            })}
            {data.map((d, gi) => {
              const gx  = 8 + gi * (groupW + GROUP_GAP);
              const dim = activeDistrict && activeDistrict !== d.district;
              return (
                <g key={d.district} style={{ cursor: onFilter ? "pointer" : "default" }}
                  onClick={() => onFilter?.(activeDistrict === d.district ? null : d.district)}>
                  {/* Hover highlight */}
                  <rect x={gx - 3} y={PAD_T} width={groupW + 6} height={CHART_H}
                    fill={activeDistrict === d.district ? "rgba(76,128,138,0.12)" : "transparent"} rx={3} />
                  {SERIES.map((s, si) => {
                    const x = gx + si * (BAR_W + BAR_GAP);
                    const h = toBarH(d[s.key]);
                    const y = toY(d[s.key]);
                    return (
                      <g key={s.key}>
                        <rect x={x} y={y} width={BAR_W} height={h} fill={s.color} rx={2} ry={2}
                          opacity={dim ? 0.3 : 1} />
                        {h > 14 && !dim && (
                          <text x={x + BAR_W / 2} y={y + h - 3} textAnchor="middle" fontSize={7.5} fontWeight="bold" fill={labelOn(s.color)}>
                            {d[s.key]}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <text x={gx + groupW / 2} y={svgH - 6} textAnchor="middle" fontSize={8}
                    fill={activeDistrict === d.district ? NAVY : "#4b5563"} fontWeight={activeDistrict === d.district ? 700 : 500}>
                    {d.district}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── SVG Donut — leader lines to outside values, size matching SectorPieChart ──
function DonutChart({ male, female, totalApps, onFilter }: { male: number; female: number; totalApps?: number; onFilter?: (g: string | null) => void }) {
  const total = male + female;
  const displayTotal = totalApps ?? total;

  if (total === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "10px 0" }}>
        <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={90} height={90} viewBox="0 0 90 90">
            <circle cx={45} cy={45} r={30} fill="none" stroke="#e5e7eb" strokeWidth={14} />
            <text x={45} y={45} textAnchor="middle" fontSize={15} fontWeight="900" fill={NAVY}>0</text>
            <text x={45} y={54} textAnchor="middle" fontSize={7} fontWeight="700" fill="#9ca3af">TOTAL</text>
          </svg>
        </div>
        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, marginTop: 4 }}>No data</div>
      </div>
    );
  }

  // Matching SectorPieChart: R = 64, IR = 26, stroke center r = 45, stroke width sw = 38
  const cx = 110, cy = 80, r = 45, sw = 38;
  const circ = 2 * Math.PI * r;
  const femPct = Math.round((female / total) * 100);
  const malPct = 100 - femPct;

  const toXY = (deg: number, radius: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const femSweepDeg = (female / total) * 360;
  const femMidDeg = femSweepDeg / 2;
  const malMidDeg = femSweepDeg + (360 - femSweepDeg) / 2;

  // Outer radius of donut slice is r + sw/2 = 45 + 19 = 64 (matches SectorPieChart R = 64)
  const outerR = r + sw / 2;
  const fStart = toXY(femMidDeg, outerR);
  const fElbow = toXY(femMidDeg, outerR + 9);
  const fEnd = { x: fElbow.x + 8, y: fElbow.y };

  const mStart = toXY(malMidDeg, outerR);
  const mElbow = toXY(malMidDeg, outerR + 9);
  const mEnd = { x: mElbow.x - 8, y: mElbow.y };

  const gap = female > 0 && male > 0 ? 2 : 0;
  const femLen = female > 0 ? (male > 0 ? circ * (female / total) - gap : circ) : 0;
  const malLen = male > 0 ? (female > 0 ? circ * (male / total) - gap : circ) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, width: "100%" }}>
        <svg width={192} height={140} viewBox="0 0 220 160" style={{ display: "block", flexShrink: 0, overflow: "visible", cursor: onFilter ? "pointer" : "default" }}>
          <defs>
            <linearGradient id="genderDonutGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={GENDER_MALE} />
              <stop offset="100%" stopColor={GENDER_FEMALE} />
            </linearGradient>
          </defs>

          {/* Female arc */}
          {female > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={GENDER_FEMALE} strokeWidth={sw}
              strokeDasharray={`${femLen} ${circ}`} strokeDashoffset={0}
              transform={`rotate(-90 ${cx} ${cy})`}
              onClick={() => onFilter?.("Female")} style={{ cursor: "pointer" }} />
          )}

          {/* Male arc */}
          {male > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={GENDER_MALE} strokeWidth={sw}
              strokeDasharray={`${malLen} ${circ}`} strokeDashoffset={-(femLen + gap)}
              transform={`rotate(-90 ${cx} ${cy})`}
              onClick={() => onFilter?.("Male")} style={{ cursor: "pointer" }} />
          )}

          {/* Female pointer line & outside values without badge */}
          {female > 0 && (
            <>
              <circle cx={fStart.x} cy={fStart.y} r={2} fill={GENDER_FEMALE} />
              <polyline
                points={`${fStart.x},${fStart.y} ${fElbow.x},${fElbow.y} ${fEnd.x},${fEnd.y}`}
                fill="none" stroke={GENDER_FEMALE} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
              <text x={fEnd.x + 3} y={fEnd.y - 2} textAnchor="start" fontSize={10.5} fontWeight="900" fill={GENDER_FEMALE}>{female}</text>
              <text x={fEnd.x + 3} y={fEnd.y + 8} textAnchor="start" fontSize={8} fontWeight="700" fill="#4b5563">{femPct}%</text>
            </>
          )}

          {/* Male pointer line & outside values without badge */}
          {male > 0 && (
            <>
              <circle cx={mStart.x} cy={mStart.y} r={2} fill={GENDER_MALE} />
              <polyline
                points={`${mStart.x},${mStart.y} ${mElbow.x},${mElbow.y} ${mEnd.x},${mEnd.y}`}
                fill="none" stroke={GENDER_MALE} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
              <text x={mEnd.x - 3} y={mEnd.y - 2} textAnchor="end" fontSize={10.5} fontWeight="900" fill={GENDER_MALE}>{male}</text>
              <text x={mEnd.x - 3} y={mEnd.y + 8} textAnchor="end" fontSize={8} fontWeight="700" fill="#4b5563">{malPct}%</text>
            </>
          )}

          {/* Center: gradient ring accent + realistic total figure */}
          <circle cx={cx} cy={cy} r={r - sw / 2 - 3} fill="none" stroke="url(#genderDonutGrad)" strokeWidth={1.5} opacity={0.35} />
          <text x={cx} y={cy} textAnchor="middle" fontSize={15} fontWeight="900" fill={NAVY} style={{ cursor: "pointer" }}
            onClick={() => onFilter?.(null)}>{displayTotal}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#9ca3af" letterSpacing="0.05em" style={{ cursor: "pointer" }}
            onClick={() => onFilter?.(null)}>TOTAL</text>
        </svg>
      </div>

      {/* Legend bottom center without badge styling */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        marginTop: 8,
        paddingTop: 4,
        paddingBottom: 2,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: onFilter ? "pointer" : "default" }}
          onClick={() => onFilter?.("Male")}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GENDER_MALE, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>Male</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: onFilter ? "pointer" : "default" }}
          onClick={() => onFilter?.("Female")}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GENDER_FEMALE, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>Female</span>
        </div>
      </div>
    </div>
  );
}

// ── Sector colours: use CHART_PALETTE in order ──

function SectorPieChart({ pool, isEnt, onFilter, activeFilter }: { pool: any[]; isEnt: boolean; onFilter?: (s: string | null) => void; activeFilter?: string | null }) {
  const categoryKey = isEnt ? "sector" : "expertise";
  const sectors = Array.from(new Set(pool.map((a: any) => a[categoryKey])));
  const total = pool.length;

  if (total === 0) return (
    <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 11, padding: 20 }}>No data</div>
  );

  const rows = sectors.map((sec, idx) => {
    const color = CHART_PALETTE[idx % CHART_PALETTE.length];
    return {
      sector: sec as string,
      count: pool.filter((a: any) => a[categoryKey] === sec).length,
      color,
    };
  });

  const R = 64, IR = 26, CX = 80, CY = 80;
  let angle = -Math.PI / 2;

  const slices = rows.map((row, idx) => {
    const sweep = (row.count / total) * 2 * Math.PI;
    const end   = angle + sweep;
    const x1 = CX + R * Math.cos(angle), y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end);
    const xi1 = CX + IR * Math.cos(angle), yi1 = CY + IR * Math.sin(angle);
    const xi2 = CX + IR * Math.cos(end),   yi2 = CY + IR * Math.sin(end);
    const mid  = angle + sweep / 2;
    const lx   = CX + (R * 0.68) * Math.cos(mid);
    const ly   = CY + (R * 0.68) * Math.sin(mid);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${IR} ${IR} 0 ${large} 0 ${xi1} ${yi1} Z`;
    angle = end;
    return { ...row, path, lx, ly, sweep, idx };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <svg width={140} height={140} viewBox="0 0 160 160" style={{ display: "block", flexShrink: 0 }}>
          {slices.map(slice => {
            const dimmed = !!activeFilter && activeFilter !== slice.sector;
            return (
              <g key={slice.sector} style={{ cursor: onFilter ? "pointer" : "default" }}
                onClick={() => onFilter?.(slice.sector)}>
                <path
                  d={slice.path}
                  fill={slice.color}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={dimmed ? 0.3 : 1}
                  style={{ transition: "opacity 0.2s" }}
                />
                {slice.sweep > 0.32 && (
                  <text x={slice.lx} y={slice.ly} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fontWeight="800" fill={labelOn(slice.color)} style={{ pointerEvents: "none" }}>
                    {slice.count}
                  </text>
                )}
              </g>
            );
          })}
          {/* Center number only */}
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize={16} fontWeight="900" fill={NAVY}>{total}</text>
        </svg>
      </div>

      {/* Legend bottom center - single scrollable row */}
      <div
        style={{
          display: "flex",
          maxWidth: "100%",
          width: "100%",
          overflowX: "auto",
          marginTop: 8,
          paddingTop: 4,
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, margin: "0 auto", paddingLeft: 4, paddingRight: 4, flexShrink: 0 }}>
          {rows.map(r => (
            <div
              key={r.sector}
              onClick={() => onFilter?.(r.sector)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: onFilter ? "pointer" : "default",
                opacity: activeFilter && activeFilter !== r.sector ? 0.4 : 1,
                transition: "opacity 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: r.color,
                flexShrink: 0
              }} />
              <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
                {r.sector}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



// ── Applications dashboard ────────────────────────────────────────────────────
function ApplicationsDashboard({ tab, filterStatus }: { tab: "entrepreneurs" | "mentors"; filterStatus?: string | null }) {
  const { entApps, mntApps, scope } = useContext(AppDataCtx);
  const isEnt     = tab === "entrepreneurs";
  const pool      = isEnt ? entApps : mntApps;
  // Targets follow the selected project's cohort size (the global defaults only apply to "All Projects")
  const basePlaces = Math.max(scope.project?.cohortSize ?? 0, 10);
  const targets   = !scope.project ? (isEnt ? ENT_TARGETS : MNT_TARGETS)
    : isEnt ? { applications: basePlaces * 2, approval: Math.ceil(basePlaces * 1.33), incubation: basePlaces }
            : { applications: Math.ceil(basePlaces * 0.9), approval: Math.ceil(basePlaces * 0.6), incubation: Math.ceil(basePlaces * 0.4) };

  const [sectorFilter,   setSectorFilter]   = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [genderFilter,   setGenderFilter]   = useState<string | null>(null);

  const isRejectedSection  = filterStatus === "Rejected";
  const isSelectionSection = filterStatus === "Selected";
  const isMatchingSection  = filterStatus === "Matching";

  // Section base pool (before drill-through filters)
  const sectionBasePool = useMemo(() => {
    if (filterStatus) return pool.filter((a: any) => a.status === filterStatus);
    return pool;
  }, [pool, filterStatus]);

  // Combined active pool — all filters (sector, district, gender) applied together for drill-through table and KPIs
  const activePool = useMemo(() => {
    return sectionBasePool.filter((a: any) => {
      if (sectorFilter   && (isEnt ? a.sector : a.expertise) !== sectorFilter)   return false;
      if (districtFilter && a.district !== districtFilter) return false;
      if (genderFilter   && a.gender !== genderFilter) return false;
      return true;
    });
  }, [sectionBasePool, sectorFilter, districtFilter, genderFilter, isEnt]);

  // Chart-level pool (filters by sector and district, preserving male/female split for the donut)
  const chartFilteredPool = useMemo(() => {
    return sectionBasePool.filter((a: any) => {
      if (sectorFilter   && (isEnt ? a.sector : a.expertise) !== sectorFilter)   return false;
      if (districtFilter && a.district !== districtFilter) return false;
      return true;
    });
  }, [sectionBasePool, sectorFilter, districtFilter, isEnt]);

  const maleCount   = chartFilteredPool.filter((a: any) => a.gender === "Male").length;
  const femaleCount = chartFilteredPool.filter((a: any) => a.gender === "Female").length;
  const genderTotal = maleCount + femaleCount;

  // Dynamic district data matching current section and chart filters
  const dynamicDistData = useMemo(() => {
    const map: Record<string, { district: string; male: number; female: number; total: number }> = {};
    chartFilteredPool.forEach((a: any) => {
      const d = a.district || "Unknown";
      if (!map[d]) map[d] = { district: d, male: 0, female: 0, total: 0 };
      if (a.gender === "Female") map[d].female += 1;
      else map[d].male += 1;
      map[d].total += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [chartFilteredPool]);

  const anyFilter = sectorFilter || districtFilter || genderFilter;

  // General metrics
  const districts  = new Set(activePool.map(a => a.district)).size;
  const categories = new Set(activePool.map((a: any) => isEnt ? a.sector : a.expertise)).size;
  const inProgress = pool.filter(a => ["Selected", "Approved", "Matching"].includes(a.status)).length;
  const avgGeneralScore = activePool.length > 0
    ? Math.round(activePool.reduce((acc, a: any) => acc + (a.score || 0), 0) / activePool.length)
    : 0;

  // Rejection metrics
  const rejectedPool = pool.filter((a: any) => a.status === "Rejected");
  const rejectedDistricts  = new Set(activePool.map(a => a.district)).size;
  const rejectedCategories = new Set(activePool.map((a: any) => isEnt ? a.sector : a.expertise)).size;
  const rejectionRate = Math.round((rejectedPool.length / (pool.length || 1)) * 100);
  const avgRejectedScore = activePool.length > 0
    ? Math.round(activePool.reduce((acc, a: any) => acc + (a.score || 0), 0) / activePool.length)
    : 0;
  const belowCutoffCount = activePool.filter((a: any) => (a.score || 0) < 50).length;
  const reapplyEligibleCount = activePool.filter((a: any) => (a.score || 0) >= 40 && (a.score || 0) < 50).length;

  // Selection metrics
  const selectedDistricts  = new Set(activePool.map(a => a.district)).size;
  const selectedCategories = new Set(activePool.map((a: any) => isEnt ? a.sector : a.expertise)).size;
  const avgSelectionScore  = activePool.length > 0
    ? Math.round(activePool.reduce((acc, a: any) => acc + (a.score || 0), 0) / activePool.length)
    : 0;
  const selectionRate = Math.round((activePool.length / (pool.length || 1)) * 100);

  // Matching metrics
  const matchingDistricts  = new Set(activePool.map(a => a.district)).size;
  const matchingCategories = new Set(activePool.map((a: any) => isEnt ? a.sector : a.expertise)).size;
  const avgMatchingScore   = activePool.length > 0
    ? Math.round(activePool.reduce((acc, a: any) => acc + (a.score || 0), 0) / activePool.length)
    : 0;
  const highReadinessCount = activePool.filter((a: any) => (a.score || 0) >= 80).length;
  const counterMatchingCount = (isEnt ? mntApps : entApps).filter((a: any) => a.status === "Matching").length;
  const matchedPairsCount = Math.min(
    entApps.filter(a => a.status === "Matching").length,
    mntApps.filter(a => a.status === "Matching").length
  );

  const metricCards = isRejectedSection ? [
    { label: isEnt ? "Total Rejected Applicants" : "Total Rejected Mentors", value: activePool.length,      icon: XCircle     },
    { label: "Overall Disqualification Rate",                                value: `${rejectionRate}%`,    icon: AlertCircle },
    { label: "Average Evaluation Score",                                     value: `${avgRejectedScore}%`, icon: FileX       },
    { label: "Below Passing Threshold (<50)",                                value: belowCutoffCount,       icon: TrendingUp  },
    { label: "Evaluations Completed",                                        value: activePool.length,      icon: CheckCircle },
  ] : isMatchingSection ? [
    { label: isEnt ? "Entrepreneurs in Matching" : "Mentors in Matching Pool", value: activePool.length,       icon: GitMerge    },
    { label: "Active Matched Pairings",                                       value: Math.max(matchedPairsCount, 3), icon: Users },
    { label: "High Compatibility (≥80%)",                                     value: highReadinessCount,     icon: Star        },
    { label: "Average Readiness Score",                                       value: `${avgMatchingScore}%`, icon: Award       },
    { label: isEnt ? "Available Mentors in Pool" : "Entrepreneurs Awaiting",  value: counterMatchingCount,   icon: UserCheck   },
  ] : isSelectionSection ? [
    { label: isEnt ? "Total Applicants Selected" : "Total Mentors Selected",  value: activePool.length,       icon: CheckCircle },
    { label: "Selected Districts Covered",                                   value: selectedDistricts,       icon: MapPin      },
    { label: isEnt ? "Priority Sectors Represented" : "Selected Expertise Areas", value: selectedCategories, icon: Layers      },
    { label: "Average Selection Score",                                      value: `${avgSelectionScore}%`, icon: Award       },
    { label: "Selection Acceptance Rate",                                    value: `${selectionRate}%`,     icon: TrendingUp  },
  ] : [
    { label: isEnt ? "Total Applications Received" : "Total Mentor Registrations", value: activePool.length, icon: FileText     },
    { label: "Districts Represented",                                        value: districts,         icon: MapPin       },
    { label: isEnt ? "Total Business Sectors" : "Total Expertise Areas",      value: categories,        icon: Layers       },
    { label: "Applications In Progress",                                     value: inProgress,        icon: Clock        },
    { label: "Average Candidate Score",                                      value: `${avgGeneralScore}%`, icon: Award    },
  ];

  const targetCards = (isRejectedSection || isMatchingSection) ? [] : isSelectionSection ? [
    { label: "Selection Cohort Target", value: 120, sub: "Pre-Incubation Shortlist Goal", icon: CheckCircle },
    { label: "Due Diligence Approval Target", value: targets.approval, sub: "Vetting & Verification Target", icon: UserCheck },
    { label: "Incubation Induction Target", value: targets.incubation, sub: "Final Cohort Onboarding Goal", icon: Lightbulb },
  ] : [
    { label: "Applications Intake Target", value: targets.applications, sub: "Total Intake Submissions Target", icon: FileCheck },
    { label: "Approval / Shortlist Target", value: targets.approval, sub: "Stage 2 Candidate Target", icon: UserCheck },
    { label: "Incubation Target", value: targets.incubation, sub: "Graduating Cohort Goal", icon: Lightbulb },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ROW 1: 5 metric tiles (PipeCard style, compact height) */}
      <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          const circ = 2 * Math.PI * 14;
          return (
            <div key={i} style={{
              flex: 1, minWidth: 0,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              background: "#4C808A",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "10px 8px",
              boxShadow: "0 4px 14px rgba(76,128,138,0.22)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Compact ring with icon */}
              <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
                <svg width={34} height={34} viewBox="0 0 34 34" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={17} cy={17} r={14} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
                  <circle cx={17} cy={17} r={14} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * 0.25}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={12} color="rgba(255,255,255,0.9)" />
                </div>
              </div>

              <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>{m.value}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 700, fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ROW 2: target cards (hidden in rejected section) */}
      {targetCards.length > 0 && (
        <div style={{ display: "flex", gap: 14 }}>
          {targetCards.map((t: any) => {
            const Icon = t.icon;
            return (
              <div key={t.label} style={{
                flex: 1, minWidth: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "12px 14px",
                background: "#fff",
                border: `2px solid ${TEAL}55`,
                borderRadius: 6,
                boxShadow: "0 2px 10px rgba(76,128,138,0.08)",
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                  <Icon size={20} color={TEAL} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: TEAL, lineHeight: 1 }}>{t.value}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: NAVY, marginTop: 4 }}>{t.label}</span>
                {t.sub && (
                  <span style={{ fontSize: 8.5, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>{t.sub}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active filter badges */}
      {anyFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {sectorFilter && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700,
              color: "#fff", background: TEAL, borderRadius: 6, padding: "2px 8px" }}>
              Sector: {sectorFilter}
              <button onClick={() => setSectorFilter(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
            </span>
          )}
          {districtFilter && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700,
              color: "#fff", background: NAVY, borderRadius: 6, padding: "2px 8px" }}>
              District: {districtFilter}
              <button onClick={() => setDistrictFilter(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
            </span>
          )}
          {genderFilter && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700,
              color: "#fff", background: genderFilter === "Male" ? GENDER_MALE : GENDER_FEMALE, borderRadius: 6, padding: "2px 8px" }}>
              Gender: {genderFilter}
              <button onClick={() => setGenderFilter(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
            </span>
          )}
          <button onClick={() => { setSectorFilter(null); setDistrictFilter(null); setGenderFilter(null); }}
            style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
            Clear all
          </button>
        </div>
      )}

      {/* ROW 3: charts — district bar | sector bar | gender donut */}
      <div style={{ display: "flex", gap: 14 }}>
        {/* District by Gender bar chart */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "#fff", border: `2px solid ${TEAL}55`,
          borderRadius: 6, padding: "10px 12px",
          boxShadow: "0 2px 16px rgba(76,128,138,0.08)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            {isSelectionSection
              ? "Selected Applicants by District"
              : isRejectedSection
                ? (isEnt ? "Rejected Applicants by District" : "Rejected Mentors by District")
                : isMatchingSection
                  ? (isEnt ? "Matching Queue by District" : "Matching Mentors by District")
                  : "App. Received by District by Gender"}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <CustomBarChart data={dynamicDistData}
              onFilter={d => setDistrictFilter(d === districtFilter ? null : d)}
              activeDistrict={districtFilter} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 8, paddingTop: 4 }}>
            {[
              { c: GENDER_MALE, l: "Male", isGrad: false },
              { c: GENDER_FEMALE, l: "Female", isGrad: false },
              { c: BAR_TOTAL, l: "Total", isGrad: false },
            ].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: x.isGrad ? x.c : undefined,
                  backgroundColor: !x.isGrad ? x.c : undefined,
                  flexShrink: 0
                }} />
                <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600 }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Apps Received by Sectors */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "#fff", border: `2px solid ${sectorFilter ? TEAL : TEAL}55`,
          borderRadius: 6, padding: "10px 12px",
          boxShadow: "0 2px 16px rgba(76,128,138,0.08)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            {isSelectionSection
              ? (isEnt ? "Selected Applicants by Sector" : "Selected Mentors by Expertise")
              : isRejectedSection
                ? (isEnt ? "Rejected Applicants by Sector" : "Rejected Mentors by Expertise")
                : isMatchingSection
                  ? (isEnt ? "Matching Queue by Sector" : "Matching Mentors by Expertise")
                  : (isEnt ? "Total Apps Received by Sectors" : "Total Apps Received by Expertise")}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
            <SectorPieChart pool={chartFilteredPool} isEnt={isEnt} activeFilter={sectorFilter} onFilter={s => setSectorFilter(s === sectorFilter ? null : s)} />
          </div>
        </div>

        {/* Donut card */}
        <div style={{
          background: "#fff", border: `2px solid ${TEAL}55`,
          borderRadius: 6, padding: "10px 12px",
          boxShadow: "0 2px 16px rgba(76,128,138,0.08)",
          display: "flex", flexDirection: "column",
          flex: 1, minWidth: 0,
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, marginBottom: 8, textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap" }}>
            {isSelectionSection
              ? "Selected Gender Distribution"
              : isRejectedSection
                ? "Rejected Applicants Gender Distribution"
                : isMatchingSection
                  ? "Matching Pool Gender Distribution"
                  : "Gender Distribution"}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
            <DonutChart male={maleCount} female={femaleCount}
              totalApps={genderTotal}
              onFilter={g => setGenderFilter(g === genderFilter ? null : g)} />
          </div>
        </div>
      </div>

    </div>
  );
}

// ── App Detail Panel ─────────────────────────────────────────────────────────
function AppDetailPanel({
  app,
  kind,
  onBack,
  onEditReason,
}: {
  app: EntrepreneurApplication | MentorApplication;
  kind: "entrepreneur" | "mentor";
  onBack: () => void;
  onEditReason?: (app: EntrepreneurApplication | MentorApplication, action: "Select" | "Reject") => void;
}) {
  const isEnt = kind === "entrepreneur";
  const ent = app as EntrepreneurApplication;
  const mnt = app as MentorApplication;
  const sc = STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS["Pending"];
  function Row({ label, value }: { label: string; value?: string }) {
    return (
      <div className="flex gap-4 py-2.5" style={{ borderBottom: "1px solid #f3f4f6" }}>
        <span className="w-40 shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <span className="text-[13px] text-gray-700">{value || "—"}</span>
      </div>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="rounded-md overflow-hidden" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3" style={{ background: `linear-gradient(135deg,${NAVY}08,${TEAL}10)`, borderBottom: "1px solid #e9edf2" }}>
          <span className="font-black text-[11px] uppercase tracking-widest" style={{ color: NAVY }}>{title}</span>
        </div>
        <div className="px-5 py-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="im-fade space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold rounded-md px-3 py-2 transition-all hover:brightness-90"
        style={{ background: `${TEAL}15`, color: TEAL }}
      >
        <ChevronLeft size={14} /> Back to list
      </button>

      {/* Identity card */}
      <div className="rounded-md p-6 flex flex-wrap gap-5 items-center justify-between"
        style={{ background: `linear-gradient(135deg,${NAVY},${TEAL})`, boxShadow: "0 4px 20px rgba(59,65,103,0.25)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "2px solid rgba(255,255,255,0.35)" }}>
            <User size={24} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight">{app.name}</div>
            <div className="text-[11px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{app.id} &nbsp;{isEnt ? "Entrepreneur" : "Mentor"}</div>
            <div className="mt-1.5">
              <span className="im-badge" style={{
                background: app.status === "Pending" ? "#ffffff" : sc.bg,
                color: app.status === "Pending" ? "#4C808A" : sc.color,
                fontWeight: 800,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                backdropFilter: "blur(4px)"
              }}>{app.status}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Score</div>
          <div className="text-3xl font-black text-white">{app.score}</div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Applied {app.date}</div>
        </div>
      </div>

      {/* Selection Details & Shortlist Section */}
      {app.status === "Selected" && (
        <div className="rounded-md overflow-hidden border border-emerald-200 bg-white shadow-xs">
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.14))", borderBottom: "1px solid #d1fae5" }}>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="font-black text-xs uppercase tracking-wider text-emerald-800">Selection Assessment & Shortlist Details</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Shortlisted for Incubation</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Evaluation Score</span>
                <div className="text-lg font-black text-emerald-700 mt-0.5">{app.score} / 100</div>
                <span className="text-[9px] text-gray-500">Threshold: 50 Pts minimum</span>
              </div>
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Selection Date</span>
                <div className="text-sm font-black text-gray-800 mt-1">{app.selectedDate ?? app.date}</div>
                <span className="text-[9px] text-gray-500">Approved by Selection Committee</span>
              </div>
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Admission Stage</span>
                <div className="text-sm font-black text-teal-700 mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> Pre-Incubation Shortlist
                </div>
                <span className="text-[9px] text-gray-500">Eligibility verified</span>
              </div>
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Next Pipeline Step</span>
                <div className="text-sm font-black text-purple-700 mt-1">Ready for Matching</div>
                <span className="text-[9px] text-gray-500">Mentor pairing queue</span>
              </div>
            </div>
            <div className="p-3.5 rounded-md bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Official Selection Justification & Committee Notes</span>
                {onEditReason && (
                  <button
                    type="button"
                    onClick={() => onEditReason(app, "Select")}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={11} /> Edit Reason
                  </button>
                )}
              </div>
              <p
                className={`text-xs font-semibold text-gray-800 leading-relaxed ${onEditReason ? "cursor-pointer hover:text-[#4C808A]" : ""}`}
                title={onEditReason ? "Click to edit reason" : undefined}
                onClick={() => onEditReason && onEditReason(app, "Select")}
              >
                {app.selectionReason ?? (app.score >= 80 ? "Exceeds technical merit & innovation criteria with proven market feasibility." : "Meets core eligibility requirements with strong entrepreneurial potential.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Details & Feedback Section */}
      {app.status === "Rejected" && (
        <div className="rounded-md overflow-hidden border border-red-200 bg-white shadow-xs">
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.14))", borderBottom: "1px solid #fee2e2" }}>
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-600" />
              <span className="font-black text-xs uppercase tracking-wider text-red-800">Rejection Assessment & Feedback Details</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">Disqualified</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-red-50/60 border border-red-100">
                <span className="text-[10px] font-bold uppercase text-red-500">Evaluation Score</span>
                <div className="text-lg font-black text-red-700 mt-0.5">{app.score} / 100</div>
                <span className="text-[9px] text-gray-500">Threshold: 50 Pts minimum</span>
              </div>
              <div className="p-3 rounded-md bg-red-50/60 border border-red-100">
                <span className="text-[10px] font-bold uppercase text-red-500">Rejection Date</span>
                <div className="text-sm font-black text-gray-800 mt-1">{app.rejectedDate ?? app.date}</div>
                <span className="text-[9px] text-gray-500">Reviewed by Evaluation Panel</span>
              </div>
            </div>
            <div className="p-3.5 rounded-md bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-gray-500">Official Disqualification Reason & Assessor Notes</span>
                {onEditReason && (
                  <button
                    type="button"
                    onClick={() => onEditReason(app, "Reject")}
                    className="text-[10px] font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={11} /> Edit Reason
                  </button>
                )}
              </div>
              <p
                className={`text-xs font-semibold text-gray-800 leading-relaxed ${onEditReason ? "cursor-pointer hover:text-[#4C808A]" : ""}`}
                title={onEditReason ? "Click to edit reason" : undefined}
                onClick={() => onEditReason && onEditReason(app, "Reject")}
              >
                {app.rejectionReason ?? (app.score < 50 ? "Candidate did not meet the mandatory 50-point technical threshold required for cohort admission." : "Incomplete business model canvas and traction verification.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matching Details & Compatibility Section */}
      {app.status === "Matching" && (
        <div className="rounded-md overflow-hidden border border-purple-200 bg-white shadow-xs">
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.08), rgba(126,34,206,0.12))", borderBottom: "1px solid #f3e8ff" }}>
            <div className="flex items-center gap-2">
              <GitMerge size={16} className="text-purple-600" />
              <span className="font-black text-xs uppercase tracking-wider text-purple-900">Mentorship Pairing & Compatibility Details</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">Active Pairing Queue</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-md bg-purple-50/60 border border-purple-100">
                <span className="text-[10px] font-bold uppercase text-purple-600">{isEnt ? "Assigned Mentor" : "Assigned Mentee"}</span>
                <div className="text-sm font-black text-gray-900 mt-1">
                  {isEnt ? (app.matchedMentor ?? "Mrs. Faith Nyirenda (Marketing)") : (app.matchedMentee ?? "Chisomo Banda (Agri-Business)")}
                </div>
                <span className="text-[9px] text-gray-500">Expertise alignment matched</span>
              </div>
              <div className="p-3 rounded-md bg-purple-50/60 border border-purple-100">
                <span className="text-[10px] font-bold uppercase text-purple-600">Compatibility Alignment</span>
                <div className="text-sm font-black text-purple-800 mt-1 flex items-center gap-1">
                  <Star size={12} className="fill-purple-600 text-purple-600" />
                  {app.matchScore ? `${app.matchScore}% Match` : "92% Compatibility"}
                </div>
                <span className="text-[9px] text-gray-500">High sector & domain synergy</span>
              </div>
              <div className="p-3 rounded-md bg-purple-50/60 border border-purple-100">
                <span className="text-[10px] font-bold uppercase text-purple-600">Matching Pipeline Stage</span>
                <div className="text-sm font-black text-gray-800 mt-1">{app.matchingStage ?? "Pairing Confirmed"}</div>
                <span className="text-[9px] text-gray-500">Awaiting intro session</span>
              </div>
              <div className="p-3 rounded-md bg-purple-50/60 border border-purple-100">
                <span className="text-[10px] font-bold uppercase text-purple-600">Introductory Call</span>
                <div className="text-sm font-black text-teal-700 mt-1">{app.introSession ?? "Friday 10:00 AM"}</div>
                <span className="text-[9px] text-gray-500">Google Meet link sent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <Section title="Personal Information">
        <Row label="Full Name"    value={app.name} />
        <Row label="District"     value={app.district} />
        <Row label="Phone"        value={app.phone} />
        <Row label="Email"        value={isEnt ? ent.email : mnt.email} />
        {isEnt && <Row label="Gender" value={ent.gender} />}
      </Section>

      {isEnt ? (
        <Section title="Business Information">
          <Row label="Business Name" value={ent.businessName} />
          <Row label="Sector"        value={ent.sector} />
          <Row label="Stage"         value={ent.stage} />
        </Section>
      ) : (
        <Section title="Professional Information">
          <Row label="Title / Designation" value={mnt.title} />
          <Row label="Employer / Company"  value={mnt.employer} />
          <Row label="Expertise Area"      value={mnt.expertise} />
        </Section>
      )}

      <Section title="Application Details">
        <Row label="Application ID" value={app.id} />
        <Row label="Programme"      value={app.program} />
        <Row label="Date Applied"   value={app.date} />
        <Row label="Status"         value={app.status} />
        <Row label="Score"          value={String(app.score)} />
      </Section>
    </div>
  );
}

// ── View: Applications table ─────────────────────────────────────────────────
function filterByStatus<T extends { status: string }>(pool: T[], status: string | null): T[] {
  if (!status) return pool;
  return pool.filter(a => a.status === status);
}

type AppTab = "entrepreneurs" | "mentors";

function ApplicationsView({ filterStatus }: { filterStatus: string | null }) {
  const { entApps, mntApps, setStatusOverride, reassignPartner, addNotification } = useContext(AppDataCtx);
  const [tab, setTab] = useState<AppTab>("entrepreneurs");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Sectors");
  const [viewingApp, setViewingApp] = useState<(EntrepreneurApplication | MentorApplication) | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    app: any;
    action: "Select" | "Reject";
  } | null>(null);
  const [customReasonText, setCustomReasonText] = useState<string>("");
  const [editReasonModal, setEditReasonModal] = useState<{
    app: any;
    action: "Select" | "Reject";
    initialReason: string;
  } | null>(null);
  const [editingReasonText, setEditingReasonText] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpenId]);

  useEffect(() => {
    if (!openFilterCol) return;
    function handleOutsideFilter(e: MouseEvent) {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target as Node)) {
        setOpenFilterCol(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideFilter);
    return () => document.removeEventListener("mousedown", handleOutsideFilter);
  }, [openFilterCol]);

  // Reset detail view and column filters when tab or filter changes
  useEffect(() => {
    setViewingApp(null);
    setColumnFilters({});
    setOpenFilterCol(null);
  }, [tab, filterStatus]);

  const isEntrepreneur = tab === "entrepreneurs";
  const pool = isEntrepreneur ? entApps : mntApps;
  const categoryKey = isEntrepreneur ? "sector" : "expertise";
  const categories = ["All Sectors", ...Array.from(new Set(pool.map((a: any) => a[categoryKey])))];

  const isRejected = filterStatus === "Rejected";
  const isMatching = filterStatus === "Matching";
  const isSelected = filterStatus === "Selected";
  const isDropouts = filterStatus === "Dropouts";

  const getColValue = (a: any, col: string): string => {
    if (isEntrepreneur) {
      switch (col) {
        case "Fullname": return a.name ?? "";
        case "Gender": return a.gender ?? "—";
        case "Age": return a.age != null ? String(a.age) : "—";
        case "Nationality": return a.nationality ?? "Malawian";
        case "Email Address": return a.email ?? "—";
        case "Phone Number(s)": return a.phone ?? "—";
        case "Physical Address": return a.address ?? "—";
        case "District/City": return a.district ?? "—";
        case "Region": return a.region ?? "Central";
        case "Language(s) Spoken": return a.languages ?? "English, Chichewa";
        case "Youth-Owned": return a.youthOwned ? "Yes" : "No";
        case "Woman-Owned": return a.womanOwned ? "Yes" : "No";
        case "PWD": return a.pwd ? "Yes" : "No";
        case "Location Type": return a.locationType ?? "Urban";
        case "Highest Qualification": return a.qualification ?? "Bachelor's";
        case "Field Study": return a.fieldStudy ?? "Business";
        case "Institution": return a.institution ?? "MUST";
        case "Business Experience": return a.bizExperience ?? "1–2 yrs";
        case "Why become Entrepreneur?": return a.whyEntrepreneur ?? "To create jobs and contribute to Malawi's economy.";
        case "Venture Name": return a.businessName ?? a.venture ?? ((a.name ? a.name.split(" ")[0] : "") + " Ventures");
        case "Sector": return a.sector ?? "";
        case "Year Started": return a.yearStarted != null ? String(a.yearStarted) : "2024";
        case "Business Reg. Status": return a.bizRegStatus ?? "Unregistered";
        case "Target Customers": return a.targetCustomers ?? "SMEs";
        case "Business Stages": return a.bizStage ?? "Idea";
        case "Co-Founder Name(s)": return a.coFounderName ?? "—";
        case "Co-Founder Role": return a.coFounderRole ?? "—";
        case "Score": return a.score != null ? String(a.score) : "";
        case "Status": return isMatching
          ? ((a.matchingStage === "Re-match Requested" || a.reMatchReq || a.status === "Re-match Requested" || a.approvalStatus === "Re-match Requested") ? "Re-match Requested" : (a.approvalStatus ?? "Approved"))
          : (!filterStatus ? "Pending" : (a.status ?? ""));
        case "Selection Reason": return a.selectionReason ?? "Demonstrated strong market feasibility and job creation potential";
        case "Selected Date": return a.selectedDate ?? a.date ?? "2026-02-18";
        case "Rejection Reason": return a.rejectionReason ?? (a.score < 50 ? "Score below 50-point cutoff threshold" : "Incomplete business model canvas and traction verification");
        case "Rejection Date": return a.rejectedDate ?? a.date ?? "2026-02-15";
        case "Feedback Status": return a.feedbackStatus ?? "Formal Notice Dispatched";
        case "Re-application Eligibility": return a.reapplyEligible ?? ((a.score || 0) >= 40 ? "Eligible for Next Cohort" : "Remediation Required");
        case "Compatibility Match": return a.matchScore != null ? `${a.matchScore}% Match` : ((a.score || 0) >= 85 ? "94% Match" : "86% Match");
        case "Assigned Mentor": return a.matchedMentor ?? "Pending Mentor Match";
        case "Assigned Mentee": return a.matchedMentee ?? "—";
        case "Matching Stage": {
          if (a.approvalStatus === "Re-match Requested" || a.status === "Re-match Requested" || (a as any).reMatchReq || a.matchingStage === "Re-match Requested") {
            return "Pairing Proposed";
          }
          const st = a.matchingStage ?? "Pairing Proposed";
          return (!st || st.toLowerCase().includes("intro call scheduled")) ? "—" : st;
        }
        case "Intro Session": return a.introSession ?? "Pending Schedule";
        default: return "";
      }
    } else {
      switch (col) {
        case "Fullname": return a.name ?? "";
        case "Gender": return a.gender ?? "—";
        case "Age": return a.age != null ? String(a.age) : "—";
        case "Nationality": return a.nationality ?? "Malawian";
        case "Email Address": return a.email ?? "—";
        case "Phone Number(s)": return a.phone ?? "—";
        case "Physical Address": return a.address ?? "—";
        case "District/City": return a.district ?? "—";
        case "Region": return a.region ?? "Central";
        case "Expertise Area": return a.expertise ?? "";
        case "Institution": return a.employer ?? a.institution ?? "—";
        case "Highest Qualification": return a.qualification ?? "Master's";
        case "Years of Experience": return a.yearsExp ?? "5+";
        case "Languages Spoken": return a.languages ?? "English";
        case "Availability": return a.availability ?? "Part-time";
        case "Score": return a.score != null ? String(a.score) : "";
        case "Status": return isMatching
          ? ((a.matchingStage === "Re-match Requested" || a.reMatchReq || a.status === "Re-match Requested" || a.approvalStatus === "Re-match Requested") ? "Re-match Requested" : (a.approvalStatus ?? "Approved"))
          : (a.status ?? "");
        case "Selection Reason": return a.selectionReason ?? "High professional domain experience and availability for incubatees";
        case "Selected Date": return a.selectedDate ?? a.date ?? "2026-02-18";
        case "Rejection Reason": return a.rejectionReason ?? (a.score < 50 ? "Weekly availability below required 4 hours/month minimum threshold" : "Mentorship credentials verification incomplete");
        case "Rejection Date": return a.rejectedDate ?? a.date ?? "2026-02-15";
        case "Feedback Status": return a.feedbackStatus ?? "Formal Notice Dispatched";
        case "Re-application Eligibility": return a.reapplyEligible ?? "Eligible for Next Cohort";
        case "Compatibility Match": return a.matchScore != null ? `${a.matchScore}% Match` : "91% Match";
        case "Assigned Mentee": return a.matchedMentee ?? "Pending Mentee Match";
        case "Assigned Mentor": return a.matchedMentor ?? "—";
        case "Matching Stage": {
          if (a.approvalStatus === "Re-match Requested" || a.status === "Re-match Requested" || (a as any).reMatchReq || a.matchingStage === "Re-match Requested") {
            return "Pairing Proposed";
          }
          const st = a.matchingStage ?? "Pairing Proposed";
          return (!st || st.toLowerCase().includes("intro call scheduled")) ? "—" : st;
        }
        case "Intro Session": return a.introSession ?? "Pending Schedule";
        default: return "";
      }
    }
  };

  const getColOptions = (col: string): string[] => {
    if (isMatching && col === "Status") {
      return ["Approved", "Pending Approval", "Re-match Requested"];
    }
    const vals = new Set<string>();
    pool.forEach((item: any) => {
      const v = getColValue(item, col);
      if (v && v !== "—") vals.add(v);
    });
    return Array.from(vals).sort();
  };

  const data = filterByStatus(pool as any, filterStatus).filter((a: any) => {
    if (categoryFilter !== "All Sectors" && a[categoryKey] !== categoryFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSearch =
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    for (const [col, filterVal] of Object.entries(columnFilters)) {
      if (!filterVal || filterVal.trim() === "" || filterVal === "All") continue;
      const cellVal = getColValue(a, col).toLowerCase();
      const query = filterVal.toLowerCase().trim();
      if (!cellVal.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const activeColumnFilterKeys = Object.entries(columnFilters).filter(
    ([, v]) => v && v.trim() !== "" && v !== "All"
  );
  const activeFilterCount = activeColumnFilterKeys.length;
  const clearAllColumnFilters = () => setColumnFilters({});

  const handleOpenEditReason = (appToEdit: any, action: "Select" | "Reject") => {
    const defaultReason = action === "Select"
      ? (appToEdit.selectionReason ?? "Demonstrated strong market feasibility and job creation potential")
      : (appToEdit.rejectionReason ?? (appToEdit.score < 50 ? "Score below 50-point cutoff threshold" : "Incomplete business model canvas and traction verification"));
    setEditingReasonText(defaultReason);
    setEditReasonModal({
      app: appToEdit,
      action,
      initialReason: defaultReason,
    });
  };

  const renderEditReasonModal = () => {
    if (!editReasonModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 im-fade">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {editReasonModal.action === "Select" ? "Edit Selection Reason" : "Edit Rejection Reason"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update official justification for {editReasonModal.app.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditReasonModal(null)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-md p-3.5 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-gray-900">{editReasonModal.app.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold text-gray-600">{editReasonModal.app.id}</span>
                  <span>{getColValue(editReasonModal.app, isEntrepreneur ? "Venture Name" : "Expertise Area")}</span>
                  <span className="text-gray-500">{editReasonModal.app.district}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-gray-400">Score</div>
                <div className="text-base font-black text-gray-800">
                  {editReasonModal.app.score}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                {editReasonModal.action === "Select" ? "Official Selection Reason & Justification" : "Official Disqualification Reason & Assessor Notes"}
              </label>
              <textarea
                value={editingReasonText}
                onChange={e => setEditingReasonText(e.target.value)}
                rows={4}
                placeholder="Enter official reason and committee notes..."
                className="w-full text-xs p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4C808A] resize-none"
                autoFocus
              />
              <p className="text-[10.5px] text-gray-500 mt-1">
                This reason will be recorded and displayed under the {editReasonModal.action === "Select" ? "Selection" : "Rejection"} section.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditReasonModal(null)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updatedText = editingReasonText.trim();
                if (!updatedText) {
                  toast.error("Reason cannot be empty.");
                  return;
                }
                const targetStatus = editReasonModal.action === "Select" ? "Selected" : "Rejected";
                setStatusOverride(editReasonModal.app.id, targetStatus, updatedText);
                if (viewingApp && viewingApp.id === editReasonModal.app.id) {
                  setViewingApp({
                    ...viewingApp,
                    ...(editReasonModal.action === "Select" ? { selectionReason: updatedText } : { rejectionReason: updatedText }),
                  });
                }
                toast.success(`${editReasonModal.action === "Select" ? "Selection" : "Rejection"} reason updated successfully!`);
                setEditReasonModal(null);
              }}
              className="px-4 py-2 text-xs font-bold text-white rounded-md bg-[#4C808A] hover:bg-[#3d6971] cursor-pointer shadow-sm transition-colors"
            >
              Save Reason
            </button>
          </div>
        </div>
      </div>
    );
  };

  const columns = useMemo(() => {
    if (isRejected) {
      return isEntrepreneur
        ? [
            "Fullname", "Gender", "District/City", "Venture Name", "Sector",
            "Score", "Rejection Reason", "Rejection Date",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ]
        : [
            "Fullname", "Gender", "District/City", "Expertise Area", "Highest Qualification",
            "Score", "Rejection Reason", "Rejection Date",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ];
    }
    if (isMatching) {
      return isEntrepreneur
        ? [
            "Fullname", "Gender", "District/City", "Venture Name", "Sector",
            "Score", "Compatibility Match", "Assigned Mentor", "Matching Stage", "Intro Session",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ]
        : [
            "Fullname", "Gender", "District/City", "Expertise Area", "Years of Experience",
            "Score", "Compatibility Match", "Assigned Mentee", "Matching Stage", "Intro Session",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ];
    }
    if (isSelected) {
      return isEntrepreneur
        ? [
            "Fullname", "Gender", "District/City", "Venture Name", "Sector",
            "Score", "Selection Reason", "Selected Date",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ]
        : [
            "Fullname", "Gender", "District/City", "Expertise Area", "Highest Qualification",
            "Score", "Selection Reason", "Selected Date",
            "Phone Number(s)", "Email Address", "Status", "Actions"
          ];
    }
    if (isDropouts) {
      return isEntrepreneur
        ? [
            "Fullname", "Gender", "District/City", "Venture Name", "Sector",
            "Score", "Status", "Phone Number(s)", "Email Address", "Actions"
          ]
        : [
            "Fullname", "Gender", "District/City", "Expertise Area",
            "Score", "Status", "Phone Number(s)", "Email Address", "Actions"
          ];
    }
    return isEntrepreneur
      ? [
          "Fullname","Gender","Age","Nationality","Email Address","Phone Number(s)",
          "Physical Address","District/City","Region","Language(s) Spoken",
          "Youth-Owned","Woman-Owned","PWD","Location Type",
          "Highest Qualification","Field Study","Institution","Business Experience",
          "Why become Entrepreneur?","Venture Name","Sector","Year Started",
          "Business Reg. Status","Target Customers","Business Stages",
          "Co-Founder Name(s)","Co-Founder Role","Score","Status","Actions",
        ]
      : [
          "Fullname","Gender","Age","Nationality","Email Address","Phone Number(s)",
          "Physical Address","District/City","Region","Expertise Area",
          "Institution","Highest Qualification","Years of Experience",
          "Languages Spoken","Availability","Score","Status","Actions",
        ];
  }, [isRejected, isMatching, isSelected, isDropouts, isEntrepreneur]);

  if (viewingApp) {
    const appToView = (!filterStatus && isEntrepreneur)
      ? { ...viewingApp, status: "Pending" }
      : viewingApp;
    return (
      <>
        <AppDetailPanel
          app={appToView}
          kind={isEntrepreneur ? "entrepreneur" : "mentor"}
          onBack={() => setViewingApp(null)}
          onEditReason={handleOpenEditReason}
        />
        {editReasonModal && renderEditReasonModal()}
      </>
    );
  }

  return (
    <div className="im-fade space-y-5">

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 p-1 rounded-md self-start w-fit"
        style={{ background: "#e9edf2", border: "1px solid #d1d5db" }}>
        {(["entrepreneurs", "mentors"] as AppTab[]).map(t => {
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); setCategoryFilter("All Sectors"); setColumnFilters({}); }}
              className="px-5 py-2 rounded-md text-xs font-bold capitalize transition-all"
              style={{
                background: tab === t ? `linear-gradient(135deg, ${NAVY}, ${TEAL})` : "transparent",
                color: tab === t ? "#fff" : "#6b7280",
                boxShadow: tab === t ? "0 2px 8px rgba(59,65,103,0.25)" : "none",
              }}
            >
              {t === "entrepreneurs" ? "Entrepreneurs" : "Mentors"}
            </button>
          );
        })}
      </div>

      {/* Dashboard: metric cards + district bar chart + gender donut */}
      <ApplicationsDashboard tab={tab} filterStatus={filterStatus} />

      {/* Search + Category filter */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Search */}
        <div className="flex items-center gap-2 rounded-md px-3 py-2 flex-1 min-w-[180px]"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
          <Search size={13} color="#9ca3af" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="bg-transparent text-sm flex-1 focus:outline-none text-gray-700 placeholder-gray-400" />
        </div>

        {/* Category filter */}
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-md px-3 py-2 text-xs font-semibold focus:outline-none"
          style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-md overflow-hidden" style={{ border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        {/* Table header bar - dot removed in front of Entrepreneur Applications */}
        <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", background: isEntrepreneur ? "#4C808A" : "#f9fafb" }}>
          <div className="flex items-center gap-2">
            {!isEntrepreneur && <div className="w-2 h-2 rounded-full" style={{ background: NAVY }} />}
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: isEntrepreneur ? "#ffffff" : "#374151" }}>
              {filterStatus === "Rejected"
                ? (isEntrepreneur ? "Details and Feedback of Rejected Applications" : "Details and Feedback of Rejected Applications")
                : (filterStatus === "Selected"
                    ? (isEntrepreneur ? "Selected Entrepreneur Applications" : "Selected Mentor Applications")
                    : (filterStatus === "Matching"
                        ? (isEntrepreneur ? "Entrepreneur Mentor-Matching Pipeline" : "Mentor Pairing & Matching Pool")
                        : (isEntrepreneur ? "Entrepreneur Applications" : "Mentor Applications")))}
            </span>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllColumnFilters}
              className="text-[11px] font-bold px-3 py-1 rounded bg-white text-[#4C808A] hover:bg-gray-100 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <X size={12} /> Clear all filters ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-amber-200" style={{ background: "#fffbeb" }}>
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Filter size={10} /> Active Filters ({activeFilterCount}):
            </span>
            {activeColumnFilterKeys.map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-gray-800 px-2 py-0.5 rounded border border-amber-300 shadow-xs">
                <span className="text-gray-500 font-bold">{k}:</span>
                <span className="text-amber-800 font-bold">{v}</span>
                <button
                  type="button"
                  onClick={() => setColumnFilters(prev => { const n = { ...prev }; delete n[k]; return n; })}
                  className="ml-1 text-gray-400 hover:text-red-600 font-black cursor-pointer"
                  title={`Remove filter on ${k}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllColumnFilters}
              className="text-[10px] font-bold text-red-600 hover:text-red-800 underline ml-auto cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, minWidth: isRejected || isMatching ? "1400px" : "2800px", width: "100%" }}>
            <thead>
              {/* Header Title Row */}
              <tr style={{ background: isEntrepreneur ? "#4C808A" : "#f9fafb", borderBottom: isEntrepreneur ? "1px solid rgba(255,255,255,0.4)" : "1px solid #e5e7eb" }}>
                {columns.map(h => {
                  const hasFilter = Boolean(columnFilters[h]);
                  return (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-[9px] uppercase tracking-wider whitespace-nowrap"
                      style={{
                        color: isEntrepreneur ? "#ffffff" : "#6b7280",
                        background: isEntrepreneur ? (hasFilter ? "#36636c" : "#4C808A") : (hasFilter ? "#e5e7eb" : undefined),
                        borderRight: isEntrepreneur ? "1px solid rgba(255,255,255,0.4)" : "1px solid #e5e7eb",
                        borderBottom: isEntrepreneur ? "1px solid rgba(255,255,255,0.4)" : "1px solid #e5e7eb",
                        position: "relative",
                      }}>
                      {h === "Actions" ? (
                        <div className="flex items-center justify-center">
                          {activeFilterCount > 0 ? (
                            <button
                              type="button"
                              onClick={clearAllColumnFilters}
                              title="Clear all filters"
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white text-[#4C808A] hover:bg-gray-100 transition-all flex items-center gap-0.5 cursor-pointer"
                            >
                              <X size={8} /> Reset
                            </button>
                          ) : (
                            <span>Actions</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5">
                          <span>{h}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterCol(openFilterCol === h ? null : h);
                            }}
                            className={`p-1 rounded transition-all cursor-pointer ${
                              hasFilter
                                ? "bg-amber-400 text-gray-900 font-black shadow-sm"
                                : isEntrepreneur
                                ? "text-white/80 hover:bg-white/20 hover:text-white"
                                : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                            }`}
                            title={`Filter ${h}`}
                          >
                            <Filter size={10} className={hasFilter ? "fill-current" : ""} />
                          </button>
                        </div>
                      )}

                      {/* Dropdown Popover for this column */}
                      {openFilterCol === h && (
                        <div
                          ref={filterPopupRef}
                          className="im-dd"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            zIndex: 100,
                            background: "#ffffff",
                            borderRadius: 8,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                            border: "1px solid #e5e7eb",
                            minWidth: 210,
                            maxWidth: 280,
                            padding: 10,
                            marginTop: 4,
                            textAlign: "left",
                            color: "#111827",
                            textTransform: "none",
                            fontWeight: "normal",
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                            <span className="text-[11px] font-bold text-gray-800">Filter: {h}</span>
                            <button
                              type="button"
                              onClick={() => setOpenFilterCol(null)}
                              className="w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <input
                            type="text"
                            value={columnFilters[h] ?? ""}
                            onChange={e => setColumnFilters(prev => ({ ...prev, [h]: e.target.value }))}
                            placeholder={`Filter ${h}...`}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-200 focus:outline-none focus:border-[#4C808A] mb-2"
                            autoFocus
                          />

                          <div className="max-h-36 overflow-y-auto space-y-1 mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setColumnFilters(prev => { const n = { ...prev }; delete n[h]; return n; });
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                                !columnFilters[h] ? "bg-[#4C808A]/15 text-[#4C808A] font-bold" : "hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              (All)
                            </button>
                            {getColOptions(h).map(opt => {
                              const isSelected = columnFilters[h] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setColumnFilters(prev => ({ ...prev, [h]: opt }));
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded text-[11px] truncate block transition-all cursor-pointer ${
                                    isSelected ? "bg-[#4C808A]/15 text-[#4C808A] font-bold" : "hover:bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {columnFilters[h] && (
                            <button
                              type="button"
                              onClick={() => {
                                setColumnFilters(prev => { const n = { ...prev }; delete n[h]; return n; });
                                setOpenFilterCol(null);
                              }}
                              className="w-full py-1 text-center text-[10px] font-bold text-red-600 hover:bg-red-50 rounded transition-all border border-red-200 cursor-pointer"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>

              {/* Dedicated Inline Filter Controls Sub-Row */}
              <tr style={{ background: isEntrepreneur ? "#3d6b74" : "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                {columns.map(h => {
                  if (h === "Actions") {
                    return (
                      <th key={`sub-${h}`} className="px-2 py-1 text-center whitespace-nowrap"
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          background: isEntrepreneur ? "#3d6b74" : "#f3f4f6",
                        }}>
                        {activeFilterCount > 0 ? (
                          <button
                            type="button"
                            onClick={clearAllColumnFilters}
                            className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-500 text-gray-900 transition-all shadow-sm cursor-pointer"
                            title="Clear all column filters"
                          >
                            Clear ({activeFilterCount})
                          </button>
                        ) : (
                          <span className="text-[9px] font-semibold" style={{ color: isEntrepreneur ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>—</span>
                        )}
                      </th>
                    );
                  }

                  const hasFilter = Boolean(columnFilters[h]);
                  const options = getColOptions(h);

                  return (
                    <th key={`sub-${h}`} className="px-1.5 py-1 whitespace-nowrap"
                      style={{
                        borderRight: isEntrepreneur ? "1px solid rgba(255,255,255,0.3)" : "1px solid #e5e7eb",
                        borderBottom: "1px solid #e5e7eb",
                        background: isEntrepreneur ? (hasFilter ? "#32575f" : "#3d6b74") : (hasFilter ? "#e2e8f0" : "#f3f4f6"),
                      }}>
                      <div className="relative flex items-center">
                        <select
                          value={columnFilters[h] ?? ""}
                          onChange={e => setColumnFilters(prev => ({ ...prev, [h]: e.target.value }))}
                          className="w-full text-[10px] font-semibold px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer"
                          style={{
                            background: hasFilter ? "#fff" : "rgba(255,255,255,0.92)",
                            color: "#111827",
                            border: hasFilter ? "1px solid #f59e0b" : "1px solid rgba(0,0,0,0.15)",
                            minWidth: 80,
                          }}
                        >
                          <option value="">All</option>
                          {options.map(opt => (
                            <option key={opt} value={opt} title={opt}>
                              {opt.length > 32 ? opt.slice(0, 30) + "…" : opt}
                            </option>
                          ))}
                        </select>
                        {hasFilter && (
                          <button
                            type="button"
                            onClick={() => setColumnFilters(prev => { const n = { ...prev }; delete n[h]; return n; })}
                            className="absolute right-5 text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
                            title="Clear"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.map((a: any) => {
                const sc = STATUS_COLORS[a.status] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={a.id} className="im-row" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {columns.map(col => {
                      if (col === "Actions") {
                        return (
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap" style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <div className="flex items-center gap-1" style={{ position: "relative" }}>
                              <button
                                className="w-7 h-7 rounded-md flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                                style={{ background: `${TEAL}15` }}
                                onClick={() => setViewingApp(a)}
                                title="View application details"
                              >
                                <Eye size={11} color={TEAL} />
                              </button>
                              <button
                                className="w-7 h-7 rounded-md flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                                style={{ background: menuOpenId === a.id ? "#e5e7eb" : "#f3f4f6" }}
                                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === a.id ? null : a.id); }}
                                title="More actions"
                              >
                                <MoreHorizontal size={11} color="#6b7280" />
                              </button>
                              {menuOpenId === a.id && (
                                <div ref={menuRef} className="im-dd" style={{
                                  position: "absolute", top: "100%", right: 0, zIndex: 100,
                                  background: "#fff", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                                  border: "1px solid #e5e7eb", minWidth: 175, padding: "5px 0", marginTop: 4,
                                }}>
                                  {isRejected ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          setCustomReasonText(a.selectionReason || "Demonstrated commitment and improved business model canvas");
                                          setDecisionModal({ app: a, action: "Select" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#059669", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <RotateCcw size={13} color="#059669" /> Re-evaluate (Select)
                                      </button>
                                      <div style={{ height: 1, background: "#f3f4f6", margin: "3px 0" }} />
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          toast.info(`Formal feedback notice re-sent to ${a.name} via Email.`);
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: TEAL, fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdfa")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <Send size={13} color={TEAL} /> Resend Notice
                                      </button>
                                    </>
                                  ) : isMatching ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          reassignPartner(a, isEntrepreneur);
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#7c3aed", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#faf5ff")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <RotateCcw size={13} color="#7c3aed" /> Re-assign Partner
                                      </button>
                                      <div style={{ height: 1, background: "#f3f4f6", margin: "3px 0" }} />
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          const defaultRej = a.rejectionReason || ((a.score || 0) < 50 ? "Evaluation score below mandatory 50-point cutoff threshold" : "Incomplete business model canvas and traction verification");
                                          setCustomReasonText(defaultRej);
                                          setDecisionModal({ app: a, action: "Reject" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <XCircle size={13} color="#ef4444" /> Reject
                                      </button>
                                    </>
                                  ) : isSelected ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setStatusOverride(a.id, "Matching");
                                          setMenuOpenId(null);
                                          toast.success(`${a.name} moved to Matching section.`);
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#7c3aed", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#faf5ff")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <GitMerge size={13} color="#7c3aed" /> Move to Matching
                                      </button>
                                      <div style={{ height: 1, background: "#f3f4f6", margin: "3px 0" }} />
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          const defaultRej = a.rejectionReason || ((a.score || 0) < 50 ? "Evaluation score below mandatory 50-point cutoff threshold" : "Incomplete business model canvas and traction verification");
                                          setCustomReasonText(defaultRej);
                                          setDecisionModal({ app: a, action: "Reject" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <XCircle size={13} color="#ef4444" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          setCustomReasonText(a.selectionReason || "Demonstrated strong market feasibility and job creation potential");
                                          setDecisionModal({ app: a, action: "Select" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#059669", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <CheckCircle size={13} color="#059669" /> Select
                                      </button>
                                      <div style={{ height: 1, background: "#f3f4f6", margin: "3px 0" }} />
                                      <button
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          const defaultRej = a.rejectionReason || ((a.score || 0) < 50 ? "Evaluation score below mandatory 50-point cutoff threshold" : "Incomplete business model canvas and traction verification");
                                          setCustomReasonText(defaultRej);
                                          setDecisionModal({ app: a, action: "Reject" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 600, textAlign: "left" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                      >
                                        <XCircle size={13} color="#ef4444" /> Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      if (col === "Score") {
                        return (
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-md" style={{ width: `${Math.min(100, Math.max(0, a.score))}%`, background: "#059669" }} />
                              </div>
                              <span className="font-bold text-[11px]" style={{ color: "#374151" }}>{a.score}</span>
                            </div>
                          </td>
                        );
                      }

                      if (col === "Status") {
                        const isEntAppSection = !filterStatus && isEntrepreneur;
                        const statusVal = isMatching
                          ? ((a.matchingStage === "Re-match Requested" || (a as any).reMatchReq || a.status === "Re-match Requested" || a.approvalStatus === "Re-match Requested")
                              ? "Re-match Requested"
                              : (a.approvalStatus ?? "Approved"))
                          : (isEntAppSection ? "Pending" : a.status);
                        const statusColor = (STATUS_COLORS[statusVal] ?? STATUS_COLORS[a.status] ?? { color: "#4C808A" }).color;
                        return (
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap text-[12px] font-semibold" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            <span style={{ color: statusColor }}>
                              {statusVal}
                            </span>
                          </td>
                        );
                      }

                      if (col === "Selection Reason" || col === "Rejection Reason") {
                        const isSelect = col === "Selection Reason";
                        const reasonValue = getColValue(a, col);
                        return (
                          <td
                            key={col}
                            className="px-3 py-2.5 text-xs text-gray-800 whitespace-nowrap cursor-pointer hover:bg-gray-100/70 transition-colors"
                            style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}
                            title="Click to edit reason"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditReason(a, isSelect ? "Select" : "Reject");
                            }}
                          >
                            <span className="hover:underline hover:text-[#4C808A] transition-colors">
                              {reasonValue}
                            </span>
                          </td>
                        );
                      }

                      if (col === "Selected Date") {
                        return (
                          <td key={col} className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {getColValue(a, col)}
                          </td>
                        );
                      }

                      if (col === "Fullname") {
                        return (
                          <td key={col} className="px-3 py-2.5 font-bold whitespace-nowrap" style={{ color: "#111827", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {a.name}
                          </td>
                        );
                      }

                      if (col === "Venture Name") {
                        return (
                          <td key={col} className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ color: NAVY, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {getColValue(a, col)}
                          </td>
                        );
                      }

                      if (col === "Compatibility Match") {
                        return (
                          <td key={col} className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap font-medium" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {getColValue(a, col)}
                          </td>
                        );
                      }

                      if (col === "Matching Stage") {
                        const val = getColValue(a, col);
                        const displayVal = (!val || val.toLowerCase().includes("intro call scheduled")) ? "—" : (val === "Re-match Requested" ? "Pairing Proposed" : val);
                        return (
                          <td key={col} className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap font-medium" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {displayVal}
                          </td>
                        );
                      }

                      if (col === "Assigned Mentor" || col === "Assigned Mentee") {
                        return (
                          <td key={col} className="px-3 py-2.5 font-bold whitespace-nowrap text-xs" style={{ color: NAVY, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {getColValue(a, col)}
                          </td>
                        );
                      }

                      if (col === "Youth-Owned" || col === "Woman-Owned" || col === "PWD") {
                        const val = getColValue(a, col);
                        const isYes = val === "Yes";
                        return (
                          <td key={col} className="px-3 py-2.5 text-center whitespace-nowrap" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: isYes ? (col === "Woman-Owned" ? "#7c3aed" : TEAL) : "#9ca3af" }}>{val}</span>
                          </td>
                        );
                      }

                      if (col === "Business Reg. Status") {
                        const isReg = getColValue(a, col) === "Registered";
                        return (
                          <td key={col} className="px-3 py-2.5 text-gray-500 whitespace-nowrap" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {isReg ? (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#d1fae5", color: "#065f46" }}>Registered</span>
                            ) : (
                              getColValue(a, col)
                            )}
                          </td>
                        );
                      }

                      if (col === "Why become Entrepreneur?") {
                        return (
                          <td key={col} className="px-3 py-2.5 text-gray-500" style={{ minWidth: 180, maxWidth: 220, whiteSpace: "normal", lineHeight: 1.4, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                            {getColValue(a, col)}
                          </td>
                        );
                      }

                      return (
                        <td key={col} className="px-3 py-2.5 text-gray-600 whitespace-nowrap" style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                          {getColValue(a, col)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">No records found.</div>
        )}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #f3f4f6" }}>
          <span className="text-xs text-gray-500">Showing {data.length} of {pool.length} records</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(p => (
              <button key={p} className="w-7 h-7 rounded-md text-xs font-bold"
                style={{ background: p === 1 ? TEAL : "#f3f4f6", color: p === 1 ? "#fff" : "#6b7280" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pop up Modal Screen for Selection / Rejection ── */}
      {decisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDecisionModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-lg"
            style={{ border: "1px solid #e5e7eb" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{
                background: decisionModal.action === "Select"
                  ? "#4C808A"
                  : "linear-gradient(135deg, #991b1b, #dc2626)"
              }}
            >
              <div>
                <h3 className="font-bold text-sm leading-snug">
                  {decisionModal.action === "Select" ? "Select Candidate for Incubation" : "Reject Candidate Application"}
                </h3>
                <p className="text-[11px] text-white/80">
                  {decisionModal.action === "Select"
                    ? "Record official selection justification to be displayed in the Selection section"
                    : "Record formal disqualification reason to be displayed in the Rejection section"}
                </p>
              </div>
              <button
                onClick={() => setDecisionModal(null)}
                className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Applicant Card */}
              <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-900">{decisionModal.app.name}</div>
                  <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-gray-800">{decisionModal.app.id}</span>
                    <span>{getColValue(decisionModal.app, isEntrepreneur ? "Venture Name" : "Expertise Area")}</span>
                    <span className="text-gray-500">{decisionModal.app.district}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Score</div>
                  <div className="text-base font-black text-gray-800 flex items-center gap-1.5 justify-end">
                    <div className="h-1.5 w-10 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-[#059669]" style={{ width: `${Math.min(100, decisionModal.app.score)}%` }} />
                    </div>
                    <span>{decisionModal.app.score}</span>
                  </div>
                </div>
              </div>

              {/* Textarea for detailed justification */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Official Reason & Committee Notes
                </label>
                <textarea
                  value={customReasonText}
                  onChange={e => setCustomReasonText(e.target.value)}
                  rows={4}
                  placeholder={`Enter official reason and committee notes for ${decisionModal.action.toLowerCase()}ing this applicant...`}
                  className="w-full text-xs p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4C808A] resize-none"
                />
                <p className="text-[10.5px] text-gray-500 mt-1">
                  This reason will be recorded and displayed under the {decisionModal.action === "Select" ? "Selection" : "Rejection"} section.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalReason = customReasonText.trim() || (decisionModal.action === "Select" ? "Meets selection criteria and approved for incubation shortlisting" : "Disqualified by evaluation committee");
                  const targetStatus = decisionModal.action === "Select" ? "Selected" : "Rejected";
                  setStatusOverride(decisionModal.app.id, targetStatus, finalReason);
                  if (decisionModal.action === "Select") {
                    toast.success(`${decisionModal.app.name} has been selected! Reason recorded and moved to Selection.`);
                  } else {
                    toast.error(`${decisionModal.app.name} has been rejected. Reason recorded in Rejection section.`);
                  }
                  setDecisionModal(null);
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-md flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
                  decisionModal.action === "Select"
                    ? "bg-[#4C808A] hover:bg-[#3d6971]"
                    : "bg-[#dc2626] hover:bg-[#b91c1c]"
                }`}
              >
                {decisionModal.action === "Select" ? (
                  "Confirm Select and Shortlist"
                ) : (
                  "Confirm Disqualification"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Reason Modal ── */}
      {renderEditReasonModal()}
    </div>
  );
}

// ── View: Email Dashboard ─────────────────────────────────────────────────────
function EmailDashboardView() {
  const { scope } = useContext(AppDataCtx);
  const emails = EMAILS.filter(e => inScope(scope, e));
  const delivered = emails.filter(e => e.status === "Delivered");
  const avg = (f: (e: typeof EMAILS[number]) => number) => delivered.length ? Math.round(delivered.reduce((a, e) => a + (e.recipients ? f(e) / e.recipients : 0), 0) / delivered.length * 100) : 0;
  return (
    <div className="im-fade space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Send,    label: "Sent",      value: String(emails.length),    color: TEAL  },
          { icon: Inbox,   label: "Delivered",  value: String(delivered.length),    color: "#059669" },
          { icon: Star,    label: "Avg. Open",  value: `${avg(e => e.opened)}%`,  color: "#7c3aed" },
          { icon: TrendingUp, label: "Avg. Click", value: `${avg(e => e.clicked)}%`, color: "#d97706" },
        ].map(s => (
          <div key={s.label} className="rounded-md p-4 flex flex-col gap-2"
            style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon size={15} color={s.color} />
            </div>
            <div className="font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="rounded-md overflow-hidden" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <h3 className="font-black text-sm" style={{ color: NAVY }}>Email Campaigns</h3>
          <button className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-md"
            style={{ background: TEAL }}><PlusCircle size={12} /> New Campaign</button>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Subject", "Recipients", "Opened", "Clicked", "Sent Date", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.map((e, i) => {
              const sc = STATUS_COLORS[e.status] ?? { bg: "#f3f4f6", color: "#374151" };
              const openRate = e.recipients > 0 ? Math.round((e.opened / e.recipients) * 100) : 0;
              const clickRate = e.recipients > 0 ? Math.round((e.clicked / e.recipients) * 100) : 0;
              return (
                <tr key={e.id} className="im-row" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="px-4 py-3 font-semibold max-w-[240px] truncate" style={{ color: "#111827" }}>{e.subject}</td>
                  <td className="px-4 py-3 font-bold text-center" style={{ color: NAVY }}>{e.recipients}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-md" style={{ width: `${openRate}%`, background: "#7c3aed" }} />
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: "#374151" }}>{openRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-md" style={{ width: `${clickRate}%`, background: "#d97706" }} />
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: "#374151" }}>{clickRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.sent}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {e.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {emails.length === 0 && <div className="p-4"><ProjectEmptyNotice scope={scope} what="email campaigns" /></div>}
      </div>
    </div>
  );
}

// ── View: Program Health ──────────────────────────────────────────────────────
function ProgramHealthView() {
  const { entApps, scope } = useContext(AppDataCtx);
  const count = (st: string) => entApps.filter(a => a.status === st).length;
  const alumniCount = ALUMNI.filter(a => inScope(scope, a)).length;
  const hasData = entApps.length > 0;
  const metrics = [
    { label: "Application Completion Rate", value: 87, color: "#059669", icon: CheckCircle },
    { label: "Mentor Matching Rate",         value: 73, color: TEAL,     icon: GitMerge    },
    { label: "Cohort Retention Rate",        value: 91, color: "#7c3aed",icon: Users        },
    { label: "Business Plan Submission",     value: 68, color: "#d97706",icon: FileText     },
    { label: "Milestone Achievement",        value: 79, color: NAVY,     icon: CheckSquare  },
    { label: "Alumni Satisfaction",          value: 94, color: "#059669",icon: Star         },
  ];

  const alerts = [
    { level: "warning", programId: SAMPLE_CORE, msg: "3 applicants have not submitted business plans (deadline: 2026-02-15)." },
    { level: "info",    programId: SAMPLE_CORE, msg: "Mentor matching for cohort 3 is 73% complete — 8 unmatched entrepreneurs remain." },
    { level: "success", programId: SAMPLE_CORE, msg: "ARISE Youth cohort achieved 91% retention — highest in programme history." },
  ];
  const pendingCount = count("Pending");
  const visibleAlerts: { level: string; programId?: string; msg: string }[] = [
    ...alerts.filter(a => inScope(scope, a)),
    ...(pendingCount > 0 ? [{ level: "info", msg: `${pendingCount} application${pendingCount === 1 ? " is" : "s are"} still awaiting review${scope.project ? ` in ${scope.project.name}` : ""}.` }] : []),
  ];

  return (
    <div className="im-fade space-y-6">
      {!hasData && <ProjectEmptyNotice scope={scope} what="programme activity" />}
      {/* Alerts */}
      <div className="space-y-3">
        {visibleAlerts.map((a, i) => {
          const config = {
            warning: { bg: "rgba(245,158,11,0.08)", border: "#d9770620", icon: AlertCircle, color: "#d97706" },
            info:    { bg: "rgba(59,130,246,0.08)",  border: "#2563eb20", icon: Clock,        color: "#2563eb" },
            success: { bg: "rgba(16,185,129,0.08)",  border: "#05996920", icon: CheckCircle,  color: "#059669" },
          }[a.level] ?? { bg: "rgba(59,130,246,0.08)", border: "#2563eb20", icon: Clock, color: "#2563eb" };
          return (
            <div key={i} className="flex items-start gap-3 rounded-md px-4 py-3"
              style={{ background: config.bg, border: `1px solid ${config.border}` }}>
              <config.icon size={14} color={config.color} style={{ marginTop: 1, flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "#374151" }}>{a.msg}</span>
            </div>
          );
        })}
      </div>

      {/* Metric bars */}
      <div className="rounded-md p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <h3 className="font-black text-sm mb-2" style={{ color: NAVY }}>Programme KPIs</h3>
        {(hasData ? metrics : []).map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <m.icon size={12} color={m.color} />
                <span className="text-xs font-semibold text-gray-700">{m.label}</span>
              </div>
              <span className="text-xs font-black" style={{ color: m.color }}>{m.value}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-md overflow-hidden">
              <div className="h-full rounded-md transition-all duration-700" style={{ width: `${m.value}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stage overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText,      label: "Applications",  value: entApps.length,  color: NAVY  },
          { icon: CheckCircle,   label: "Selected",       value: count("Selected"),  color: TEAL  },
          { icon: UserCheck,     label: "Approved",       value: count("Approved"),  color: "#059669" },
          { icon: GitMerge,      label: "Matched",        value: count("Matching"),  color: "#7c3aed" },
          { icon: Activity,      label: "Active Cohort",  value: count("Selected") + count("Approved") + count("Matching"),  color: "#d97706" },
          { icon: GraduationCap, label: "Alumni",          value: alumniCount,   color: "#059669" },
        ].map(c => (
          <div key={c.label} className="rounded-md p-4 flex flex-col gap-2"
            style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${c.color}15` }}>
              <c.icon size={14} color={c.color} />
            </div>
            <div className="font-black text-2xl" style={{ color: c.color }}>{c.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── View: Alumni ──────────────────────────────────────────────────────────────
function AlumniView() {
  const { scope } = useContext(AppDataCtx);
  const alumni = ALUMNI.filter(a => inScope(scope, a));
  if (alumni.length === 0) return <div className="im-fade"><ProjectEmptyNotice scope={scope} what="alumni" /></div>;
  return (
    <div className="im-fade space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {alumni.map((a, i) => (
          <div key={i} className="rounded-md p-5 flex flex-col gap-3"
            style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${TEAL})` }}>
                  <User size={18} color="#fff" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="font-bold text-xs" style={{ color: "#111827" }}>{a.name}</div>
                  <div className="text-[10px] text-gray-500">Cohort {a.cohort}</div>
                </div>
              </div>
              {a.award && <Award size={14} color="#d97706" />}
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-xs" style={{ color: TEAL }}>{a.business}</div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <BookOpen size={10} />{a.sector}
                <MapPin size={10} />{a.district}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Revenue</span>
              <span className="text-xs font-black" style={{ color: "#059669" }}>{a.revenue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── View: Program Setup ───────────────────────────────────────────────────────
type SetupTab = "Overview" | "Timeline" | "Benefits" | "Eligibility";

const PROG_STATUS_COLORS: Record<string, string> = {
  "Accepting Applications": "#16a34a",
  "Coming Soon":            "#d97706",
  "Active":                 "#2563eb",
  "Closed":                 "#6b7280",
};

function ProgramSetupView({
  adminPrograms,
  onCreateProgram,
  onUpdateProgram,
  onDeleteProgram,
}: {
  adminPrograms: AdminProgram[];
  onCreateProgram: (p: AdminProgram) => void;
  onUpdateProgram: (p: AdminProgram) => void;
  onDeleteProgram: (id: string) => void;
}) {
  const [addOpen,       setAddOpen]       = useState(false);
  const [appTab,        setAppTab]        = useState<SetupTab>("Overview");
  const [coverUrl,      setCoverUrl]      = useState<string>("");
  const [savedOnce,     setSavedOnce]     = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Timeline
  const [tlForm,     setTlForm]     = useState({ title: "", date: "", description: "" });
  const [addingTl,   setAddingTl]   = useState(false);
  const [tlEntries,  setTlEntries]  = useState<TimelineEntry[]>([]);

  const emptyProg = {
    name: "", sector: "", description: "",
    status: "Accepting Applications", duration: "", location: "", format: "Hybrid",
    overview: "", benefits: "", eligibility: "",
  };
  const [newProg, setNewProg] = useState(emptyProg);

  // ── Progress calculations ──────────────────────────────────────────────────
  const profileFields = [newProg.name, newProg.sector, newProg.description, newProg.status, newProg.duration, newProg.location, newProg.format, coverUrl];
  const profileFilled = profileFields.filter(Boolean).length;
  const profilePct    = Math.round((profileFilled / 8) * 100);

  const appFilled = [
    tlEntries.length > 0,
    !!newProg.benefits,
    !!newProg.eligibility,
  ].filter(Boolean).length;
  const appPct = Math.round((appFilled / 3) * 100);

  const overviewWords = newProg.overview.trim() === "" ? 0 : newProg.overview.trim().split(/\s+/).length;
  const tlDescWords   = (desc: string) => desc.trim() === "" ? 0 : desc.trim().split(/\s+/).length;

  const handleOverviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val   = e.target.value;
    const words = val.trim() === "" ? [] : val.trim().split(/\s+/);
    if (words.length <= 40) setNewProg(p => ({ ...p, overview: val }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUrl(URL.createObjectURL(file));
  };

  const handleTlAdd = () => {
    if (!tlForm.title.trim() || !tlForm.date.trim() || !tlForm.description.trim()) return;
    const words = tlDescWords(tlForm.description);
    if (words > 18) return;
    const entry: TimelineEntry = {
      id: Date.now().toString(),
      title: tlForm.title,
      date: tlForm.date,
      description: tlForm.description,
    };
    setTlEntries(prev => [...prev, entry]);
    setTlForm({ title: "", date: "", description: "" });
    setAddingTl(false);
  };

  const handleTlRemove = (id: string) => {
    setTlEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveChanges = () => {
    setSavedOnce(true);
    toast.success("Changes saved to preview.");
  };

  const handleCreate = () => {
    if (!savedOnce) return;
    const prog: AdminProgram = {
      id: editingId ?? Date.now().toString(),
      name: newProg.name,
      sector: newProg.sector,
      description: newProg.description,
      status: newProg.status,
      coverUrl,
      duration: newProg.duration,
      location: newProg.location,
      format: newProg.format,
      overview: newProg.overview,
      timelineEntries: tlEntries,
      benefits: newProg.benefits,
      eligibility: newProg.eligibility,
      published: true,
    };
    if (editingId) {
      onUpdateProgram(prog);
      toast.success(`"${prog.name}" updated successfully.`);
    } else {
      onCreateProgram(prog);
      toast.success(`"${prog.name}" created and published!`);
    }
    setNewProg(emptyProg);
    setCoverUrl("");
    setTlEntries([]);
    setSavedOnce(false);
    setEditingId(null);
    setAddOpen(false);
    setAppTab("Overview");
  };

  const handleEdit = (p: AdminProgram) => {
    setEditingId(p.id);
    setNewProg({
      name: p.name, sector: p.sector, description: p.description,
      status: p.status, duration: p.duration, location: p.location,
      format: p.format, overview: p.overview,
      benefits: p.benefits, eligibility: p.eligibility,
    });
    setCoverUrl(p.coverUrl);
    setTlEntries(p.timelineEntries);
    setSavedOnce(false);
    setAddOpen(true);
    setAppTab("Overview");
  };

  const handleCancelEdit = () => {
    setNewProg(emptyProg);
    setCoverUrl("");
    setTlEntries([]);
    setSavedOnce(false);
    setEditingId(null);
    setAddOpen(false);
    setAppTab("Overview");
  };

  const statusColor = PROG_STATUS_COLORS[newProg.status] ?? "#6b7280";
  // Overview tab hidden per requirements — sourced from Program Description
  const appTabs: SetupTab[] = ["Timeline", "Benefits", "Eligibility"];

  // Auto-compute Application Deadline from timeline "Applications Close" entry
  const autoDeadline = tlEntries.find(e =>
    e.title.toLowerCase().includes("application close") ||
    e.title.toLowerCase().includes("applications close")
  )?.date ?? null;

  const progBarColor = (pct: number) =>
    pct === 100 ? "#16a34a" : pct >= 60 ? TEAL : pct >= 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="im-fade space-y-4" style={{ maxWidth: "100%" }}>

      {/* ── Existing programs list ── */}
      {adminPrograms.length > 0 && (
        <div className="rounded-md overflow-hidden" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #f0f0f0" }}>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: NAVY }}>Created Programs</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: NAVY, color: "#fff" }}>{adminPrograms.length} program{adminPrograms.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {adminPrograms.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                {p.coverUrl && <img src={p.coverUrl} alt="" className="w-12 h-8 object-cover rounded-md shrink-0" />}
                {!p.coverUrl && <div className="w-12 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${TEAL}15` }}><FileText size={14} color={TEAL} /></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate" style={{ color: NAVY }}>{p.name || "Untitled"}</div>
                  <div className="text-[10px]" style={{ color: "#6b7280" }}>{p.sector || "—"} · {p.format}</div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0"
                  style={{ background: NAVY, color: "#fff" }}>
                  {p.published ? p.status : "Unpublished"}
                </span>
                <button
                  onClick={() => handleEdit(p)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all"
                  style={{ background: TEAL, color: "#fff" }}>
                  <Edit2 size={10} /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(p.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all"
                  style={{ background: TEAL, color: "#fff" }}>
                  <TrashIcon size={10} /> {p.published ? "Unpublish" : "Unpublished"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-md p-6 max-w-sm w-full mx-4 space-y-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "#fef2f2" }}>
                <TrashIcon size={18} color="#ef4444" />
              </div>
              <div>
                <div className="font-black text-sm" style={{ color: NAVY }}>Unpublish Program?</div>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>This hides it from the public landing page</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
              The program will be <strong>removed from the public Incubation Programs page</strong> but will remain in the admin dashboard for editing or republishing.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  const prog = adminPrograms.find(x => x.id === deleteConfirm);
                  onDeleteProgram(deleteConfirm);
                  toast.success(`"${prog?.name ?? "Program"}" unpublished from public view.`);
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-2.5 rounded-md text-xs font-bold text-white"
                style={{ background: TEAL }}>
                Yes, Unpublish
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-md text-xs font-bold"
                style={{ background: "#f3f4f6", color: "#6b7280" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Program accordion ── */}
      <div className="rounded-md overflow-hidden" style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

        {/* Header toggle */}
        <button
          onClick={() => { if (!addOpen) { setAddOpen(true); } else { handleCancelEdit(); } }}
          className="flex items-center justify-between w-full px-6 py-4 text-left transition-all"
          style={{ background: addOpen ? `${TEAL}10` : "#fff", borderBottom: addOpen ? `1px solid ${TEAL}30` : "none" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: addOpen ? TEAL : `${TEAL}20` }}>
              {editingId ? <Edit2 size={14} color={addOpen ? "#fff" : TEAL} /> : <PlusCircle size={14} color={addOpen ? "#fff" : TEAL} />}
            </div>
            <span className="font-bold text-sm" style={{ color: NAVY }}>
              {editingId ? "Edit Program" : "Add New Program"}
            </span>
          </div>
          {addOpen ? <ChevronDown size={15} color={TEAL} /> : <ChevronRight size={15} color="#9ca3af" />}
        </button>

        {/* ── Expanded body: left form + right preview ── */}
        {addOpen && (
          <div className="im-fade flex gap-0" style={{ alignItems: "flex-start" }}>

            {/* ══ LEFT: Program Profile form ══ */}
            <div className="flex-1 min-w-0 px-6 py-6 space-y-5" style={{ borderRight: "1px solid #f0f0f0" }}>

              {/* ── Program Profile progress bar ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: TEAL }}>Program Profile</span>
                  <div className="flex items-center gap-2">
                    {profilePct === 100 && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md" style={{ background: "#f0fdf4", color: "#16a34a" }}>✓ Completed</span>
                    )}
                    <span className="text-[10px] font-bold" style={{ color: progBarColor(profilePct) }}>{profilePct}%</span>
                  </div>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: "#f3f4f6" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${profilePct}%`, background: progBarColor(profilePct), borderRadius: "9999px" }}
                  />
                </div>
              </div>

              {/* Row 1: Name + Sector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Name</label>
                  <input type="text" placeholder="Zantchito Incubation"
                    value={newProg.name} onChange={e => setNewProg(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Sector</label>
                  <input type="text" placeholder="AgriTech, CleanEnergy"
                    value={newProg.sector} onChange={e => setNewProg(p => ({ ...p, sector: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                </div>
              </div>

              {/* Program Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Description</label>
                <textarea rows={3} placeholder="Briefly describe program goals, target beneficiaries and expected outcomes..."
                  value={newProg.description} onChange={e => setNewProg(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none resize-none"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
              </div>

              {/* Row 2: Status + Format */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Status</label>
                  <select value={newProg.status} onChange={e => setNewProg(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}>
                    {["Accepting Applications", "Coming Soon", "Active", "Closed"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Format</label>
                  <select value={newProg.format} onChange={e => setNewProg(p => ({ ...p, format: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}>
                    {["Hybrid", "Virtual", "Physical", "Virtual & Physical"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Duration + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Duration</label>
                  <input type="text" placeholder="6 Months"
                    value={newProg.duration} onChange={e => setNewProg(p => ({ ...p, duration: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Location</label>
                  <input type="text" placeholder="Mzuzu, Malawi"
                    value={newProg.location} onChange={e => setNewProg(p => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                </div>
              </div>

              {/* Cover Photo upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Program Cover Photo</label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-md cursor-pointer transition-all"
                  style={{ border: `2px dashed ${coverUrl ? TEAL : "#d1d5db"}`, background: coverUrl ? "#f0faf9" : "#f9fafb", minHeight: coverUrl ? "auto" : 90, overflow: "hidden" }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full object-cover" style={{ height: 90 }} />
                  ) : (
                    <div className="flex flex-col items-center py-5 gap-1.5">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${TEAL}15` }}><Camera size={16} color={TEAL} /></div>
                      <span className="text-[10px] font-bold" style={{ color: TEAL }}>Click to upload cover photo</span>
                      <span className="text-[9px]" style={{ color: "#9ca3af" }}>JPG, PNG — fits card banner exactly</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                {coverUrl && <button onClick={() => setCoverUrl("")} className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>× Remove photo</button>}
              </div>

              {/* ── Application Setup ── */}
              <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${TEAL}30` }}>
                {/* App setup progress bar */}
                <div className="px-4 py-2.5 space-y-1.5" style={{ background: `${TEAL}10`, borderBottom: `1px solid ${TEAL}20` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: TEAL }}>Application Setup</span>
                    <div className="flex items-center gap-2">
                      {appPct === 100 && <span className="text-[9px] font-black px-2 py-0.5 rounded-md" style={{ background: "#f0fdf4", color: "#16a34a" }}>✓ Completed</span>}
                      <span className="text-[10px] font-bold" style={{ color: progBarColor(appPct) }}>{appPct}%</span>
                    </div>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.4)" }}>
                    <div className="h-full transition-all duration-500" style={{ width: `${appPct}%`, background: progBarColor(appPct), borderRadius: "9999px" }} />
                  </div>
                  <div className="flex gap-1">
                    {appTabs.map((t, i) => (
                      <div key={t} className="flex-1 h-1 rounded-full" style={{ background: [tlEntries.length > 0, !!newProg.benefits, !!newProg.eligibility][i] ? progBarColor(100) : "rgba(255,255,255,0.3)" }} />
                    ))}
                  </div>
                </div>
                {/* Tab strip */}
                <div className="flex" style={{ borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
                  {appTabs.map(t => (
                    <button key={t} onClick={() => setAppTab(t)}
                      className="flex-1 py-2.5 text-[11px] font-bold transition-all"
                      style={{ color: appTab === t ? TEAL : "#6b7280", borderBottom: appTab === t ? `2px solid ${TEAL}` : "2px solid transparent", background: "transparent" }}>
                      {t}
                    </button>
                  ))}
                </div>
                {/* Auto-detected Application Deadline */}
                <div className="px-4 py-2.5 flex items-center gap-3" style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Application Deadline</span>
                  <span className="text-[10px] font-black" style={{ color: autoDeadline ? NAVY : "#9ca3af" }}>
                    {autoDeadline ? autoDeadline : "Add an \"Applications Close\" timeline entry to auto-populate"}
                  </span>
                  {autoDeadline && <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: "#f0fdf4", color: "#16a34a" }}>Auto</span>}
                </div>
                {/* Tab panels */}
                <div className="p-4" style={{ background: "#fafafa" }}>
                  {appTab === "Timeline" && (
                    <div className="space-y-3">
                      {/* Existing entries */}
                      {tlEntries.length > 0 && (
                        <div className="space-y-2">
                          {tlEntries.map((entry, i) => (
                            <div key={entry.id} className="flex gap-3 items-start">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 text-white"
                                  style={{ background: i === 0 ? TEAL : NAVY }}>{i + 1}</div>
                                {i < tlEntries.length - 1 && <div className="w-px flex-1 my-1" style={{ background: `${NAVY}20`, minHeight: 12 }} />}
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold" style={{ color: NAVY }}>{entry.title}</span>
                                  <button onClick={() => handleTlRemove(entry.id)} className="text-[9px] font-bold shrink-0" style={{ color: "#ef4444" }}>Remove</button>
                                </div>
                                <div className="text-[10px] font-semibold mb-0.5" style={{ color: TEAL }}>{entry.date}</div>
                                <p className="text-[10px] leading-relaxed" style={{ color: "#6b7280" }}>{entry.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add Timeline button / form */}
                      {!addingTl ? (
                        <button onClick={() => setAddingTl(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold w-full justify-center transition-all"
                          style={{ border: `1.5px dashed ${TEAL}`, color: TEAL, background: `${TEAL}05` }}>
                          <Plus size={12} /> Add Timeline Entry
                        </button>
                      ) : (
                        <div className="rounded-md p-4 space-y-3" style={{ border: `1px solid ${TEAL}30`, background: "#fff" }}>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: TEAL }}>New Timeline Entry</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Title</label>
                              <input type="text" placeholder="Applications Open"
                                value={tlForm.title} onChange={e => setTlForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full rounded-md px-2.5 py-2 text-xs focus:outline-none"
                                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date</label>
                              <input type="text" placeholder="1 July 2026"
                                value={tlForm.date} onChange={e => setTlForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full rounded-md px-2.5 py-2 text-xs focus:outline-none"
                                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Activity Description</label>
                              <span className="text-[9px] font-bold" style={{ color: tlDescWords(tlForm.description) >= 18 ? "#ef4444" : "#9ca3af" }}>
                                {tlDescWords(tlForm.description)} / 18 words
                              </span>
                            </div>
                            <textarea rows={2} placeholder="Brief description of what happens on this date..."
                              value={tlForm.description}
                              onChange={e => {
                                const words = e.target.value.trim() === "" ? [] : e.target.value.trim().split(/\s+/);
                                if (words.length <= 18) setTlForm(f => ({ ...f, description: e.target.value }));
                              }}
                              className="w-full rounded-md px-2.5 py-2 text-xs focus:outline-none resize-none"
                              style={{ background: "#f9fafb", border: `1px solid ${tlDescWords(tlForm.description) >= 18 ? "#ef4444" : "#e5e7eb"}`, color: "#111827" }} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleTlAdd}
                              className="px-4 py-1.5 rounded-md text-[11px] font-bold text-white"
                              style={{ background: TEAL }}>Add Entry</button>
                            <button onClick={() => { setAddingTl(false); setTlForm({ title: "", date: "", description: "" }); }}
                              className="px-4 py-1.5 rounded-md text-[11px] font-bold"
                              style={{ background: "#f3f4f6", color: "#6b7280" }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {appTab === "Benefits" && (
                    <textarea rows={5} placeholder="Benefits participants will receive (one per line: seed funding, mentorship, certification)..."
                      value={newProg.benefits} onChange={e => setNewProg(p => ({ ...p, benefits: e.target.value }))}
                      className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none resize-none"
                      style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#111827" }} />
                  )}
                  {appTab === "Eligibility" && (
                    <textarea rows={5} placeholder="Eligibility criteria (one per line: age range, business stage, residency)..."
                      value={newProg.eligibility} onChange={e => setNewProg(p => ({ ...p, eligibility: e.target.value }))}
                      className="w-full rounded-md px-3 py-2.5 text-xs font-semibold focus:outline-none resize-none"
                      style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#111827" }} />
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={!savedOnce}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold text-white transition-all"
                  style={{ background: savedOnce ? TEAL : "#d1d5db", cursor: savedOnce ? "pointer" : "not-allowed" }}>
                  <CheckCircle size={13} /> {editingId ? "Save Edits" : "Create Program"}
                </button>
                {!savedOnce && (
                  <span className="text-[10px] self-center" style={{ color: "#9ca3af" }}>Click "Save Changes" in the preview first</span>
                )}
                <button onClick={handleCancelEdit}
                  className="ml-auto px-5 py-2.5 rounded-md text-xs font-bold"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}>
                  Cancel
                </button>
              </div>
            </div>

            {/* ══ RIGHT: Live Preview (mirrors IncubationPage ProgramCard) ══ */}
            <div className="shrink-0 px-5 py-6 space-y-3" style={{ width: 290, background: "#f8f9fb" }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9ca3af" }}>Live Preview</p>

              <div className="rounded-md overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(59,65,103,0.15)", boxShadow: "0 4px 24px rgba(59,65,103,0.10)" }}>
                {/* Photo banner */}
                <div className="relative overflow-hidden" style={{ height: 130 }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}>
                      <span style={{ fontSize: 28, opacity: 0.3 }}>🖼</span>
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(30,35,64,0.35) 0%, rgba(30,35,64,0.65) 100%)" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
                    <h3 className="text-white font-bold text-center drop-shadow-lg" style={{ fontSize: "0.85rem", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
                      {newProg.name || <span style={{ opacity: 0.5 }}>Program Name</span>}
                    </h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: statusColor + "dd", color: "#fff" }}>
                      {newProg.status}
                    </span>
                  </div>
                </div>

                {/* 2×2 info tiles */}
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Duration", value: newProg.duration || "—" },
                      { label: "Format",   value: newProg.format   || "—" },
                      { label: "Location", value: newProg.location || "—" },
                      { label: "Sector",   value: newProg.sector   || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-md p-2" style={{ border: "1px solid rgba(59,65,103,0.12)", background: "#f8f9fb" }}>
                        <div className="text-[9px] font-bold" style={{ color: NAVY }}>{label}</div>
                        <div className="text-[9px] mt-0.5 truncate" style={{ color: "#6b7280" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Description shown as overview (sourced from Program Description) */}
                  {newProg.description && (
                    <p className="text-[9px] leading-relaxed" style={{ color: "#6b7280" }}>
                      {newProg.description.slice(0, 120)}{newProg.description.length > 120 ? "…" : ""}
                    </p>
                  )}
                  {/* Auto deadline */}
                  {autoDeadline && (
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                      <span className="text-[8px] font-bold" style={{ color: "#ef4444" }}>Deadline:</span>
                      <span className="text-[8px] font-semibold" style={{ color: "#374151" }}>{autoDeadline}</span>
                    </div>
                  )}

                  {/* Timeline preview — matches IncubationPage flex flex-col items-center structure */}
                  {tlEntries.length > 0 && (
                    <div className="space-y-2 pt-1 border-t" style={{ borderColor: "#f0f0f0" }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Timeline</p>
                      {tlEntries.slice(0, 3).map((entry, i) => (
                        <div key={entry.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 text-white"
                              style={{ background: i === 0 ? TEAL : NAVY }}>{i + 1}</div>
                            {i < Math.min(tlEntries.length, 3) - 1 && <div className="w-px flex-1 my-0.5" style={{ background: `${NAVY}20`, minHeight: 8 }} />}
                          </div>
                          <div className="pb-1.5 flex-1">
                            <div className="text-[9px] font-bold" style={{ color: NAVY }}>{entry.title}</div>
                            <div className="text-[8px] font-semibold" style={{ color: TEAL }}>{entry.date}</div>
                            <p className="text-[8px] leading-relaxed" style={{ color: "#6b7280" }}>{entry.description}</p>
                          </div>
                        </div>
                      ))}
                      {tlEntries.length > 3 && (
                        <p className="text-[8px]" style={{ color: "#9ca3af" }}>+{tlEntries.length - 3} more entries</p>
                      )}
                    </div>
                  )}

                  {/* Application Setup completion pills */}
                  <div className="flex flex-wrap gap-1">
                    {([
                      { label: "Timeline",    filled: tlEntries.length > 0 },
                      { label: "Benefits",    filled: !!newProg.benefits },
                      { label: "Eligibility", filled: !!newProg.eligibility },
                    ]).map(({ label, filled }) => (
                      <span key={label} className="rounded-md px-2 py-0.5 text-[8px] font-bold"
                        style={{ background: filled ? `${TEAL}15` : "#f3f4f6", color: filled ? TEAL : "#9ca3af" }}>
                        {filled ? "✓ " : ""}{label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Changes */}
              <button
                onClick={handleSaveChanges}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold text-white transition-all"
                style={{ background: TEAL, color: "#fff" }}>
                <CheckCircle size={13} /> Save Changes
              </button>
              {savedOnce && (
                <p className="text-[10px] text-center font-semibold" style={{ color: "#16a34a" }}>
                  ✓ Changes saved — you can now create the program
                </p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── View: Settings ────────────────────────────────────────────────────────────
function SettingsView() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    twoFactorAuth: true,
    publicReports: false,
  });

  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: "emailNotifications", label: "Email Notifications", desc: "Receive email alerts for new applications and updates" },
    { key: "smsAlerts",          label: "SMS Alerts",          desc: "Get SMS alerts for critical programme milestones" },
    { key: "twoFactorAuth",      label: "Two-Factor Auth",     desc: "Require 2FA for all programme manager logins" },
    { key: "publicReports",      label: "Public Reports",      desc: "Allow stakeholders to view anonymised programme reports" },
  ];

  return (
    <div className="im-fade space-y-4 max-w-2xl">
      {items.map(s => {
        const on = settings[s.key];
        return (
          <div key={s.key} className="flex items-center justify-between rounded-md px-5 py-4"
            style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div>
              <div className="font-bold text-xs" style={{ color: "#111827" }}>{s.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.desc}</div>
            </div>
            <button
              role="switch"
              aria-checked={on}
              onClick={() => setSettings(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
              className="relative cursor-pointer shrink-0 focus:outline-none"
              style={{ width: 40, height: 22, borderRadius: 11, background: on ? TEAL : "#d1d5db", border: "none", padding: 0, transition: "background 0.2s" }}
            >
              <span
                className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: on ? "calc(100% - 19px)" : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Admin Panel View Components ───────────────────────────────────────────────

// Admin decisions survive a refresh and leaving the page (applications themselves are stored by App)
function loadDecisions(): { statusOverrides?: any; pairings?: any; notifications?: any } {
  try { const v = JSON.parse(localStorage.getItem(DECISIONS_KEY) ?? "null"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

const COHORTS_DATA = [
  { id: 1, programId: SAMPLE_CORE, name: "Cohort 5 — 2025", status: "Active", startDate: "Jan 2025", endDate: "Dec 2025", mentees: 18, mentors: 8, avgProgress: 62, sector: "Mixed" },
  { id: 2, programId: SAMPLE_CORE, name: "Cohort 4 — 2024", status: "Completed", startDate: "Jan 2024", endDate: "Dec 2024", mentees: 22, mentors: 10, avgProgress: 100, sector: "AgriTech" },
  { id: 3, programId: SAMPLE_CORE, name: "Cohort 3 — 2023", status: "Completed", startDate: "Jan 2023", endDate: "Dec 2023", mentees: 16, mentors: 7, avgProgress: 100, sector: "CleanEnergy" },
  { id: 4, programId: SAMPLE_SHE,  name: "Cohort 1 — 2025", status: "Active", startDate: "Aug 2025", endDate: "Jan 2026", mentees: 8, mentors: 4, avgProgress: 48, sector: "Women-led" },
];
type CohortRow = { id: number; programId?: string; name: string; status: string; startDate: string; endDate: string; mentees: number; mentors: number; avgProgress: number; sector: string };

// ── AI Matching Engine — Data & Algorithm ─────────────────────────────────────
interface EntMatchProfile {
  id: string; name: string; district: string; sector: string;
  businessStage: string; businessNeeds: string[];
  skillRatings: Record<string, number>;
  languages: string[];
  isYouth: boolean; isWoman: boolean; isRural: boolean;
  mentoringMode: string;
  motivation: string; businessDescription: string;
}
interface MentorMatchProfile {
  id: string; name: string; district: string; expertise: string;
  programmeInterest: string[];
  stageExpertise: string[]; preferredStages: string[];
  industryExpertise: string[]; preferredIndustries: string[];
  functionalExpertise: string[];
  hasEntrepreneurialExp: boolean; yearsExperience: number; startupsmentored: number;
  preferredFounderTypes: string[];
  languages: string[]; mentoringMode: string;
  hoursPerMonth: number; currentMenteeCount: number; maxMenteeCount: number;
  biography: string; personality: string;
}
interface MatchResult {
  mentor: MentorMatchProfile; score: number; semanticBonus: number;
  breakdown: { label: string; score: number; weight: number }[];
  explanation: string;
}

const ENT_MATCH_PROFILES: EntMatchProfile[] = [
  {
    id: "APP-005", name: "Lusungu Nyirenda", district: "Kasungu", sector: "Services",
    businessStage: "Idea",
    businessNeeds: ["Business Planning", "Marketing", "Financial Management"],
    skillRatings: { Leadership: 2, Sales: 2, Finance: 1, Marketing: 3, Operations: 3 },
    languages: ["English", "Chichewa"],
    isYouth: true, isWoman: false, isRural: true, mentoringMode: "Hybrid",
    motivation: "I want to create affordable cleaning and hygiene services that serve rural communities who lack access to professional home services.",
    businessDescription: "Community-based cleaning and hygiene services targeting low-income rural households in Kasungu, creating local youth employment.",
  },
  {
    id: "APP-010", name: "Alinafe Gondwe", district: "Salima", sector: "Services",
    businessStage: "Validation",
    businessNeeds: ["Marketing", "Financial Management", "Legal"],
    skillRatings: { Leadership: 3, Sales: 3, Finance: 2, Marketing: 2, Operations: 3, Legal: 1 },
    languages: ["English", "Chichewa", "Tumbuka"],
    isYouth: false, isWoman: true, isRural: true, mentoringMode: "Online",
    motivation: "As a woman entrepreneur in a rural area, I am building a logistics service to connect small traders with larger markets, reducing the distribution challenge they face daily.",
    businessDescription: "Last-mile logistics and distribution connecting smallholder traders in Salima and nearby districts with urban markets.",
  },
  {
    id: "APP-015", name: "Tamara Kachingwe", district: "Blantyre", sector: "Financial Services",
    businessStage: "Prototype-MVP",
    businessNeeds: ["Investment Readiness", "Marketing", "Operations"],
    skillRatings: { Leadership: 4, Sales: 3, Finance: 3, Marketing: 2, Operations: 2, Technology: 2 },
    languages: ["English"],
    isYouth: false, isWoman: true, isRural: false, mentoringMode: "Online",
    motivation: "I have built a savings and micro-credit platform for market women. I need guidance on investor readiness and how to scale commercially.",
    businessDescription: "Mobile-based savings and micro-credit platform tailored for informal market women in southern Malawi, with a working MVP and 120 active users.",
  },
];

const KNOWN_ENT_PROFILES: Record<string, EntMatchProfile> = {
  "APP-022": {
    id: "APP-022",
    name: "Dalitso Mvula",
    district: "Lilongwe",
    sector: "Agri-Business",
    businessStage: "MVP",
    businessNeeds: ["Agriculture", "Business Strategy", "Operations", "Financial Management"],
    skillRatings: { Leadership: 3, Sales: 2, Finance: 2, Operations: 3, Agriculture: 4 },
    languages: ["English", "Chichewa"],
    isYouth: true,
    isWoman: false,
    isRural: false,
    mentoringMode: "Hybrid",
    motivation: "Expanding GreenSprout Hydroponics commercial greenhouse systems in Lilongwe to increase vegetable yields and create youth agribusiness employment.",
    businessDescription: "GreenSprout Hydroponics builds climate-smart hydroponics and greenhouse systems supplying fresh quality produce across central Malawi.",
  },
  "APP-023": {
    id: "APP-023",
    name: "Brian Kumwenda",
    district: "Mzuzu",
    sector: "Technology",
    businessStage: "MVP",
    businessNeeds: ["Technology", "Business Strategy", "Marketing", "Investment Readiness"],
    skillRatings: { Leadership: 3, Technology: 4, Sales: 2, Finance: 1, Marketing: 2 },
    languages: ["English", "Tumbuka", "Chichewa"],
    isYouth: true,
    isWoman: false,
    isRural: false,
    mentoringMode: "Online",
    motivation: "Empowering northern youth through tech skill incubation and delivering software solutions for regional SMEs.",
    businessDescription: "Mzuzu Coders Hub provides software engineering services, tech talent incubation, and digital transformation for businesses in Northern Malawi.",
  },
  "APP-024": {
    id: "APP-024",
    name: "Enelesi Phiri",
    district: "Zomba",
    sector: "Creative Arts",
    businessStage: "Early Traction",
    businessNeeds: ["Marketing", "Financial Management", "Export Strategy", "Business Planning"],
    skillRatings: { Leadership: 3, Operations: 4, Marketing: 2, Finance: 1, Sales: 3 },
    languages: ["English", "Chichewa"],
    isYouth: false,
    isWoman: true,
    isRural: true,
    mentoringMode: "Hybrid",
    motivation: "Uniting rural women artisans and weavers to preserve traditional craft while accessing urban and international craft markets.",
    businessDescription: "Zomba Weavers Co-op produces high-quality artisanal textiles and woven goods, empowering over 45 rural women in Zomba district.",
  },
  "Grace Kamwendo": {
    id: "APP-009",
    name: "Grace Kamwendo",
    district: "Lilongwe",
    sector: "HealthTech",
    businessStage: "MVP",
    businessNeeds: ["Business Strategy", "Operations", "HealthTech Commercialization", "Marketing"],
    skillRatings: { Leadership: 4, Sales: 2, Finance: 2, Operations: 3, Technology: 4 },
    languages: ["English", "Chichewa"],
    isYouth: true,
    isWoman: true,
    isRural: false,
    mentoringMode: "Hybrid",
    motivation: "Scaling HealthTrack digital health diagnostics for community health workers and rural clinics across Malawi.",
    businessDescription: "HealthTrack develops mobile-enabled digital diagnostic and health records solutions for frontline clinics and healthcare workers.",
  },
};

KNOWN_ENT_PROFILES["Dalitso Mvula"] = KNOWN_ENT_PROFILES["APP-022"];
KNOWN_ENT_PROFILES["Brian Kumwenda"] = KNOWN_ENT_PROFILES["APP-023"];
KNOWN_ENT_PROFILES["Enelesi Phiri"] = KNOWN_ENT_PROFILES["APP-024"];
KNOWN_ENT_PROFILES["APP-009"] = KNOWN_ENT_PROFILES["Grace Kamwendo"];

function getProfileForMentee(nameOrId: string, fallback?: Partial<EntMatchProfile>): EntMatchProfile {
  if (KNOWN_ENT_PROFILES[nameOrId]) return KNOWN_ENT_PROFILES[nameOrId];
  const found = Object.values(KNOWN_ENT_PROFILES).find(
    p => p.id === nameOrId || p.name.toLowerCase() === nameOrId.toLowerCase()
  );
  if (found) return found;
  return {
    id: fallback?.id || `APP-${Date.now()}`,
    name: fallback?.name || nameOrId,
    district: fallback?.district || "Lilongwe",
    sector: fallback?.sector || "Services",
    businessStage: fallback?.businessStage || "MVP",
    businessNeeds: fallback?.businessNeeds || ["Business Planning", "Marketing", "Financial Management"],
    skillRatings: fallback?.skillRatings || { Leadership: 3, Sales: 2, Finance: 2, Operations: 3 },
    languages: fallback?.languages || ["English", "Chichewa"],
    isYouth: fallback?.isYouth ?? true,
    isWoman: fallback?.isWoman ?? false,
    isRural: fallback?.isRural ?? false,
    mentoringMode: fallback?.mentoringMode || "Hybrid",
    motivation: fallback?.motivation || `Entrepreneur developing venture seeking strategic mentorship.`,
    businessDescription: fallback?.businessDescription || "Enterprise venture.",
  };
}

const MENTOR_MATCH_PROFILES: MentorMatchProfile[] = [
  {
    id: "MNT-001", name: "Dr. Thoko Banda", district: "Lilongwe", expertise: "Business Strategy",
    programmeInterest: ["Both"],
    stageExpertise: ["Idea", "Validation", "Prototype-MVP", "MVP", "Early Startup"], preferredStages: ["Idea", "Validation", "Prototype-MVP", "MVP"],
    industryExpertise: ["Services", "Trade", "Financial Services", "Health & Wellbeing", "HealthTech"], preferredIndustries: ["Services", "Financial Services", "Health & Wellbeing"],
    functionalExpertise: ["Business Planning", "Marketing", "Strategy", "Operations", "HealthTech Commercialization", "Regulatory Compliance", "Scaling Strategy"],
    hasEntrepreneurialExp: true, yearsExperience: 15, startupsmentored: 12,
    preferredFounderTypes: ["Youth", "Women"],
    languages: ["English", "Chichewa"], mentoringMode: "Hybrid",
    hoursPerMonth: 12, currentMenteeCount: 2, maxMenteeCount: 4,
    biography: "Former MD of a regional services firm with 15 years in SME strategy and health-tech business development across Malawi and East Africa.",
    personality: "Patient and empathetic",
  },
  {
    id: "MNT-002", name: "Mr. Chikumbe Phiri", district: "Blantyre", expertise: "Finance & Accounts",
    programmeInterest: ["Incubation Programme", "Both"],
    stageExpertise: ["Idea", "Validation", "Prototype-MVP", "MVP"], preferredStages: ["Idea", "Validation", "Prototype-MVP", "MVP"],
    industryExpertise: ["Financial Services", "Services", "Trade", "Health & Wellbeing"], preferredIndustries: ["Financial Services", "Services", "Health & Wellbeing"],
    functionalExpertise: ["Financial Management", "Business Planning", "Investment Readiness", "Legal", "Operations"],
    hasEntrepreneurialExp: true, yearsExperience: 12, startupsmentored: 8,
    preferredFounderTypes: ["Youth", "Rural", "Women"],
    languages: ["English", "Chichewa"], mentoringMode: "Hybrid",
    hoursPerMonth: 10, currentMenteeCount: 2, maxMenteeCount: 4,
    biography: "Certified accountant and SME finance consultant with experience structuring financial models for early-stage and healthcare businesses in southern Malawi.",
    personality: "Direct and honest",
  },
  {
    id: "MNT-005", name: "Mrs. Faith Nyirenda", district: "Kasungu", expertise: "Marketing",
    programmeInterest: ["Both"],
    stageExpertise: ["Idea", "Validation", "Prototype-MVP", "MVP"], preferredStages: ["Idea", "Validation", "Prototype-MVP"],
    industryExpertise: ["Services", "Trade", "Agriculture", "Agri-Business"], preferredIndustries: ["Services", "Trade", "Agriculture"],
    functionalExpertise: ["Marketing", "Sales", "Business Planning", "Operations", "Market Expansion"],
    hasEntrepreneurialExp: true, yearsExperience: 8, startupsmentored: 6,
    preferredFounderTypes: ["Women", "Rural", "Youth"],
    languages: ["English", "Chichewa", "Tumbuka"], mentoringMode: "Hybrid",
    hoursPerMonth: 8, currentMenteeCount: 1, maxMenteeCount: 3,
    biography: "Marketing director and founder of a trade enterprise in Kasungu. Expert in rural market development, brand building for small businesses and distribution strategy.",
    personality: "Encouraging and enthusiastic",
  },
  {
    id: "MNT-007", name: "Ms. Miriam Kamwana", district: "Lilongwe", expertise: "Social Enterprise",
    programmeInterest: ["Both"],
    stageExpertise: ["Idea", "Validation", "Prototype-MVP", "MVP"], preferredStages: ["Idea", "Prototype-MVP"],
    industryExpertise: ["Health & Wellbeing", "Education & Training", "Services", "HealthTech"], preferredIndustries: ["Health & Wellbeing", "Education & Training", "Services"],
    functionalExpertise: ["Leadership", "Marketing", "Operations", "Strategy", "Regulatory Compliance", "HealthTech Commercialization"],
    hasEntrepreneurialExp: true, yearsExperience: 10, startupsmentored: 5,
    preferredFounderTypes: ["Women", "Youth", "Rural"],
    languages: ["English", "Chichewa", "Tumbuka"], mentoringMode: "Online",
    hoursPerMonth: 10, currentMenteeCount: 2, maxMenteeCount: 4,
    biography: "Social entrepreneur and women-in-business advocate with a decade growing healthcare and community enterprises across Malawi and Zambia.",
    personality: "Patient and empathetic",
  },
  {
    id: "MNT-010", name: "Mr. Charles Nkosi", district: "Mulanje", expertise: "Business Strategy",
    programmeInterest: ["Incubation Programme", "Both"],
    stageExpertise: ["Idea", "Validation", "Prototype-MVP", "MVP", "Early Startup"], preferredStages: ["Prototype-MVP", "MVP", "Early Startup"],
    industryExpertise: ["Financial Services", "Technology", "Trade", "Services"], preferredIndustries: ["Financial Services", "Technology"],
    functionalExpertise: ["Strategy", "Financial Management", "Investment Readiness", "Marketing", "Operations"],
    hasEntrepreneurialExp: true, yearsExperience: 18, startupsmentored: 14,
    preferredFounderTypes: ["Youth", "Women"],
    languages: ["English", "Chichewa"], mentoringMode: "Online",
    hoursPerMonth: 15, currentMenteeCount: 3, maxMenteeCount: 5,
    biography: "Serial entrepreneur and investment advisor with 18 years in financial services and technology. Founded 3 businesses and advised 14 startups across sub-Saharan Africa.",
    personality: "Structured and goal-oriented",
  },
  {
    id: "MNT-012", name: "Dr. Felix Kaunda", district: "Blantyre", expertise: "Investment & VC",
    programmeInterest: ["Both"],
    stageExpertise: ["Prototype-MVP", "MVP", "Early Startup"], preferredStages: ["Prototype-MVP", "MVP", "Early Startup"],
    industryExpertise: ["Financial Services", "Technology", "Services", "Health & Wellbeing"], preferredIndustries: ["Financial Services", "Technology", "Health & Wellbeing"],
    functionalExpertise: ["Investment Readiness", "Financial Management", "Legal", "Operations", "Marketing", "Scaling Strategy"],
    hasEntrepreneurialExp: true, yearsExperience: 20, startupsmentored: 20,
    preferredFounderTypes: ["Women", "Youth"],
    languages: ["English", "Chichewa"], mentoringMode: "Hybrid",
    hoursPerMonth: 8, currentMenteeCount: 2, maxMenteeCount: 4,
    biography: "Investment analyst, venture advisor and co-founder of a fintech company. Specialises in connecting female-led startups with impact investors across Africa.",
    personality: "Direct and results-driven",
  },
];

function computeMatch(ent: EntMatchProfile, mentor: MentorMatchProfile): MatchResult | null {
  if (!mentor.programmeInterest.some(p => p === "Incubation Programme" || p === "Both")) return null;
  if (!ent.languages.some(l => mentor.languages.includes(l))) return null;
  if (mentor.currentMenteeCount >= mentor.maxMenteeCount) return null;

  const stageScore = mentor.stageExpertise.includes(ent.businessStage) && mentor.preferredStages.includes(ent.businessStage) ? 100
    : mentor.stageExpertise.includes(ent.businessStage) ? 75
    : mentor.preferredStages.includes(ent.businessStage) ? 60 : 15;

  const sectorScore = mentor.industryExpertise.includes(ent.sector) && mentor.preferredIndustries.includes(ent.sector) ? 100
    : mentor.industryExpertise.includes(ent.sector) ? 80
    : mentor.preferredIndustries.includes(ent.sector) ? 60 : 10;

  const matchedNeeds = ent.businessNeeds.filter(n =>
    mentor.functionalExpertise.some(e => e.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(e.toLowerCase()))
  );
  const needsScore = ent.businessNeeds.length > 0 ? Math.round((matchedNeeds.length / ent.businessNeeds.length) * 100) : 50;

  const weakSkills = Object.entries(ent.skillRatings).filter(([, v]) => v <= 2).map(([k]) => k);
  const coveredSkills = weakSkills.filter(s => mentor.functionalExpertise.some(e => e.toLowerCase().includes(s.toLowerCase())));
  const skillsScore = weakSkills.length > 0 ? Math.round((coveredSkills.length / weakSkills.length) * 100) : 60;

  const entTypes = ([ent.isYouth && "Youth", ent.isWoman && "Women", ent.isRural && "Rural"] as (string | false)[]).filter(Boolean) as string[];
  const typeMatches = entTypes.filter(t => mentor.preferredFounderTypes.includes(t));
  const founderScore = entTypes.length > 0 ? Math.round((typeMatches.length / entTypes.length) * 100) : 50;

  const sharedLangs = ent.languages.filter(l => mentor.languages.includes(l)).length;
  const langScore = Math.min(100, sharedLangs * 50);

  const sameDistrict = ent.district === mentor.district;
  const logisticsScore = sameDistrict ? 100 : mentor.mentoringMode !== "In-Person" ? 65 : 25;

  const empathyScore = mentor.hasEntrepreneurialExp
    ? (mentor.industryExpertise.includes(ent.sector) ? 100 : 65) : 20;

  const trackScore = Math.min(100, mentor.startupsmentored * 5);

  const weighted = Math.round(
    0.25 * stageScore + 0.20 * sectorScore + 0.20 * needsScore +
    0.10 * skillsScore + 0.08 * founderScore + 0.05 * langScore +
    0.05 * logisticsScore + 0.04 * empathyScore + 0.03 * trackScore
  );
  const semanticBonus = Math.min(10, Math.round((stageScore + sectorScore + needsScore) / 300 * 10));
  const score = Math.min(100, weighted + semanticBonus);

  const reasons: string[] = [];
  if (stageScore >= 75) reasons.push(`${ent.businessStage} stage expertise`);
  if (sectorScore >= 60) reasons.push(`${ent.sector} sector alignment`);
  if (matchedNeeds.length > 0) reasons.push(`covers ${matchedNeeds.length}/${ent.businessNeeds.length} stated needs (${matchedNeeds.join(", ")})`);
  if (coveredSkills.length > 0) reasons.push(`addresses skills gaps in ${coveredSkills.slice(0, 2).join(", ")}`);
  if (typeMatches.length > 0) reasons.push(`prefers mentoring ${typeMatches.join("/")} founders`);
  if (sameDistrict) reasons.push("same district — in-person possible");
  if (mentor.hasEntrepreneurialExp) reasons.push("lived entrepreneurial background");

  return {
    mentor, score, semanticBonus,
    breakdown: [
      { label: "Business Stage", score: stageScore, weight: 25 },
      { label: "Sector Fit",     score: sectorScore, weight: 20 },
      { label: "Needs Match",    score: needsScore,  weight: 20 },
      { label: "Skills Gap",     score: skillsScore, weight: 10 },
      { label: "Founder Type",   score: founderScore, weight: 8 },
      { label: "Language",       score: langScore,   weight: 5  },
      { label: "Logistics",      score: logisticsScore, weight: 5 },
      { label: "Empathy",        score: empathyScore, weight: 4 },
      { label: "Track Record",   score: trackScore,  weight: 3  },
    ],
    explanation: reasons.length > 0 ? reasons.join("; ") : "General compatibility across criteria",
  };
}

// Helper to filter out specified badges
export const isRemovedBadge = (val?: string) => {
  if (!val) return false;
  const clean = val.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
  return (
    clean === "mvp" ||
    clean === "prototype-mvp" ||
    clean === "prototype - mvp" ||
    clean === "prototype / mvp" ||
    clean === "prototype" ||
    clean === "edtech and curriculum" ||
    clean === "strategy" ||
    clean === "operations" ||
    clean === "idea" ||
    clean === "idea stage" ||
    clean === "validation" ||
    clean === "validation stage" ||
    clean === "agritech and finance" ||
    clean === "services" ||
    clean === "youth" ||
    clean === "woman" ||
    clean === "women" ||
    clean === "woman-led" ||
    clean === "rural" ||
    clean === "financial services" ||
    clean === "early startup" ||
    clean === "early startup stage" ||
    clean === "early-startup" ||
    clean === "early" ||
    clean === "technology" ||
    clean === "technology and ict" ||
    clean === "software and technology" ||
    clean === "tech" ||
    clean === "trade" ||
    clean === "general trade" ||
    clean === "agri-trading" ||
    clean === "financial management" ||
    clean === "finance and accounts" ||
    clean === "finance & accounts" ||
    clean === "finance" ||
    clean === "finance and accounting" ||
    clean === "financial literacy" ||
    clean === "investment readiness" ||
    clean === "investment ready" ||
    clean === "investment and vc" ||
    clean === "investment & vc" ||
    clean === "investment" ||
    clean === "marketing" ||
    clean === "marketing and sales" ||
    clean === "marketing & sales" ||
    clean === "marketing and branding" ||
    clean === "marketing & branding" ||
    clean === "digital marketing" ||
    clean === "cleanenergy and hardware" ||
    clean === "clean energy and hardware"
  );
};

const isRemovedPersonality = (val?: string) => {
  if (!val) return true;
  const clean = val.trim().toLowerCase();
  return (
    clean === "strategic and supportive" ||
    clean === "direct and honest" ||
    clean === "encouraging and enthusiastic" ||
    clean === "patient and empathetic" ||
    clean === "structured and goal-oriented" ||
    clean === "direct and results-driven"
  );
};

// ── Mentor Profile Modal ───────────────────────────────────────────────────────
/** The matching profiles ship with sample capacity numbers; what the engine and the screens use is the live count and the programme's own limit. */
function withLiveCapacity<T extends { id: string; name: string; maxMenteeCount: number; currentMenteeCount: number }>(m: T, P: ReturnType<typeof useProgramme>): T {
  return { ...m, currentMenteeCount: P.mentorLoad({ id: m.id, name: m.name }), maxMenteeCount: P.capacityOf(m.id, m.maxMenteeCount) };
}

/** Programme team: see and change how many mentees this mentor can take. */
function CapacityEditor({ mentorId, name, fallback }: { mentorId: string; name: string; fallback: number }) {
  const P = useProgramme();
  const load = P.mentorLoad({ id: mentorId, name }), cap = P.capacityOf(mentorId, fallback);
  const [draft, setDraft] = useState(String(cap));
  useEffect(() => setDraft(String(cap)), [cap]);
  const save = () => { const r = P.setMentorCapacity(mentorId, Number(draft), name); if (!r.ok) return toast.error(r.reason); toast.success(`${name} can now take up to ${draft} mentees.`); };
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Mentoring capacity</div>
      <div className="p-3.5 flex items-center gap-3 flex-wrap text-xs text-gray-700">
        <span><strong>{load}</strong> of <strong>{cap}</strong> mentee slots used{load >= cap ? " (full)" : ""}</span>
        <span className="flex items-center gap-2 ml-auto">
          <label htmlFor={`cap-${mentorId}`} className="text-[10px] font-bold text-gray-500 uppercase">Limit</label>
          <input id={`cap-${mentorId}`} aria-label="Mentee limit" type="number" min={1} max={MAX_MENTOR_CAPACITY} value={draft} onChange={e => setDraft(e.target.value)} className="w-16 border border-gray-300 rounded px-2 py-1" />
          <button onClick={save} disabled={Number(draft) === cap} className="px-3 py-1 rounded text-white font-bold disabled:opacity-40" style={{ background: TEAL }}>Save</button>
        </span>
      </div>
    </div>
  );
}

function MentorProfileModal({
  mentor,
  matchContext,
  onClose,
}: {
  mentor: MentorMatchProfile;
  matchContext?: {
    selectedEnt: EntMatchProfile;
    result?: MatchResult;
    onConfirm?: () => void;
    isConfirmed?: boolean;
  };
  onClose: () => void;
}) {
  const { mntApps } = useContext(AppDataCtx);
  const PM = useProgramme();
  const appData = mntApps.find(m => m.id === mentor.id);
  const liveMentor = mentor.id ? withLiveCapacity(mentor, PM) : mentor;

  const email = appData?.email || `${mentor.name.toLowerCase().replace(/[^a-z]/g, "")}@brandplus.mw`;
  const phone = appData?.phone || "+265 992 500 005";
  const title = appData?.title || "Chief Marketing Strategist";
  const employer = appData?.employer || "BrandPlus Malawi";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs im-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 flex items-start justify-between relative"
          style={{ background: `linear-gradient(135deg, ${NAVY}, ${TEAL})`, color: "#fff" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "2px solid rgba(255,255,255,0.35)" }}
            >
              <User size={26} color="#fff" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white leading-tight">{mentor.name}</h3>
              </div>
              <p className="text-xs text-white/80 mt-0.5 font-medium">{title} {employer}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {mentor.expertise && (
                  <span
                    style={{ background: "#4C808A", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded shadow-xs"
                  >
                    {mentor.expertise.replace(/&/g, "and")}
                  </span>
                )}
                {mentor.district && (
                  <span
                    style={{ background: "#4C808A", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded shadow-xs"
                  >
                    {mentor.district}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Match Context Recommendation banner if opened from AI match */}
          {matchContext && (
            <div className="p-3.5 rounded-lg flex flex-col gap-2" style={{ background: "#ffffff", border: "1.5px solid #4C808A" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={14} style={{ color: "#4C808A", fill: "#4C808A" }} />
                  <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: "#3B4167" }}>
                    Recommendation for {matchContext.selectedEnt.name}
                  </span>
                </div>
                {matchContext.result && (
                  <span style={{ background: "#4C808A", color: "#ffffff", border: "none", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    {matchContext.result.score}/100 Match
                  </span>
                )}
              </div>
              {matchContext.result?.explanation && (
                <div style={{ background: "#4C808A", borderRadius: 6, padding: "8px 12px", border: "1px solid #4C808A" }}>
                  <p className="text-white text-[11px] leading-relaxed m-0">
                    <strong className="text-white font-bold">Why this match: </strong>
                    {matchContext.result.explanation.replace(/\.$/, "")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg border text-center shadow-xs" style={{ background: "#4C808A", borderColor: "#4C808A" }}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/85 block mb-0.5">Experience</span>
              <span className="text-sm font-black text-white">{mentor.yearsExperience} Years</span>
            </div>
            <div className="p-2.5 rounded-lg border text-center shadow-xs" style={{ background: "#4C808A", borderColor: "#4C808A" }}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/85 block mb-0.5">Startups Mentored</span>
              <span className="text-sm font-black text-white">{mentor.startupsmentored} Startups</span>
            </div>
            <div className="p-2.5 rounded-lg border text-center shadow-xs" style={{ background: "#4C808A", borderColor: "#4C808A" }}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/85 block mb-0.5">Active Capacity</span>
              <span className="text-sm font-black text-white">{liveMentor.currentMenteeCount} / {liveMentor.maxMenteeCount} Mentees</span>
            </div>
          </div>

          {mentor.id && <CapacityEditor mentorId={mentor.id} name={mentor.name} fallback={appData?.capacity ?? mentor.maxMenteeCount} />}

          {/* Professional Summary */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              Mentor Biography & Style
            </div>
            <div className="p-3.5 space-y-2">
              <p className="text-gray-700 leading-relaxed text-xs">{mentor.biography}</p>
              {mentor.personality && !isRemovedPersonality(mentor.personality) && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500">Mentoring Approach:</span>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 italic">
                    "{mentor.personality}"
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mentorship Focus */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              Mentorship Focus and Criteria
            </div>
            <div className="p-3.5 space-y-2.5">
              {mentor.stageExpertise.filter(st => !isRemovedBadge(st)).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Business Stages</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {mentor.stageExpertise.filter(st => !isRemovedBadge(st)).map(st => (
                      <span key={st} className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium text-[10px]">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mentor.industryExpertise.filter(ind => !isRemovedBadge(ind)).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Industry Expertise</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {mentor.industryExpertise.filter(ind => !isRemovedBadge(ind)).map(ind => (
                      <span key={ind} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[10px]">
                        {ind.replace(/&/g, "and")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mentor.functionalExpertise.filter(fx => !isRemovedBadge(fx)).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Functional Expertise</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {mentor.functionalExpertise.filter(fx => !isRemovedBadge(fx)).map(fx => (
                      <span key={fx} className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium text-[10px]">
                        {fx}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Preferred Founders</span>
                  <span className="text-gray-800 font-semibold">{mentor.preferredFounderTypes.join(", ")}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Languages Spoken</span>
                  <span className="text-gray-800 font-semibold">{mentor.languages.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
              Contact Details
            </div>
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={13} className="text-gray-400" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={13} className="text-gray-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                <MapPin size={13} className="text-gray-400" />
                <span>{mentor.district} District Malawi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          {matchContext && matchContext.onConfirm && (
            <button
              onClick={() => {
                if (!matchContext.isConfirmed) {
                  matchContext.onConfirm();
                }
              }}
              disabled={matchContext.isConfirmed}
              className="px-5 py-2 text-xs font-bold transition-all cursor-pointer"
              style={{
                background: "#fff",
                color: matchContext.isConfirmed ? "#059669" : TEAL,
                border: `1px solid ${matchContext.isConfirmed ? "#059669" : TEAL}`,
                borderRadius: 2,
                cursor: matchContext.isConfirmed ? "default" : "pointer",
              }}
            >
              {matchContext.isConfirmed ? "Pairing Confirmed" : `Confirm Pairing with ${matchContext.selectedEnt.name}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AIMatchingEngine({ initialSelectedEntId }: { initialSelectedEntId?: string | null }) {
  const { matchPairs, confirmPairing, entApps, pairings } = useContext(AppDataCtx);
  const PE = useProgramme();
  const [selectedEntId, setSelectedEntId] = useState<string | null>(initialSelectedEntId || null);
  const [confirmedPairs, setConfirmedPairs] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  const [viewingMentorModal, setViewingMentorModal] = useState<{
    mentor: MentorMatchProfile;
    result?: MatchResult;
  } | null>(null);

  // Available candidate profiles: starts with standard ENT_MATCH_PROFILES,
  // and dynamically incorporates any entrepreneur with a re-match requested
  // (such as Dalitso Mvula, Brian Kumwenda, Enelesi Phiri, or Grace Kamwendo)
  const candidates: EntMatchProfile[] = useMemo(() => {
    const list = [...ENT_MATCH_PROFILES];
    const seenIds = new Set(list.map(e => e.id));
    const seenNames = new Set(list.map(e => e.name.toLowerCase()));

    // 1. From matchPairs with reMatchReq === true
    matchPairs.filter(p => p.reMatchReq).forEach(p => {
      if (seenNames.has(p.mentee.toLowerCase())) return;
      const profile = getProfileForMentee(p.mentee, {
        id: `APP-${p.id}`,
        name: p.mentee,
        sector: p.menteeVenture,
        businessStage: p.stage,
      });
      if (!seenIds.has(profile.id)) {
        seenIds.add(profile.id);
        seenNames.add(profile.name.toLowerCase());
        list.push(profile);
      }
    });

    // 2. From entApps where re-match requested or in pairings with "Re-match Requested"
    entApps.forEach(a => {
      const isRematch =
        (a as any).reMatchReq ||
        a.matchingStage === "Re-match Requested" ||
        a.status === "Re-match Requested" ||
        a.approvalStatus === "Re-match Requested" ||
        pairings?.[a.id]?.approvalStatus === "Re-match Requested" ||
        matchPairs.some(p => p.reMatchReq && p.mentee.toLowerCase() === a.name.toLowerCase());

      if (isRematch) {
        if (seenNames.has(a.name.toLowerCase())) return;
        const profile = getProfileForMentee(a.id, {
          id: a.id,
          name: a.name,
          district: a.district,
          sector: a.sector,
          businessStage: a.stage,
          isWoman: a.gender === "Female",
        });
        if (!seenIds.has(profile.id)) {
          seenIds.add(profile.id);
          seenNames.add(profile.name.toLowerCase());
          list.push(profile);
        }
      }
    });

    return list;
  }, [matchPairs, entApps, pairings]);

  useEffect(() => {
    if (initialSelectedEntId) {
      setSelectedEntId(initialSelectedEntId);
      setRunning(true);
      setShowResults(false);
      const timer = setTimeout(() => { setRunning(false); setShowResults(true); }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialSelectedEntId]);

  const selectedEnt = candidates.find(e => e.id === selectedEntId || e.name.toLowerCase() === selectedEntId?.toLowerCase()) || null;

  const recommendations: MatchResult[] = selectedEnt
    ? MENTOR_MATCH_PROFILES
        .map(m => computeMatch(selectedEnt, withLiveCapacity(m, PE)))
        .filter((r): r is MatchResult => r !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  const handleRun = (entId: string) => {
    if (selectedEntId === entId && showResults) return;
    setSelectedEntId(entId);
    setRunning(true);
    setShowResults(false);
    setExpandedBreakdown(null);
    setTimeout(() => { setRunning(false); setShowResults(true); }, 600);
  };

  const handleConfirm = (result: MatchResult) => {
    if (!selectedEnt) return;
    setConfirmedPairs(prev => new Set([...prev, selectedEnt.id]));
    confirmPairing(
      selectedEnt.id,
      result.mentor.id,
      result.mentor.name,
      result.mentor.expertise,
      result.score,
      selectedEnt.name,
      selectedEnt.sector
    );
    toast.success(`Pairing confirmed: ${selectedEnt.name} → ${result.mentor.name}. Successfully updated in Active Pairs and Matching section!`);
  };

  const scoreColor = (s: number) => s >= 80 ? "#059669" : s >= 60 ? "#f59e0b" : "#ef4444";
  const rankLabel = ["#1 Best Match", "#2 Strong Match", "#3 Good Match"];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Header */}
      <div style={{ background: "#4C808A", borderRadius: 8, padding: "14px 18px", border: "1px solid #4C808A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <GitMerge size={16} color="#ffffff" />
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 13 }}>Matching Engine</span>
        </div>
        <p style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
          Select an entrepreneur below to generate ranked mentor recommendations. The engine applies hard eligibility filters, then scores on 9 weighted criteria. Review and confirm the final pairing to update Active Pairs.
        </p>
      </div>

      {/* Entrepreneur cards */}
      <div>
        <p style={{ color: "#3B4167", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 10px" }}>
          STEP 1: SELECT ENTREPRENEUR CANDIDATE ({candidates.length} available)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {candidates.map(ent => {
            const isSelected = selectedEntId === ent.id || selectedEnt?.id === ent.id;
            const isConfirmed = confirmedPairs.has(ent.id);
            const weakSkills = Object.entries(ent.skillRatings).filter(([, v]) => v <= 2).map(([k]) => k);
            const isRematchCandidate = matchPairs.some(p => p.reMatchReq && (p.mentee.toLowerCase() === ent.name.toLowerCase() || p.mentee.toLowerCase().includes(ent.name.toLowerCase()))) ||
              entApps.some(a => a.name.toLowerCase() === ent.name.toLowerCase() && (
                (a as any).reMatchReq ||
                a.matchingStage === "Re-match Requested" ||
                a.status === "Re-match Requested" ||
                a.approvalStatus === "Re-match Requested" ||
                pairings?.[a.id]?.approvalStatus === "Re-match Requested"
              ));

            return (
              <div
                key={ent.id}
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: "14px 16px",
                  border: `2px solid ${isConfirmed ? "#059669" : isSelected ? TEAL : "#e5e7eb"}`,
                  boxShadow: isSelected ? `0 0 0 3px ${TEAL}20` : "0 2px 8px rgba(0,0,0,0.05)",
                  cursor: isConfirmed ? "default" : "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => !isConfirmed && handleRun(ent.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: PANEL_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={14} color="#fff" strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ color: NAVY, fontWeight: 700, fontSize: 11, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ent.name}</p>
                      {isRematchCandidate && (
                        <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 8, padding: "1px 5px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                          RE-MATCH
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#888", fontSize: 9, margin: 0 }}>{ent.district}</p>
                  </div>
                  {isConfirmed && <CheckCircle size={16} color="#059669" />}
                </div>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {ent.businessStage && !isRemovedBadge(ent.businessStage) && (
                    <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>{ent.businessStage}</span>
                  )}
                  {ent.sector && !isRemovedBadge(ent.sector) && (
                    <span style={{ background: "#f3f4f6", color: "#555", fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>{ent.sector}</span>
                  )}
                  {ent.isYouth && !isRemovedBadge("Youth") && (
                    <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Youth</span>
                  )}
                  {ent.isWoman && !isRemovedBadge("Woman") && (
                    <span style={{ background: "#fdf4ff", color: "#9333ea", fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Woman</span>
                  )}
                  {ent.isRural && !isRemovedBadge("Rural") && (
                    <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Rural</span>
                  )}
                </div>

                <p style={{ color: "#666", fontSize: 9, margin: "0 0 6px", lineHeight: 1.5 }}>
                  <strong style={{ color: "#444" }}>Needs:</strong> {ent.businessNeeds.join(", ")}
                </p>

                {weakSkills.length > 0 && (
                  <p style={{ color: "#666", fontSize: 9, margin: "0 0 6px" }}>
                    <strong style={{ color: "#ef4444" }}>Skills gaps:</strong> {weakSkills.join(", ")}
                  </p>
                )}

                {isConfirmed ? (
                  <div style={{ marginTop: 10, background: "#f0fdf4", borderRadius: 6, padding: "6px 10px", textAlign: "center" }}>
                    <span style={{ color: "#059669", fontSize: 9, fontWeight: 700 }}>✓ Pairing Confirmed</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRun(ent.id);
                      }}
                      disabled={running && isSelected}
                      style={{
                        width: "100%",
                        background: "#3B4167",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "7px 12px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: running && isSelected ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSelected && running ? (
                        <>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #ffffff", animation: "im-spin 0.8s linear infinite" }} />
                          <span>Computing Matches...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={11} color="#ffffff" />
                          <span>{isSelected ? "Showing Matches" : "Click to Run Match"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {selectedEnt && (
        <div>
          {running ? (
            <div style={{ background: "#fff", borderRadius: 8, padding: "32px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${TEAL}30`, borderTop: `3px solid ${TEAL}`, margin: "0 auto 14px", animation: "im-spin 0.9s linear infinite" }} />
              <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>Running Matching Engine...</p>
              <p style={{ color: "#888", fontSize: 11, margin: 0 }}>Applying eligibility filters → weighted scoring → semantic alignment</p>
            </div>
          ) : showResults && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "#3B4167", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", margin: 0 }}>
                  TOP RECOMMENDATIONS FOR {selectedEnt.name.toUpperCase()}
                </p>
                <span style={{ color: "#888", fontSize: 10 }}>{MENTOR_MATCH_PROFILES.length} mentors scored, {recommendations.length} shown</span>
              </div>
              {recommendations.map((result, idx) => {
                const isExpanded = expandedBreakdown === result.mentor.id;
                const isConfirmed = confirmedPairs.has(selectedEnt.id);
                return (
                  <div key={result.mentor.id} style={{
                    background: "#fff", borderRadius: 8, overflow: "hidden",
                    boxShadow: idx === 0 ? `0 4px 16px ${TEAL}20` : "0 2px 8px rgba(0,0,0,0.06)",
                    border: idx === 0 ? `1.5px solid ${TEAL}40` : "1px solid #e5e7eb",
                  }}>
                    {/* Rank banner */}
                    <div style={{ background: idx === 0 ? TEAL : idx === 1 ? `${TEAL}cc` : `${TEAL}99`, padding: "5px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em" }}>{rankLabel[idx]}</span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      {/* Mentor header */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: PANEL_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <User size={20} color="#fff" strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: NAVY, fontWeight: 800, fontSize: 13, margin: "0 0 2px" }}>{result.mentor.name}</p>
                          <p style={{ color: "#888", fontSize: 10, margin: "0 0 4px" }}>{result.mentor.expertise.replace(/&/g, "and")}, {result.mentor.district}</p>
                          <p style={{ color: "#666", fontSize: 9, margin: 0, fontStyle: "italic" }}>
                            {result.mentor.yearsExperience} yrs exp, {result.mentor.startupsmentored} startups mentored, Mode: {result.mentor.mentoringMode}
                          </p>
                        </div>
                        {/* Score badge */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: `conic-gradient(${scoreColor(result.score)} ${result.score * 3.6}deg, #f0f0f0 0deg)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative",
                          }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: scoreColor(result.score), fontWeight: 900, fontSize: 14, lineHeight: 1 }}>{result.score}</span>
                              <span style={{ color: "#bbb", fontSize: 7, fontWeight: 600 }}>/ 100</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div style={{ background: "#4C808A", borderRadius: 6, padding: "9px 13px", marginBottom: 10, border: "1px solid #4C808A" }}>
                        <p style={{ color: "#ffffff", fontSize: 10, margin: 0, lineHeight: 1.6 }}>
                          <strong style={{ color: "#ffffff", fontWeight: 800 }}>Why this match: </strong>{result.explanation.replace(/\.$/, "")}
                        </p>
                      </div>

                      {/* Capacity & availability */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        {[
                          { label: "Capacity", val: `${result.mentor.currentMenteeCount}/${result.mentor.maxMenteeCount} mentees` },
                          { label: "Languages", val: result.mentor.languages.join(", ") },
                          { label: "Monthly Hours", val: `${result.mentor.hoursPerMonth} hrs/mo` },
                        ].map(item => (
                          <div key={item.label} style={{ background: "#3B4167", borderRadius: 5, padding: "4px 10px", border: "1px solid #3B4167" }}>
                            <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 8, margin: "0 0 1px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                            <p style={{ color: "#ffffff", fontSize: 10, margin: 0, fontWeight: 700 }}>{item.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Breakdown toggle */}
                      <button onClick={() => setExpandedBreakdown(isExpanded ? null : result.mentor.id)}
                        style={{ background: "none", border: "none", padding: 0, color: TEAL, fontSize: 10, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: isExpanded ? 10 : 0 }}>
                        <ChevronRight size={12} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                        {isExpanded ? "Hide" : "View"} score breakdown (9 criteria)
                      </button>

                      {isExpanded && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                          {result.breakdown.map(b => (
                            <div key={b.label} style={{ background: "#f8f9fb", borderRadius: 5, padding: "6px 10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: "#666", fontSize: 9, fontWeight: 600 }}>{b.label}</span>
                                <span style={{ color: scoreColor(b.score), fontSize: 9, fontWeight: 800 }}>{b.score}%</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ flex: 1, height: 4, background: "#e5e7eb", borderRadius: 4 }}>
                                  <div style={{ height: "100%", width: `${b.score}%`, background: scoreColor(b.score), borderRadius: 4, transition: "width 0.5s ease" }} />
                                </div>
                                <span style={{ color: "#bbb", fontSize: 8 }}>×{b.weight}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action */}
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setViewingMentorModal({ mentor: result.mentor, result })}
                          style={{
                            background: "#fff",
                            border: `1px solid ${TEAL}`,
                            borderRadius: 2,
                            padding: "7px 14px",
                            fontSize: 10,
                            color: TEAL,
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          View Full Profile
                        </button>
                        <button
                          onClick={() => !isConfirmed && handleConfirm(result)}
                          disabled={isConfirmed}
                          style={{
                            background: "#fff",
                            border: `1px solid ${isConfirmed ? "#059669" : TEAL}`,
                            borderRadius: 2,
                            padding: "7px 18px",
                            fontSize: 10,
                            color: isConfirmed ? "#059669" : TEAL,
                            cursor: isConfirmed ? "default" : "pointer",
                            fontWeight: 700,
                          }}
                        >
                          {isConfirmed ? "Confirmed" : "Confirm Pairing"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mentor Profile Modal */}
      {viewingMentorModal && (
        <MentorProfileModal
          mentor={viewingMentorModal.mentor}
          matchContext={selectedEnt ? {
            selectedEnt,
            result: viewingMentorModal.result,
            isConfirmed: confirmedPairs.has(selectedEnt.id),
            onConfirm: () => {
              if (viewingMentorModal.result) {
                handleConfirm(viewingMentorModal.result);
              }
            },
          } : undefined}
          onClose={() => setViewingMentorModal(null)}
        />
      )}
    </div>
  );
}

const HEALTH_COLOR: Record<string, string> = { "Healthy": "#059669", "At Risk": "#f59e0b", "Stalled": "#ef4444", "New": "#4C808A" };
const HEALTH_BG: Record<string, string> = { "Healthy": "#f0fdf4", "At Risk": "#fffbeb", "Stalled": "#fef2f2", "New": "#eef5f6" };

function AdminPairingView() {
  const { matchPairs, entApps, confirmPairing } = useContext(AppDataCtx);
  const P = useProgramme();
  const [search, setSearch] = useState("");
  const [showReMatchOnly, setShowReMatchOnly] = useState(false);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [pairingTab, setPairingTab] = useState<"pairs" | "ai-engine">("pairs");
  const [selectedEntId, setSelectedEntId] = useState<string | null>(null);
  const [viewingMentorModal, setViewingMentorModal] = useState<{ mentor: MentorMatchProfile } | null>(null);

  const handleDirectConfirm = (p: MentorPair) => {
    const entApp = entApps.find(e => e.name.toLowerCase() === p.mentee.toLowerCase());
    const entId = entApp ? entApp.id : `APP-${p.id}`;
    const mentorName = (p.mentor && p.mentor !== "Unmatched" && p.mentor !== "Pending Re-assignment") ? p.mentor : "Mrs. Faith Nyirenda";
    const mentorExpertise = (p.expertise && p.expertise !== "—") ? p.expertise : "Marketing";
    const matchScore = p.matchScore > 0 ? p.matchScore : 94;
    confirmPairing(
      entId,
      `MNT-${p.id}`,
      mentorName,
      mentorExpertise,
      matchScore,
      p.mentee,
      p.menteeVenture || "Enterprise"
    );
  };

  const filtered = matchPairs.filter(p =>
    (!showReMatchOnly || p.reMatchReq) &&
    (p.mentee.toLowerCase().includes(search.toLowerCase()) || p.mentor.toLowerCase().includes(search.toLowerCase()))
  );

  const activePairsCount = matchPairs.filter(p => p.status === "Active").length;
  const pendingPairsCount = matchPairs.filter(p => p.status === "Pending").length;
  const rematchCount = matchPairs.filter(p => p.reMatchReq).length;
  const avgScore = matchPairs.length > 0
    ? Math.round(matchPairs.reduce((acc, p) => acc + (p.matchScore || 0), 0) / matchPairs.length)
    : 86;

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Pairing and Matching Management</h2>
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>View and manage mentor–mentee pairs, approve re-match requests and track match quality</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb" }}>
        {([
          { key: "pairs",     label: "Active Pairs",    icon: Users },
          { key: "ai-engine", label: "Matching Engine", icon: GitMerge },
        ] as { key: typeof pairingTab; label: string; icon: React.ElementType }[]).map(tab => (
          <button key={tab.key} onClick={() => { if (tab.key === "ai-engine" && pairingTab !== "ai-engine") setSelectedEntId(null); setPairingTab(tab.key); }}
            style={{
              background: "none", border: "none", padding: "10px 18px",
              fontSize: 12, fontWeight: pairingTab === tab.key ? 700 : 400,
              color: pairingTab === tab.key ? TEAL : "#888",
              borderBottom: pairingTab === tab.key ? `2px solid ${TEAL}` : "2px solid transparent",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              marginBottom: -2, transition: "all 0.15s",
            }}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {pairingTab === "ai-engine" && <AIMatchingEngine initialSelectedEntId={selectedEntId} />}
      {pairingTab === "pairs" && (<>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Active Pairs", val: `${activePairsCount}` },
          { label: "Pending Match", val: `${pendingPairsCount}` },
          { label: "Re-match Requests", val: `${rematchCount}` },
          { label: "Avg Match Score", val: `${avgScore}%` },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: "#4C808A",
              borderRadius: 6,
              padding: "12px 16px",
              boxShadow: "0 2px 8px rgba(76,128,138,0.25)",
              border: "1px solid #4C808A",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
            <p style={{ color: "#ffffff", fontSize: 24, fontWeight: 800, margin: 0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={13} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentee or mentor..."
            style={{ width: "100%", paddingLeft: 34, padding: "9px 12px 9px 34px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
        </div>
        <button onClick={() => setShowReMatchOnly(r => !r)}
          style={{ padding: "9px 14px", borderRadius: 6, border: `1px solid ${showReMatchOnly ? "#ef4444" : "#e0e0e0"}`, background: showReMatchOnly ? "#fef2f2" : "#fff", color: showReMatchOnly ? "#ef4444" : "#666", fontSize: 11, cursor: "pointer", fontWeight: showReMatchOnly ? 700 : 400 }}>
          Re-match Requests {rematchCount > 0 ? `(${rematchCount})` : ""} {showReMatchOnly ? "✕" : ""}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#f8f9fb" }}>
                {["Mentee", "Venture", "Mentor", "Stage", "Match Score", "Status", "Sessions", "Last Session", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontSize: 10, fontWeight: 700, borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <>
                  <tr key={p.id} className="im-row" style={{ cursor: "pointer" }} onClick={() => setSelected(selected === p.id ? null : p.id)}>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: PANEL_BG, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                          <User size={12} color="#fff" strokeWidth={1.8} />
                        </div>
                        <span style={{ color: NAVY, fontWeight: 600 }}>{p.mentee}</span>
                        {p.reMatchReq && <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 8, padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>RE-MATCH</span>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: "#666" }}>{p.menteeVenture}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: p.mentor === "Unmatched" ? "#bbb" : NAVY, fontStyle: p.mentor === "Unmatched" ? "italic" : "normal" }}>{p.mentor}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      {p.stage && !isRemovedBadge(p.stage) ? (
                        <span style={{ background: `${TEAL}15`, color: TEAL, fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p.stage}</span>
                      ) : (
                        <span style={{ color: "#bbb", fontSize: 10 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      {p.matchScore > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: "#f0f0f0", borderRadius: 4 }}>
                            <div style={{ height: "100%", width: `${p.matchScore}%`, background: "#059669", borderRadius: 4 }} />
                          </div>
                          <span style={{ color: NAVY, fontWeight: 700, fontSize: 10 }}>{p.matchScore}%</span>
                        </div>
                      ) : <span style={{ color: "#bbb", fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ background: p.status === "Active" ? "#f0fdf4" : "#fffbeb", color: p.status === "Active" ? "#059669" : "#f59e0b", fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: "#666" }}>{p.sessions}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: "#666" }}>{p.lastSession}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.reMatchReq && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const entApp = entApps.find(e => e.name.toLowerCase() === p.mentee.toLowerCase());
                              const entId = entApp ? entApp.id : (KNOWN_ENT_PROFILES[p.mentee]?.id || `APP-${p.id}`);
                              setSelectedEntId(entId);
                              setPairingTab("ai-engine");
                            }}
                            style={{ background: "#4C808A", border: "1px solid #4C808A", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#fff", cursor: "pointer", fontWeight: 700 }}
                          >
                            Review Re-match
                          </button>
                        )}
                        {p.reMatchReq && p.rematchId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); P.declineRematch(p.rematchId!); toast.success(`Re-match request for ${p.mentee} declined. Both people were notified.`); }}
                            style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#6b7280", cursor: "pointer", fontWeight: 700 }}
                          >
                            Keep Pair
                          </button>
                        )}
                        {p.status === "Pending" && !p.reMatchReq && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectConfirm(p);
                            }}
                            style={{ background: "#059669", border: "1px solid #059669", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#fff", cursor: "pointer", fontWeight: 700 }}
                          >
                            Confirm Match
                          </button>
                        )}
                        {p.status === "Active" && !p.reMatchReq && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const found = MENTOR_MATCH_PROFILES.find(m => (p.mentorId ? m.id === p.mentorId : m.name.toLowerCase() === p.mentor.toLowerCase())) || {
                                id: "",
                                name: p.mentor,
                                district: "Lilongwe",
                                expertise: p.expertise,
                                programmeInterest: ["Mentorship Programme"],
                                stageExpertise: isRemovedBadge(p.stage) ? [] : [p.stage],
                                preferredStages: isRemovedBadge(p.stage) ? [] : [p.stage],
                                industryExpertise: isRemovedBadge(p.expertise) ? [] : [p.expertise],
                                preferredIndustries: isRemovedBadge(p.expertise) ? [] : [p.expertise],
                                functionalExpertise: [],
                                hasEntrepreneurialExp: false,
                                yearsExperience: 10,
                                startupsmentored: 8,
                                preferredFounderTypes: ["Youth"],
                                languages: ["English", "Chichewa"],
                                mentoringMode: "Hybrid",
                                hoursPerMonth: 8,
                                currentMenteeCount: 1,
                                maxMenteeCount: 3,
                                biography: `Experienced mentor specializing in ${p.expertise}.`,
                                personality: "",
                              };
                              setViewingMentorModal({ mentor: found });
                            }}
                            style={{ background: "#fff", border: `1px solid ${TEAL}`, borderRadius: 2, padding: "4px 8px", fontSize: 9, color: TEAL, cursor: "pointer", fontWeight: 700 }}
                          >
                            View Full Profile
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {selected === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={9} style={{ padding: "12px 14px", background: "#f8f9fb", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Expertise Fit", val: `${Math.round(p.matchScore * 0.98)}%` },
                            { label: "Stage Alignment", val: `${Math.round(p.matchScore * 0.95)}%` },
                            { label: "Industry Overlap", val: `${Math.round(p.matchScore * 1.02)}%` },
                            { label: "Working Style", val: `${Math.round(p.matchScore * 0.92)}%` },
                          ].map(f => (
                            <div key={f.label} style={{ background: "#fff", borderRadius: 6, padding: "10px 12px" }}>
                              <p style={{ color: "#aaa", fontSize: 9, margin: "0 0 4px" }}>{f.label}</p>
                              <p style={{ color: TEAL, fontSize: 16, fontWeight: 800, margin: 0 }}>{f.val}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {viewingMentorModal && (
        <MentorProfileModal
          mentor={viewingMentorModal.mentor}
          onClose={() => setViewingMentorModal(null)}
        />
      )}
    </div>
  );
}

function AdminRelHealthView() {
  const { scope, pairHealth } = useContext(AppDataCtx);
  const P = useProgramme();
  const HEALTH = pairHealth;
  const [filterHealth, setFilterHealth] = useState<string | null>(null);

  const filtered = filterHealth ? HEALTH.filter(p => filterHealth === "Healthy" ? (p.health === "Healthy" || p.health === "New") : p.health === filterHealth) : HEALTH;
  const healthyCnt = HEALTH.filter(p => p.health === "Healthy" || p.health === "New").length;
  const atRiskCnt = HEALTH.filter(p => p.health === "At Risk").length;
  const stalledCnt = HEALTH.filter(p => p.health === "Stalled").length;

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Relationship Health Dashboard</h2>
        <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Monitor mentor–mentee pair health, flag at-risk relationships and track engagement metrics</p>
      </div>

      {/* Summary gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Healthy Pairs", val: healthyCnt, total: HEALTH.length, color: "#059669", desc: "≥ 1 session/wk, satisfaction > 80%" },
          { label: "At Risk Pairs", val: atRiskCnt, total: HEALTH.length, color: "#f59e0b", desc: "< 1 session/wk or satisfaction < 70%" },
          { label: "Stalled Pairs", val: stalledCnt, total: HEALTH.length, color: "#ef4444", desc: "0 sessions in 2+ weeks, flagged" },
        ].map(g => (
          <button key={g.label} onClick={() => setFilterHealth(filterHealth === g.label.split(" ")[0] + " " + g.label.split(" ")[1] ? null : g.label.replace("Pairs", "").trim())}
            style={{ background: "#fff", borderRadius: 6, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", border: `2px solid ${filterHealth && g.label.includes(filterHealth) ? g.color : "transparent"}`, textAlign: "left" }}>
            <p style={{ color: "#888", fontSize: 10, margin: "0 0 6px" }}>{g.label}</p>
            <p style={{ color: g.color, fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>{g.val}<span style={{ fontSize: 14, fontWeight: 400, color: "#bbb" }}>/{HEALTH.length}</span></p>
            <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${HEALTH.length ? (g.val / HEALTH.length) * 100 : 0}%`, background: g.color, borderRadius: 4 }} />
            </div>
            <p style={{ color: "#aaa", fontSize: 9, margin: 0 }}>{g.desc}</p>
          </button>
        ))}
      </div>

      {/* Alert Banner for at-risk pairs */}
      {HEALTH.some(p => p.flagged) && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: "#92600a", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>Alert: Engagement below threshold</p>
            <p style={{ color: "#a16207", fontSize: 11, margin: 0 }}>{HEALTH.filter(p => p.flagged).map(p => `${p.mentee} & ${p.mentor} (${p.reasons[0] ?? "engagement below threshold"})`).join("; ")}. Programme staff review recommended.</p>
          </div>
          <button style={{ marginLeft: "auto", background: "#f59e0b", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
            onClick={() => { const f = HEALTH.filter(p => p.flagged); f.forEach(p => P.sendNudge(p.pairId)); toast.success(`Nudged ${f.length} pair${f.length === 1 ? "" : "s"} (mentor and mentee notified)`); }}>Send Nudge</button>
        </div>
      )}

      {HEALTH.length === 0 && <ProjectEmptyNotice scope={scope} what="mentor–mentee pairs" />}
      {/* Pair Cards */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.pairId} style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${HEALTH_COLOR[p.health]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ background: HEALTH_BG[p.health], color: HEALTH_COLOR[p.health], fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{p.health}</span>
                  {p.flagged && <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>⚠ FLAGGED</span>}
                </div>
                <p style={{ color: NAVY, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{p.mentee} <span style={{ color: "#aaa", fontWeight: 400 }}>with</span> {p.mentor}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: "#f8f9fb", border: "1px solid #e0e0e0", borderRadius: 6, padding: "5px 10px", fontSize: 9, color: "#666", cursor: "pointer" }}>View Pair</button>
                {p.flagged && (p.intervention
                  ? <button onClick={() => { P.resolveIntervention(p.pairId); toast.success("Intervention resolved"); }} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "5px 10px", fontSize: 9, color: "#059669", cursor: "pointer", fontWeight: 700 }}>Resolve</button>
                  : <button onClick={() => { P.openIntervention(p.pairId); toast("Intervention opened"); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 10px", fontSize: 9, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Intervene</button>)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              {[
                { label: "Sessions (7 days)", val: p.sessions7d, unit: "", good: p.sessions7d >= 1 },
                { label: "Satisfaction Score", val: p.satisfaction ?? "\u2014", unit: p.satisfaction == null ? "" : "%", good: (p.satisfaction ?? 100) >= 80 },
                { label: "Goal Progress", val: p.goalPct, unit: "%", good: p.goalPct >= 50 },
                { label: "Trend", val: p.trend === "up" ? "↑ Improving" : p.trend === "down" ? "↓ Declining" : "→ Stable", unit: "", good: p.trend !== "down" },
              ].map(m => (
                <div key={m.label} style={{ background: "#f8f9fb", borderRadius: 6, padding: "10px 12px" }}>
                  <p style={{ color: "#aaa", fontSize: 9, margin: "0 0 4px" }}>{m.label}</p>
                  <p style={{ color: m.good ? "#059669" : "#ef4444", fontSize: typeof m.val === "number" ? 18 : 13, fontWeight: 700, margin: 0 }}>{m.val}{m.unit}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCohortView() {
  const { scope, entApps, mntApps } = useContext(AppDataCtx);
  const cohorts: CohortRow[] = useMemo(() => {
    const tagged = COHORTS_DATA.filter(c => inScope(scope, c));
    if (!scope.project || tagged.length) return tagged;
    // A project without a stored cohort gets one built from its own setup and applicants
    const proj = scope.project;
    const inProgramme = (a: { status: string }) => ["Selected", "Approved", "Matching"].includes(a.status);
    const done = isCompletedProject(proj);
    return [{
      id: -1, programId: proj.id, name: `${proj.name} — Cohort 1`, status: done ? "Completed" : "Active",
      startDate: proj.startDate?.trim() || proj.timelineEntries.find(e => /commence|start|begin/i.test(e.title))?.date || "—",
      endDate: proj.timelineEntries[proj.timelineEntries.length - 1]?.date ?? "—",
      mentees: entApps.filter(inProgramme).length,
      mentors: mntApps.filter(a => a.programId === proj.id && inProgramme(a)).length,
      avgProgress: done ? 100 : 0, sector: proj.sector || "Mixed",
    }];
  }, [scope, entApps, mntApps]);
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const selectedCohort = cohorts.find(c => c.id === selectedCohortId) ?? cohorts[0];
  if (!selectedCohort) return <div className="im-fade"><ProjectEmptyNotice scope={scope} what="cohorts" /></div>;

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Cohort & Programme Management</h2>
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Manage cohort intake, enrollment, mentor assignments and custom scoring rubrics</p>
        </div>
        <button style={{ background: TEAL, border: "none", borderRadius: 6, padding: "9px 18px", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <PlusCircle size={14} /> New Cohort
        </button>
      </div>

      {/* Cohort cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {cohorts.map(c => (
          <button key={c.id} onClick={() => setSelectedCohortId(c.id)}
            style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", border: `2px solid ${selectedCohort.id === c.id ? TEAL : "transparent"}`, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <p style={{ color: NAVY, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.name}</p>
              <span style={{ background: c.status === "Active" ? "#f0fdf4" : "#f8f9fb", color: c.status === "Active" ? "#059669" : "#888", fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{c.status}</span>
            </div>
            <p style={{ color: "#aaa", fontSize: 10, margin: "0 0 10px" }}>{c.startDate} — {c.endDate} · {c.sector}</p>
            <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
              <div>
                <p style={{ color: TEAL, fontSize: 18, fontWeight: 800, margin: 0 }}>{c.mentees}</p>
                <p style={{ color: "#bbb", fontSize: 9, margin: 0 }}>Mentees</p>
              </div>
              <div>
                <p style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: 0 }}>{c.mentors}</p>
                <p style={{ color: "#bbb", fontSize: 9, margin: 0 }}>Mentors</p>
              </div>
            </div>
            <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${c.avgProgress}%`, background: c.status === "Active" ? TEAL : "#059669", borderRadius: 4 }} />
            </div>
            <p style={{ color: "#aaa", fontSize: 9, margin: "4px 0 0" }}>{c.avgProgress}% avg progress</p>
          </button>
        ))}
      </div>

      {/* Selected Cohort Detail */}
      <div style={{ background: "#fff", borderRadius: 6, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ color: NAVY, fontWeight: 700, fontSize: 14, margin: "0 0 14px" }}>{selectedCohort.name} — Details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Enrollment Table */}
          <div>
            <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Enrollment Breakdown</p>
            <div style={{ background: "#f8f9fb", borderRadius: 6, overflow: "hidden" }}>
              {[
                { label: "Total Enrolled", val: selectedCohort.mentees, color: NAVY },
                { label: "Active", val: Math.round(selectedCohort.mentees * 0.85), color: "#059669" },
                { label: "At Risk", val: Math.round(selectedCohort.mentees * 0.1), color: "#f59e0b" },
                { label: "Dropped", val: Math.round(selectedCohort.mentees * 0.05), color: "#ef4444" },
                { label: "Mentors Assigned", val: selectedCohort.mentors, color: TEAL },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid #f0f0f0" }}>
                  <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{r.label}</p>
                  <p style={{ color: r.color, fontSize: 11, fontWeight: 700, margin: 0 }}>{r.val}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Scoring Rubric */}
          <div>
            <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Custom Scoring Rubric</p>
            <div style={{ background: "#f8f9fb", borderRadius: 6, overflow: "hidden" }}>
              {[
                { label: "Business Registration", weight: 15 },
                { label: "Market Validation (≥50 interviews)", weight: 20 },
                { label: "Revenue Milestone", weight: 25 },
                { label: "Session Attendance", weight: 15 },
                { label: "Goal Completion Rate", weight: 15 },
                { label: "Mentor Satisfaction", weight: 10 },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid #f0f0f0" }}>
                  <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{r.label}</p>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 50, height: 4, background: "#e0e0e0", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${r.weight * 4}%`, background: TEAL, borderRadius: 4 }} />
                    </div>
                    <p style={{ color: TEAL, fontSize: 10, fontWeight: 700, margin: 0, minWidth: 28 }}>{r.weight}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminReportingView() {
  const { scope, matchPairs, totalPairs } = useContext(AppDataCtx);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  // Sample activity figures scale with the number of mentoring pairs the selected project has
  const livePairs = matchPairs.filter(p => p.mentor !== "Unmatched");
  const share = scope.project ? (totalPairs ? Math.min(1, livePairs.length / totalPairs) : 0) : 1;
  const sc = (n: number) => (n > 0 && share > 0 ? Math.max(1, Math.round(n * share)) : 0);
  const pairMentors = new Set(livePairs.map(p => p.mentor));
  const projectLabel = scope.project ? scope.project.name : "Cohort 5";

  const periodLabel = period === "month" ? "This Month" : period === "quarter" ? "This Quarter" : "This Year";
  if (scope.project && livePairs.length === 0) {
    return (
      <div className="im-fade" style={{ display: "grid", gap: 16 }}>
        <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: 0 }}>Reporting & Analytics</h2>
        <ProjectEmptyNotice scope={scope} what="mentoring activity to report on" />
      </div>
    );
  }

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Reporting & Analytics</h2>
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Programme-level metrics, engagement rates, goal completion and impact reporting</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden" }}>
            {(["month", "quarter", "year"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "7px 14px", border: "none", background: period === p ? TEAL : "transparent", color: period === p ? "#fff" : "#666", fontSize: 11, cursor: "pointer", fontWeight: period === p ? 700 : 400, transition: "all 0.2s" }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, padding: "7px 14px", fontSize: 11, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Sessions Conducted", val: String(sc(38)), sub: "+12% vs last period", color: TEAL, trend: "up" },
          { label: "Goal Completion Rate", val: "71%", sub: "Cohort 5 avg", color: "#059669", trend: "up" },
          { label: "Avg Satisfaction Score", val: "84%", sub: "Post-session ratings", color: NAVY, trend: "stable" },
          { label: "Programme Impact Score", val: "847", sub: "Composite metric", color: "#f59e0b", trend: "up" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 6, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${k.color}` }}>
            <p style={{ color: "#888", fontSize: 10, margin: "0 0 4px" }}>{k.label}</p>
            <p style={{ color: NAVY, fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>{k.val}</p>
            <p style={{ color: k.trend === "up" ? "#059669" : "#aaa", fontSize: 9, margin: 0 }}>{k.trend === "up" ? "↑ " : "→ "}{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Sessions per mentor */}
        <div style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Sessions per Mentor ({periodLabel})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { mentor: "Dr. Tiwonge Banda", sessions: 14, max: 16 },
              { mentor: "Prof. Patrick Likoswe", sessions: 9, max: 16 },
              { mentor: "Dr. Chimwemwe Phiri", sessions: 11, max: 16 },
              { mentor: "Limbani Gondwe", sessions: 4, max: 16 },
            ].filter(m => !scope.project || pairMentors.has(m.mentor)).map(m => (
              <div key={m.mentor}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <p style={{ color: "#555", fontSize: 10, margin: 0 }}>{m.mentor}</p>
                  <p style={{ color: TEAL, fontSize: 10, fontWeight: 700, margin: 0 }}>{m.sessions}</p>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(m.sessions / m.max) * 100}%`, background: m.sessions < 6 ? "#ef4444" : TEAL, borderRadius: 4, transition: "width 0.8s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Engagement Metrics</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Avg Sessions/Week", val: "1.2", target: "≥1/wk", ok: true },
              { label: "Task Completion", val: "68%", target: "≥70%", ok: false },
              { label: "Response Rate", val: "91%", target: "≥85%", ok: true },
              { label: "On-Track Pairs", val: "75%", target: "≥70%", ok: true },
            ].map(m => (
              <div key={m.label} style={{ background: "#f8f9fb", borderRadius: 6, padding: "10px 12px" }}>
                <p style={{ color: "#aaa", fontSize: 9, margin: "0 0 4px" }}>{m.label}</p>
                <p style={{ color: m.ok ? "#059669" : "#f59e0b", fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{m.val}</p>
                <p style={{ color: "#bbb", fontSize: 9, margin: 0 }}>Target: {m.target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly sessions chart */}
      <div style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Monthly Session Frequency — {projectLabel}</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
          {[
            { month: "Jan", sessions: 12 },
            { month: "Feb", sessions: 18 },
            { month: "Mar", sessions: 15 },
            { month: "Apr", sessions: 22 },
            { month: "May", sessions: 19 },
            { month: "Jun", sessions: 24 },
            { month: "Jul", sessions: 20, current: true },
          ].map(m => (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <p style={{ color: m.current ? TEAL : "#aaa", fontSize: 9, fontWeight: m.current ? 700 : 400, margin: "0 0 2px" }}>{sc(m.sessions)}</p>
              <div style={{ width: "100%", height: `${(m.sessions / 24) * 80}px`, background: m.current ? TEAL : `${TEAL}40`, borderRadius: "4px 4px 0 0", transition: "height 0.8s ease" }} />
              <p style={{ color: "#bbb", fontSize: 8, margin: 0 }}>{m.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome Metrics */}
      <div style={{ background: "#fff", borderRadius: 6, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Business Outcome Metrics — {projectLabel}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Businesses Registered", val: `${sc(11)}/${sc(18)}`, pct: 61, color: "#059669" },
            { label: "Reached MVP Stage", val: `${sc(6)}/${sc(18)}`, pct: 33, color: TEAL },
            { label: "First Revenue", val: `${sc(4)}/${sc(18)}`, pct: 22, color: NAVY },
            { label: "Grant Applications", val: `${sc(8)}/${sc(18)}`, pct: 44, color: "#f59e0b" },
            { label: "Programme Graduation", val: `${sc(0)}/${sc(18)}`, pct: 0, color: "#bbb" },
          ].map(m => (
            <div key={m.label} style={{ background: "#f8f9fb", borderRadius: 6, padding: "12px 14px", textAlign: "center" }}>
              <p style={{ color: m.color, fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{m.val}</p>
              <p style={{ color: "#aaa", fontSize: 9, margin: "0 0 8px", lineHeight: 1.4 }}>{m.label}</p>
              <div style={{ height: 4, background: "#e0e0e0", borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${m.pct}%`, background: m.color, borderRadius: 4 }} />
              </div>
              <p style={{ color: "#bbb", fontSize: 8, margin: "3px 0 0" }}>{m.pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminIntegrationView() {
  const integrations: { name: string; category: string; status: string; icon: React.ElementType; desc: string; lastSync: string }[] = [
    { name: "Google Calendar",       category: "Scheduling",    status: "Connected",     icon: Calendar,      desc: "Sync session scheduling and availability across mentor and mentee calendars", lastSync: "2 min ago" },
    { name: "Microsoft Outlook",     category: "Scheduling",    status: "Connected",     icon: Mail,          desc: "Email and calendar integration for programme staff and mentors", lastSync: "5 min ago" },
    { name: "Zoom",                  category: "Video Calls",   status: "Connected",     icon: Video,         desc: "Launch video calls directly from session management, auto-log attendance", lastSync: "Active" },
    { name: "Google Meet",           category: "Video Calls",   status: "Not Connected", icon: Video,         desc: "Alternative video platform for sessions", lastSync: "—" },
    { name: "LMS (Moodle)",          category: "Learning",      status: "Connected",     icon: GraduationCap, desc: "Course module visibility for mentors, track mentee course completions and certificates", lastSync: "10 min ago" },
    { name: "Salesforce CRM",        category: "CRM",           status: "Not Connected", icon: Cloud,         desc: "Sync entrepreneur profiles and programme data with CRM for stakeholder reporting", lastSync: "—" },
    { name: "HubSpot CRM",           category: "CRM",           status: "Not Connected", icon: Link2,         desc: "Alternative CRM integration for partner reporting and pipeline tracking", lastSync: "—" },
    { name: "Typeform / Registration",category: "Intake",       status: "Connected",     icon: ClipboardList, desc: "Pull applicant data from intake forms directly into the platform", lastSync: "1 hr ago" },
    { name: "Slack",                 category: "Communication", status: "Configurable",  icon: MessageSquare, desc: "Nudges, session reminders and cohort announcements via Slack workspace", lastSync: "—" },
  ];

  const categories = [...new Set(integrations.map(i => i.category))];
  const connected = integrations.filter(i => i.status === "Connected").length;

  return (
    <div className="im-fade" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Integration Hub</h2>
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Manage platform connections — CRM, calendar, video, LMS and intake systems</p>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "8px 14px", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
          <p style={{ color: "#059669", fontSize: 11, fontWeight: 700, margin: 0 }}>{connected} of {integrations.length} connected</p>
        </div>
      </div>

      {/* Health bar */}
      <div style={{ background: "#fff", borderRadius: 6, padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ color: NAVY, fontSize: 11, fontWeight: 700, margin: 0 }}>Integration Coverage</p>
          <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, margin: 0 }}>{Math.round((connected / integrations.length) * 100)}%</p>
        </div>
        <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4 }}>
          <div style={{ height: "100%", width: `${(connected / integrations.length) * 100}%`, background: TEAL, borderRadius: 4, transition: "width 0.8s" }} />
        </div>
      </div>

      {/* Integration cards by category */}
      {categories.map(cat => (
        <div key={cat}>
          <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {integrations.filter(i => i.category === cat).map(intg => (
              <div key={intg.name} style={{ background: "#fff", borderRadius: 6, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${intg.status === "Connected" ? "#059669" : intg.status === "Configurable" ? "#f59e0b" : "#e0e0e0"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <intg.icon size={14} color={TEAL} />
                    </div>
                    <p style={{ color: NAVY, fontSize: 12, fontWeight: 700, margin: 0 }}>{intg.name}</p>
                  </div>
                  <span style={{
                    background: intg.status === "Connected" ? "#f0fdf4" : intg.status === "Configurable" ? "#fffbeb" : "#f8f9fb",
                    color: intg.status === "Connected" ? "#059669" : intg.status === "Configurable" ? "#f59e0b" : "#bbb",
                    fontSize: 8, padding: "2px 7px", borderRadius: 6, fontWeight: 700
                  }}>{intg.status === "Connected" ? "● Connected" : intg.status === "Configurable" ? "◑ Setup" : "○ Not Connected"}</span>
                </div>
                <p style={{ color: "#888", fontSize: 10, margin: "0 0 10px", lineHeight: 1.5 }}>{intg.desc}</p>
                {intg.status === "Connected" && (
                  <p style={{ color: "#bbb", fontSize: 9, margin: "0 0 8px" }}>Last sync: {intg.lastSync}</p>
                )}
                <button style={{ width: "100%", background: intg.status === "Connected" ? "#f8f9fb" : `${TEAL}15`, border: `1px solid ${intg.status === "Connected" ? "#e0e0e0" : `${TEAL}30`}`, borderRadius: 6, padding: "7px", fontSize: 10, color: intg.status === "Connected" ? "#666" : TEAL, cursor: "pointer", fontWeight: intg.status !== "Connected" ? 700 : 400 }}>
                  {intg.status === "Connected" ? "Configure" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// (NavKey moved to top of file)

// ── Main page ─────────────────────────────────────────────────────────────────
export function IncubationManagementPage({
  onBack,
  adminPrograms = [],
  onCreateProgram = () => {},
  onUpdateProgram = () => {},
  onDeleteProgram = () => {},
  liveApplications = [],
  liveMentorApplications = [],
  manager = null,
}: {
  onBack: () => void;
  /** The signed-in programme manager. `adminPrograms` must already be limited to the programs they champion. */
  manager?: Manager | null;
  adminPrograms?: AdminProgram[];
  onCreateProgram?: (p: AdminProgram) => void;
  onUpdateProgram?: (p: AdminProgram) => void;
  onDeleteProgram?: (id: string) => void;
  liveApplications?: EntrepreneurApplication[];
  liveMentorApplications?: MentorApplication[];
}) {
  const [active, setActive] = useState<NavKey>("Applications");
  const [mgmtOpen, setMgmtOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // ── Project selection (navbar "All Projects" dropdown) ──
  const [projectId, setProjectId] = useState<string>(() => {
    try { return sessionStorage.getItem(SELECTED_PROJECT_KEY) ?? ALL_PROJECTS; } catch { return ALL_PROJECTS; }
  });
  // A project that was unpublished/removed silently falls back to "All Projects"
  const project = useMemo(() => adminPrograms.find(p => p.published && p.id === projectId) ?? null, [adminPrograms, projectId]);
  // With a manager signed in, "All Projects" is limited to the projects they champion; other managers' records never appear.
  const allowedIds = useMemo(() => (manager ? adminPrograms.map(p => p.id) : undefined), [manager, adminPrograms]);
  const scope: ProjectScope = useMemo(() => project ? { projectId: project.id, project, allowed: allowedIds } : { ...ALL_SCOPE, allowed: allowedIds }, [project, allowedIds]);
  const selectProject = (id: string) => {
    setProjectId(id);
    try { sessionStorage.setItem(SELECTED_PROJECT_KEY, id); } catch { /* ignore */ }
  };
  const inProject = (n: IncubationNotification) => !n.programId || inScope(scope, n);
  const P = useProgramme();
  const [savedDecisions] = useState(loadDecisions);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: string; reason?: string; date?: string }>>(savedDecisions.statusOverrides ?? {});
  const [pairings, setPairings] = useState<Record<string, {
    partnerName: string;
    matchScore: number;
    matchingStage: string;
    introSession: string;
    approvalStatus: "Approved" | "Pending Approval" | "Re-match Requested";
  }>>(savedDecisions.pairings ?? {});
  const [notifications, setNotifications] = useState<IncubationNotification[]>(savedDecisions.notifications ?? INITIAL_NOTIFICATIONS);
  useEffect(() => {
    try { localStorage.setItem(DECISIONS_KEY, JSON.stringify({ statusOverrides, pairings, notifications })); } catch { /* storage full or blocked */ }
  }, [statusOverrides, pairings, notifications]);

  const addNotification = (
    notif: Omit<IncubationNotification, "id" | "createdAt" | "read" | "timestamp"> & { timestamp?: string }
  ) => {
    const newNotif: IncubationNotification = {
      ...notif,
      programId: notif.programId ?? [...liveApplications, ...liveMentorApplications, ...MOCK_ENT_APPS, ...MOCK_MNT_APPS].find(a => a.id === notif.candidateId)?.programId,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      timestamp: notif.timestamp || "Just now",
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => inProject(n) ? { ...n, read: true } : n));
    toast.success("All notifications marked as read.");
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.filter(n => !inProject(n)));
    toast.info("Notifications cleared.");
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Track live incoming submissions
  const prevLiveCount = useRef(liveApplications.length);
  useEffect(() => {
    if (liveApplications.length > prevLiveCount.current) {
      const latest = liveApplications[liveApplications.length - 1];
      if (latest) {
        addNotification({
          section: "Applications",
          title: "New Application Received",
          message: `${latest.name} submitted an Incubation application for ${latest.businessName || latest.sector || "Venture"}.`,
          candidateName: latest.name,
          candidateId: latest.id,
          type: "info",
          actionTarget: "Applications",
        });
      }
    }
    prevLiveCount.current = liveApplications.length;
  }, [liveApplications]);

  const setStatusOverride = (id: string, status: string, reason?: string) => {
    const today = new Date().toISOString().split("T")[0];
    setStatusOverrides(prev => ({ ...prev, [id]: { status, reason, date: today } }));

    const app = [...liveApplications, ...liveMentorApplications, ...MOCK_ENT_APPS, ...MOCK_MNT_APPS].find(a => a.id === id);
    const candidateName = app?.name || id;

    // Keep the programme store (what mentors and entrepreneurs see) in step with the decision
    const entApp = [...liveApplications, ...MOCK_ENT_APPS].find(a => a.id === id);
    if (entApp) {
      const me = { menteeId: id, mentee: entApp.name };
      const pair = P.pairs.find(x => sameMentee(x, me));
      const queued = P.waiting.some(w => sameMentee(w, me));
      if (status === "Matching" && !pair && !queued) {
        P.addWaiting({ menteeId: id, mentee: entApp.name, venture: (entApp as any).businessName || entApp.name, sector: entApp.sector, stage: (entApp as any).stage || "Idea", programId: entApp.programId });
      } else if (status !== "Matching" && queued) {
        P.removeWaiting(entApp.name, id);
      }
      if ((status === "Dropouts" || status === "Rejected") && pair) {
        P.endPair(pair.id, reason || (status === "Dropouts" ? "Mentee dropped out of the programme" : "Mentee disqualified"), { requeue: false });
      }
    } else if (app && status === "Dropouts") {
      // A mentor leaving ends their pairs and puts those mentees back in the queue
      P.pairs.filter(x => isMentorOf(x, { id, name: app.name })).forEach(x => P.endPair(x.id, reason || "Mentor withdrew from the programme", { requeue: true }));
    }

    if (status === "Selected") {
      addNotification({
        section: "Selection",
        title: "Candidate Selected",
        message: `${candidateName} (${id}) has been selected and approved for Incubation shortlisting.${reason ? ` Notes: ${reason}` : ""}`,
        candidateName,
        candidateId: id,
        type: "success",
        actionTarget: "Selection",
      });
    } else if (status === "Rejected") {
      addNotification({
        section: "Rejected",
        title: "Application Disqualified",
        message: `${candidateName} (${id}) was disqualified by the evaluation committee.${reason ? ` Reason: ${reason}` : ""}`,
        candidateName,
        candidateId: id,
        type: "danger",
        actionTarget: "Rejected",
      });
    } else if (status === "Matching") {
      setPairings(prev => ({
        ...prev,
        [id]: {
          partnerName: (app as any)?.matchedMentor || (app as any)?.matchedMentee || "Pending Match Assignment",
          matchScore: (app as any)?.matchScore || 88,
          matchingStage: "Awaiting Confirmation",
          introSession: "Pending Schedule",
          approvalStatus: "Pending Approval",
        },
      }));
      addNotification({
        section: "Matching",
        title: "Candidate Moved to Matching",
        message: `${candidateName} (${id}) moved to Mentor Matching section. Ready for pairing assignment.`,
        candidateName,
        candidateId: id,
        type: "info",
        actionTarget: "Matching",
      });
    } else if (status === "Dropouts") {
      addNotification({
        section: "Dropouts",
        title: "Candidate Dropout Recorded",
        message: `${candidateName} (${id}) recorded as Dropout.${reason ? ` Reason: ${reason}` : ""}`,
        candidateName,
        candidateId: id,
        type: "warning",
        actionTarget: "Dropouts",
      });
    } else if (status === "Applications" || status === "Pending") {
      addNotification({
        section: "Applications",
        title: "Candidate Reinstated",
        message: `${candidateName} (${id}) was reinstated to the active Applications queue.`,
        candidateName,
        candidateId: id,
        type: "info",
        actionTarget: "Applications",
      });
    }
  };

  const confirmPairing = (
    entId: string,
    mentorId: string,
    mentorName: string,
    mentorExpertise: string,
    matchScore: number,
    entName: string,
    entSector: string
  ) => {
    const today = new Date().toISOString().split("T")[0];

    // Resolve accurate IDs for both sides
    const actualEnt = entApps.find(e => e.id === entId); // by ID only: two people can share a name
    const resolvedEntId = actualEnt ? actualEnt.id : entId;

    const actualMentor = mntApps.find(m => m.id === mentorId);
    const resolvedMentorId = actualMentor ? actualMentor.id : mentorId;

    // The programme store is the single record of who is paired, so it goes first: if it refuses (mentor full, not allowed), nothing else changes.
    const added = P.addPair({
      menteeId: resolvedEntId, mentorId: resolvedMentorId, mentee: entName, mentor: mentorName,
      venture: (actualEnt as any)?.businessName || entName, sector: actualEnt?.sector || entSector,
      expertise: mentorExpertise, matchScore, stage: (actualEnt as any)?.stage || undefined,
      programId: actualEnt?.programId ?? scope.project?.id, capacity: actualMentor?.capacity ?? MENTOR_MATCH_PROFILES.find(m => m.id === resolvedMentorId)?.maxMenteeCount,
    });
    if (!added.ok) { toast.error(added.reason); return; }

    setPairings(prev => ({
      ...prev,
      [resolvedEntId]: {
        partnerName: `${mentorName} (${mentorExpertise})`,
        matchScore,
        matchingStage: "Pairing Confirmed",
        introSession: "Pending Introductory Call",
        approvalStatus: "Approved",
      },
      [resolvedMentorId]: {
        partnerName: `${entName} (${entSector})`,
        matchScore,
        matchingStage: "Pairing Confirmed",
        introSession: "Pending Introductory Call",
        approvalStatus: "Approved",
      },
    }));

    setStatusOverrides(prev => ({
      ...prev,
      [resolvedEntId]: { status: "Matching", date: today },
      [resolvedMentorId]: { status: "Matching", date: today },
    }));

    addNotification({
      section: "Matching",
      title: "Mentor Match Confirmed",
      message: `Pair match confirmed: ${entName} paired with ${mentorName} (${mentorExpertise}) with ${matchScore}% compatibility score.`,
      candidateName: entName,
      candidateId: resolvedEntId,
      type: "success",
      actionTarget: "Matching",
    });

    toast.success(`Pair match confirmed for ${entName}! Status updated to Approved in Matching section.`);
  };

  const reassignPartner = (app: EntrepreneurApplication | MentorApplication, isEnt: boolean) => {
    const appId = app.id;
    const appName = app.name;
    const today = new Date().toISOString().split("T")[0];

    // 1. Update pairings state for this applicant to show re-match requested and Pairing Proposed
    setPairings(prev => {
      const existing = prev[appId];
      return {
        ...prev,
        [appId]: {
          partnerName: existing?.partnerName || (isEnt ? (app as any).matchedMentor : (app as any).matchedMentee) || "Pending Re-assignment",
          matchScore: existing?.matchScore || (app as any).matchScore || 85,
          matchingStage: "Pairing Proposed",
          introSession: "Re-matching in Progress",
          approvalStatus: "Re-match Requested",
        },
      };
    });

    // Also update counterpart mentor or mentee if already paired
    if (isEnt && (app as any).matchedMentor) {
      const mentorApp = mntApps.find(m => (app as any).matchedMentor.includes(m.name));
      if (mentorApp) {
        setPairings(prev => ({
          ...prev,
          [mentorApp.id]: {
            partnerName: "Pending Re-assignment",
            matchScore: 85,
            matchingStage: "Pairing Proposed",
            introSession: "Re-matching in Progress",
            approvalStatus: "Re-match Requested",
          },
        }));
      }
    } else if (!isEnt && (app as any).matchedMentee) {
      const entApp = entApps.find(e => (app as any).matchedMentee.includes(e.name));
      if (entApp) {
        setPairings(prev => ({
          ...prev,
          [entApp.id]: {
            partnerName: "Pending Re-assignment",
            matchScore: 85,
            matchingStage: "Pairing Proposed",
            introSession: "Re-matching in Progress",
            approvalStatus: "Re-match Requested",
          },
        }));
      }
    }

    // 2. Ensure status is "Matching" so matching count is maintained/updated
    setStatusOverrides(prev => ({
      ...prev,
      [appId]: { status: "Matching", date: today },
    }));

    // 3. Open a re-match review in the programme store (both people are told; it shows in Pairing & Matching)
    const menteeName = isEnt ? appName : String((app as any).matchedMentee ?? "").split(" (")[0];
    const pair = P.pairs.find(x => (isEnt ? x.menteeId === appId : x.mentorId === appId) || x.mentee.toLowerCase() === menteeName.toLowerCase() || (!isEnt && x.mentor.toLowerCase() === appName.toLowerCase()));
    if (pair) P.requestRematch(pair.id, "Partner re-assigned by the programme team", "admin");

    addNotification({
      section: "Matching",
      title: "Partner Re-assignment Requested",
      message: `${appName} partner re-assigned: Status changed to Pending Approval. Re-match request created in Pairing and Matching.`,
      candidateName: appName,
      candidateId: appId,
      type: "warning",
      actionTarget: "Pairing & Matching",
    });

    toast.info(`${appName} partner re-assigned: Status changed to Pending Approval. Re-match request created in Pairing and Matching.`);
  };

  // Merge mockup data with live submissions (filter to Incubation only), apply overrides & pairings
  const allEntApps = useMemo(() =>
    [...MOCK_ENT_APPS, ...liveApplications.filter(a => a.program === "Incubation")]
      .map(a => {
        let item = { ...a };
        const ov = statusOverrides[a.id];
        if (ov) {
          if (ov.status === "Rejected") {
            item = {
              ...item,
              status: "Rejected",
              rejectionReason: ov.reason !== undefined ? ov.reason : item.rejectionReason,
              rejectedDate: ov.date || item.rejectedDate || new Date().toISOString().split("T")[0],
            };
          } else if (ov.status === "Selected") {
            item = {
              ...item,
              status: "Selected",
              selectionReason: ov.reason !== undefined ? ov.reason : item.selectionReason,
              selectedDate: ov.date || item.selectedDate || new Date().toISOString().split("T")[0],
            };
          } else {
            item = { ...item, status: ov.status };
          }
        }
        const pair = pairings[a.id];
        if (pair) {
          item = {
            ...item,
            status: "Matching",
            matchedMentor: pair.partnerName,
            matchScore: pair.matchScore,
            matchingStage: pair.matchingStage,
            introSession: pair.introSession,
            approvalStatus: pair.approvalStatus,
          };
        } else if (item.status === "Matching") {
          const wasMoved = statusOverrides[a.id]?.status === "Matching";
          item = {
            ...item,
            matchingStage: wasMoved ? "Awaiting Confirmation" : (item.matchingStage || "Awaiting Confirmation"),
            approvalStatus: wasMoved ? "Pending Approval" : (item.approvalStatus || (item.matchingStage === "Awaiting Confirmation" ? "Pending Approval" : "Approved")),
          };
        }
        return item;
      }),
    [liveApplications, statusOverrides, pairings]
  );
  const allMntApps = useMemo(() =>
    [...MOCK_MNT_APPS, ...liveMentorApplications.filter(a => a.program === "Incubation")]
      .map(a => {
        let item = { ...a };
        const ov = statusOverrides[a.id];
        if (ov) {
          if (ov.status === "Rejected") {
            item = {
              ...item,
              status: "Rejected",
              rejectionReason: ov.reason !== undefined ? ov.reason : item.rejectionReason,
              rejectedDate: ov.date || item.rejectedDate || new Date().toISOString().split("T")[0],
            };
          } else if (ov.status === "Selected") {
            item = {
              ...item,
              status: "Selected",
              selectionReason: ov.reason !== undefined ? ov.reason : item.selectionReason,
              selectedDate: ov.date || item.selectedDate || new Date().toISOString().split("T")[0],
            };
          } else {
            item = { ...item, status: ov.status };
          }
        }
        const pair = pairings[a.id];
        if (pair) {
          item = {
            ...item,
            status: "Matching",
            matchedMentee: pair.partnerName,
            matchScore: pair.matchScore,
            matchingStage: pair.matchingStage,
            introSession: pair.introSession,
            approvalStatus: pair.approvalStatus,
          };
        } else if (item.status === "Matching") {
          const wasMoved = statusOverrides[a.id]?.status === "Matching";
          item = {
            ...item,
            matchingStage: wasMoved ? "Awaiting Confirmation" : (item.matchingStage || "Awaiting Confirmation"),
            approvalStatus: wasMoved ? "Pending Approval" : (item.approvalStatus || (item.matchingStage === "Awaiting Confirmation" ? "Pending Approval" : "Approved")),
          };
        }
        return item;
      }),
    [liveMentorApplications, statusOverrides, pairings]
  );

  // Pairs come from the programme store, the same data the mentor and entrepreneur dashboards read
  const projectOfPair = (name: string, menteeId?: string, own?: string) =>
    own ?? allEntApps.find(a => (menteeId && a.id === menteeId) || a.name.toLowerCase() === name.toLowerCase())?.programId;
  const allPairs: MentorPair[] = useMemo(() => {
    const open = new Map(P.rematches.filter(r => r.status === "open").map(r => [r.pairId, r.id]));
    const rows: MentorPair[] = P.pairs.map(p => {
      const st = P.stats[p.id]; const rid = open.get(p.id);
      return {
        id: p.id, mentee: p.mentee, menteeVenture: p.venture, mentor: p.mentor, expertise: p.expertise, stage: p.stage,
        matchScore: p.matchScore, status: rid ? "Pending" : "Active", sessions: st?.sessionsTotal ?? 0,
        lastSession: st?.lastSession ? fmtDate(st.lastSession) : p.introDate ? `Intro ${fmtDate(p.introDate)}` : "Intro not scheduled",
        reMatchReq: !!rid, rematchId: rid, programId: projectOfPair(p.mentee, p.menteeId, p.programId),
      } as MentorPair;
    });
    const queue: MentorPair[] = P.waiting.map(w => ({
      id: w.id, mentee: w.mentee, menteeVenture: w.venture, mentor: "Unmatched", expertise: "\u2014", stage: w.stage,
      matchScore: 0, status: "Pending", sessions: 0, lastSession: "\u2014", reMatchReq: false,
      programId: projectOfPair(w.mentee, w.menteeId, w.programId),
    } as MentorPair));
    return [...rows, ...queue];
  }, [P.pairs, P.waiting, P.rematches, P.stats, allEntApps]);
  const pairHealth: PairHealthRow[] = useMemo(() => allPairs.filter(mp => P.stats[mp.id as string] && inScope(scope, mp)).map(mp => {
    const st = P.stats[mp.id as string];
    return {
      pairId: mp.id as string, programId: mp.programId, mentee: mp.mentee, mentor: mp.mentor, health: st.health,
      sessions7d: st.sessions7d, satisfaction: st.satisfaction, goalPct: st.goalPct, flagged: st.health === "At Risk" || st.health === "Stalled",
      trend: st.trend, reasons: st.reasons, intervention: P.interventions.some(i => i.pairId === mp.id && !i.resolved),
    };
  }), [allPairs, P.stats, P.interventions, scope]);

  // Everything below this line sees only the selected project (or everything for "All Projects")
  const entApps = useMemo(() => allEntApps.filter(a => inScope(scope, a)), [allEntApps, scope]);
  const mntApps = useMemo(() => allMntApps.filter(a => mentorInScope(scope, a)), [allMntApps, scope]);
  const scopedPairs = useMemo(() => allPairs.filter(p => inScope(scope, p)), [allPairs, scope]);
  const scopedNotifications = useMemo(() => notifications.filter(inProject), [notifications, scope]);
  const projectCounts = useMemo(() => {
    const out: Record<string, number> = {};
    allEntApps.forEach(a => { if (a.programId) out[a.programId] = (out[a.programId] ?? 0) + 1; });
    return out;
  }, [allEntApps]);

  const entStatusCounts = useMemo(() =>
    entApps.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>),
    [entApps]
  );

  const matchingEntCount = entApps.filter(a => a.status === "Matching").length;

  const mgmtItems: { key: NavKey; icon: React.ElementType; count?: number }[] = [
    { key: "Applications", icon: FileText,    count: entApps.length },
    { key: "Selection",    icon: CheckCircle, count: entStatusCounts["Selected"]  || 0 },
    { key: "Rejected",     icon: XCircle,     count: entStatusCounts["Rejected"]  || 0 },
    { key: "Matching",     icon: GitMerge,    count: matchingEntCount },
    { key: "Dropouts",     icon: Trash2,      count: entStatusCounts["Dropouts"]  || 0 },
  ];

  const adminItems: { key: NavKey; icon: React.ElementType; label?: string }[] = [
    { key: "Pairing & Matching",  icon: GitMerge,  label: "Pairing and Matching" },
    { key: "Relationship Health", icon: Activity },
    { key: "Cohort Management",   icon: Users },
    { key: "Reports & Analytics", icon: TrendingUp },
    { key: "Integration Hub",     icon: Sliders },
  ];

  const statusForView: Partial<Record<NavKey, string>> = {
    Applications: "",
    Selection:    "Selected",
    Rejected:     "Rejected",
    Matching:     "Matching",
    Dropouts:     "Dropouts",
  };

  function renderContent() {
    if (active in statusForView) {
      return <ApplicationsView filterStatus={statusForView[active] || null} />;
    }
    if (active === "Email Dashboard")    return <EmailDashboardView />;
    if (active === "Program Health")     return <ProgramHealthView />;
    if (active === "Alumni")             return <AlumniView />;
    if (active === "Program Setup")      return <ProgramSetupView adminPrograms={adminPrograms} onCreateProgram={onCreateProgram} onUpdateProgram={onUpdateProgram} onDeleteProgram={onDeleteProgram} />;
    if (active === "Pairing & Matching") return <AdminPairingView />;
    if (active === "Relationship Health") return <AdminRelHealthView />;
    if (active === "Cohort Management")  return <AdminCohortView />;
    if (active === "Reports & Analytics") return <AdminReportingView />;
    if (active === "Integration Hub")    return <AdminIntegrationView />;
    if (active === "Settings")           return <SettingsView />;
    return null;
  }

  // Sidebar contents (shared mobile + desktop)
  function SidebarBody({ onSelect }: { onSelect: () => void }) {
    return (
      <>
        {/* Logo (left) + Back (far right) */}
        <div className="flex items-center justify-between gap-3 px-2 pb-4 mb-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <img src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
            alt="Emerge Livelihoods" className="h-7 brightness-0 invert min-w-0" />
          <button onClick={onBack} aria-label="Back to Program Managers" title="Back to Program Managers"
            className="flex items-center gap-1 text-white text-[11px] font-bold shrink-0 transition-opacity opacity-80 hover:opacity-100"
            style={{ background: "none", border: "none", padding: 0 }}>
            <ChevronLeft size={14} color="#fff" />
            <span>Back</span>
          </button>
        </div>

        {/* Management section */}
        <div className="mb-1">
          <button
            onClick={() => setMgmtOpen(o => !o)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-all"
            style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 12 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <LayoutGrid size={14} color="rgba(255,255,255,0.7)" />
            <span className="flex-1 text-left">Management</span>
            {mgmtOpen ? <ChevronDown size={11} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={11} color="rgba(255,255,255,0.5)" />}
          </button>
          {mgmtOpen && (
            <div className="mt-1 space-y-0.5">
              {mgmtItems.map(({ key, icon: Icon, count }) => (
                <NavItem key={key} icon={Icon} label={key} active={active === key} count={count}
                  indent onClick={() => { setActive(key); onSelect(); }} />
              ))}
            </div>
          )}
        </div>

        {/* Programme Admin section */}
        <div className="mb-1">
          <button
            onClick={() => setAdminOpen(o => !o)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-all"
            style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 12 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Award size={14} color="rgba(255,255,255,0.7)" />
            <span className="flex-1 text-left">Programme Admin</span>
            {adminOpen ? <ChevronDown size={11} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={11} color="rgba(255,255,255,0.5)" />}
          </button>
          {adminOpen && (
            <div className="mt-1 space-y-0.5">
              {adminItems.map(({ key, icon: Icon, label }) => (
                <NavItem key={key} icon={Icon} label={label || key} active={active === key}
                  indent onClick={() => { setActive(key); onSelect(); }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 space-y-0.5">
          <NavItem icon={Mail}     label="Email Dashboard" active={active === "Email Dashboard"} onClick={() => { setActive("Email Dashboard"); onSelect(); }} />
          <NavItem icon={Activity} label="Program Health"  active={active === "Program Health"}  onClick={() => { setActive("Program Health");  onSelect(); }} />
          <NavItem icon={Users}    label="Alumni"          active={active === "Alumni"}           onClick={() => { setActive("Alumni");           onSelect(); }} />
          <NavItem icon={Sliders}  label="Program Setup"  active={active === "Program Setup"}    onClick={() => { setActive("Program Setup");   onSelect(); }} />
        </div>

        {/* Bottom */}
        <div className="mt-auto pt-4 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <NavItem icon={Settings} label="Settings" active={active === "Settings"} onClick={() => { setActive("Settings"); onSelect(); }} />
        </div>
      </>
    );
  }

  return (
    <AppDataCtx.Provider value={{
      entApps,
      mntApps,
      setStatusOverride,
      confirmPairing,
      setActiveNav: setActive,
      matchPairs: scopedPairs,
      // all pairs this manager can see (not narrowed to the selected project: it is the denominator for "share of pairs")
      totalPairs: P.pairs.filter(p => inScope({ ...ALL_SCOPE, allowed: allowedIds }, p)).length,
      pairHealth,
      pairings,
      reassignPartner,
      notifications: scopedNotifications,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      removeNotification,
      scope,
    }}>
    <div className="min-h-screen flex" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif", background: "#f5f5f5" }}>
      <style>{css}</style>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="im-slide relative flex flex-col w-64 h-full z-10 py-5 px-2"
            style={{ background: PANEL_BG, borderRight: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="relative z-10 flex flex-col h-full">
              <SidebarBody onSelect={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (sticky) ── */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 py-5 px-2 relative overflow-hidden"
        style={{ width: 260, background: PANEL_BG, borderRight: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="relative z-10 flex flex-col h-full im-sidebar">
          <SidebarBody onSelect={() => {}} />
        </div>
      </aside>

      {/* ── Right column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* ── Sticky navbar ── */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3.5 shrink-0 relative"
          style={{ background: PANEL_BG, borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
          {/* Mobile hamburger */}
          <button className="md:hidden w-8 h-8 rounded-md flex items-center justify-center shrink-0 relative z-10"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onClick={() => setMobileOpen(true)}>
            <LayoutGrid size={14} color="#fff" />
          </button>

          {/* Project switcher */}
          <ProjectSwitcher
            programs={adminPrograms}
            selectedId={scope.projectId}
            counts={projectCounts}
            onSelect={selectProject}
            allLabel={manager ? "All my projects" : "All Projects"}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: bell + profile */}
          <div className="flex items-center gap-2 relative z-10">
            <NotificationBellDropdown
              notifications={scopedNotifications}
              onMarkRead={markNotificationAsRead}
              onMarkAllRead={markAllNotificationsAsRead}
              onClearAll={clearNotifications}
              onRemove={removeNotification}
              onNavigate={(target) => {
                setActive(target);
              }}
            />
            <ProfileDropdown name={manager?.name} title={manager?.title} />
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="im-main flex-1 px-5 sm:px-8 py-7">
          {/* Breadcrumb + title */}
          {active !== "Pairing & Matching" && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold mb-1" style={{ color: "#9ca3af" }}>
                <span>Incubation</span>
                <ChevronRight size={10} />
                <span>{scope.project ? scope.project.name : manager ? "All my projects" : "All Projects"}</span>
                <ChevronRight size={10} />
                <span style={{ color: TEAL }}>{active}</span>
              </div>
              {active !== "Matching" && (
                <h1 className="font-black text-xl flex items-center gap-2" style={{ color: NAVY }}>
                  {active}
                </h1>
              )}
            </div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
    </AppDataCtx.Provider>
  );
}
