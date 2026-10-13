import { useState, useRef } from "react";
import { scoreEntrepreneur } from "../data/applicationScoring";
import { ArrowRight, CheckCircle, Circle, User, Briefcase, Building, Users, Target, ChevronDown, Camera, Lightbulb, Search, Wrench, Rocket } from "lucide-react";
import type { EntrepreneurApplication } from "../types";
import { AccountFields, accountProblem } from "./AccountFields";

type Stage = "idea" | "validation" | "prototype" | "early";

const TEAL = "#4C808A";
const NAVY = "#3B4167";
const PANEL_BG = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";

const stages: { id: Stage; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "idea",       label: "Idea Stage",              icon: Lightbulb, desc: "I have an idea but have not yet developed a product or started operations." },
  { id: "validation", label: "Validation Stage",         icon: Search,    desc: "I am testing my idea with potential customers and gathering market evidence." },
  { id: "prototype",  label: "Prototype / MVP Stage",    icon: Wrench,    desc: "I have built a prototype or MVP and am testing it with real users." },
  { id: "early",      label: "Early Startup Stage",      icon: Rocket,    desc: "My product has launched, I have customers and I am generating revenue." },
];

const steps = [
  { id: 1, label: "Business Stage", icon: Target },
  { id: 2, label: "Personal Info",  icon: User },
  { id: 3, label: "Founder Profile",icon: Briefcase },
  { id: 4, label: "Business Info",  icon: Building },
  { id: 5, label: "Team & Needs",   icon: Users },
  { id: 6, label: "Review",         icon: CheckCircle },
];

const MALAWI_LANGUAGES = [
  "Chichewa","Chitumbuka","Yao","Lomwe","Sena",
  "Nyakyusa","Senga","Lambya","Ngonde","Ndali","Sukwa","Tonga",
];

const skillsList  = ["Leadership","Sales","Marketing","Finance","Product Development","Technology","Operations","Legal & Compliance"];
const needsList   = ["Business Planning","Product Development","Marketing & Branding","Financial Management","Accounting","Legal Compliance","Intellectual Property","Investment Readiness","Digital Marketing","Leadership","Sales","Export Readiness"];
const sectorList  = ["Agriculture & Agribusiness","Technology & ICT","Health & Wellbeing","Education & Training","Manufacturing","Trade & Commerce","Creative Industries","Tourism & Hospitality","Financial Services","Energy & Environment","Other"];

// ── Dot pattern (matches login form) ─────────────────────────────────────────
// ── Animated progress bar ─────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  const color =
    pct <= 25 ? "#ef4444" :
    pct <= 50 ? "#f97316" :
    pct <= 85 ? "#C9CC3F" :
               "#0FFF50";

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 bg-white/20 rounded-md h-2 overflow-hidden">
        <div
          className="h-full rounded-md"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.6s ease",
            boxShadow: `0 0 10px ${color}88`,
            animation: "progPulse 1.8s ease-in-out infinite",
          }}
        />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 800, minWidth: 36, textShadow: `0 0 8px ${color}` }}>
        {pct}%
      </span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: NAVY }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls    = `w-full bg-[#f8f9fb] border border-[${NAVY}]/15 rounded-md px-3 py-2.5 text-[${NAVY}] text-xs focus:outline-none focus:border-[${TEAL}] focus:ring-1 focus:ring-[${TEAL}]/20 transition-all placeholder-[#6b7280]`;
const selectCls   = inputCls + " appearance-none cursor-pointer";
const textareaCls = inputCls + " resize-none";

export function IncubationApplicationForm({ onBack, onSubmitApplication, programId, programName }: { onBack: () => void; onSubmitApplication?: (app: EntrepreneurApplication, password: string) => void; programId?: string; programName?: string }) {
  const [step, setStep]         = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");

  // Profile picture
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const avatarInputRef              = useRef<HTMLInputElement>(null);

  // Multi-select stage
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);
  const toggleStage = (id: Stage) =>
    setSelectedStages(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const [personal, setPersonal] = useState({
    firstName: "", lastName: "", gender: "", dob: "", nationality: "Malawian",
    email: "", phone: "", address: "", district: "", region: "", country: "Malawi", password: "", confirmPassword: "",
    languages: [] as string[],
    youthOwned: false, womanOwned: false, disability: false,
    ruralUrban: "",
  });
  const [founder, setFounder] = useState({
    qualification: "", fieldOfStudy: "", institution: "", employmentHistory: "", businessExperience: "",
    industryExperience: "", skills: {} as Record<string, string>,
    whyEntrepreneur: "", motivation: "",
  });
  const [business, setBusiness] = useState({
    name: "", industry: "", sector: "", yearStarted: "", registrationStatus: "",
    problem: "", whoExperiences: "", solution: "", differentiation: "",
    ideaDescription: "", inspiration: "", idealCustomer: "", spokeToCustomers: "",
    interviewsCompleted: "", surveysCompleted: "", marketResearch: "", competitors: "",
    productDeveloped: "", prototypeCompleted: "", mvpLaunched: "", users: "", customerFeedback: "",
    customersAcquired: "", payingCustomers: "", monthlyRevenue: "", teamSize: "",
  });
  const [team, setTeam] = useState({ coFounderName: "", coFounderRole: "", coFounderSkills: "", teamMemberPosition: "", teamMemberResponsibilities: "" });
  const [needs, setNeeds] = useState<Record<string, boolean>>({});

  const setP  = (k: string, v: string | boolean) => setPersonal(prev => ({ ...prev, [k]: v }));
  const setF  = (k: string, v: string)            => setFounder(prev => ({ ...prev, [k]: v }));
  const setB  = (k: string, v: string)            => setBusiness(prev => ({ ...prev, [k]: v }));

  const toggleLanguage = (lang: string) =>
    setPersonal(prev => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang],
    }));

  const canProceed = () => {
    if (step === 1) return selectedStages.length > 0;
    if (step === 2) return !!(personal.firstName && personal.lastName && personal.email && personal.phone && personal.gender) && !accountProblem("mentee", personal.email, personal.password, personal.confirmPassword);
    return true;
  };

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${TEAL}18`, border: `2px solid ${TEAL}` }}>
            <CheckCircle className="w-10 h-10" style={{ color: TEAL }} />
          </div>
          <h2 className="font-bold mb-3" style={{ fontSize: "1.5rem", color: NAVY }}>Application Submitted!</h2>
          <p className="text-[#6b7280] text-sm mb-2">Thank you, <strong style={{ color: NAVY }}>{personal.firstName}</strong>. Your application for the Emerge Livelihoods Incubation Program has been received.</p>
          {refId && <p className="text-[#6b7280] text-xs mb-4">Your reference number: <strong style={{ color: NAVY }}>{refId}</strong>. Keep it to track your application.</p>}
          <p className="text-[#6b7280] text-sm mb-8">Our team will review your application and contact you at <strong style={{ color: NAVY }}>{personal.email}</strong> within <strong style={{ color: NAVY }}>5–7 business days</strong>.</p>
          <div className="bg-white rounded-md border border-[#3B4167]/10 p-6 mb-6 text-left space-y-2">
            <h4 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Application Summary</h4>
            <div className="flex justify-between text-xs"><span className="text-[#6b7280]">Applicant</span><span className="font-semibold" style={{ color: NAVY }}>{personal.firstName} {personal.lastName}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6b7280]">Business Stage(s)</span><span className="font-semibold" style={{ color: NAVY }}>{selectedStages.map(id => stages.find(s => s.id === id)?.label).join(", ") || "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6b7280]">Business</span><span className="font-semibold" style={{ color: NAVY }}>{business.name || "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6b7280]">Sector</span><span className="font-semibold" style={{ color: NAVY }}>{business.sector || "—"}</span></div>
          </div>
          <button onClick={onBack} className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white text-sm font-bold transition-all" style={{ background: TEAL }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif", background: "#f8f9fb" }}>
      <style>{`
        @keyframes progPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="relative pt-10 pb-8" style={{ background: PANEL_BG }}>
        <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-8">
          <button onClick={onBack} className="text-white/60 hover:text-white text-xs mb-4 transition-colors block">Back</button>

          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md" style={{ background: TEAL }}>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#fff" }}>Incubation Application</span>
            </div>
            <span className="text-xs" style={{ color: "#fff" }}>Step {step} of {steps.length}</span>
          </div>
          {programName && (
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>Applying to: <strong>{programName}</strong></p>
          )}

          <h1 className="font-bold mb-3 text-white" style={{ fontSize: "clamp(1.15rem, 3vw, 1.65rem)" }}>
            {steps[step - 1].label}
          </h1>

          {/* Animated progress bar */}
          <ProgressBar step={step} total={steps.length} />

          {/* Step pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {steps.map((s) => (
              <div key={s.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold shrink-0 transition-all ${
                s.id === step ? "text-white" : s.id < step ? "text-white" : "text-white/40"
              }`} style={{ background: s.id === step ? TEAL : s.id < step ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)" }}>
                {s.id < step ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10">

        {/* STEP 1: Business Stage */}
        {step === 1 && (
          <div>
            {/* ── Profile picture upload — top centre ── */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-3">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer group"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${TEAL})`, border: `3px solid ${TEAL}`, boxShadow: "0 4px 20px rgba(76,128,138,0.25)" }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 80 80" width="56" height="56" fill="none">
                      <circle cx="40" cy="28" r="14" fill="rgba(255,255,255,0.85)" />
                      <ellipse cx="40" cy="68" rx="26" ry="16" fill="rgba(255,255,255,0.85)" />
                    </svg>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <Camera size={18} color="#fff" />
                    <span className="text-white text-[9px] font-bold mt-1">Upload</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: TEAL }}
                >
                  <Camera size={12} color="#fff" />
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <p className="text-xs font-semibold mb-0.5" style={{ color: NAVY }}>Profile Photo</p>
              <p className="text-[10px] text-[#6b7280]">Upload a recent photo of yourself (optional)</p>
            </div>

            <p className="text-[#6b7280] text-sm mb-6 text-center">
              Select the stage that best describes where your startup is right now. Your selection will personalise the rest of this application.
            </p>
            <p className="text-[10px] font-semibold mb-3 text-center" style={{ color: TEAL }}>You may select multiple stages</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {stages.map((s) => {
                const isSelected = selectedStages.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStage(s.id)}
                    className="text-left p-5 rounded-md border-2 transition-all"
                    style={{
                      borderColor: isSelected ? TEAL : "rgba(59,65,103,0.15)",
                      background: isSelected ? `${TEAL}08` : "#fff",
                      boxShadow: isSelected ? `0 4px 16px ${TEAL}22` : "none",
                    }}
                  >
                    <div className="mb-3"><s.icon size={18} /></div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-sm" style={{ color: NAVY }}>{s.label}</h3>
                      {isSelected && <CheckCircle className="w-4 h-4" style={{ color: TEAL }} />}
                    </div>
                    <p className="text-[#6b7280] text-[11px] leading-relaxed">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Personal Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First Name" required><input className={inputCls} placeholder="Amina" value={personal.firstName} onChange={e => setP("firstName", e.target.value)} /></Field>
                <Field label="Last Name" required><input className={inputCls} placeholder="Banda" value={personal.lastName} onChange={e => setP("lastName", e.target.value)} /></Field>
                <Field label="Gender" required>
                  <div className="relative">
                    <select className={selectCls} value={personal.gender} onChange={e => setP("gender", e.target.value)}>
                      <option value="">Select gender</option>
                      <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Date of Birth"><input type="date" className={inputCls} value={personal.dob} onChange={e => setP("dob", e.target.value)} /></Field>
                <Field label="Nationality"><input className={inputCls} value={personal.nationality} onChange={e => setP("nationality", e.target.value)} /></Field>
                <Field label="Email Address" required><input type="email" className={inputCls} placeholder="amina@example.com" value={personal.email} onChange={e => setP("email", e.target.value)} /></Field>
                <AccountFields role="mentee" variant="light" email={personal.email} password={personal.password} confirm={personal.confirmPassword} onChange={v => setPersonal(p => ({ ...p, password: v.password, confirmPassword: v.confirm }))} />
                <Field label="Phone Number" required><input type="tel" className={inputCls} placeholder="+265 88 000 0000" value={personal.phone} onChange={e => setP("phone", e.target.value)} /></Field>
                <Field label="Physical Address"><input className={inputCls} placeholder="Street / Area" value={personal.address} onChange={e => setP("address", e.target.value)} /></Field>
                <Field label="District / City">
                  <div className="relative">
                    <select className={selectCls} value={personal.district} onChange={e => setP("district", e.target.value)}>
                      <option value="">Select district / city</option>
                      {["Mzuzu City","Rumphi","Mzimba","Nkhata Bay","Karonga","Chitipa","Likoma","Kasungu","Ntchisi","Dowa","Mchinji","Lilongwe City","Lilongwe","Dedza","Ntcheu","Salima","Nkhotakota","Zomba City","Zomba","Machinga","Mangochi","Balaka","Liwonde","Chiradzulu","Blantyre City","Blantyre","Thyolo","Mulanje","Phalombe","Chikwawa","Nsanje","Mwanza","Neno"].map(d => <option key={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Region">
                  <div className="relative">
                    <select className={selectCls} value={personal.region} onChange={e => setP("region", e.target.value)}>
                      <option value="">Select region</option>
                      <option>Northern Region</option><option>Central Region</option><option>Southern Region</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
              </div>

              {/* Languages */}
              <div className="mt-5">
                <label className="block text-xs font-semibold mb-2" style={{ color: NAVY }}>Languages Spoken</label>
                <p className="text-[#6b7280] text-[10px] mb-3">Select all languages you speak</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MALAWI_LANGUAGES.map(lang => {
                    const active = personal.languages.includes(lang);
                    return (
                      <label key={lang}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-all"
                        style={{
                          borderColor: active ? TEAL : "rgba(59,65,103,0.12)",
                          background: active ? `${TEAL}0d` : "#f8f9fb",
                        }}
                      >
                        <input type="checkbox" checked={active} onChange={() => toggleLanguage(lang)} className="w-3.5 h-3.5 accent-[#4C808A]" />
                        <span className="text-xs font-semibold" style={{ color: active ? TEAL : "#374151" }}>{lang}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: NAVY }}>Demographics</h3>
              <p className="text-[#6b7280] text-[10px] mb-4">This information is used for donor reporting only and does not affect your application.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: "youthOwned", label: "Youth-owned business (under 35)" },
                  { key: "womanOwned", label: "Woman-owned business" },
                  { key: "disability", label: "Person with disability" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-md border border-[#3B4167]/10 hover:border-[#4C808A]/30 transition-all">
                    <input type="checkbox" checked={personal[key as keyof typeof personal] as boolean} onChange={e => setP(key, e.target.checked)} className="w-4 h-4 accent-[#4C808A]" />
                    <span className="text-xs" style={{ color: NAVY }}>{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Field label="Location Type">
                  <div className="flex gap-3">
                    {["Rural", "Urban", "Peri-Urban"].map(v => (
                      <label key={v} className={`flex-1 text-center py-2 rounded-md border text-xs cursor-pointer transition-all ${personal.ruralUrban === v ? "font-bold" : "text-[#6b7280]"}`}
                        style={{ borderColor: personal.ruralUrban === v ? TEAL : "rgba(59,65,103,0.15)", background: personal.ruralUrban === v ? `${TEAL}12` : "transparent", color: personal.ruralUrban === v ? TEAL : undefined }}>
                        <input type="radio" className="hidden" value={v} checked={personal.ruralUrban === v} onChange={() => setP("ruralUrban", v)} />{v}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Founder Profile */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Education Background</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Highest Qualification">
                  <div className="relative">
                    <select className={selectCls} value={founder.qualification} onChange={e => setF("qualification", e.target.value)}>
                      <option value="">Select</option>
                      {["MSCE / O-Levels","Certificate","Diploma","Bachelor's Degree","Master's Degree","PhD","Other"].map(q => <option key={q}>{q}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Field of Study"><input className={inputCls} placeholder="Business Admin" value={founder.fieldOfStudy} onChange={e => setF("fieldOfStudy", e.target.value)} /></Field>
                <Field label="Institution"><input className={inputCls} placeholder="MUBAS" value={founder.institution} onChange={e => setF("institution", e.target.value)} /></Field>
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Professional Experience</h3>
              <div className="space-y-4">
                <Field label="Employment History"><textarea className={textareaCls} rows={2} placeholder="List previous jobs, roles or freelance work..." value={founder.employmentHistory} onChange={e => setF("employmentHistory", e.target.value)} /></Field>
                <Field label="Business Experience"><textarea className={textareaCls} rows={2} placeholder="Any previous business or entrepreneurial experience?" value={founder.businessExperience} onChange={e => setF("businessExperience", e.target.value)} /></Field>
                <Field label="Industry Experience"><input className={inputCls} placeholder="Industries you have worked in" value={founder.industryExperience} onChange={e => setF("industryExperience", e.target.value)} /></Field>
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: NAVY }}>Skills Self-Assessment</h3>
              <p className="text-[#6b7280] text-[10px] mb-4">Rate your confidence level in each area (1 = Beginner, 5 = Expert)</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {skillsList.map(skill => (
                  <div key={skill}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold" style={{ color: NAVY }}>{skill}</label>
                      <span className="text-xs font-bold" style={{ color: TEAL }}>{founder.skills[skill] || "—"}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setFounder(prev => ({ ...prev, skills: { ...prev.skills, [skill]: String(n) } }))}
                          className={`flex-1 h-6 rounded-md text-[9px] font-bold transition-all`}
                          style={{ background: parseInt(founder.skills[skill] || "0") >= n ? TEAL : "#f8f9fb", color: parseInt(founder.skills[skill] || "0") >= n ? "#fff" : "#6b7280", border: parseInt(founder.skills[skill] || "0") >= n ? "none" : "1px solid rgba(59,65,103,0.15)" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Entrepreneurial Profile</h3>
              <div className="space-y-4">
                <Field label="Why do you want to become an entrepreneur?" required>
                  <textarea className={textareaCls} rows={3} placeholder="Tell us your motivation..." value={founder.whyEntrepreneur} onChange={e => setF("whyEntrepreneur", e.target.value)} />
                </Field>
                <Field label="What motivates you?">
                  <textarea className={textareaCls} rows={2} placeholder="What drives you to build something great?" value={founder.motivation} onChange={e => setF("motivation", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Business Information */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Basic Business Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business" required>
                  <input className={inputCls} placeholder="AgroFresh Solutions" value={business.name} onChange={e => setB("name", e.target.value)} />
                </Field>
                <Field label="Sector" required>
                  <div className="relative">
                    <select className={selectCls} value={business.sector} onChange={e => setB("sector", e.target.value)}>
                      <option value="">Select sector</option>
                      {sectorList.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Year Started">
                  <input className={inputCls} placeholder="2025" value={business.yearStarted} onChange={e => setB("yearStarted", e.target.value)} />
                </Field>
                <Field label="Registration Status">
                  <div className="relative">
                    <select className={selectCls} value={business.registrationStatus} onChange={e => setB("registrationStatus", e.target.value)}>
                      <option value="">Select status</option>
                      <option>Not registered</option><option>In progress</option><option>Registered (sole trader)</option><option>Registered (company)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Business Description</h3>
              <div className="space-y-4">
                <Field label="What problem are you solving?" required><textarea className={textareaCls} rows={2} value={business.problem} onChange={e => setB("problem", e.target.value)} placeholder="Describe the problem clearly..." /></Field>
                <Field label="Who experiences this problem?"><input className={inputCls} value={business.whoExperiences} onChange={e => setB("whoExperiences", e.target.value)} placeholder="Target customers / beneficiaries" /></Field>
                <Field label="What is your solution?" required><textarea className={textareaCls} rows={2} value={business.solution} onChange={e => setB("solution", e.target.value)} placeholder="How does your product or service solve this?" /></Field>
                <Field label="Why is your solution different?"><textarea className={textareaCls} rows={2} value={business.differentiation} onChange={e => setB("differentiation", e.target.value)} placeholder="What makes you unique compared to alternatives?" /></Field>
              </div>
            </div>

            {/* Stage-specific questions */}
            {selectedStages.map(stageId => {
              const stageInfo = stages.find(s => s.id === stageId)!;
              return (
                <div key={stageId} className="rounded-md border p-6" style={{ background: `${TEAL}08`, borderColor: `${TEAL}33` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <stageInfo.icon size={18} />
                    <h3 className="font-bold text-sm" style={{ color: NAVY }}>{stageInfo.label} — Additional Questions</h3>
                  </div>

                  {stageId === "idea" && (
                    <div className="space-y-4">
                      <Field label="Describe your idea in detail" required><textarea className={textareaCls} rows={3} value={business.ideaDescription} onChange={e => setB("ideaDescription", e.target.value)} placeholder="What does your product or service do?" /></Field>
                      <Field label="What inspired this idea?"><input className={inputCls} value={business.inspiration} onChange={e => setB("inspiration", e.target.value)} placeholder="What sparked this?" /></Field>
                      <Field label="Who is your ideal customer?" required><input className={inputCls} value={business.idealCustomer} onChange={e => setB("idealCustomer", e.target.value)} placeholder="Describe them in detail — who, where, what pain?" /></Field>
                      <Field label="Have you spoken to any potential customers?">
                        <div className="flex gap-2">
                          {["Yes", "No", "A few"].map(v => <button key={v} type="button" onClick={() => setB("spokeToCustomers", v)} className="flex-1 py-2 rounded-md border text-xs font-semibold transition-all" style={{ borderColor: business.spokeToCustomers === v ? TEAL : "rgba(59,65,103,0.15)", background: business.spokeToCustomers === v ? `${TEAL}12` : "transparent", color: business.spokeToCustomers === v ? TEAL : "#6b7280" }}>{v}</button>)}
                        </div>
                      </Field>
                      <div className="rounded-md border border-dashed p-4" style={{ background: "#f8f9fb", borderColor: `${TEAL}44` }}>
                        <p className="text-xs font-semibold mb-3" style={{ color: NAVY }}>Supporting Documents (Optional)</p>
                        <div className="space-y-2">
                          {["Concept note","Sketches / diagrams","Research notes"].map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-[#3B4167]/10 cursor-pointer hover:border-[#4C808A]/40 transition-all">
                              <span className="text-[#6b7280] text-[10px] flex-1">{doc}</span>
                              <input type="file" className="text-[10px] text-[#4C808A] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#4C808A]/10 file:text-[#4C808A] file:text-[10px] file:font-semibold hover:file:bg-[#4C808A]/20 cursor-pointer" />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {stageId === "validation" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Customer interviews completed" required><input type="number" className={inputCls} placeholder="12" value={business.interviewsCompleted} onChange={e => setB("interviewsCompleted", e.target.value)} /></Field>
                        <Field label="Surveys completed"><input type="number" className={inputCls} placeholder="45" value={business.surveysCompleted} onChange={e => setB("surveysCompleted", e.target.value)} /></Field>
                        <Field label="Market research conducted?">
                          <div className="flex gap-2">
                            {["Yes","No","Partially"].map(v => <button key={v} type="button" onClick={() => setB("marketResearch", v)} className="flex-1 py-2 rounded-md border text-xs font-semibold transition-all" style={{ borderColor: business.marketResearch === v ? TEAL : "rgba(59,65,103,0.15)", background: business.marketResearch === v ? `${TEAL}12` : "transparent", color: business.marketResearch === v ? TEAL : "#6b7280" }}>{v}</button>)}
                          </div>
                        </Field>
                        <Field label="Competitors identified"><input className={inputCls} value={business.competitors} onChange={e => setB("competitors", e.target.value)} placeholder="Name key competitors" /></Field>
                      </div>
                      <div className="rounded-md border border-dashed p-4" style={{ background: "#f8f9fb", borderColor: `${TEAL}44` }}>
                        <p className="text-xs font-semibold mb-3" style={{ color: NAVY }}>Supporting Documents</p>
                        <div className="space-y-2">
                          {["Survey results","Market research report"].map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-[#3B4167]/10 cursor-pointer hover:border-[#4C808A]/40 transition-all">
                              <span className="text-[#6b7280] text-[10px] flex-1">{doc}</span>
                              <input type="file" className="text-[10px] text-[#4C808A] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#4C808A]/10 file:text-[#4C808A] file:text-[10px] file:font-semibold hover:file:bg-[#4C808A]/20 cursor-pointer" />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {stageId === "prototype" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { key: "productDeveloped",  label: "Product developed?"   },
                          { key: "prototypeCompleted", label: "Prototype completed?" },
                          { key: "mvpLaunched",        label: "MVP launched?"        },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: NAVY }}>{label}</label>
                            <div className="flex gap-2">
                              {["Yes","No"].map(v => <button key={v} type="button" onClick={() => setB(key, v)} className="flex-1 py-2 rounded-md border text-xs font-semibold transition-all" style={{ borderColor: business[key as keyof typeof business] === v ? TEAL : "rgba(59,65,103,0.15)", background: business[key as keyof typeof business] === v ? `${TEAL}12` : "transparent", color: business[key as keyof typeof business] === v ? TEAL : "#6b7280" }}>{v}</button>)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Number of users / testers"><input type="number" className={inputCls} placeholder="30" value={business.users} onChange={e => setB("users", e.target.value)} /></Field>
                        <Field label="Customer / user feedback"><textarea className={textareaCls} rows={2} value={business.customerFeedback} onChange={e => setB("customerFeedback", e.target.value)} placeholder="What have users said about your product?" /></Field>
                      </div>
                    </div>
                  )}

                  {stageId === "early" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Customers acquired" required><input type="number" className={inputCls} placeholder="Total customers" value={business.customersAcquired} onChange={e => setB("customersAcquired", e.target.value)} /></Field>
                        <Field label="Paying customers" required><input type="number" className={inputCls} placeholder="Paying customers" value={business.payingCustomers} onChange={e => setB("payingCustomers", e.target.value)} /></Field>
                        <Field label="Monthly revenue (MK)" required><input className={inputCls} placeholder="MK 150,000" value={business.monthlyRevenue} onChange={e => setB("monthlyRevenue", e.target.value)} /></Field>
                        <Field label="Current team size"><input type="number" className={inputCls} placeholder="Full-time + part-time" value={business.teamSize} onChange={e => setB("teamSize", e.target.value)} /></Field>
                      </div>
                      <div className="rounded-md border border-dashed p-4" style={{ background: "#f8f9fb", borderColor: `${TEAL}44` }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: NAVY }}>Supporting Documents</p>
                        <p className="text-[#6b7280] text-[10px] mb-3">Upload any of the following to strengthen your application</p>
                        <div className="space-y-2">
                          {["Business registration certificate","Sales records","Customer testimonials"].map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-[#3B4167]/10 cursor-pointer hover:border-[#4C808A]/40 transition-all">
                              <span className="text-[#6b7280] text-[10px] flex-1">{doc}</span>
                              <input type="file" className="text-[10px] text-[#4C808A] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#4C808A]/10 file:text-[#4C808A] file:text-[10px] file:font-semibold hover:file:bg-[#4C808A]/20 cursor-pointer" />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 5: Team & Needs */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Team Information</h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <Field label="Co-founder Name (if any)"><input className={inputCls} value={team.coFounderName} onChange={e => setTeam(t => ({ ...t, coFounderName: e.target.value }))} placeholder="Full name" /></Field>
                <Field label="Co-founder Role"><input className={inputCls} value={team.coFounderRole} onChange={e => setTeam(t => ({ ...t, coFounderRole: e.target.value }))} placeholder="CTO" /></Field>
                <Field label="Co-founder Key Skills"><input className={inputCls} value={team.coFounderSkills} onChange={e => setTeam(t => ({ ...t, coFounderSkills: e.target.value }))} placeholder="Tech, Finance" /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Other Team Member Position"><input className={inputCls} value={team.teamMemberPosition} onChange={e => setTeam(t => ({ ...t, teamMemberPosition: e.target.value }))} placeholder="Marketing Lead" /></Field>
                <Field label="Responsibilities"><input className={inputCls} value={team.teamMemberResponsibilities} onChange={e => setTeam(t => ({ ...t, teamMemberResponsibilities: e.target.value }))} placeholder="Key duties" /></Field>
              </div>
            </div>

            <div className="bg-white rounded-md border border-[#3B4167]/10 p-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: NAVY }}>Business Needs Assessment</h3>
              <p className="text-[#6b7280] text-[10px] mb-4">Select all areas where you need support. This helps us match you with the right mentors and learning modules.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {needsList.map(need => (
                  <label key={need} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all"
                    style={{ borderColor: needs[need] ? TEAL : "rgba(59,65,103,0.1)", background: needs[need] ? `${TEAL}0a` : "transparent" }}>
                    <input type="checkbox" className="w-4 h-4 accent-[#4C808A]" checked={!!needs[need]} onChange={e => setNeeds(n => ({ ...n, [need]: e.target.checked }))} />
                    <span className="text-xs" style={{ color: NAVY }}>{need}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-[#6b7280] text-sm mb-4">Please review your application before submitting. You can go back to edit any section.</p>
            {[
              { title: "Business Stage", back: 1, items: [{ label: "Selected Stage(s)", value: selectedStages.map(id => stages.find(s => s.id === id)?.label).join(", ") || "—" }] },
              { title: "Personal Information", back: 2, items: [
                { label: "Name",     value: `${personal.firstName} ${personal.lastName}` },
                { label: "Email",    value: personal.email },
                { label: "Phone",    value: personal.phone },
                { label: "District / City", value: personal.district || "—" },
                { label: "Languages", value: personal.languages.join(", ") || "—" },
              ]},
              { title: "Founder Profile", back: 3, items: [
                { label: "Qualification",  value: founder.qualification || "—" },
                { label: "Field of Study", value: founder.fieldOfStudy || "—" },
              ]},
              { title: "Business Information", back: 4, items: [
                { label: "Business", value: business.name || "—" },
                { label: "Sector",   value: business.sector || "—" },
                { label: "Problem",  value: business.problem ? business.problem.substring(0, 60) + "…" : "—" },
              ]},
              { title: "Business Needs", back: 5, items: [
                { label: "Support Areas Selected", value: Object.keys(needs).filter(k => needs[k]).join(", ") || "None selected" },
              ]},
            ].map(section => (
              <div key={section.title} className="bg-white rounded-md border border-[#3B4167]/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs" style={{ color: NAVY }}>{section.title}</h4>
                  <button onClick={() => setStep(section.back)} className="text-[10px] font-bold hover:opacity-70 transition-opacity" style={{ color: TEAL }}>Edit</button>
                </div>
                <div className="space-y-1.5">
                  {section.items.map(item => (
                    <div key={item.label} className="flex items-start justify-between gap-4">
                      <span className="text-[#6b7280] text-[10px]">{item.label}</span>
                      <span className="text-[10px] font-semibold text-right max-w-xs" style={{ color: NAVY }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-md border p-4 text-center" style={{ background: "#3B4167", borderColor: "#3B4167" }}>
              <p className="text-white/90 text-[10px] leading-relaxed">
                By submitting this application I confirm that the information provided is accurate and complete. I understand that Emerge Livelihoods may contact me to verify information and that submission does not guarantee selection.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-md border text-xs font-bold transition-all"
              style={{ borderColor: "rgba(59,65,103,0.2)", color: NAVY }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = NAVY)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(59,65,103,0.2)")}>
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (!canProceed()) return;
              if (step < steps.length) { setStep(s => s + 1); return; }
              const app: EntrepreneurApplication = {
                id: `APP-${Date.now()}`,
                name: `${personal.firstName} ${personal.lastName}`,
                district: personal.district || "Lilongwe",
                phone: personal.phone,
                sector: business.sector || business.industry || "Other",
                date: new Date().toISOString().split("T")[0],
                status: "Pending",
                score: scoreEntrepreneur({ founder, business, team, needs, selectedStages }),
                program: "Incubation",
                programId,
                programName,
                isMockup: false,
                firstName: personal.firstName,
                lastName: personal.lastName,
                email: personal.email,
                businessName: business.name,
                stage: selectedStages.join(", "),
                gender: personal.gender,
                bio: business.ideaDescription || business.solution || business.problem || undefined,
              };
              onSubmitApplication?.(app, personal.password);
              setRefId(app.id);
              setSubmitted(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-md text-xs font-bold text-white transition-all"
            style={{ background: canProceed() ? TEAL : `${TEAL}80`, cursor: canProceed() ? "pointer" : "not-allowed" }}
          >
            {step === steps.length ? "Submit Application" : "Continue"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
