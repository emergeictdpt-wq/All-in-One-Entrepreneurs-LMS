import { useState, useRef } from "react";
import { Lightbulb, BookOpen, Heart, UserCheck, Zap, ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import lightBulbImg from "../../imports/light-bulb.png";

const programs = [
  {
    icon: Lightbulb,
    name: "Emerge4Biz",
    tagline: "Sustainable Entrepreneurship and Livelihoods Program",
    desc: "A structured incubation and acceleration program designed to take MSMEs and startups from concept to commercialisation with hands-on support, expert mentors and investor connections.",
    duration: "6 Months",
    cohort: "Rolling Intake",
    accent: "#4C808A",
    img: "/images/program-emerge4biz.jpg",
  },
  {
    icon: BookOpen,
    name: "Emerge Learn",
    tagline: "Leadership Development Education and Training Program",
    desc: "A comprehensive learning platform offering certified entrepreneurship courses, skills training and practical toolkits for founders and aspiring entrepreneurs at every stage.",
    duration: "Self-Paced",
    cohort: "Always Open",
    accent: "#3B4167",
    img: "/images/program-emerge-learn.jpg",
  },
  /* She Emerge — commented out
  {
    icon: Heart,
    name: "She Emerge",
    tagline: "Women Entrepreneurship Program",
    desc: "A targeted incubation and acceleration program empowering women entrepreneurs with funding readiness, mentorship, market access and a strong peer support network.",
    duration: "5 Months",
    cohort: "Quarterly Intake",
    accent: "#4C808A",
    img: "https://images.unsplash.com/photo-1744973149087-179e3ed54eae?w=600&h=400&fit=crop&auto=format",
  },
  */
  /* Mentorship card — commented out
  {
    icon: UserCheck,
    name: "Mentorship",
    tagline: "Expert-Led Coaching and Guidance",
    desc: "One-on-one and group mentorship sessions with seasoned entrepreneurs, industry specialists and sector experts — structured to solve real challenges and accelerate growth.",
    duration: "Ongoing",
    cohort: "Matched Monthly",
    accent: "#3B4167",
    img: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&h=400&fit=crop&auto=format",
  },
  */
  /* Bootcamps card — commented out
  {
    icon: Zap,
    name: "Bootcamps",
    tagline: "Intensive Skills Bootcamps",
    desc: "Short, high-intensity training programs focused on specific entrepreneurship skills — from pitching and financial modelling to digital marketing, leadership and innovation.",
    duration: "2–4 Weeks",
    cohort: "Monthly",
    accent: "#4C808A",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop&auto=format",
  },
  */
];

const VISIBLE = 3;

function Emerge4BizModal({ open, onClose, onNavigateIncubation, onNavigateAcceleration }: { open: boolean; onClose: () => void; onNavigateIncubation?: () => void; onNavigateAcceleration?: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,21,40,0.80)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-md w-full max-w-lg shadow-2xl overflow-hidden relative border border-white/20"
        style={{
          animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
          background: "rgba(59, 65, 103, 0.92)",
          backdropFilter: "blur(16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.88) translateY(24px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal background image with opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&h=700&fit=crop&auto=format')",
            opacity: 0.14,
          }}
        />

        {/* Header with image */}
        <div className="relative p-6 border-b border-white/10 z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=300&fit=crop&auto=format')",
              opacity: 0.22,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3B4167]/90 via-[#3B4167]/80 to-[#4C808A]/75 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold" style={{ fontSize: "1.15rem" }}>Join Emerge4Biz</h3>
              <p className="text-white/85 text-xs mt-0.5">Choose your program track to get started</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/25 transition-all text-lg leading-none shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="relative z-10 p-6 grid gap-4">
          {[
            {
              title: "Incubation Program",
              desc: "Ideal for idea-stage and early startups. Get structured support, co-working access, expert facilitation and cohort-based learning to validate and build your venture.",
              icon: "💡",
              duration: "6 Months",
              accent: "#4C808A",
            },
            {
              title: "Acceleration Program",
              desc: "Designed for growth-stage startups ready to scale. Access intensive curriculum, investor introductions, market expansion support and demo day opportunities.",
              icon: "rocket",
              duration: "4 Months",
              accent: "#3B4167",
            },
          ].map((opt) => (
            <div
              key={opt.title}
              className="group flex items-start gap-4 p-5 rounded-md border border-white/30 transition-all hover:shadow-lg"
              style={{ background: "#4C808A" }}
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                style={{ background: "#ffffff" }}
              >
                {opt.title === "Incubation Program" ? (
                  <img src={lightBulbImg} alt="Incubation" className="w-7 h-7 object-contain" />
                ) : (
                  <Rocket className="w-6 h-6" style={{ color: "#4C808A" }} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-bold text-sm">{opt.title}</h4>
                </div>
                <p className="text-white/80 text-xs leading-relaxed">{opt.desc}</p>
                <button
                  onClick={(e) => { e.preventDefault(); onClose(); if (opt.title === "Incubation Program") onNavigateIncubation?.(); else if (opt.title === "Acceleration Program") onNavigateAcceleration?.(); }}
                  className="mt-3 inline-flex items-center text-xs font-bold text-white transition-colors hover:opacity-80"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quiz footer — removed */}
      </div>
    </div>
  );
}

export function Programs({ onNavigateIncubation, onNavigateAcceleration }: { onNavigateIncubation?: () => void; onNavigateAcceleration?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = programs.length;
  const maxIndex = Math.max(0, total - VISIBLE);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(maxIndex, c + 1));

  return (
    <>
    <Emerge4BizModal open={modalOpen} onClose={() => setModalOpen(false)} onNavigateIncubation={onNavigateIncubation} onNavigateAcceleration={onNavigateAcceleration} />
    <section className="py-20 relative" id="programs" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      </svg>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] border border-[#4C808A] mb-5">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Our Programs</span>
          </div>
          <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", fontWeight: 700 }}>
            Programs Designed to{" "}
            <span className="text-[#4C808A]">Accelerate Your Journey</span>
          </h2>
          <p className="text-white text-sm max-w-2xl mx-auto leading-relaxed">
            Five purposefully designed programs, each targeting a different stage, audience and need within the entrepreneurship ecosystem.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Track */}
          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-6 justify-center flex-wrap"
            >
              {programs.map((p) => (
                <div
                  key={p.name}
                  className="relative group rounded-md hover:border hover:border-[#4C808A] transition-all duration-300 overflow-hidden flex flex-col shadow-md"
                  style={{ width: "clamp(280px, 40%, 420px)", background: "#f8f9fb" }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden shrink-0">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-[#3B4167]"
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, #1e2340 100%)` }} />
                    <div
                      className="absolute bottom-4 left-5 w-10 h-10 rounded-md flex items-center justify-center shadow-sm"
                      style={{ background: p.accent }}
                    >
                      <p.icon className="w-5 h-5 text-white" style={{ color: "#ffffff" }} />
                    </div>
                    {/* Duration badge removed */}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6" style={{ background: "#f8f9fb" }}>
                    <h3 className="mb-1" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#6b7280" }}>{p.name}</h3>
                    <p className="text-xs font-semibold mb-3" style={{ color: "#6b7280" }}>{p.tagline}</p>
                    <p className="text-xs leading-relaxed mb-5 flex-1" style={{ color: "#6b7280" }}>{p.desc}</p>
                    {p.name === "Emerge4Biz" ? (
                      <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center px-5 py-2.5 rounded-md text-xs font-bold text-white transition-all duration-200 self-start"
                        style={{ background: "#4C808A" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#3B4167")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#4C808A")}
                      >
                        Join the Program
                      </button>
                    ) : (
                      <a
                        href="#"
                        className="inline-flex items-center px-5 py-2.5 rounded-md text-xs font-bold text-white transition-all duration-200 self-start"
                        style={{ background: "#4C808A" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#3B4167")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#4C808A")}
                      >
                        Join the Program
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
    </>
  );
}
