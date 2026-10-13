import { useState, useRef } from "react";
import { scoreMentor } from "../data/applicationScoring";
import type { MentorApplication } from "../types";
import { accountProblem } from "./AccountFields";
import {
  ChevronRight, ChevronLeft, Check, Plus, Trash2, Upload, Eye, EyeOff,
  User, Briefcase, BookOpen, Star, Target, Globe, FileText,
  Zap, Users, ArrowRight, Camera, ClipboardCheck
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Qualification { qualification: string; field: string; institution: string; country: string; year: string; }
interface Experience { org: string; position: string; industry: string; startDate: string; endDate: string; responsibilities: string; achievements: string; }
interface MentoringExp { org: string; program: string; startups: string; years: string; types: string[]; }

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Account", icon: User, desc: "Create your account" },
  { id: 2, label: "Profile", icon: Camera, desc: "Personal details" },
  { id: 3, label: "Biography", icon: FileText, desc: "Your story" },
  { id: 4, label: "Education", icon: BookOpen, desc: "Qualifications" },
  { id: 5, label: "Experience", icon: Briefcase, desc: "Work history" },
  { id: 6, label: "Entrepreneurship", icon: Zap, desc: "Business background" },
  { id: 7, label: "Mentoring", icon: Users, desc: "Mentoring history" },
  { id: 8, label: "Programme Fit", icon: Target, desc: "Programme and stage" },
  { id: 9, label: "Expertise", icon: Star, desc: "Industry and skills" },
  { id: 10, label: "Preferences", icon: Globe, desc: "Who you mentor" },
  { id: 11, label: "Docs and Links", icon: Upload, desc: "Documents and profiles" },
  { id: 12, label: "Assessment", icon: ClipboardCheck, desc: "Suitability profile" },
  { id: 13, label: "Review", icon: Check, desc: "Submit application" },
];

// ─── Data ────────────────────────────────────────────────────────────────────

const BUSINESS_STAGES = ["Idea Stage", "Validation Stage", "Prototype / MVP", "Early Startup", "Growth", "Scale-Up", "Investment Ready"];
const INDUSTRIES = ["Agriculture", "Agritech", "ICT", "Artificial Intelligence", "Manufacturing", "Tourism", "Health", "Education", "Energy", "Renewable Energy", "Green Business", "Climate Innovation", "Circular Economy", "Logistics", "Financial Services", "FinTech", "Creative Industries", "Construction", "Retail", "Social Enterprise", "NGO", "Public Sector", "Other"];
const LANGUAGES = ["English", "Chichewa", "Tumbuka", "French", "Portuguese", "Swahili", "Arabic", "Other"];
const FOUNDER_TYPES = ["Youth Entrepreneurs", "Women Entrepreneurs", "Students", "Researchers", "Rural Entrepreneurs", "Social Enterprises", "Tech Founders", "Agripreneurs"];
const MENTORING_TYPES = ["One-on-One", "Group", "Virtual", "In-person", "Coaching", "Advisory"];
const FUNCTIONAL_EXPERTISE: { group: string; items: string[] }[] = [
  { group: "Business Strategy", items: ["Business Planning", "Business Model Design", "Lean Startup", "Strategic Planning"] },
  { group: "Marketing", items: ["Branding", "Marketing Strategy", "Sales", "Digital Marketing", "Customer Acquisition"] },
  { group: "Finance", items: ["Financial Management", "Accounting", "Tax", "Budgeting", "Financial Modelling", "Fundraising"] },
  { group: "Investment", items: ["Investor Readiness", "Pitch Deck Development", "Venture Capital", "Angel Investment", "Due Diligence"] },
  { group: "Product", items: ["Product Development", "Product Design", "User Experience", "MVP Development"] },
  { group: "Operations", items: ["Supply Chain", "Operations", "Quality Management", "Procurement"] },
  { group: "Technology", items: ["Software Development", "Data Science", "AI", "Cloud Computing", "Cybersecurity"] },
  { group: "Leadership", items: ["Leadership Development", "HR", "Team Building", "Change Management"] },
  { group: "Legal", items: ["Company Registration", "Contracts", "Intellectual Property", "Compliance"] },
];
const ENT_EXPERIENCE_OPTIONS = ["Started a business", "Owned a business", "Co-founded a startup", "Managed a business", "Invested in startups"];

// ─── Reusable field components ────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#000000" }}>
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ placeholder, type = "text", value, onChange, className = "" }: {
  placeholder?: string; type?: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-white border border-[#b3b3b3] rounded-md px-4 py-2.5 text-black text-xs placeholder-gray-400 focus:outline-none focus:border-[#4C808A] transition-all ${className}`}
    />
  );
}

function Textarea({ placeholder, value, onChange, rows = 4 }: {
  placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-white border border-[#b3b3b3] rounded-md px-4 py-2.5 text-black text-xs placeholder-gray-400 focus:outline-none focus:border-[#4C808A] transition-all resize-none"
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#b3b3b3] rounded-md px-4 py-2.5 text-black text-xs focus:outline-none focus:border-[#4C808A] transition-all appearance-none"
    >
      {placeholder && <option value="" className="bg-white text-gray-600">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o} className="bg-white text-black">{o}</option>)}
    </select>
  );
}

function ChipToggle({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
      style={{
        background: selected ? "#4C808A" : "#f3f4f6",
        borderColor: selected ? "#4C808A" : "#d1d5db",
        color: selected ? "white" : "#374151",
      }}
    >
      {selected && <Check className="inline w-3 h-3 mr-1" />}
      {label}
    </button>
  );
}

function PasswordInput({ placeholder, value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#b3b3b3] rounded-md px-4 py-2.5 text-black text-xs placeholder-gray-400 focus:outline-none focus:border-[#4C808A] transition-all pr-10"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-5 shadow-sm">
      <div className="px-6 py-4" style={{ background: "#4C808A" }}>
        <h3 className="text-white font-bold" style={{ fontSize: "1rem" }}>{title}</h3>
        {desc && <p className="text-white/80 text-xs mt-1">{desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Profile Strength Gauge ───────────────────────────────────────────────────

function StrengthGauge({ pct }: { pct: number }) {
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct < 40 ? "#e85454" : pct < 70 ? "#f59e0b" : "#4C808A";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{pct}%</span>
        </div>
      </div>
      <div className="text-white text-[10px] mt-1 text-center">Profile Strength</div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function MentorRegistrationForm({ onBack, onNavigateHome, onSubmitMentorApplication }: { onBack: () => void; onNavigateHome?: () => void; onSubmitMentorApplication?: (app: MentorApplication, password: string) => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");
  const topRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Form state ──
  const [acct, setAcct] = useState({ firstName: "", middleName: "", lastName: "", preferredName: "", gender: "", dob: "", nationality: "", nationalId: "", email: "", mobile: "", altPhone: "", password: "", confirmPassword: "", program: "" });
  const acctProblem = accountProblem("mentor", acct.email, acct.password, acct.confirmPassword);
  const [profile, setProfile] = useState({ photo: "", title: "", occupation: "", employer: "", yearsExp: "", country: "", region: "", district: "", address: "" });
  const [bio, setBio] = useState({ biography: "", career: "", interests: "", motivation: "" });
  const [qualifications, setQualifications] = useState<Qualification[]>([{ qualification: "", field: "", institution: "", country: "", year: "" }]);
  const [experiences, setExperiences] = useState<Experience[]>([{ org: "", position: "", industry: "", startDate: "", endDate: "", responsibilities: "", achievements: "" }]);
  const [entExpChecks, setEntExpChecks] = useState<string[]>([]);
  const [entBiz, setEntBiz] = useState({ name: "", industry: "", years: "", status: "", achievements: "", employees: "", revenue: "" });
  const [hasMentored, setHasMentored] = useState<"yes" | "no" | "">("");
  const [mentoringExp, setMentoringExp] = useState<MentoringExp>({ org: "", program: "", startups: "", years: "", types: [] });
  const [progInterest, setProgInterest] = useState<string[]>([]);
  const [stageExp, setStageExp] = useState<string[]>([]);
  const [industryExp, setIndustryExp] = useState<string[]>([]);
  const [funcExp, setFuncExp] = useState<string[]>([]);
  const [prefStages, setPrefStages] = useState<string[]>([]);
  const [prefIndustries, setPrefIndustries] = useState<string[]>([]);
  const [prefFounderTypes, setPrefFounderTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [mentoringMode, setMentoringMode] = useState<string[]>([]);
  const [ref1, setRef1] = useState({ name: "", email: "", phone: "", org: "" });
  const [ref2, setRef2] = useState({ name: "", email: "", phone: "", org: "" });
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({ cv: null, nationalId: null, acadCerts: null });
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const docs = { cv: !!docFiles.cv, nationalId: !!docFiles.nationalId, profCerts: false, acadCerts: !!docFiles.acadCerts, bizReg: false, memberCerts: false };
  const [socials, setSocials] = useState({ linkedin: "", website: "", portfolio: "", github: "", researchgate: "", scholar: "", twitter: "", facebook: "" });
  const [conflict, setConflict] = useState<"yes" | "no" | "">("");
  const [conflictExplain, setConflictExplain] = useState("");
  const [assessment, setAssessment] = useState({ coaching: "", communication: "", personality: [] as string[], digital: [] as string[], commitment: [] as string[] });
  const [hoursPerMonth, setHoursPerMonth] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);

  const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setPhotoError("Only JPG, JPEG and PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setPhotoError("File size must be under 5MB."); return; }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(p => ({ ...p, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleDocSelect = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!valid.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
      setDocErrors(prev => ({ ...prev, [key]: "Only PDF, DOC and DOCX files are accepted." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) { setDocErrors(prev => ({ ...prev, [key]: "File size must be under 10MB." })); return; }
    setDocErrors(prev => ({ ...prev, [key]: "" }));
    setDocFiles(prev => ({ ...prev, [key]: file }));
  };

  const removeDoc = (key: string) => {
    setDocFiles(prev => ({ ...prev, [key]: null }));
    setDocErrors(prev => ({ ...prev, [key]: "" }));
    if (docInputRefs.current[key]) docInputRefs.current[key]!.value = "";
  };

  // Profile strength calc
  const strength = Math.min(100, Math.round(
    (acct.firstName ? 5 : 0) + (acct.email ? 5 : 0) + (acct.mobile ? 5 : 0) +
    (profile.title ? 5 : 0) + (profile.employer ? 5 : 0) + (profile.yearsExp ? 5 : 0) +
    (bio.motivation ? 8 : 0) + (bio.biography ? 7 : 0) +
    (qualifications[0].institution ? 8 : 0) + (experiences[0].org ? 8 : 0) +
    (progInterest.length > 0 ? 8 : 0) + (stageExp.length > 0 ? 8 : 0) +
    (industryExp.length > 0 ? 7 : 0) + (funcExp.length > 0 ? 7 : 0) +
    (docs.cv ? 9 : 0)
  ));

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });
  const next = () => { setStep(s => Math.min(s + 1, 13)); scrollTop(); };
  const prev = () => { setStep(s => Math.max(s - 1, 1)); scrollTop(); };

  const completedSteps = new Set<number>();
  if (acct.firstName && acct.email) completedSteps.add(1);
  if (profile.title && profile.employer) completedSteps.add(2);
  if (bio.motivation) completedSteps.add(3);
  if (qualifications[0].institution) completedSteps.add(4);
  if (experiences[0].org) completedSteps.add(5);
  if (entExpChecks.length > 0 || hasMentored !== "") completedSteps.add(6);
  if (hasMentored !== "") completedSteps.add(7);
  if (progInterest.length) completedSteps.add(8);
  if (industryExp.length) completedSteps.add(9);
  if (prefStages.length || languages.length) completedSteps.add(10);
  if (docs.cv || socials.linkedin) completedSteps.add(11);
  if (assessment.coaching) completedSteps.add(12);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #3B4167 0%, #4C808A 100%)" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#4C808A] border-4 border-white/30 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white font-bold mb-3" style={{ fontSize: "1.6rem" }}>Application Submitted!</h2>
          <p className="text-white text-sm mb-2">Thank you, <strong className="text-white">{acct.firstName}</strong>. Your mentor registration has been received.</p>
          <p className="text-white text-xs mb-8 leading-relaxed">Our team will review your profile within 5–7 business days. You will receive a confirmation email at <strong className="text-white">{acct.email}</strong>.</p>
          {refId && <p className="text-white/70 text-xs mb-6">Your reference number: <strong className="text-white">{refId}</strong>. Use it, or your email, under Track Application to follow your registration.</p>}
          <div className="rounded-md p-5 border border-white/20 mb-6" style={{ background: "#4C808A" }}>
            <div className="font-bold text-sm mb-3" style={{ color: "#FFFFFF" }}>Your Profile Strength</div>
            <StrengthGauge pct={strength} />
          </div>
          <button onClick={onBack} className="inline-flex items-center gap-2 px-8 py-3 rounded-md font-bold text-sm hover:opacity-90 transition-all" style={{ background: "#3B4167", color: "#FFFFFF" }}>
            Back to Mentor Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen" style={{ background: "linear-gradient(135deg, #3B4167 0%, #4C808A 100%)" }}>
      <div className="flex min-h-screen">
        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-black/25 backdrop-blur-md border-r border-white/10 p-6 sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <button onClick={() => onNavigateHome?.()} className="flex items-center gap-3 mb-8">
            <img src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods" className="h-7 w-auto brightness-0 invert" />
          </button>

          <div className="mb-6">
            <div className="text-white font-bold text-sm mb-0.5">Mentor Registration</div>
            <div className="text-white text-xs">Complete all sections</div>
          </div>

          {/* Profile strength */}
          <div className="mb-6 p-4 rounded-md border border-white/10" style={{ background: "#4C808A" }}>
            <StrengthGauge pct={strength} />
          </div>

          {/* Back to Mentor Landing Page */}
          <button
            onClick={onBack}
            className="mb-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all border border-white/20"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Mentor Landing Page
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#f5f5f5" }}>

          {/* Mobile header — logo + back (hidden on lg since sidebar shows) */}
          <div className="flex items-center justify-between p-4 lg:hidden" style={{ background: "#4C808A" }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white text-xs font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <img src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods" className="h-6 brightness-0 invert" />
          </div>

          {/* Mobile step dots (hidden on lg) */}
          <div className="lg:hidden px-4 pt-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#000000" }}>Step {step} of {STEPS.length}</span>
              <span className="font-semibold text-xs" style={{ color: "#000000" }}>{STEPS[step - 1].label}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-md transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%`, background: "#4C808A" }} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {STEPS.map(({ id, label }) => {
                const done = completedSteps.has(id);
                const active = step === id;
                return (
                  <button key={id} onClick={() => { setStep(id); scrollTop(); }}
                    title={label}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                    style={{
                      background: active ? "#4C808A" : done ? "rgba(76,128,138,0.3)" : "#e5e7eb",
                      color: active || done ? "#fff" : "#6b7280",
                      border: active ? "1px solid #4C808A" : "1px solid transparent",
                    }}>
                    {id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Top progress bar */}
          <div className="hidden lg:block" style={{ background: "#4C808A" }}>
            <div className="px-10 py-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">Step {step} of {STEPS.length}</div>
                  <div className="text-white font-bold text-sm">{STEPS[step - 1].label}</div>
                </div>
                <div className="text-white/80 text-xs">{STEPS[step - 1].desc}</div>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-md transition-all duration-500"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-10">
          <div className="max-w-3xl mx-auto">

            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <>
                <SectionCard title="Create Your Account" desc="Basic account details. Fields marked * are required.">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div><Label text="First Name" required /><Input value={acct.firstName} onChange={v => setAcct({ ...acct, firstName: v })} placeholder="Grace" /></div>
                    <div><Label text="Middle Name" /><Input value={acct.middleName} onChange={v => setAcct({ ...acct, middleName: v })} placeholder="Optional" /></div>
                    <div><Label text="Last Name" required /><Input value={acct.lastName} onChange={v => setAcct({ ...acct, lastName: v })} placeholder="Mwale" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Preferred Name" /><Input value={acct.preferredName} onChange={v => setAcct({ ...acct, preferredName: v })} placeholder="What should we call you?" /></div>
                    <div><Label text="Gender" /><Select value={acct.gender} onChange={v => setAcct({ ...acct, gender: v })} options={["Male", "Female", "Non-binary", "Prefer not to say"]} placeholder="Select gender" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Date of Birth" /><Input type="date" value={acct.dob} onChange={v => setAcct({ ...acct, dob: v })} /></div>
                    <div><Label text="Nationality" /><Input value={acct.nationality} onChange={v => setAcct({ ...acct, nationality: v })} placeholder="Malawian" /></div>
                  </div>
                  <div className="mb-4"><Label text="National ID / Passport Number" /><Input value={acct.nationalId} onChange={v => setAcct({ ...acct, nationalId: v })} placeholder="Optional" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Email Address" required /><Input type="email" value={acct.email} onChange={v => setAcct({ ...acct, email: v })} placeholder="your@email.com" /></div>
                    <div><Label text="Mobile Number" required /><Input type="tel" value={acct.mobile} onChange={v => setAcct({ ...acct, mobile: v })} placeholder="+265 88 000 0000" /></div>
                  </div>
                  <div className="mb-4"><Label text="Alternative Phone" /><Input type="tel" value={acct.altPhone} onChange={v => setAcct({ ...acct, altPhone: v })} placeholder="Optional" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Password" required /><PasswordInput value={acct.password} onChange={v => setAcct({ ...acct, password: v })} placeholder="Create a strong password" /></div>
                    <div><Label text="Confirm Password" required /><PasswordInput value={acct.confirmPassword} onChange={v => setAcct({ ...acct, confirmPassword: v })} placeholder="Repeat your password" /></div>
                  </div>
                  <div>
                    <Label text="Programme" required />
                    <Select value={acct.program} onChange={v => setAcct({ ...acct, program: v })} options={["Incubation", "Acceleration"]} placeholder="Select programme" />
                    <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>Choose the Emerge Livelihoods programme you wish to mentor in.</p>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 2: Personal Profile ── */}
            {step === 2 && (
              <>
                <SectionCard title="Personal and Professional Details" desc="Help us build your public mentor profile.">
                  {/* Photo upload */}
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handlePhotoSelect} />
                  <div className="flex items-center gap-5 mb-6 p-4 bg-gray-50 rounded-md border border-dashed border-gray-300">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold text-xs mb-1">Upload Profile Photo</div>
                      <div className="text-gray-400 text-[10px] mb-2">JPG, JPEG, PNG — max 5MB. Square crop recommended.</div>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => photoInputRef.current?.click()}
                          className="px-4 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all">
                          {profile.photo ? "Change Photo" : "Choose File"}
                        </button>
                        {profile.photo && (
                          <button type="button" onClick={() => { setProfile(p => ({ ...p, photo: "" })); setPhotoError(""); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                            className="px-4 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all">
                            Remove
                          </button>
                        )}
                      </div>
                      {photoError && <div className="text-red-500 text-[10px] mt-1.5 font-semibold">{photoError}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Professional Title" required /><Input value={profile.title} onChange={v => setProfile({ ...profile, title: v })} placeholder="CEO, Senior Consultant" /></div>
                    <div><Label text="Current Occupation" /><Input value={profile.occupation} onChange={v => setProfile({ ...profile, occupation: v })} placeholder="Your job role" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><Label text="Current Employer / Organization" required /><Input value={profile.employer} onChange={v => setProfile({ ...profile, employer: v })} placeholder="Organization name" /></div>
                    <div><Label text="Years of Professional Experience" required /><Select value={profile.yearsExp} onChange={v => setProfile({ ...profile, yearsExp: v })} options={["1–3 years", "4–6 years", "7–10 years", "11–15 years", "16–20 years", "20+ years"]} placeholder="Select range" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div><Label text="Country" /><Input value={profile.country} onChange={v => setProfile({ ...profile, country: v })} placeholder="Malawi" /></div>
                    <div><Label text="Region / State" /><Input value={profile.region} onChange={v => setProfile({ ...profile, region: v })} placeholder="Northern Region" /></div>
                    <div><Label text="District / City" /><Input value={profile.district} onChange={v => setProfile({ ...profile, district: v })} placeholder="Mzuzu" /></div>
                  </div>
                  <div><Label text="Physical Address" /><Input value={profile.address} onChange={v => setProfile({ ...profile, address: v })} placeholder="Street, area" /></div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 3: Biography ── */}
            {step === 3 && (
              <>
                <SectionCard title="Professional Biography" desc="Tell us about yourself in your own words. This helps match you with the right entrepreneurs.">
                  <div className="mb-4">
                    <Label text="Professional Biography" required />
                    <Textarea value={bio.biography} onChange={v => setBio({ ...bio, biography: v })} placeholder="Describe your professional background, key roles and accomplishments in 150–300 words..." rows={5} />
                  </div>
                  <div className="mb-4">
                    <Label text="Career Summary" />
                    <Textarea value={bio.career} onChange={v => setBio({ ...bio, career: v })} placeholder="A concise 2–3 sentence career summary for your public mentor profile..." rows={3} />
                  </div>
                  <div className="mb-4">
                    <Label text="Areas of Professional Interest" />
                    <Input value={bio.interests} onChange={v => setBio({ ...bio, interests: v })} placeholder="AgriTech innovation, women-led businesses, early-stage startups" />
                  </div>
                  <div>
                    <Label text="Why would you like to mentor entrepreneurs?" required />
                    <Textarea value={bio.motivation} onChange={v => setBio({ ...bio, motivation: v })} placeholder="What drives you to give back? What impact do you hope to make through mentoring?" rows={4} />
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 4: Education ── */}
            {step === 4 && (
              <>
                <SectionCard title="Education and Qualifications" desc="Add all relevant academic qualifications.">
                  {qualifications.map((q, i) => (
                    <div key={i} className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200 relative">
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Qualification {i + 1}</div>
                      {qualifications.length > 1 && (
                        <button onClick={() => setQualifications(qualifications.filter((_, j) => j !== i))}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div><Label text="Qualification" /><Select value={q.qualification} onChange={v => { const n = [...qualifications]; n[i].qualification = v; setQualifications(n); }} options={["Certificate", "Diploma", "Bachelor's Degree", "Honours Degree", "Master's Degree", "MBA", "PhD", "Professional Qualification", "Other"]} placeholder="Select level" /></div>
                        <div><Label text="Field of Study" /><Input value={q.field} onChange={v => { const n = [...qualifications]; n[i].field = v; setQualifications(n); }} placeholder="Business Administration" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1"><Label text="Institution" /><Input value={q.institution} onChange={v => { const n = [...qualifications]; n[i].institution = v; setQualifications(n); }} placeholder="University name" /></div>
                        <div><Label text="Country" /><Input value={q.country} onChange={v => { const n = [...qualifications]; n[i].country = v; setQualifications(n); }} placeholder="Malawi" /></div>
                        <div><Label text="Year" /><Input value={q.year} onChange={v => { const n = [...qualifications]; n[i].year = v; setQualifications(n); }} placeholder="2018" /></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setQualifications([...qualifications, { qualification: "", field: "", institution: "", country: "", year: "" }])}
                    className="flex items-center gap-2 text-xs font-semibold text-[#4C808A] hover:text-[#3B4167] border border-dashed border-[#4C808A]/40 hover:border-[#3B4167]/40 px-4 py-2.5 rounded-md transition-all w-full justify-center">
                    <Plus className="w-4 h-4" /> Add Another Qualification
                  </button>
                </SectionCard>
              </>
            )}

            {/* ── STEP 5: Professional Experience ── */}
            {step === 5 && (
              <>
                <SectionCard title="Professional Experience" desc="List your most relevant positions, starting with the most recent.">
                  {experiences.map((exp, i) => (
                    <div key={i} className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200 relative">
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Position {i + 1}</div>
                      {experiences.length > 1 && (
                        <button onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div><Label text="Organization" /><Input value={exp.org} onChange={v => { const n = [...experiences]; n[i].org = v; setExperiences(n); }} placeholder="Company / organization" /></div>
                        <div><Label text="Position" /><Input value={exp.position} onChange={v => { const n = [...experiences]; n[i].position = v; setExperiences(n); }} placeholder="Your job title" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div><Label text="Industry" /><Input value={exp.industry} onChange={v => { const n = [...experiences]; n[i].industry = v; setExperiences(n); }} placeholder="FinTech" /></div>
                        <div><Label text="Start Date" /><Input type="month" value={exp.startDate} onChange={v => { const n = [...experiences]; n[i].startDate = v; setExperiences(n); }} /></div>
                        <div><Label text="End Date" /><Input type="month" value={exp.endDate} onChange={v => { const n = [...experiences]; n[i].endDate = v; setExperiences(n); }} placeholder="Present if current" /></div>
                      </div>
                      <div className="mb-3"><Label text="Key Responsibilities" /><Textarea value={exp.responsibilities} onChange={v => { const n = [...experiences]; n[i].responsibilities = v; setExperiences(n); }} placeholder="Describe your main duties..." rows={3} /></div>
                      <div><Label text="Major Achievements" /><Textarea value={exp.achievements} onChange={v => { const n = [...experiences]; n[i].achievements = v; setExperiences(n); }} placeholder="What are you most proud of in this role?" rows={2} /></div>
                    </div>
                  ))}
                  <button onClick={() => setExperiences([...experiences, { org: "", position: "", industry: "", startDate: "", endDate: "", responsibilities: "", achievements: "" }])}
                    className="flex items-center gap-2 text-xs font-semibold text-[#4C808A] hover:text-[#3B4167] border border-dashed border-[#4C808A]/40 hover:border-[#3B4167]/40 px-4 py-2.5 rounded-md transition-all w-full justify-center">
                    <Plus className="w-4 h-4" /> Add Professional Experience
                  </button>
                </SectionCard>
              </>
            )}

            {/* ── STEP 6: Entrepreneurial Experience ── */}
            {step === 6 && (
              <>
                <SectionCard title="Entrepreneurial Experience" desc="Have you had direct experience building or running a business?">
                  <div className="mb-5">
                    <Label text="Have you ever:" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {ENT_EXPERIENCE_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => setEntExpChecks(toggle(entExpChecks, opt))}
                          className="flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all"
                          style={{ background: entExpChecks.includes(opt) ? "rgba(76,128,138,0.1)" : "#f9fafb", borderColor: entExpChecks.includes(opt) ? "#4C808A" : "#e5e7eb" }}>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${entExpChecks.includes(opt) ? "bg-[#4C808A] border-[#4C808A]" : "border-gray-300"}`}>
                            {entExpChecks.includes(opt) && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-gray-800 text-xs font-semibold">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {entExpChecks.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Business Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div><Label text="Business Name" /><Input value={entBiz.name} onChange={v => setEntBiz({ ...entBiz, name: v })} placeholder="Business name" /></div>
                        <div><Label text="Industry" /><Input value={entBiz.industry} onChange={v => setEntBiz({ ...entBiz, industry: v })} placeholder="AgriTech" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div><Label text="Years of Operation" /><Input value={entBiz.years} onChange={v => setEntBiz({ ...entBiz, years: v })} placeholder="5" /></div>
                        <div><Label text="Current Status" /><Select value={entBiz.status} onChange={v => setEntBiz({ ...entBiz, status: v })} options={["Active", "Sold", "Closed", "Merged", "On hold"]} placeholder="Select" /></div>
                        <div><Label text="Number of Employees" /><Input value={entBiz.employees} onChange={v => setEntBiz({ ...entBiz, employees: v })} placeholder="25" /></div>
                      </div>
                      <div className="mb-3"><Label text="Major Achievements" /><Textarea value={entBiz.achievements} onChange={v => setEntBiz({ ...entBiz, achievements: v })} placeholder="Key milestones, awards, markets reached..." rows={2} /></div>
                      <div><Label text="Annual Revenue Range (Optional)" /><Select value={entBiz.revenue} onChange={v => setEntBiz({ ...entBiz, revenue: v })} options={["Under MWK 5M", "MWK 5M – 20M", "MWK 20M – 100M", "MWK 100M – 500M", "MWK 500M+"]} placeholder="Select range (optional)" /></div>
                    </div>
                  )}
                </SectionCard>
              </>
            )}

            {/* ── STEP 7: Mentoring Experience ── */}
            {step === 7 && (
              <>
                <SectionCard title="Mentoring Experience" desc="Tell us about your previous mentoring or coaching roles.">
                  <div className="mb-5">
                    <Label text="Have you mentored before?" required />
                    <div className="flex gap-3 mt-2">
                      {(["yes", "no"] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setHasMentored(v)}
                          className="px-6 py-2.5 rounded-md text-xs font-bold border transition-all capitalize"
                          style={{ background: hasMentored === v ? "#4C808A" : "#f3f4f6", borderColor: hasMentored === v ? "#4C808A" : "#d1d5db", color: hasMentored === v ? "white" : "#374151" }}>
                          {v === "yes" ? "Yes, I have" : "No, this is new for me"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasMentored === "yes" && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div><Label text="Organization" /><Input value={mentoringExp.org} onChange={v => setMentoringExp({ ...mentoringExp, org: v })} placeholder="Where you mentored" /></div>
                        <div><Label text="Programme Name" /><Input value={mentoringExp.program} onChange={v => setMentoringExp({ ...mentoringExp, program: v })} placeholder="Youth Entrepreneurship Programme" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div><Label text="Number of Startups Mentored" /><Input value={mentoringExp.startups} onChange={v => setMentoringExp({ ...mentoringExp, startups: v })} placeholder="12" /></div>
                        <div><Label text="Years of Mentoring" /><Input value={mentoringExp.years} onChange={v => setMentoringExp({ ...mentoringExp, years: v })} placeholder="3" /></div>
                      </div>
                      <div>
                        <Label text="Type of Mentoring" />
                        <div className="flex flex-wrap gap-2 mt-1">
                          {MENTORING_TYPES.map((t) => (
                            <ChipToggle key={t} label={t} selected={mentoringExp.types.includes(t)} onToggle={() => setMentoringExp({ ...mentoringExp, types: toggle(mentoringExp.types, t) })} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {hasMentored === "no" && (
                    <div className="p-4 bg-[#4C808A]/10 rounded-md border border-[#4C808A]/20">
                      <p className="text-gray-700 text-xs leading-relaxed">No previous mentoring experience? No problem. All new mentors receive structured onboarding, training and matching support before they begin their first engagement.</p>
                    </div>
                  )}
                </SectionCard>
              </>
            )}

            {/* ── STEP 8: Programme Fit ── */}
            {step === 8 && (
              <>
                <SectionCard title="Programme Interest" desc="Which Emerge Livelihoods programmes would you like to support?">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "Incubation Programme", label: "Incubation Programme", desc: "Support idea-stage to early startup founders over 5–6 months." },
                      { id: "Acceleration Programme", label: "Acceleration Programme", desc: "Guide growth-stage businesses to scale and investment readiness." },
                      { id: "Both", label: "Both Programmes", desc: "Contribute across incubation and acceleration cohorts." },
                    ].map(({ id, label, desc }) => (
                      <button key={id} type="button" onClick={() => setProgInterest(toggle(progInterest, id))}
                        className="p-4 rounded-md border text-left transition-all"
                        style={{ background: progInterest.includes(id) ? "rgba(76,128,138,0.1)" : "#f9fafb", borderColor: progInterest.includes(id) ? "#4C808A" : "#e5e7eb" }}>
                        <div className={`w-5 h-5 rounded-md border mb-2 flex items-center justify-center ${progInterest.includes(id) ? "bg-[#4C808A] border-[#4C808A]" : "border-gray-300"}`}>
                          {progInterest.includes(id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-gray-800 font-bold text-xs mb-1">{label}</div>
                        <div className="text-gray-500 text-[10px] leading-relaxed">{desc}</div>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Business Stage Expertise" desc="Select all stages where you can confidently guide entrepreneurs. This is a primary matching criterion.">
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_STAGES.map((s) => (
                      <ChipToggle key={s} label={s} selected={stageExp.includes(s)} onToggle={() => setStageExp(toggle(stageExp, s))} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Availability" desc="How much time can you commit monthly?">
                  <div className="mb-4">
                    <Label text="Available Hours Per Month" />
                    <Select value={hoursPerMonth} onChange={setHoursPerMonth} options={["1–2 hours", "3–5 hours", "6–8 hours", "9–12 hours", "12+ hours"]} placeholder="Select commitment level" />
                  </div>
                  <div>
                    <Label text="Preferred Days / Time" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Weekday Mornings", "Weekday Afternoons", "Weekday Evenings", "Saturday", "Sunday", "Flexible"].map(d => (
                        <ChipToggle key={d} label={d} selected={availability.includes(d)} onToggle={() => setAvailability(toggle(availability, d))} />
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 9: Expertise ── */}
            {step === 9 && (
              <>
                <SectionCard title="Industry Expertise" desc="Select all industries where you have professional expertise.">
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <ChipToggle key={ind} label={ind} selected={industryExp.includes(ind)} onToggle={() => setIndustryExp(toggle(industryExp, ind))} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Functional / Skills Expertise" desc="Select specific areas where you can mentor entrepreneurs.">
                  {FUNCTIONAL_EXPERTISE.map(({ group, items }) => (
                    <div key={group} className="mb-5">
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">{group}</div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => (
                          <ChipToggle key={item} label={item} selected={funcExp.includes(item)} onToggle={() => setFuncExp(toggle(funcExp, item))} />
                        ))}
                      </div>
                    </div>
                  ))}
                </SectionCard>
              </>
            )}

            {/* ── STEP 10: Preferences ── */}
            {step === 10 && (
              <>
                <SectionCard title="Who Would You Like to Mentor?" desc="Help us match you with the right entrepreneurs.">
                  <div className="mb-5">
                    <Label text="Preferred Business Stages" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {BUSINESS_STAGES.map((s) => <ChipToggle key={s} label={s} selected={prefStages.includes(s)} onToggle={() => setPrefStages(toggle(prefStages, s))} />)}
                    </div>
                  </div>
                  <div className="mb-5">
                    <Label text="Preferred Industries" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {INDUSTRIES.slice(0, 12).map((ind) => <ChipToggle key={ind} label={ind} selected={prefIndustries.includes(ind)} onToggle={() => setPrefIndustries(toggle(prefIndustries, ind))} />)}
                    </div>
                  </div>
                  <div>
                    <Label text="Preferred Founder Types" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {FOUNDER_TYPES.map((ft) => <ChipToggle key={ft} label={ft} selected={prefFounderTypes.includes(ft)} onToggle={() => setPrefFounderTypes(toggle(prefFounderTypes, ft))} />)}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Languages and Mentoring Mode">
                  <div className="mb-5">
                    <Label text="Languages You Can Mentor In" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {LANGUAGES.map((l) => <ChipToggle key={l} label={l} selected={languages.includes(l)} onToggle={() => setLanguages(toggle(languages, l))} />)}
                    </div>
                  </div>
                  <div>
                    <Label text="Preferred Mentoring Mode" />
                    <div className="flex flex-wrap gap-3 mt-1">
                      {["Online", "Physical / In-Person", "Hybrid"].map((m) => (
                        <ChipToggle key={m} label={m} selected={mentoringMode.includes(m)} onToggle={() => setMentoringMode(toggle(mentoringMode, m))} />
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 11: Docs and Links ── */}
            {step === 11 && (
              <>
                <SectionCard title="Professional References" desc="Provide two professional references who can vouch for your expertise.">
                  {[{ label: "Reference 1", ref: ref1, setRef: setRef1 }, { label: "Reference 2", ref: ref2, setRef: setRef2 }].map(({ label, ref, setRef }) => (
                    <div key={label} className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">{label}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><Label text="Full Name" /><Input value={ref.name} onChange={v => setRef({ ...ref, name: v })} placeholder="Reference name" /></div>
                        <div><Label text="Organization" /><Input value={ref.org} onChange={v => setRef({ ...ref, org: v })} placeholder="Their organization" /></div>
                        <div><Label text="Email" /><Input type="email" value={ref.email} onChange={v => setRef({ ...ref, email: v })} placeholder="reference@email.com" /></div>
                        <div><Label text="Phone Number" /><Input type="tel" value={ref.phone} onChange={v => setRef({ ...ref, phone: v })} placeholder="+265 88 000 0000" /></div>
                      </div>
                    </div>
                  ))}
                </SectionCard>

                <SectionCard title="Document Uploads" desc="Upload supporting documents. CV is required; others recommended.">
                  <div className="space-y-3">
                    {[
                      { key: "cv", label: "CV / Resume", required: true },
                      { key: "nationalId", label: "National ID or Passport", required: false },
                      { key: "acadCerts", label: "Academic Certificates", required: false },
                    ].map(({ key, label, required }) => {
                      const file = docFiles[key];
                      const err = docErrors[key];
                      return (
                        <div key={key}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            ref={(el) => { docInputRefs.current[key] = el; }}
                            onChange={handleDocSelect(key)}
                          />
                          <div className={`flex items-center justify-between p-3 bg-white rounded-md border transition-all ${err ? "border-red-300" : file ? "border-[#4C808A]/40 bg-[#4C808A]/5" : "border-gray-200 hover:border-gray-300"}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${file ? "bg-[#4C808A]" : "bg-gray-100"}`}>
                                {file ? <Check className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-gray-400" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-gray-800 text-xs font-semibold">{label} {required && <span className="text-red-500">*</span>}</div>
                                {file ? (
                                  <div className="text-[#4C808A] text-[10px] font-medium truncate max-w-[200px]">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>
                                ) : (
                                  <div className="text-gray-400 text-[10px]">PDF, DOC, DOCX — max 10MB</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {file && (
                                <>
                                  <button type="button" onClick={() => window.open(URL.createObjectURL(file), "_blank")}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-gray-200 text-[#4C808A] hover:bg-gray-50 transition-all">
                                    Preview
                                  </button>
                                  <button type="button" onClick={() => removeDoc(key)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                                    Remove
                                  </button>
                                </>
                              )}
                              <button type="button" onClick={() => docInputRefs.current[key]?.click()}
                                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all flex items-center gap-1.5">
                                <Upload className="w-3 h-3" /> {file ? "Change" : "Upload"}
                              </button>
                            </div>
                          </div>
                          {err && <div className="text-red-500 text-[10px] mt-1 font-semibold pl-1">{err}</div>}
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard title="Social and Professional Profiles" desc="Add links to your professional online presence.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div><Label text="LinkedIn Profile" /><Input value={socials.linkedin} onChange={v => setSocials({ ...socials, linkedin: v })} placeholder="linkedin.com/in/yourprofile" /></div>
                    <div><Label text="Website" /><Input value={socials.website} onChange={v => setSocials({ ...socials, website: v })} placeholder="yourwebsite.com" /></div>
                    {/* <div><Label text="GitHub (if technical)" /><Input value={socials.github} onChange={v => setSocials({ ...socials, github: v })} placeholder="github.com/username" /></div> */}
                    <div><Label text="ResearchGate" /><Input value={socials.researchgate} onChange={v => setSocials({ ...socials, researchgate: v })} placeholder="researchgate.net/profile/..." /></div>
                    <div><Label text="Google Scholar" /><Input value={socials.scholar} onChange={v => setSocials({ ...socials, scholar: v })} placeholder="scholar.google.com/..." /></div>
                    <div><Label text="X (Twitter)" /><Input value={socials.twitter} onChange={v => setSocials({ ...socials, twitter: v })} placeholder="@yourhandle" /></div>
                  </div>
                  <div>
                    <Label text="Conflict of Interest" />
                    <p className="text-gray-500 text-xs mb-3">Do you currently work with any startup that may create a conflict of interest if you are placed as their mentor?</p>
                    <div className="flex gap-3 mb-3">
                      {(["yes", "no"] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setConflict(v)}
                          className="px-5 py-2 rounded-md text-xs font-bold border transition-all capitalize"
                          style={{ background: conflict === v ? "#4C808A" : "#f3f4f6", borderColor: conflict === v ? "#4C808A" : "#d1d5db", color: conflict === v ? "white" : "#374151" }}>
                          {v === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                    {conflict === "yes" && (
                      <Textarea value={conflictExplain} onChange={setConflictExplain} placeholder="Please explain the nature of the potential conflict..." rows={3} />
                    )}
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 12: Suitability Assessment ── */}
            {step === 12 && (
              <>
                <div className="mb-5 p-4 bg-[#4C808A]/5 rounded-md border border-[#4C808A]/20">
                  <div className="text-[#4C808A] text-[10px] font-bold tracking-widest uppercase mb-1">Mentor Suitability Assessment</div>
                  <p className="text-gray-600 text-xs leading-relaxed">This is not a pass or fail test. It is a diagnostic tool that helps us build your <strong className="text-gray-900">Mentor Matching Profile</strong> — so we can connect you with entrepreneurs whose needs align with your style and strengths.</p>
                </div>

                <SectionCard title="Coaching and Communication Style">
                  <div className="mb-5">
                    <Label text="How would you describe your coaching approach?" />
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { v: "Directive", desc: "I give clear direction and structured guidance." },
                        { v: "Facilitative", desc: "I ask questions and help entrepreneurs find their own answers." },
                        { v: "Collaborative", desc: "I work alongside the entrepreneur as a thinking partner." },
                      ].map(({ v, desc }) => (
                        <button key={v} type="button" onClick={() => setAssessment({ ...assessment, coaching: v })}
                          className="p-4 rounded-md border text-left transition-all"
                          style={{ background: assessment.coaching === v ? "rgba(76,128,138,0.1)" : "#f9fafb", borderColor: assessment.coaching === v ? "#4C808A" : "#e5e7eb" }}>
                          <div className="text-gray-800 font-bold text-xs mb-1">{v}</div>
                          <div className="text-gray-500 text-[10px] leading-relaxed">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label text="Preferred communication style?" />
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { v: "Structured", desc: "Scheduled sessions with set agendas and clear outputs." },
                        { v: "Flexible", desc: "Responsive, ad-hoc support as needs arise." },
                        { v: "Hands-on", desc: "Deep involvement in the entrepreneur's journey." },
                      ].map(({ v, desc }) => (
                        <button key={v} type="button" onClick={() => setAssessment({ ...assessment, communication: v })}
                          className="p-4 rounded-md border text-left transition-all"
                          style={{ background: assessment.communication === v ? "rgba(76,128,138,0.1)" : "#f9fafb", borderColor: assessment.communication === v ? "#4C808A" : "#e5e7eb" }}>
                          <div className="text-gray-800 font-bold text-xs mb-1">{v}</div>
                          <div className="text-gray-500 text-[10px] leading-relaxed">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Personality and Digital Readiness">
                  <div className="mb-5">
                    <Label text="Which describe your mentoring personality? (Select all that apply)" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Patient and empathetic", "Active listener", "Gives constructive feedback", "Strong problem-solver", "Encouraging", "Direct and honest", "Detail-oriented"].map(p => (
                        <ChipToggle key={p} label={p} selected={assessment.personality.includes(p)} onToggle={() => setAssessment({ ...assessment, personality: toggle(assessment.personality, p) })} />
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <Label text="Digital comfort level" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Comfortable with video calls", "Uses online collaboration tools", "Learning platform experience", "Basic digital skills only"].map(d => (
                        <ChipToggle key={d} label={d} selected={assessment.digital.includes(d)} onToggle={() => setAssessment({ ...assessment, digital: toggle(assessment.digital, d) })} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label text="Commitment readiness" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Can commit consistently for 6+ months", "Open to mentor training", "Open to receiving feedback", "Willing to complete session reports"].map(c => (
                        <ChipToggle key={c} label={c} selected={assessment.commitment.includes(c)} onToggle={() => setAssessment({ ...assessment, commitment: toggle(assessment.commitment, c) })} />
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── STEP 13: Review and Submit ── */}
            {step === 13 && (
              <>
                <div className="mb-5 p-5 rounded-md shadow-sm text-center" style={{ background: "#4C808A" }}>
                  <StrengthGauge pct={strength} />
                  <div className="mt-3 font-bold text-sm" style={{ color: "#FFFFFF" }}>Mentor Profile Strength: {strength}%</div>
                  {strength < 70 && <p className="text-xs mt-1" style={{ color: "#FFFFFF" }}>Complete more sections to strengthen your profile and improve matching results.</p>}
                </div>

                {/* Summary cards */}
                {[
                  { label: "Account", icon: User, items: [acct.firstName + " " + acct.lastName, acct.email, acct.mobile].filter(Boolean) },
                  { label: "Professional Profile", icon: Briefcase, items: [profile.title, profile.employer, profile.yearsExp + " experience"].filter(Boolean) },
                  { label: "Programme Interest", icon: Target, items: progInterest.length ? progInterest : ["Not selected"] },
                  { label: "Business Stage Expertise", icon: Zap, items: stageExp.length ? stageExp : ["Not selected"] },
                  { label: "Industry Expertise", icon: Globe, items: industryExp.length ? [industryExp.slice(0, 3).join(", ") + (industryExp.length > 3 ? ` +${industryExp.length - 3} more` : "")] : ["Not selected"] },
                  { label: "Functional Expertise", icon: Star, items: funcExp.length ? [funcExp.slice(0, 4).join(", ") + (funcExp.length > 4 ? ` +${funcExp.length - 4} more` : "")] : ["Not selected"] },
                  { label: "Availability", icon: Users, items: [hoursPerMonth || "Not specified", ...(availability.length ? [availability.join(", ")] : [])] },
                  { label: "Documents", icon: FileText, items: [docs.cv ? "CV uploaded" : "CV not uploaded (required)", ...Object.entries(docs).filter(([k, v]) => k !== "cv" && v).map(([k]) => k)] },
                ].map(({ label, icon: Icon, items }) => (
                  <div key={label} className="bg-white rounded-md border border-gray-200 p-4 mb-3 flex gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: "#4C808A" }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-bold text-xs mb-1">{label}</div>
                      {items.map((item, i) => <div key={i} className="text-gray-500 text-[10px]">{item}</div>)}
                    </div>
                  </div>
                ))}

                {!docs.cv && (
                  <div className="mb-4 p-3.5 rounded-md border border-red-700 shadow-sm" style={{ background: "#dc2626" }}>
                    <p className="text-white text-xs font-bold leading-relaxed">CV / Resume is required before submission. Please go back to Section 11 and upload your CV.</p>
                  </div>
                )}

                {/* Declaration */}
                <div className="p-5 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
                  <div className="text-gray-900 font-bold text-xs mb-2">Declaration</div>
                  <p className="text-gray-500 text-[10px] leading-relaxed mb-4">
                    I confirm that the information provided in this application is accurate and complete to the best of my knowledge. I understand that providing false information may result in disqualification from the mentor program. I agree to abide by the Emerge Livelihoods Mentor Code of Conduct if selected.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="w-4 h-4 rounded-md border border-[#4C808A] bg-[#4C808A] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-600 text-xs">I agree to the terms above and the Mentor Code of Conduct.</span>
                  </label>
                </div>

                {acctProblem && <p className="text-xs text-amber-300 mb-3">{acctProblem} Go back to step 1 (Account) to fix it.</p>}
                <button
                  disabled={!!acctProblem}
                  onClick={() => {
                    if (acctProblem) return;
                    const newId = `MNT-${Date.now()}`;
                    setRefId(newId);
                    const app: MentorApplication = {
                      id: newId,
                      name: `${acct.firstName} ${acct.lastName}`,
                      district: profile.district || "Lilongwe",
                      phone: acct.mobile,
                      expertise: industryExp[0] || funcExp[0] || "General",
                      date: new Date().toISOString().split("T")[0],
                      status: "Pending",
                      score: scoreMentor({
                        profile, bio, qualifications, experiences, hasMentored, mentoringExp, progInterest, stageExp, industryExp, funcExp,
                        hoursPerMonth, availability, mentoringMode, languages, ref1, ref2, socials, hasCv: !!docFiles.cv,
                      }),
                      program: (acct.program as "Incubation" | "Acceleration") || "Incubation",
                      isMockup: false,
                      email: acct.email,
                      title: profile.title,
                      employer: profile.employer,
                      bio: bio.career || bio.biography || undefined,
                      expertiseAreas: [...industryExp, ...funcExp].slice(0, 6),
                      location: [profile.district, profile.country || "Malawi"].filter(Boolean).join(", "),
                      preferredStages: stageExp, industries: industryExp, hoursPerMonth: hoursPerMonth || undefined,
                    };
                    onSubmitMentorApplication?.(app, acct.password);
                    setSubmitted(true);
                  }}
                  className="w-full py-4 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#4C808A", color: "white", border: "2px solid rgba(255,255,255,0.3)" }}
                >
                  Submit Mentor Registration <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-6">
              <button onClick={prev} disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: "1px solid #3B4167", color: "#3B4167", background: "transparent" }}>
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="text-[10px]" style={{ color: "#000000" }}>{step} / {STEPS.length}</div>
              {step < 13 ? (
                <button onClick={next}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md text-white text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: "#3B4167" }}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
