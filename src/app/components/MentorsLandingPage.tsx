import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Check, Star, Users, Clock, Globe, Award, BookOpen,
  Briefcase, TrendingUp, Lightbulb, Heart, Network, Shield, ChevronDown,
  ChevronUp, Calendar, MapPin, Lock, Menu, X,
  Zap, Target, Layers, BarChart2, Mic, Coffee
} from "lucide-react";
import { Footer } from "./Footer";
import { isRemovedBadge } from "./IncubationManagementPage";
import { readMentorDraft } from "../data/mentorDraft";

// ─── Data ────────────────────────────────────────────────────────────────────

const navLinks = ["About Mentorship", "Mentorship Models", "Meet Our Mentors", "Success Stories", "FAQs", "Contact"];

const benefits = [
  { icon: Heart, title: "Give Back", desc: "Help build stronger businesses and stronger communities across Malawi and beyond." },
  { icon: Network, title: "Grow Your Network", desc: "Connect with founders, experts, investors and ecosystem partners across Africa." },
  { icon: Globe, title: "Expand Your Influence", desc: "Support innovative businesses across different industries and sectors." },
  { icon: BookOpen, title: "Continuous Learning", desc: "Gain fresh insights into emerging technologies, markets and business models." },
  { icon: Award, title: "Recognition", desc: "Receive certificates, awards, public recognition and invitations to exclusive events." },
  { icon: TrendingUp, title: "Build Future Partnerships", desc: "Discover startups for advisory roles, investment or collaboration opportunities." },
];

const eligibleProfiles = [
  "Entrepreneurs", "CEOs", "Business Owners", "Industry Experts", "Researchers",
  "University Lecturers", "Corporate Professionals", "Investors", "Consultants",
  "Engineers", "Lawyers", "Accountants", "Marketing Specialists", "Product Managers",
];

const mentorRoles = [
  { icon: Briefcase, title: "Business Mentor", desc: "Supports strategy, business planning and growth.", color: "#4C808A" },
  { icon: Zap, title: "Technical Mentor", desc: "Supports product and technology development.", color: "#3B4167" },
  { icon: Layers, title: "Industry Mentor", desc: "Provides sector-specific expertise and market insight.", color: "#4C808A" },
  { icon: TrendingUp, title: "Investment Mentor", desc: "Prepares startups for fundraising and investor readiness.", color: "#3B4167" },
  { icon: BarChart2, title: "Marketing Mentor", desc: "Supports branding, customer acquisition and sales.", color: "#4C808A" },
  { icon: Star, title: "Leadership Mentor", desc: "Develops founder leadership and team management.", color: "#3B4167" },
  { icon: Target, title: "Operations Mentor", desc: "Improves business systems and operational efficiency.", color: "#4C808A" },
  { icon: Lightbulb, title: "Innovation Mentor", desc: "Guides product innovation and creative problem-solving.", color: "#3B4167" },
];

const journeySteps = [
  { step: "01", title: "Apply", desc: "Submit your mentor application with professional background and expertise areas." },
  { step: "02", title: "Profile Review", desc: "Our team reviews your experience, sector knowledge and availability." },
  { step: "03", title: "Approval", desc: "Receive confirmation and onboarding details within 5–7 business days." },
  { step: "04", title: "Training and Orientation", desc: "Complete our structured mentor orientation program and platform walkthrough." },
  { step: "05", title: "Startup Matching", desc: "Get matched with startups based on your expertise, sector and their growth stage." },
  { step: "06", title: "Mentorship Sessions", desc: "Conduct structured one-to-one or virtual sessions using our built-in tools." },
  { step: "07", title: "Progress Reviews", desc: "Participate in quarterly reviews to track startup progress and adjust goals." },
  { step: "08", title: "Program Completion", desc: "Celebrate cohort graduation and document key milestones achieved." },
  { step: "09", title: "Recognition and Alumni Network", desc: "Receive your mentor certificate and join our exclusive alumni mentor network." },
];

const mentorshipModels = [
  { icon: Users, title: "One-to-One Mentoring", desc: "Dedicated sessions between a single mentor and one startup founder, focused on specific goals and challenges.", tag: "Most Popular" },
  // { icon: Layers, title: "Group Mentoring", desc: "One mentor works with a small cohort of 3–6 startups simultaneously, sharing lessons across the group.", tag: null },
  // { icon: Coffee, title: "Office Hours", desc: "Open, drop-in style sessions where entrepreneurs can bring quick questions or challenges for rapid advice.", tag: null },
  // { icon: BookOpen, title: "Cohort Mentoring", desc: "Mentors guide an entire incubation or acceleration cohort through a structured curriculum over a program cycle.", tag: null },
  { icon: Globe, title: "Virtual Mentoring", desc: "Remote video sessions via the platform, enabling mentors to contribute from anywhere in the world.", tag: "Remote-Friendly" },
  // { icon: MapPin, title: "In-Person Mentoring", desc: "Face-to-face sessions at Emerge Hub in Mzuzu or at the entrepreneur's place of business.", tag: null },
  // { icon: Mic, title: "Masterclasses", desc: "Expert-led workshops delivered to large groups of entrepreneurs on a specific business or technical topic.", tag: null },
  { icon: Mic, title: "Pitch Coaching", desc: "Intensive sessions preparing founders to pitch confidently to investors, competitions and demo day panels.", tag: null },
];

const programs = [
  {
    name: "Emerge4Biz Core Incubation",
    type: "Incubation",
    focus: ["Business Strategy", "Product Development", "Market Validation", "Financial Literacy"],
    duration: "6 months",
    stages: ["Idea Stage", "Validation", "Prototype"],
    commitment: "4–6 hours/month",
    cohort: "September 2026",
    color: "#4C808A",
  },
  {
    name: "GrowthScale Acceleration",
    type: "Acceleration",
    focus: ["Scale Strategy", "Fundraising", "Operations", "Leadership"],
    duration: "4 months",
    stages: ["Early Startup", "Growth Stage"],
    commitment: "6–8 hours/month",
    cohort: "October 2026",
    color: "#3B4167",
  },
  {
    name: "She Emerge Program",
    type: "Incubation",
    focus: ["Women Entrepreneurship", "Finance", "Marketing", "Confidence Building"],
    duration: "5 months",
    stages: ["Idea Stage", "Validation"],
    commitment: "3–5 hours/month",
    cohort: "August 2026",
    color: "#7a89c2",
  },
];

const expertiseAreas = [
  "Business Strategy", "Finance and Accounting", "Marketing and Sales",
  "Product Development", "Software and Technology", "Agribusiness",
  "Manufacturing", "Health", "Education", "Tourism", "Green Innovation",
  "Legal and Intellectual Property", "Export Readiness", "Digital Transformation",
  "Human Resources", "Leadership", "Investment Readiness",
];

const rolesByArea: Record<string, string[]> = {
  "Business Strategy": ["Business Mentor", "Leadership Mentor"],
  "Finance and Accounting": ["Business Mentor", "Investment Mentor"],
  "Marketing and Sales": ["Marketing Mentor"],
  "Product Development": ["Technical Mentor", "Innovation Mentor"],
  "Software and Technology": ["Technical Mentor"],
  "Agribusiness": ["Industry Mentor"],
  "Manufacturing": ["Industry Mentor", "Operations Mentor"],
  "Health": ["Industry Mentor"],
  "Education": ["Industry Mentor"],
  "Tourism": ["Industry Mentor"],
  "Green Innovation": ["Industry Mentor", "Innovation Mentor"],
  "Legal and Intellectual Property": ["Business Mentor"],
  "Export Readiness": ["Industry Mentor", "Marketing Mentor"],
  "Digital Transformation": ["Technical Mentor", "Operations Mentor"],
  "Human Resources": ["Leadership Mentor", "Operations Mentor"],
  "Leadership": ["Leadership Mentor"],
  "Investment Readiness": ["Investment Mentor"],
};

const matchStages = ["Idea", "Validation", "Prototype", "Early Startup"];
const matchSectors = ["Agribusiness", "Health", "Education", "Tourism", "Green Innovation", "Software and Technology", "Manufacturing"];
const matchNeeds = ["Business Strategy", "Finance and Accounting", "Marketing and Sales", "Investment Readiness", "Leadership", "Digital Transformation", "Export Readiness"];
// Weights follow the matching framework (stage 25, sector 20, support needs 20); 65 points are shown here.
const MATCH_MAX = 65;

const featuredMentors = [
  {
    name: "Dr. Kondwani Phiri",
    title: "Managing Director & Serial Entrepreneur",
    org: "Phiri Agribusiness Holdings (Blantyre)",
    expertise: ["Business Strategy", "Leadership", "Investment Readiness"],
    years: 18,
    industries: ["AgriTech", "FinTech"],
    startups: 24,
    stages: ["Validation", "Prototype", "Early Startup"],
    sectors: ["Agribusiness", "Software and Technology"],
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&auto=format",
    role: "Business Mentor",
  },
  {
    name: "Grace Mwale",
    title: "Head of Digital Innovation",
    org: "National Bank of Malawi (Lilongwe)",
    expertise: ["Digital Transformation", "Product Development", "Finance and Accounting"],
    years: 12,
    industries: ["FinTech", "Banking"],
    startups: 16,
    stages: ["Prototype", "Early Startup"],
    sectors: ["Software and Technology", "Finance and Accounting"],
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&auto=format",
    role: "Technical Mentor",
  },
  {
    name: "Prof. James Banda",
    title: "Professor of Entrepreneurship & Agribusiness",
    org: "Mzuzu University & LUANAR",
    expertise: ["Education", "Agribusiness", "Business Strategy"],
    years: 22,
    industries: ["Education", "AgriTech", "Health"],
    startups: 31,
    stages: ["Idea", "Validation"],
    sectors: ["Education", "Agribusiness", "Health"],
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format",
    role: "Industry Mentor",
  },
  {
    name: "Tadala Chirwa",
    title: "Founder and Managing Director",
    org: "CleanTech Malawi (Mzuzu Hub)",
    expertise: ["Green Innovation", "Marketing and Sales", "Export Readiness"],
    years: 9,
    industries: ["CleanTech", "Manufacturing"],
    startups: 11,
    stages: ["Idea", "Validation", "Early Startup"],
    sectors: ["Green Innovation", "Manufacturing"],
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&auto=format",
    role: "Industry Mentor",
  },
];

const impactMetrics = [
  { label: "Active Mentors", value: 520, suffix: "+" },
  { label: "Startups Mentored", value: 1240, suffix: "+" },
  { label: "Sessions Completed", value: 18000, suffix: "+" },
  { label: "Volunteer Hours", value: 42000, suffix: "+" },
  { label: "Founder Satisfaction", value: 97, suffix: "%" },
  { label: "Businesses Graduated", value: 380, suffix: "+" },
  { label: "Jobs Created", value: 8400, suffix: "+" },
  { label: "Investment Raised", value: 12, prefix: "$", suffix: "M+" },
];

const mentorTestimonials = [
  {
    name: "David Kachingwe",
    role: "Investment Mentor",
    org: "Private Equity Specialist",
    quote: "Mentoring with Emerge Livelihoods has been one of the most fulfilling professional experiences of my career. Watching founders apply your advice and grow their revenues is deeply rewarding.",
    gain: "Built lasting relationships with a new generation of founders",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    name: "Sarah Tembo",
    role: "Marketing Mentor",
    org: "Brand Consultant",
    quote: "I joined to give back, but I learned as much as I taught. The ecosystem is vibrant, the founders are hungry to grow and the platform makes everything seamless.",
    gain: "Expanded professional network and discovered new market insights",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
  },
];

const founderTestimonials = [
  {
    name: "Chimwemwe Mzumara",
    startup: "FreshHarvest Malawi",
    sector: "AgriTech",
    result: "Revenue grew 3x in 6 months after improving our sales strategy with mentor guidance.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    name: "Alinafe Banda",
    startup: "HealthLink Mw",
    sector: "HealthTech",
    result: "Secured MWK 15M in seed funding after pitch coaching sessions with our investment mentor.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  },
  {
    name: "Patrick Khumalo",
    startup: "SolarHome Malawi",
    sector: "CleanTech",
    result: "Expanded to 3 districts and hired 12 staff — our operations mentor transformed how we work.",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
  },
];

const opportunities = [
  { type: "Pitch Judging", title: "She Emerge Pitch Day 2026", iso: "2026-11-27", time: "14:00–17:00 CAT", location: "Virtual (Zoom)", tag: "Pitch" },
  { type: "Bootcamp", title: "AgriTech Innovation Bootcamp", iso: "2026-12-03", time: "08:30–16:30 CAT", location: "Mzuzu Hub, In-Person", tag: "Bootcamp" },
  { type: "Incubation Cohort", title: "Emerge4Biz Core Cohort 8", iso: "2027-01-18", time: "09:00–11:00 CAT", location: "Mzuzu Hub, In-Person", tag: "Incubation" },
  // { type: "Demo Day", title: "GrowthScale Demo Day — Cohort 3", iso: "2027-02-20", time: "10:00–14:00 CAT", location: "Hybrid", tag: "Demo Day" },
];

const formatOppDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// Only show opportunities that have not already happened.
const upcomingOpportunities = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return opportunities
    .filter((o) => new Date(`${o.iso}T00:00:00`) >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso));
};

const resources = [
  { title: "Mentor Handbook", desc: "Comprehensive guide covering your role, responsibilities and best practices.", icon: BookOpen, locked: false },
  { title: "Mentorship Framework", desc: "Structured methodology for effective mentor-mentee relationships.", icon: Layers, locked: false },
  { title: "Coaching Guides", desc: "Topic-specific coaching frameworks for common startup challenges.", icon: Target, locked: true },
  { title: "Session Templates", desc: "Pre-built session plans for strategy, finance, marketing and more.", icon: Briefcase, locked: true },
  { title: "Goal-Setting Worksheets", desc: "Tools for setting and tracking SMART goals with your mentees.", icon: Check, locked: true },
  { title: "Code of Conduct", desc: "Platform guidelines, ethical standards and confidentiality policy.", icon: Shield, locked: false },
];

const recognitions = [
  { icon: Award, title: "Digital Certificates", desc: "Issued upon completing each mentorship cycle." },
  { icon: Star, title: "Annual Mentor Awards", desc: "Top mentors recognised at our Annual Entrepreneurs Summit." },
  { icon: Globe, title: "LinkedIn Recommendations", desc: "Official platform endorsements added to your profile." },
  { icon: Users, title: "Community Spotlight", desc: "Featured on our website, newsletter and social media." },
  { icon: Zap, title: "Mentor Badges", desc: "Digital badges displayed on your platform profile." },
  { icon: Heart, title: "Exclusive Events", desc: "Priority invitations to investor dinners and ecosystem summits." },
];

const faqs = [
  { q: "Who can become a mentor?", a: "Any experienced professional, entrepreneur, executive, investor, researcher, lecturer or specialist with relevant industry experience can apply. Applications are reviewed by our programme team." },
  { q: "Is mentoring voluntary or paid?", a: "Mentoring on the Emerge Livelihoods platform is voluntary. Some specific programme contracts may include honoraria for intensive long-term engagements." },
  { q: "How much time is required?", a: "Most mentors commit between 3–8 hours per month depending on the programme and mentorship model chosen. You choose a model that fits your schedule." },
  { q: "Can I mentor remotely?", a: "Yes, our virtual mentoring model allows you to mentor from anywhere in the world using our built-in video and messaging tools." },
  { q: "How are startups matched?", a: "Matching is based on your sector expertise, the startup's business stage, goals and specific support needs. Our platform uses a structured matching rubric." },
  { q: "Can I mentor more than one startup?", a: "Yes. Depending on your availability and programme load, you can mentor more than one startup. You state your capacity when you register." },
  { q: "What support do mentors receive?", a: "All mentors receive structured onboarding, session management tools, coaching resources, peer mentor community access and dedicated programme manager support." },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setCount(value); return; }
        const duration = 1800;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) { setCount(value); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ─── Mentor Matching Preview ──────────────────────────────────────────────────

function MatchingPreview({ onApplyMentor }: { onApplyMentor?: () => void }) {
  const [stage, setStage] = useState(matchStages[1]);
  const [sector, setSector] = useState(matchSectors[0]);
  const [need, setNeed] = useState(matchNeeds[0]);

  const ranked = featuredMentors
    .map((m) => {
      const stageFit = m.stages.includes(stage);
      const sectorFit = m.sectors.includes(sector);
      const needFit = m.expertise.includes(need);
      const points = (stageFit ? 25 : 0) + (sectorFit ? 20 : 0) + (needFit ? 20 : 0);
      return { m, stageFit, sectorFit, needFit, pct: Math.round((points / MATCH_MAX) * 100) };
    })
    .sort((a, b) => b.pct - a.pct || b.m.startups - a.m.startups);

  const selectCls = "w-full px-3 py-2.5 rounded-md border border-[#3B4167]/20 bg-white text-[#3B4167] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C808A]";

  return (
    <section className="py-20 bg-[#f8f9fb]" id="matching">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Matching</span>
          </div>
          <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
            How Startups Are Matched With Mentors
          </h2>
          <p className="text-[#6b7280] text-sm max-w-2xl mx-auto">
            We compare a startup's business stage, industry and support needs with each mentor's experience. Try it: describe a startup and see how our featured mentors would rank.
          </p>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-md border border-[#3B4167]/10 p-5 space-y-4 h-fit">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#6b7280] mb-1">Business stage</span>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
                {matchStages.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#6b7280] mb-1">Industry</span>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectCls}>
                {matchSectors.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#6b7280] mb-1">Biggest support need</span>
              <select value={need} onChange={(e) => setNeed(e.target.value)} className={selectCls}>
                {matchNeeds.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          </div>

          <div className="space-y-3" aria-live="polite">
            {ranked.map(({ m, stageFit, sectorFit, needFit, pct }, i) => (
              <div key={m.name} className={`bg-white rounded-md border p-4 flex gap-4 items-center ${i === 0 && pct > 0 ? "border-[#4C808A] shadow-md" : "border-[#3B4167]/10"}`}>
                <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[#3B4167] font-bold text-sm truncate">{m.name}{i === 0 && pct > 0 && <span className="ml-2 px-2 py-0.5 rounded-md bg-[#4C808A] text-white text-[9px] font-bold uppercase">Best fit</span>}</div>
                    <div className="text-[#3B4167] font-bold text-sm shrink-0">{pct}%</div>
                  </div>
                  <div className="h-1.5 bg-[#3B4167]/10 rounded-full overflow-hidden my-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Fit score for ${m.name}`}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#3B4167" }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {[{ ok: stageFit, t: `Stage: ${stage}` }, { ok: sectorFit, t: `Industry: ${sector}` }, { ok: needFit, t: `Expertise: ${need}` }].map(({ ok, t }) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border"
                        style={ok ? { background: "#3B4167", color: "#FFFFFF", borderColor: "#3B4167" } : { background: "#FFFFFF", color: "#6b7280", borderColor: "#d1d5db" }}>
                        {ok ? <Check className="w-3 h-3" aria-hidden="true" /> : <X className="w-3 h-3" aria-hidden="true" />}
                        <span className="sr-only">{ok ? "Matches " : "Does not match "}</span>{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#6b7280] text-xs mt-6 max-w-2xl mx-auto">
          This is a simplified illustration. In practice matching also considers language, location, mentor availability and conflicts of interest, and a programme manager confirms every pairing.
        </p>
        <div className="text-center mt-5">
          <button onClick={onApplyMentor} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#4C808A] text-white text-xs font-bold border border-white hover:bg-[#3d6b74] transition-all">
            Add your expertise to the network <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MentorsLandingPage({ onBack, onApplyMentor, onMentorLogin }: { onBack: () => void; onApplyMentor?: () => void; onMentorLogin?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeExpertise, setActiveExpertise] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTestimonialTab, setActiveTestimonialTab] = useState<"mentor" | "founder">("mentor");
  const [hasDraft] = useState(() => readMentorDraft() !== null); // an unfinished application can be resumed
  const applyLabel = hasDraft ? "Continue Your Application" : "Register as a Mentor";

  return (
    <div className="min-h-screen" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>

      {/* ── 1. Sticky Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1528]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={onBack} className="flex items-center gap-3 group">
            <img
              src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </button>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-white/60 hover:text-white text-xs font-semibold transition-colors">
                {link}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={onMentorLogin} className="text-white hover:text-white text-xs font-semibold px-4 py-2 rounded-md border border-white hover:border-white transition-all">
              Mentor Login
            </button>
            <button
              onClick={onApplyMentor}
              className="text-white text-xs font-bold px-5 py-2.5 rounded-md bg-[#4C808A] hover:bg-[#3d6b74] transition-all border border-white"
            >
              {applyLabel}
            </button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-white">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0f1528] border-t border-white/10 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/70 text-sm font-semibold py-1">
                {link}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <button onClick={onMentorLogin} className="text-white text-sm font-semibold py-2 rounded-md border border-white">Mentor Login</button>
              <button onClick={onApplyMentor} className="text-white text-sm font-bold py-2 rounded-md bg-[#4C808A] border border-white">
                {applyLabel}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. Hero Section ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0f1528] pt-16">
        {/* Geometric mesh background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4C808A" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="200" cy="200" r="300" fill="#4C808A" fillOpacity="0.08" />
            <circle cx="1200" cy="700" r="400" fill="#3B4167" fillOpacity="0.15" />
            <circle cx="1000" cy="100" r="200" fill="#4C808A" fillOpacity="0.06" />
          </svg>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <h1 className="text-white mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.15 }}>
              Shape the Next<br />
              <span className="text-[#4C808A]">Generation</span> of<br />
              Entrepreneurs
            </h1>

            <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-lg">
              Join a network of experienced entrepreneurs, industry experts, executives, researchers and investors dedicated to helping startups grow from ideas to investment-ready businesses.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="#about-mentorship" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#4C808A] text-white font-bold text-sm hover:bg-[#3d6870] transition-all shadow-md">
                Explore Mentorship
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[{ v: "520+", l: "Expert Mentors" }, { v: "4.9★", l: "Avg Rating" }, { v: "18K+", l: "Sessions" }].map(({ v, l }) => (
                <div key={l}>
                  <div className="text-white font-bold" style={{ fontSize: "1.2rem" }}>{v}</div>
                  <div className="text-white text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stacked mentor cards */}
          <div className="relative hidden lg:block">
            {/* Main large image */}
            <div className="relative rounded-md overflow-hidden border border-white/10 shadow-2xl" style={{ height: 420 }}>
              <img
                src="/images/mentors-hero.jpg"
                alt="Mentorship in action"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1528]/60 to-transparent" />
              {/* Floating card */}
              {/* Cohort 7 Mentor Match Rate stat removed */}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Why Register as a Mentor ── */}
      <section id="about-mentorship" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Why Mentor</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Why Register as a Mentor?
            </h2>
            <p className="text-[#6b7280] text-sm max-w-xl mx-auto">
              Mentoring is not just about helping others, it is a meaningful, rewarding and professionally enriching experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group relative p-6 rounded-md border border-[#3B4167]/10 bg-[#f8f9fb] hover:bg-[#3B4167] hover:border-[#3B4167] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-0 group-hover:opacity-10 transition-all"
                  style={{ background: "#4C808A" }} />
                <div className="w-12 h-12 rounded-md bg-[#4C808A]/10 group-hover:bg-[#4C808A] flex items-center justify-center mb-4 transition-all">
                  <Icon className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-[#3B4167] group-hover:text-white font-bold mb-2 text-sm">{title}</h3>
                <p className="text-[#6b7280] group-hover:text-white/70 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Who Can Register as a Mentor ── */}
      <section className="py-20 bg-[#3B4167]" id="eligibility">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Eligibility badge commented out
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-white/10 border border-white/20 mb-4">
                <span className="text-white text-xs font-semibold tracking-widest uppercase">Eligibility</span>
              </div>
              */}
              <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
                Who Can Register as a Mentor?
              </h2>
              <p className="text-white/85 text-sm leading-relaxed mb-6">
                If you have built experience, solved real problems and achieved results in your field, you have everything it takes. We welcome professionals from all sectors and backgrounds.
              </p>
              <button
                onClick={onApplyMentor}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-md bg-[#4C808A] text-white font-bold text-sm border border-white hover:bg-[#3d6b74] transition-all"
              >
                Apply Now
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {eligibleProfiles.map((profile) => (
                <span key={profile}
                  className="px-4 py-2 rounded-md bg-[#4C808A] text-white text-xs font-semibold hover:bg-[#3d6870] transition-all cursor-default shadow-sm">
                  {profile}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Mentor Roles ── */}
      <section className="py-20 bg-[#f8f9fb]" id="mentor-roles">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Mentor Roles</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              How Mentors Contribute
            </h2>
            <p className="text-[#6b7280] text-sm max-w-xl mx-auto">
              Choose a role that aligns with your expertise and the type of impact you want to make.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mentorRoles.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="bg-white rounded-md p-5 border border-[#3B4167]/10 hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
                  style={{ background: color + "18" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-[#3B4167] font-bold text-sm mb-2">{title}</h3>
                <p className="text-[#6b7280] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Mentorship Journey ── */}
      <section className="relative overflow-hidden py-24 bg-[#0f1528]" id="mentorship-journey">
        {/* Background photo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center lg:bg-fixed"
          style={{ backgroundImage: "url('/images/mentor-lifecycle-bg.jpg')" }}
        />
        {/* Dark brand overlay for readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(15,21,40,0.92) 0%, rgba(15,21,40,0.82) 50%, rgba(15,21,40,0.94) 100%)" }}
        />
        {/* Teal tint accent */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(76,128,138,0.28), transparent 60%)" }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-white/20 mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Your Journey</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 700 }}>
              The Mentor Lifecycle
            </h2>
            <p className="text-white/80 text-sm max-w-xl mx-auto">
              From application to recognition, a clear, structured path for every mentor.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2" style={{ width: 2, background: "#FFFFFF" }} />

            <div className="space-y-8">
              {journeySteps.map(({ step, title, desc }, i) => (
                <div key={step}
                  className={`relative flex flex-col lg:flex-row gap-6 items-start lg:items-center ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                  {/* Content card */}
                  <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                    <div className={`rounded-md p-5 border border-white/10 hover:border-[#4C808A]/40 transition-all ${i % 2 === 0 ? "lg:ml-8" : "lg:mr-8"}`} style={{ background: "#4C808A" }}>
                      <div className="font-bold tracking-widest mb-1 text-white" style={{ fontSize: "1.1rem" }}>STEP {step}</div>
                      <h3 className="font-semibold text-xs mb-1 text-white">{title}</h3>
                      <p className="text-white text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden lg:flex w-4 h-4 rounded-full bg-[#4C808A] border-2 border-white items-center justify-center shrink-0 z-10 shadow-md shadow-[#4C808A]/40" />

                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Mentorship Models ── */}
      <section className="py-20 bg-white" id="mentorship-models">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A]/30 mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Engagement Models</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Mentorship Models
            </h2>
            <p className="text-[#6b7280] text-sm max-w-xl mx-auto">
              Choose how you engage. Flexible models to fit your schedule and expertise.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {mentorshipModels.map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="relative rounded-md p-5 border border-[#3B4167]/10 bg-[#f8f9fb] hover:border-[#4C808A]/50 hover:shadow-md transition-all group w-full sm:w-[calc(50%-8px)] lg:w-72">
                {tag && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#4C808A] text-white text-[9px] font-bold uppercase tracking-wide">
                    {tag}
                  </span>
                )}
                <div className="w-10 h-10 rounded-md bg-[#4C808A]/10 group-hover:bg-[#4C808A] flex items-center justify-center mb-3 transition-all">
                  <Icon className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-[#3B4167] font-bold text-sm mb-2">{title}</h3>
                <p className="text-[#6b7280] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mentor Matching Preview ── */}
      <MatchingPreview onApplyMentor={onApplyMentor} />

      {/* ── 8. Incubation and Acceleration Programs (removed) ── */}
      {false && <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#3B4167]/10 border border-[#3B4167]/20 mb-4">
              <span className="text-[#3B4167] text-xs font-semibold tracking-widest uppercase">Where You Fit In</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Incubation and Acceleration Programs
            </h2>
            <p className="text-[#6b7280] text-sm max-w-xl mx-auto">
              See the active programs where your mentorship is needed most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {programs.map((p) => (
              <div key={p.name} className="bg-white rounded-md border border-[#3B4167]/10 overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-2" style={{ background: p.color }} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md"
                      style={{ background: p.color + "18", color: p.color }}>
                      {p.type}
                    </span>
                    <span className="text-[#6b7280] text-xs">{p.duration}</span>
                  </div>

                  <h3 className="text-[#3B4167] font-bold mb-3" style={{ fontSize: "0.95rem" }}>{p.name}</h3>

                  <div className="space-y-2.5 mb-4">
                    <div>
                      <div className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wide mb-1">Focus Areas</div>
                      <div className="flex flex-wrap gap-1">
                        {p.focus.filter(f => !isRemovedBadge(f)).map((f) => (
                          <span key={f} className="px-2 py-0.5 rounded-md bg-[#f8f9fb] border border-[#3B4167]/15 text-[#3B4167] text-[10px]">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wide mb-1">Business Stages</div>
                      <div className="flex flex-wrap gap-1">
                        {p.stages.filter(s => !isRemovedBadge(s)).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md text-[10px]" style={{ background: p.color + "15", color: p.color }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#6b7280] text-[10px] block">Mentor Commitment</span>
                        <span className="text-[#3B4167] font-semibold">{p.commitment}</span>
                      </div>
                      <div>
                        <span className="text-[#6b7280] text-[10px] block">Next Cohort</span>
                        <span className="text-[#3B4167] font-semibold">{p.cohort}</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-md text-xs font-bold border transition-all"
                    style={{ borderColor: p.color, color: p.color }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = p.color; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = p.color; }}>
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ── 9. Areas of Expertise Needed ── */}
      <section className="py-20 bg-[#3B4167]" id="expertise">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Where You Fit</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Areas of Expertise Needed
            </h2>
            <p className="text-white/80 text-sm max-w-xl mx-auto">
              Click any area to see how mentors in that field contribute to our programs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {expertiseAreas.map((area) => (
              <button
                key={area}
                onClick={() => setActiveExpertise(activeExpertise === area ? null : area)}
                className="px-4 py-2.5 rounded-md text-xs font-semibold transition-all shadow-sm hover:opacity-90"
                aria-pressed={activeExpertise === area}
                style={{
                  background: activeExpertise === area ? "#FFFFFF" : "#4C808A",
                  color: activeExpertise === area ? "#3B4167" : "#FFFFFF",
                }}>
                {area}
              </button>
            ))}
          </div>

          {activeExpertise && (
            <div className="mt-6 max-w-2xl mx-auto bg-white/10 rounded-md p-5 border border-white/20 text-center" role="region" aria-live="polite">
              <div className="text-[#A9D3DB] text-xs font-bold tracking-widest uppercase mb-2">{activeExpertise}</div>
              <p className="text-white/90 text-sm">
                Mentors with expertise in <strong className="text-white">{activeExpertise}</strong> are needed across our Incubation, Acceleration and Bootcamp programs.
              </p>
              <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                <span className="text-white text-[10px] font-semibold uppercase tracking-wide">Roles that fit:</span>
                {(rolesByArea[activeExpertise] ?? []).map((r) => (
                  <span key={r} className="px-2.5 py-1 rounded-md bg-white text-[#3B4167] text-[10px] font-bold">{r}</span>
                ))}
              </div>
              <p className="mt-3 text-white text-xs">
                {featuredMentors.filter((m) => m.expertise.includes(activeExpertise)).length > 0
                  ? `${featuredMentors.filter((m) => m.expertise.includes(activeExpertise)).length} featured mentor(s) already cover this area. See them highlighted below.`
                  : "No featured mentor covers this area yet, so your expertise would fill a real gap."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button onClick={onApplyMentor}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#4C808A] text-white text-xs font-bold border border-white hover:bg-[#3d6b74] transition-all">
                  Apply as {activeExpertise} Mentor
                </button>
                <a href="#meet-our-mentors" className="inline-flex items-center px-5 py-2.5 rounded-md text-white text-xs font-bold border border-white/60 hover:bg-white/10 transition-all">
                  See mentors in this area
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 10. Meet Our Mentors ── */}
      <section className="py-20 bg-white" id="meet-our-mentors">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A]/30 mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Our Network</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Meet Our Mentors
            </h2>
          </div>

          {activeExpertise && (
            <div className="mb-6 flex items-center justify-center gap-3 text-xs text-[#3B4167]">
              <span>Highlighting mentors with expertise in <strong>{activeExpertise}</strong></span>
              <button onClick={() => setActiveExpertise(null)} className="px-3 py-1 rounded-md border border-[#3B4167]/30 font-semibold hover:bg-[#3B4167] hover:text-white transition-all">Clear</button>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredMentors.map((m) => (
              <div key={m.name} className={`bg-[#f8f9fb] rounded-md overflow-hidden border hover:shadow-xl hover:-translate-y-2 hover:border-[#4C808A]/60 transition-all duration-300 group ${activeExpertise ? (m.expertise.includes(activeExpertise) ? "border-[#4C808A] ring-2 ring-[#4C808A]/40" : "opacity-40 border-[#3B4167]/10") : "border-[#3B4167]/10"}`}>
                <div className="relative h-44">
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3B4167]/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-[#4C808A] text-white text-[9px] font-bold">{m.role}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-[#3B4167] font-bold text-sm">{m.name}</h3>
                  <p className="text-[#4C808A] text-xs mb-1">{m.title}</p>
                  <p className="text-[#6b7280] text-[10px] mb-3">{m.org}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.expertise.filter(e => !isRemovedBadge(e)).map((e) => (
                      <span key={e} className="px-2 py-0.5 rounded-md text-white text-[9px] font-semibold" style={{ background: "#4C808A" }}>{e}</span>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="text-[#6b7280] text-[9px] font-semibold uppercase tracking-wide mb-1">Industries supported</div>
                    <p className="text-[#3B4167] text-[10px]">{m.industries.join(", ")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-center border-t border-[#3B4167]/10 pt-3">
                    {[{ v: `${m.years} years`, l: "Experience" }, { v: m.startups, l: "Startups mentored" }].map(({ v, l }) => (
                      <div key={l}>
                        <div className="text-[#3B4167] font-bold text-xs">{v}</div>
                        <div className="text-[#6b7280] text-[9px]">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. Mentorship Impact ── */}
      <section className="py-20 bg-[#0f1528]" id="impact">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A]/30 mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Impact</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Mentorship Impact
            </h2>
            <p className="text-white text-sm max-w-xl mx-auto">
              Real outcomes from a growing network of dedicated mentors and ambitious founders.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactMetrics.map(({ label, value, prefix = "", suffix }) => (
              <div key={label} className="bg-[#4C808A] rounded-md p-5 text-center shadow-sm transition-all">
                <div className="text-white font-bold mb-1" style={{ fontSize: "1.6rem" }}>
                  <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
                </div>
                <div className="text-white text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12 and 13. Testimonials (Mentor + Founder) ── */}
      <section className="py-20 bg-[#f8f9fb]" id="success-stories">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Testimonials</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Voices from Our Community
            </h2>
            {/* Tabs */}
            <div className="inline-flex rounded-md bg-white border border-[#3B4167]/15 p-1 mt-4">
              {(["mentor", "founder"] as const).map((tab) => (
                <button key={tab}
                  onClick={() => setActiveTestimonialTab(tab)}
                  className="px-5 py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: activeTestimonialTab === tab ? "#3B4167" : "transparent",
                    color: activeTestimonialTab === tab ? "white" : "#6b7280"
                  }}>
                  {tab === "mentor" ? "Mentor Stories" : "Founder Stories"}
                </button>
              ))}
            </div>
          </div>

          {activeTestimonialTab === "mentor" ? (
            <div className="grid md:grid-cols-2 gap-5">
              {mentorTestimonials.map((t) => (
                <div key={t.name} className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:shadow-lg transition-all">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-[#4C808A] fill-current" />)}
                  </div>
                  <p className="text-[#3B4167] text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                  <div className="bg-[#4C808A]/8 rounded-md p-3 mb-4 border border-[#4C808A]/15">
                    <div className="text-[10px] text-[#4C808A] font-bold uppercase tracking-wide mb-1">What I gained</div>
                    <p className="text-[#3B4167] text-xs">{t.gain}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-[#3B4167] font-bold text-xs">{t.name}</div>
                      <div className="text-[#6b7280] text-[10px]">{t.role} · {t.org}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {founderTestimonials.map((t) => (
                <div key={t.name} className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:shadow-lg transition-all">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3B4167]/10 text-[#3B4167] text-[10px] font-bold mb-4">
                    {t.sector}
                  </div>
                  <p className="text-[#3B4167] text-sm leading-relaxed mb-5 italic">"{t.result}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-[#3B4167] font-bold text-xs">{t.name}</div>
                      <div className="text-[#6b7280] text-[10px]">{t.startup}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 14. Upcoming Mentor Opportunities ── */}
      <section className="py-20 bg-white" id="opportunities">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Open Now</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Upcoming Mentor Opportunities
            </h2>
          </div>

          {upcomingOpportunities().length === 0 && (
            <p className="text-center text-[#6b7280] text-sm">No opportunities are scheduled right now. Register as a mentor to be notified when new ones open.</p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            {upcomingOpportunities().map((o) => (
              <div key={o.title} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] bg-[#f8f9fb] rounded-md p-5 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-md transition-all flex flex-col">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-white text-[9px] font-bold uppercase tracking-wide mb-3 self-start" style={{ background: "#4C808A" }}>
                  {o.tag}
                </span>
                <h3 className="text-[#3B4167] font-bold text-sm mb-3 flex-1">{o.title}</h3>
                <div className="space-y-1.5 text-[10px] text-[#6b7280]">
                  <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {formatOppDate(o.iso)}</div>
                  <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {o.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {o.location}</div>
                </div>
                <button onClick={onApplyMentor} className="mt-4 w-full py-2 rounded-md bg-[#3B4167] text-white text-xs font-bold hover:bg-[#2c3150] transition-all">
                  Register Interest
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 15. Mentor Resources (commented out) ── */}
      {false && <section className="py-20 bg-[#f8f9fb]" id="resources">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#3B4167]/10 border border-[#3B4167]/20 mb-4">
              <span className="text-[#3B4167] text-xs font-semibold tracking-widest uppercase">Resources</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Mentor Resources
            </h2>
            <p className="text-[#6b7280] text-sm max-w-xl mx-auto">
              Summaries available now. Full access unlocked after approval and login.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(({ title, desc, icon: Icon, locked }) => (
              <div key={title}
                className={`relative rounded-md p-5 border transition-all ${locked ? "bg-white/60 border-[#3B4167]/10 opacity-80" : "bg-white border-[#4C808A]/20 hover:shadow-md"}`}>
                {locked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-4 h-4 text-[#6b7280]" />
                  </div>
                )}
                <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${locked ? "bg-[#3B4167]/10" : "bg-[#4C808A]/10"}`}>
                  <Icon className={`w-5 h-5 ${locked ? "text-[#3B4167]" : "text-[#4C808A]"}`} />
                </div>
                <h3 className="text-[#3B4167] font-bold text-sm mb-1">{title}</h3>
                <p className="text-[#6b7280] text-xs leading-relaxed mb-3">{desc}</p>
                {locked ? (
                  <span className="text-[10px] text-[#6b7280] font-semibold">Login required to access</span>
                ) : (
                  <button className="text-[#4C808A] text-xs font-bold flex items-center gap-1 hover:underline">
                    View Preview <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ── 16. Mentor Recognition Programme ── */}
      <section className="py-20 bg-[#3B4167]" id="recognition">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Recognition</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Mentor Recognition Program
            </h2>
            <p className="text-white/80 text-sm max-w-xl mx-auto">
              Your contribution is valued, celebrated and publicly acknowledged.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recognitions.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center bg-[#4C808A] rounded-md p-5 shadow-sm transition-all group">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#3B4167" }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1">{title}</h3>
                <p className="text-white text-[10px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 17. FAQs ── */}
      <section className="py-20 bg-white" id="faqs">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">FAQs</span>
            </div>
            <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="rounded-md border border-[#3B4167]/10 overflow-hidden bg-[#f8f9fb]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-[#3B4167] text-sm font-semibold pr-4">{q}</span>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#4C808A]/15 flex items-center justify-center">
                    {openFaq === i
                      ? <ChevronUp className="w-3 h-3 text-[#4C808A]" />
                      : <ChevronDown className="w-3 h-3 text-[#4C808A]" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[#6b7280] text-sm leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 18. Final CTA ── */}
      <section className="py-24 bg-[#0f1528] relative overflow-hidden" id="join">
        {/* Background accent */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: "#4C808A", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full" style={{ background: "#3B4167", filter: "blur(60px)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-6" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Join the Network</span>
          </div>
          <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, lineHeight: 1.2 }}>
            Ready to Inspire the Next<br />Generation of Entrepreneurs?
          </h2>
          <p className="text-white/50 text-sm mb-10 max-w-xl mx-auto leading-relaxed">
            Your experience, your network and your wisdom have the power to transform a business and a life. Join over 520 mentors already making a difference.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={onApplyMentor}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-[#4C808A] text-white font-bold text-sm border border-white hover:bg-[#3d6b74] transition-all shadow-lg shadow-[#4C808A]/30"
            >
              {applyLabel}
            </button>
          </div>
        </div>
      </section>

      <div id="contact"><Footer /></div>
    </div>
  );
}
