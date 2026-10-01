import { useState } from "react";
import {
  Calendar, Clock, Users, CheckCircle, ArrowRight, ChevronDown,
  TrendingUp, DollarSign, Rocket, Target, BarChart2, Globe,
  Award, Zap, Star, Plus, Minus, Play, ShieldCheck
} from "lucide-react";

const programs = [
  {
    id: "growthscale-core",
    name: "GrowthScale Accelerator",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=320&fit=crop&auto=format",
    startDate: "1 August 2026",
    format: "Hybrid",
    duration: "4 Months",
    cohortSize: 20,
    location: "Mzuzu + Virtual",
    nextCohort: "October 2026",
    deadline: "15 September 2026",
    status: "Accepting Applications",
    statusColor: "#16a34a",
    fundingPotential: "Up to MK 10,000,000",
    revenueMin: "MK 500,000/month",
    overview:
      "Our flagship acceleration program for growth-stage startups with proven traction. GrowthScale provides an intensive, milestone-driven curriculum designed to help founders scale revenue, build investor-ready financials and close their first or follow-on funding round.",
    eligibility: [
      "Operating business with at least 6 months of trading history",
      "Minimum monthly revenue of MK 500,000 or 50+ active customers",
      "Full-time founding team (minimum 1 founder committed)",
      "Scalable business model with potential for market expansion",
      "Willingness to share equity for funding consideration",
    ],
    benefits: [
      "4-month intensive acceleration curriculum",
      "Weekly 1:1 sessions with a dedicated growth mentor",
      "Investor readiness coaching and pitch deck refinement",
      "Access to angel investors and development finance institutions",
      "Demo Day presentation to 30+ curated investors and partners",
      "Revenue growth strategy and customer acquisition playbooks",
      "Financial modelling, valuation and due diligence preparation",
      "Market expansion strategy and business development support",
      "Graduation certificate and alumni investor network access",
    ],
    milestones: [
      { label: "Revenue Target", value: "3x baseline by Demo Day", icon: TrendingUp },
      { label: "Customer Growth", value: "2x active customers", icon: Users },
      { label: "Investor Pitch", value: "Investor-ready by Month 3", icon: DollarSign },
      { label: "Market Expansion", value: "1 new market entry plan", icon: Globe },
    ],
    timeline: [
      { phase: "Applications Open", date: "1 August 2026", desc: "Submit your business profile, financials and growth story.", status: "open" },
      { phase: "Applications Close", date: "15 September 2026", desc: "Hard deadline — no late applications accepted.", status: "upcoming" },
      { phase: "Due Diligence Review", date: "16–25 September 2026", desc: "Panel reviews revenue data, team and scalability potential.", status: "upcoming" },
      { phase: "Founder Interviews", date: "26 September – 3 October 2026", desc: "Intensive interviews testing market insight and vision.", status: "upcoming" },
      { phase: "Cohort Announced", date: "8 October 2026", desc: "Selected founders notified and cohort agreement signed.", status: "upcoming" },
      { phase: "Sprint 1: Scale Foundation", date: "October 2026", desc: "Revenue model audit, customer segmentation, growth strategy design.", status: "upcoming" },
      { phase: "Sprint 2: Investor Readiness", date: "November 2026", desc: "Financial modelling, pitch deck, due diligence prep.", status: "upcoming" },
      { phase: "Sprint 3: Market Expansion", date: "December 2026", desc: "Market entry strategy, partnerships and business development.", status: "upcoming" },
      { phase: "Sprint 4: Demo Day Prep", date: "January 2027", desc: "Pitch rehearsals, investor Q&A coaching, deck finalization.", status: "upcoming" },
      { phase: "Demo Day", date: "February 2027", desc: "Live pitch to 30+ investors. Top performers receive term sheets.", status: "upcoming" },
      { phase: "Graduation", date: "February 2027", desc: "Ceremony, certificates and alumni network onboarding.", status: "upcoming" },
    ],
  },
  {
    id: "fintech-accelerator",
    name: "FinTech Growth Accelerator",
    img: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=320&fit=crop&auto=format",
    startDate: "1 September 2026",
    format: "Virtual + Hub",
    duration: "3 Months",
    cohortSize: 12,
    location: "Virtual + Mzuzu Hub",
    nextCohort: "November 2026",
    deadline: "31 October 2026",
    status: "Accepting Applications",
    statusColor: "#16a34a",
    fundingPotential: "Up to MK 15,000,000",
    revenueMin: "MK 1,000,000/month",
    overview:
      "A specialised acceleration program for FinTech startups disrupting financial services in Malawi and the region. Focuses on regulatory compliance, digital payments, credit products and financial inclusion. Co-designed with industry partners.",
    eligibility: [
      "FinTech startup with live product and active users",
      "Monthly revenue of MK 1,000,000+ or 200+ active users",
      "Compliance-ready or willing to undergo compliance onboarding",
      "Team of at least 2 (tech + business co-founder preferred)",
    ],
    benefits: [
      "FinTech-specific regulatory and compliance guidance",
      "Access to banking and payments industry mentors",
      "Partnership introductions with financial institutions",
      "Grant and equity funding from FinTech-focused investors",
      "API and technology integration support",
      "Customer acquisition strategies for financial products",
    ],
    milestones: [
      { label: "User Growth", value: "5x active users", icon: Users },
      { label: "Revenue Scale", value: "2x MRR", icon: TrendingUp },
      { label: "Compliance", value: "Regulatory sandbox entry", icon: ShieldCheck },
      { label: "Partnerships", value: "1 bank/MNO partnership", icon: Globe },
    ],
    timeline: [
      { phase: "Applications Open", date: "1 September 2026", desc: "Apply with your product demo and revenue data.", status: "upcoming" },
      { phase: "Applications Close", date: "31 October 2026", desc: "Final deadline.", status: "upcoming" },
      { phase: "Technical Review", date: "1–10 November 2026", desc: "Product, tech stack and compliance review.", status: "upcoming" },
      { phase: "Founder Interviews", date: "12–18 November 2026", desc: "Market and business model deep-dive.", status: "upcoming" },
      { phase: "Cohort Launch", date: "1 December 2026", desc: "Kick-off with regulatory onboarding.", status: "upcoming" },
      { phase: "Sprint 1: Compliance and Scale", date: "December 2026", desc: "Regulatory framework, compliance roadmap.", status: "upcoming" },
      { phase: "Sprint 2: Partnership and Growth", date: "January 2027", desc: "Bank and MNO partnership negotiations.", status: "upcoming" },
      { phase: "Sprint 3: Investor Prep and Demo Day", date: "February 2027", desc: "Pitch to FinTech investors and partners.", status: "upcoming" },
    ],
  },
  {
    id: "shemerge-accelerate",
    name: "She Emerge Accelerator",
    img: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=320&fit=crop&auto=format",
    startDate: "15 January 2027",
    format: "Hybrid",
    duration: "4 Months",
    cohortSize: 15,
    location: "Mzuzu + Lilongwe",
    nextCohort: "January 2027",
    deadline: "30 November 2026",
    status: "Coming Soon",
    statusColor: "#d97706",
    fundingPotential: "Up to MK 8,000,000",
    revenueMin: "Any revenue-generating business",
    overview:
      "An intensive acceleration program for women entrepreneurs who have completed incubation or are operating revenue-generating businesses. Designed to unlock the next level of scale through capital, markets and strategic partnerships.",
    eligibility: [
      "Women-led business with any level of revenue",
      "Completed an incubation program or operating 12+ months",
      "Committed to full-time program participation",
      "Based in Malawi",
    ],
    benefits: [
      "Women-focused acceleration curriculum",
      "Access to gender-lens investors and grants",
      "Peer accountability with women founders cohort",
      "Market access and procurement opportunities",
      "Leadership and executive coaching",
      "Cross-border market expansion support",
    ],
    milestones: [
      { label: "Revenue Growth", value: "2x within 4 months", icon: TrendingUp },
      { label: "Market Entry", value: "1 new market or channel", icon: Globe },
      { label: "Funding", value: "Grant or equity raise", icon: DollarSign },
      { label: "Team Building", value: "First hire or partner", icon: Users },
    ],
    timeline: [
      { phase: "Applications Open", date: "1 October 2026", desc: "Apply online with your business story and financials.", status: "upcoming" },
      { phase: "Applications Close", date: "30 November 2026", desc: "Final deadline for all applications.", status: "upcoming" },
      { phase: "Shortlisting", date: "1–10 December 2026", desc: "Panel review and shortlisting.", status: "upcoming" },
      { phase: "Interviews", date: "12–18 December 2026", desc: "Finalist interviews.", status: "upcoming" },
      { phase: "Cohort Launch", date: "15 January 2027", desc: "Kick-off and orientation.", status: "upcoming" },
      { phase: "Sprints 1–4", date: "January–April 2027", desc: "Intensive monthly sprints.", status: "upcoming" },
      { phase: "Demo Day and Graduation", date: "May 2027", desc: "Pitch and graduate.", status: "upcoming" },
    ],
  },
];

const differentiators = [
  {
    icon: Rocket,
    title: "Sprint-Based Curriculum",
    desc: "Four intensive monthly sprints — each with a clear focus, deliverables and milestone review. No fluff, only traction.",
  },
  {
    icon: DollarSign,
    title: "Investor-Matched Demo Day",
    desc: "Pitch to 30+ pre-qualified investors, angels and development finance partners at a curated Demo Day event.",
  },
  {
    icon: BarChart2,
    title: "Live KPI Dashboard",
    desc: "Track your revenue, customers and growth milestones in real time through the Emerge platform during the program.",
  },
  {
    icon: Play,
    title: "Guest Speaker Series",
    desc: "Weekly sessions with successful founders, investors and industry leaders from across Africa and beyond.",
  },
  {
    icon: Target,
    title: "Cohort Pitch Challenges",
    desc: "Monthly internal pitch challenges with prizes, feedback and peer accountability to keep your momentum high.",
  },
  {
    icon: Globe,
    title: "Market Expansion Support",
    desc: "Hands-on business development support to enter a new geographic market, segment or sales channel.",
  },
];

const faqs = [
  { q: "What is the difference between incubation and acceleration?", a: "Incubation is for idea-stage and early startups building their foundation. Acceleration is for growth-stage businesses with proven traction — the goal is to scale fast, become investor-ready and raise capital." },
  { q: "Do I need to have a certain level of revenue to apply?", a: "Most programs require at least some revenue or active customers. The GrowthScale Accelerator requires MK 500,000/month minimum. Requirements vary per program — check each program card." },
  { q: "Will I give up equity?", a: "Equity arrangements vary. Some programs are grant-funded with no equity requirement. Programs that connect you to investors may involve negotiated equity. This is always disclosed clearly upfront." },
  { q: "Can I apply if I previously completed an incubation program?", a: "Yes — in fact, incubation graduates are strongly encouraged to apply to our acceleration programs. Completing incubation is considered a positive indicator during selection." },
  { q: "How intensive is the program?", a: "Acceleration is highly intensive. Expect 2–3 days per week of sessions, coaching and sprint reviews. You should be able to dedicate significant time alongside running your business." },
];

function ProgramCard({ program, onApply }: { program: typeof programs[0]; onApply: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"overview" | "timeline" | "benefits" | "milestones" | "eligibility">("overview");

  return (
    <div className="bg-white rounded-md border border-[#3B4167]/15 overflow-hidden hover:shadow-2xl transition-all duration-300" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.10)" }}>

      {/* Photo banner with name overlay */}
      <div className="relative h-48 overflow-hidden">
        <img src={program.img} alt={program.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(30,35,64,0.35) 0%, rgba(30,35,64,0.65) 100%)" }} />
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md"
          style={{ background: program.statusColor + "dd", color: "#fff" }}
        >
          {program.status}
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-white font-bold text-center px-4 drop-shadow-lg" style={{ fontSize: "1.15rem", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {program.name}
          </h3>
        </div>
      </div>

      <div className="p-5">
        {/* 2×2 info tiles */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Calendar, label: "Start Date",  value: program.startDate },
            { icon: Clock,    label: "Duration",    value: program.duration },
            { icon: Globe,    label: "Location",    value: program.location },
            { icon: Users,    label: "Format",      value: program.format },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5 rounded-md border border-[#3B4167]/15 p-3 bg-[#f8f9fb]">
              <Icon className="w-4 h-4 text-[#3B4167] mt-0.5 shrink-0" />
              <div>
                <div className="text-[#3B4167] text-xs font-bold leading-tight">{label}</div>
                <div className="text-[#6b7280] text-[11px] mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>


        {/* Deadline */}
        <div className="flex items-center justify-center gap-2 mb-4 p-2.5 rounded-md bg-red-600 text-white text-center">
          <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="text-xs text-white font-semibold">Application Deadline: {program.deadline}</span>
        </div>

        {/* Expand */}
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between py-2 text-[#4C808A] text-xs font-bold hover:text-[#3d6b74] transition-colors">
          {expanded ? "Show Less" : "View Full Program Details"}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-4 border-t border-[#3B4167]/10 pt-4">
            <div className="flex gap-1 mb-4 bg-[#f8f9fb] rounded-md p-1 overflow-x-auto">
              {(["overview", "milestones", "timeline", "benefits", "eligibility"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-shrink-0 py-1.5 px-2 rounded-md text-[10px] font-bold capitalize transition-all ${tab === t ? "bg-[#4C808A] text-white shadow-sm" : "text-[#6b7280] hover:text-[#3B4167]"}`}
                >{t}</button>
              ))}
            </div>

            {tab === "overview" && <p className="text-[#6b7280] text-xs leading-relaxed">{program.overview}</p>}

            {tab === "milestones" && (
              <div className="grid grid-cols-2 gap-3">
                {program.milestones.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-[#f8f9fb] rounded-md p-3 border border-[#3B4167]/10">
                    <div className="w-8 h-8 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-[#4C808A]" />
                    </div>
                    <div className="text-[#3B4167] text-[10px] font-bold mb-0.5">{label}</div>
                    <div className="text-[#4C808A] text-[10px] font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "timeline" && (
              <div className="space-y-3">
                {program.timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: step.status === "open" ? "#4C808A" : "#3B4167", color: "white" }}>{i + 1}</div>
                      {i < program.timeline.length - 1 && <div className="w-px flex-1 bg-[#3B4167]/15 my-1" />}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#3B4167] text-xs font-bold">{step.phase}</span>
                        {step.status === "open" && <span className="px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 text-[9px] font-bold">OPEN NOW</span>}
                      </div>
                      <div className="text-[#4C808A] text-[10px] font-semibold mb-0.5">{step.date}</div>
                      <p className="text-[#6b7280] text-[10px] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "benefits" && (
              <ul className="space-y-2">
                {program.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#4C808A] mt-0.5 shrink-0" />
                    <span className="text-[#3B4167] text-xs">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {tab === "eligibility" && (
              <ul className="space-y-2">
                {program.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#4C808A] mt-0.5 shrink-0" />
                    <span className="text-[#3B4167] text-xs">{e}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={() => onApply(program.id)}
          className="mt-4 w-full py-3 rounded-md text-sm font-bold text-white transition-all"
          style={{ background: "#4C808A" }}
        >
          {program.status === "Coming Soon" ? "Get Notified When Open" : "Apply Now"}
        </button>
      </div>
    </div>
  );
}

function ApplyModal({ programId, onClose }: { programId: string | null; onClose: () => void }) {
  const program = programs.find((p) => p.id === programId);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", revenue: "", team: "", pitch: "" });

  if (!programId || !program) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(30,35,64,0.8)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-[#1e2340] rounded-md w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.88) translateY(24px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold" style={{ fontSize: "1rem" }}>Apply — {program.name}</h3>
              <p className="text-white text-xs mt-0.5">Step {step} of 2 — {step === 1 ? "Founder Details" : "Business & Growth Data"}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all text-lg">×</button>
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2].map((s) => <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? "#4C808A" : "rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Full name" },
                { label: "Email Address", key: "email", type: "email", placeholder: "daniel@example.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+265 88 000 0000" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-white text-xs font-semibold mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#4C808A]" />
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: "Business Name", key: "business", placeholder: "Business name" },
                { label: "Current Monthly Revenue (MK)", key: "revenue", placeholder: "Annual revenue" },
                { label: "Team Size", key: "team", placeholder: "Number of employees" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-white text-xs font-semibold mb-1">{label}</label>
                  <input placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#4C808A]" />
                </div>
              ))}
              <div>
                <label className="block text-white text-xs font-semibold mb-1">What do you want to achieve in this program? (30-second pitch)</label>
                <textarea rows={4} placeholder="Describe your growth ambition and what you'll scale during acceleration..."
                  value={form.pitch} onChange={(e) => setForm({ ...form, pitch: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#4C808A] resize-none" />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-md text-xs font-bold text-white hover:bg-white/10 transition-all">Back</button>
            )}
            <button
              onClick={() => step === 1 ? setStep(2) : alert("Application submitted! Our team will review your growth data and be in touch within 5 business days.")}
              className="flex-1 py-2.5 rounded-md text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: "#4C808A" }}>
              {step === 1 ? "Continue" : "Submit Application"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccelerationPage({ onBack, onApply, onLogin }: { onBack: () => void; onApply?: () => void; onLogin?: () => void }) {
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
      <ApplyModal programId={applyingTo} onClose={() => setApplyingTo(null)} />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
        {/* Cinematic image — full width, clipped bottom, sits behind text */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1600&h=800&fit=crop&auto=format"
            alt="Acceleration"
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.18, mixBlendMode: "luminosity" }}
          />
        </div>

        {/* Large decorative number in background */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none" aria-hidden>
          <span className="text-white/[0.04] font-black leading-none" style={{ fontSize: "clamp(18rem, 35vw, 28rem)", lineHeight: 1 }}>
            4×
          </span>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 pt-28 pb-0">
          <div className="mb-6">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs transition-colors">
              Back to Home
            </button>
          </div>

          <div className="pb-0">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] mb-5">
                <span className="text-white text-xs font-semibold tracking-widest uppercase">Acceleration Programs</span>
              </div>
              <h1 className="text-white leading-none mb-5" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Scale Fast.<br />
                <span style={{ color: "#4C808A", WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>Raise Capital.</span><br />
                Dominate Your Market.
              </h1>
              <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-xl">
                Our acceleration programs are designed for growth-stage founders who have proven their concept and are ready to scale — fast. Intensive sprints, investor access, Demo Day pitching and revenue milestones.
              </p>
            </div>

            {/* Right: floating image card — removed */}
            <div className="hidden">
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="relative mt-10">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full block">
            <path d="M0 50L1440 50L1440 14C1200 50 720 0 0 28L0 50Z" fill="#f8f9fb" />
          </svg>
        </div>
      </section>


      {/* Programs */}
      <section className="py-4 pb-20 bg-[#f8f9fb]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[#3B4167] mb-2 font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}>Available Acceleration Programs</h2>
            <p className="text-[#6b7280] text-sm">Select a program to view details, milestones, timeline and apply.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => <ProgramCard key={p.id} program={p} onApply={() => onApply ? onApply() : setApplyingTo(p.id)} />)}
          </div>
        </div>
      </section>

      {/* Sprint Journey */}
      <section className="py-16 bg-[#3B4167]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <h2 className="text-white text-center mb-3 font-bold" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}>The Acceleration Sprint Model</h2>
          <p className="text-white/80 text-xs text-center mb-10">Three focused sprints — each with a clear deliverable and milestone review</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { sprint: "Sprint 1", theme: "Scale Foundation", weeks: "Month 1", desc: "Revenue model audit, customer segmentation, growth strategy and team structure review." },
              { sprint: "Sprint 2", theme: "Investor Readiness", weeks: "Month 2", desc: "Financial modelling, pitch deck, valuation, due diligence document preparation." },
              { sprint: "Sprint 3", theme: "Market Expansion", weeks: "Month 3", desc: "New market entry strategy, partnerships, sales channel development and brand positioning." },
            ].map((s, i) => (
              <div key={s.theme} className="relative">
                <div className="rounded-md p-6 h-full text-white shadow-lg border border-white/20 text-center" style={{ background: "#4C808A" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-3 border-2 border-white shadow-sm mx-auto" style={{ background: "#4C808A" }}>
                    {i + 1}
                  </div>
                  <h4 className="text-white font-bold text-base mb-2">{s.theme}</h4>
                  <p className="text-white/90 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#f8f9fb]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <h2 className="text-[#3B4167] text-center mb-8 font-bold" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-md border border-[#3B4167]/10 overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-[#3B4167] text-xs font-semibold pr-4">{faq.q}</span>
                  <div className="w-6 h-6 rounded-full bg-[#4C808A]/15 flex items-center justify-center shrink-0">
                    {faqOpen === i ? <Minus className="w-3 h-3 text-[#4C808A]" /> : <Plus className="w-3 h-3 text-[#4C808A]" />}
                  </div>
                </button>
                {faqOpen === i && <div className="px-5 pb-4"><p className="text-[#6b7280] text-xs leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#3B4167]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-white mb-3 font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}>Ready to Accelerate?</h2>
          <p className="text-white/60 text-sm mb-8">Cohort spots are strictly limited. Apply now before the deadline closes.</p>
          <div className="flex justify-center">
            <button onClick={() => onApply ? onApply() : setApplyingTo("growthscale-core")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-md text-sm font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
              Apply Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
