import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Amina Diallo",
    role: "Founder, AgroFresh Technologies",
    type: "Entrepreneur",
    quote:
      "This platform gave us everything: structured learning, an incredible mentor and direct access to impact investors. We raised $2.4M within 6 months of graduating.",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format",
    rating: 5,
  },
  {
    name: "Prof. James Thornton",
    role: "Lead Mentor, HealthTech Track",
    type: "Mentor",
    quote:
      "The mentorship portal is genuinely the best I've seen. Scheduling, note-taking, impact tracking all in one place. I've mentored 163 founders and the platform makes it effortless.",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&auto=format",
    rating: 5,
  },
  {
    name: "Yusuf Al-Habsi",
    role: "Partner, Frontier Ventures",
    type: "Investor",
    quote:
      "Our deal flow quality improved dramatically after joining this platform's investor network. The startups are investment-ready — due diligence-backed profiles and clear traction metrics.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    rating: 5,
  },
  {
    name: "Christine Nakato",
    role: "Program Director, UNDP Innovation Hub",
    type: "Donor",
    quote:
      "We've been looking for a platform that can handle end-to-end program management, MEL reporting and beneficiary tracking. This platform does it all and beautifully.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    rating: 5,
  },
  {
    name: "Daniel Omondi",
    role: "CEO, PaySwift Africa",
    type: "Entrepreneur",
    quote:
      "I joined with just an idea. Today, we're a $5.8M funded startup with 124 employees. The platform's mentors and investor connections were game-changing.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
    rating: 5,
  },
];

const typeBgColors: Record<string, string> = {
  Entrepreneur: "#4C808A",
  Mentor:       "#4C808A",
  Investor:     "#4C808A",
  Donor:        "#4C808A",
};
const typeTextColors: Record<string, string> = {
  Entrepreneur: "#fff",
  Mentor:       "#fff",
  Investor:     "#fff",
  Donor:        "#fff",
};

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const t = testimonials[current];

  return (
    <section className="py-20 relative" id="testimonials" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      </svg>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Testimonials</span>
          </div>
          <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Voices from Our Ecosystem
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-md p-8 relative">
            <Quote className="w-10 h-10 text-[#4C808A]/30 absolute top-6 right-6" />

            <div className="flex items-center gap-4 mb-6">
              <img
                src={t.img}
                alt={t.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#4C808A]/40 bg-gray-200"
              />
              <div>
                <h3 className="text-white font-bold text-sm">{t.name}</h3>
                <p className="text-white/60 text-xs">{t.role}</p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold"
                  style={{ background: typeBgColors[t.type], color: typeTextColors[t.type] }}
                >
                  {t.type}
                </span>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <p className="text-white/80 text-sm leading-relaxed italic">"{t.quote}"</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#4C808A] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-md transition-all ${
                    i === current ? "w-6 bg-[#4C808A]" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#4C808A] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
