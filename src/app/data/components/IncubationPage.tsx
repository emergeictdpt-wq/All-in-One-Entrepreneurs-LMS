import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar, Clock, Users, Check, ArrowRight, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon,
  Target, BookOpen, UserCheck, TrendingUp, Award, Globe, Star, Plus, Minus
} from "lucide-react";
import type { AdminProgram } from "../types";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useProgramme, cohortEnrolled } from "../data/programmeStore";
import { programFacts, timelineStates, saveInterest, type StepState } from "../data/programUtils";
import serpentineFlowBanner from "../../imports/serpentine-flow-banner-transparent.png";

type ProgramCardData = {
  id: string; name: string; img: string; startDate: string; format: string; duration: string;
  cohortLine: string | null; location: string; sector: string; deadline: string;
  status: string; statusColor: string; overview: string;
  eligibility: string[]; benefits: string[];
  timeline: { phase: string; date: string; desc: string; status: StepState }[];
};

const faqs = [
  { q: "Who can apply to an incubation program?", a: "Any entrepreneur aged 18–45 based in Malawi with a business idea or early-stage venture. Each program has specific eligibility requirements listed on the program card." },
  { q: "Is there a cost to join?", a: "All Emerge Livelihoods incubation programs are fully funded. There is no fee to apply or participate. Some programs may involve equity arrangements for funding access." },
  { q: "Can I apply to more than one program?", a: "You may apply to multiple programs but you may only join one cohort at a time. Our team will help you identify the best fit." },
  { q: "What happens after graduation?", a: "Graduates join the Emerge Alumni Network, gain ongoing access to mentors and are eligible to apply for follow-on funding and the Acceleration Program." },
  { q: "Are the sessions in-person or online?", a: "Most programs are hybrid — core sessions are held at Emerge Hub in Mzuzu, with some virtual options available for participants outside the city." },
];

function ProgramCard({ program, onApply }: { program: ProgramCardData; onApply: (id: string, name: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"overview" | "timeline" | "benefits" | "eligibility">("overview");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const isClosed = program.status === "Closed";
  const isComingSoon = program.status === "Coming Soon";

  const submitInterest = () => {
    const email = notifyEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email address."); return; }
    saveInterest(program.id, program.name, email); // storage blocked: still confirm to the visitor
    setNotified(true);
    toast.success(`We'll email ${email} when ${program.name} opens.`);
  };

  return (
    <div className="bg-white rounded-md border border-[#3B4167]/15 overflow-hidden hover:shadow-2xl transition-all duration-300" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.10)" }}>

      {/* Photo banner with program name overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={program.img}
          alt={program.name}
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(30,35,64,0.35) 0%, rgba(30,35,64,0.65) 100%)" }} />
        {/* Status badge top-right */}
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md"
          style={{ background: program.statusColor + "dd", color: "#fff" }}
        >
          {program.status}
        </span>
        {/* Program name centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-white font-bold text-center px-4 drop-shadow-lg" style={{ fontSize: "1.15rem", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {program.name}
          </h3>
        </div>
      </div>

      <div className="p-5">
        {/* 2×2 info tiles matching reference */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Calendar, label: "Start Date",  value: program.startDate },
            { icon: Clock,    label: "Duration",    value: program.duration },
            { icon: Globe,    label: "Location",    value: program.location },
            { icon: Users,    label: "Format",      value: program.format },
            { icon: Target,   label: "Sector",      value: program.sector },
            ...(program.cohortLine ? [{ icon: UserCheck, label: "Cohort", value: program.cohortLine }] : []),
          ].map(({ icon: Icon, label, value }, idx, arr) => (
            <div
              key={label}
              className={`flex items-start gap-2.5 rounded-md border border-[#3B4167]/15 p-3 bg-[#f8f9fb] ${arr.length % 2 === 1 && idx === arr.length - 1 ? "col-span-2" : ""}`}
            >
              <Icon className="w-4 h-4 text-[#3B4167] mt-0.5 shrink-0" />
              <div>
                <div className="text-[#3B4167] text-xs font-bold leading-tight">{label}</div>
                <div className="text-[#6b7280] text-[11px] mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Deadline badge (only when a deadline is actually known) */}
        {program.deadline !== "—" && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2.5 rounded-md bg-red-600 text-white text-center">
            <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="text-xs text-white font-semibold">Application Deadline: {program.deadline}</span>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 text-[#4C808A] text-xs font-bold hover:text-[#3d6b74] transition-colors"
        >
          {expanded ? "Show Less" : "View Full Program Details"}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 border-t border-[#3B4167]/10 pt-4">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-[#f8f9fb] rounded-md p-1">
              {(["overview", "timeline", "benefits", "eligibility"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold capitalize transition-all ${
                    tab === t ? "bg-[#4C808A] text-white shadow-sm" : "text-[#6b7280] hover:text-[#3B4167]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <p className="text-[#6b7280] text-xs leading-relaxed">{program.overview}</p>
            )}

            {tab === "timeline" && (
              <div className="space-y-3">
                {program.timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: step.status === "open" ? "#4C808A" : step.status === "done" ? "#16a34a" : "#3B4167",
                          color: "white",
                        }}
                      >
                        {step.status === "done" ? "\u2713" : i + 1}
                      </div>
                      {i < program.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-[#3B4167]/15 my-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#3B4167] text-xs font-bold">{step.phase}</span>
                        {step.status === "open" && (
                          <span className="px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 text-[9px] font-bold">OPEN NOW</span>
                        )}
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
                    <Check className="w-3.5 h-3.5 text-[#4C808A] mt-0.5 shrink-0" />
                    <span className="text-[#3B4167] text-xs">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {tab === "eligibility" && (
              <ul className="space-y-2">
                {program.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4C808A] mt-0.5 shrink-0" />
                    <span className="text-[#3B4167] text-xs">{e}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Apply button */}
        {isClosed ? (
          <button
            disabled
            className="mt-4 w-full py-3 rounded-md text-sm font-bold text-white"
            style={{ background: "#9ca3af", cursor: "not-allowed" }}
          >
            Applications Closed
          </button>
        ) : isComingSoon ? (
          notified ? (
            <div className="mt-4 w-full py-3 rounded-md text-sm font-bold text-center" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              You're on the list
            </div>
          ) : notifyOpen ? (
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitInterest(); }}
                placeholder="Your email address"
                className="flex-1 min-w-0 px-3 py-3 rounded-md text-xs border border-[#3B4167]/20 outline-none"
              />
              <button
                onClick={submitInterest}
                className="px-4 py-3 rounded-md text-xs font-bold text-white"
                style={{ background: "#4C808A" }}
              >
                Notify Me
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNotifyOpen(true)}
              className="mt-4 w-full py-3 rounded-md text-sm font-bold text-white transition-all"
              style={{ background: "#4C808A" }}
            >
              Get Notified When Open
            </button>
          )
        ) : (
          <button
            onClick={() => onApply(program.id, program.name)}
            className="mt-4 w-full py-3 rounded-md text-sm font-bold text-white transition-all"
            style={{ background: "#4C808A" }}
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}

const PROG_STATUS_COLORS: Record<string, string> = {
  "Accepting Applications": "#16a34a",
  "Coming Soon":            "#d97706",
  "Active":                 "#2563eb",
  "Closed":                 "#6b7280",
};

function adminToCard(p: AdminProgram, cohorts: { id: number; name: string; startDate: string; enrolled: number }[]): ProgramCardData {
  const facts = programFacts(p, cohorts);
  const states = timelineStates(p.timelineEntries, p.status);
  return {
    id: p.id,
    name: p.name,
    img: p.coverUrl || "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=320&fit=crop&auto=format",
    startDate: facts.startDate,
    format: p.format,
    duration: p.duration || "—",
    cohortLine: facts.cohort,
    location: p.location || "—",
    sector: p.sector || "—",
    deadline: facts.deadline,
    status: p.status,
    statusColor: PROG_STATUS_COLORS[p.status] ?? "#6b7280",
    overview: p.description || p.overview,
    eligibility: p.eligibility ? p.eligibility.split("\n").filter(Boolean) : [],
    benefits:    p.benefits   ? p.benefits.split("\n").filter(Boolean)   : [],
    timeline: p.timelineEntries.map((t, i) => ({
      phase: t.title,
      date:  t.date,
      desc:  t.description,
      status: states[i],
    })),
  };
}

export function IncubationPage({ onBack, onApply, onLogin, extraPrograms = [], activeCount }: { onBack: () => void; onApply?: (programId: string, programName: string) => void; onLogin?: () => void; extraPrograms?: AdminProgram[]; activeCount?: number }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [carouselStart, setCarouselStart] = useState(0);

  const P = useProgramme();
  const cohortRows = P.cohorts.map(c => ({ id: c.id, name: c.name, startDate: c.startDate, enrolled: cohortEnrolled(c, P.pairs, P.waiting) }));
  const allPrograms = extraPrograms.map(p => adminToCard(p, cohortRows));
  const PAGE_SIZE = 3;
  const visiblePrograms = allPrograms.slice(carouselStart, carouselStart + PAGE_SIZE);
  const canPrev = carouselStart > 0;
  const canNext = carouselStart + PAGE_SIZE < allPrograms.length;
  const totalPages = Math.ceil(allPrograms.length / PAGE_SIZE);

  const scrollToPrograms = () => {
    document.getElementById("available-programs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>

      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden min-h-[520px]" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
        {/* Background image — right half */}
        <div className="absolute inset-0 flex">
          <div className="w-full lg:w-1/2" />
          <div
            className="hidden lg:block w-1/2 h-full"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=700&fit=crop&auto=format')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.35,
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 pb-20">
          <div className="mb-6">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs transition-colors">
              Back to Home
            </button>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] border border-[#4C808A] mb-5">
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Incubation Programs</span>
            </div>
            <h1 className="text-white mb-5 leading-tight" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 700 }}>
              Turn Your Idea Into a{" "}
              <span className="text-[#4C808A]">Thriving Business</span>
            </h1>
            <p className="text-white text-sm leading-relaxed mb-8 max-w-xl">
              Our incubation programs offer structured, milestone-driven support for early-stage entrepreneurs — from business model validation through to investor readiness and market entry. Choose the program that fits your stage, sector and goals.
            </p>
          </div>
        </div>

        {/* Diagonal cut revealing image on mobile */}
        <div className="lg:hidden relative h-48 overflow-hidden mt-4">
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=400&fit=crop&auto=format"
            alt="Incubation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #3B4167 0%, transparent 40%, #f8f9fb 100%)" }} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 hidden lg:block">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full">
            <path d="M0 40L1440 40L1440 10C1200 40 720 0 0 20L0 40Z" fill="#f8f9fb" />
          </svg>
        </div>
      </section>

      {/* Programs */}
      <section id="available-programs" className="py-4 pb-20 bg-[#f8f9fb]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[#3B4167] mb-2" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 700 }}>
              Available Incubation Programs
            </h2>
            <p className="text-[#6b7280] text-sm">Select a program to view full details, timeline and apply.</p>
          </div>
          {allPrograms.length === 0 && (
            <div className="max-w-xl mx-auto text-center rounded-md border border-[#3B4167]/15 bg-white p-10" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.06)" }}>
              <h3 className="text-[#3B4167] font-bold mb-2" style={{ fontSize: "1.05rem" }}>No programmes open right now</h3>
              <p className="text-[#6b7280] text-xs leading-relaxed">New incubation programmes are announced here as soon as they are published. Please check back soon.</p>
              {onBack && (
                <button onClick={onBack} className="mt-5 px-5 py-2.5 rounded-md text-xs font-bold text-white" style={{ background: "#4C808A" }}>Back to Home</button>
              )}
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePrograms.map((p) => (
              <ProgramCard key={p.id} program={p} onApply={(id, name) => onApply?.(id, name)} />
            ))}
          </div>

          {/* Carousel navigation */}
          {allPrograms.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCarouselStart(s => Math.max(0, s - PAGE_SIZE))}
                disabled={!canPrev}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all"
                style={{ background: canPrev ? "#4C808A" : "#d1d5db", color: "#fff", cursor: canPrev ? "pointer" : "not-allowed" }}>
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {/* Pagination dots */}
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselStart(i * PAGE_SIZE)}
                    className="transition-all"
                    style={{
                      width: carouselStart / PAGE_SIZE === i ? 24 : 8,
                      height: 8,
                      borderRadius: 9999,
                      background: carouselStart / PAGE_SIZE === i ? "#4C808A" : "#d1d5db",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setCarouselStart(s => Math.min(allPrograms.length - PAGE_SIZE, s + PAGE_SIZE))}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all"
                style={{ background: canNext ? "#4C808A" : "#d1d5db", color: "#fff", cursor: canNext ? "pointer" : "not-allowed" }}>
                Next <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Journey strip */}
      <section className="py-16 bg-[#3B4167]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <h2 className="text-white text-center mb-10 font-bold" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}>
            Your Journey Through Incubation
          </h2>
          <div className="flex justify-center">
            <ImageWithFallback
              src={serpentineFlowBanner}
              alt="8-stage incubation journey: Apply, Get Selected, Onboard, Learn, Get Mentored, Pitch, Graduate, Scale"
              className="w-full max-w-4xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#f8f9fb]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <h2 className="text-[#3B4167] text-center mb-8 font-bold" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-md border border-[#3B4167]/10 overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-[#3B4167] text-xs font-semibold pr-4">{faq.q}</span>
                  <div className="w-6 h-6 rounded-full bg-[#4C808A]/15 flex items-center justify-center shrink-0">
                    {faqOpen === i ? <Minus className="w-3 h-3 text-[#4C808A]" /> : <Plus className="w-3 h-3 text-[#4C808A]" />}
                  </div>
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[#6b7280] text-xs leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#3B4167]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-white mb-3 font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}>
            Ready to Start Your Incubation Journey?
          </h2>
          <p className="text-white text-sm mb-8">Spaces are limited. Apply now to secure your place in the next cohort.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={scrollToPrograms}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-md text-sm font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </button>
            <button style={{ display: "none" }}
            >
              Apply to GJA&Y
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
