import { useState } from "react";
import { ArrowRight } from "lucide-react";

const expertiseFilters = ["All", "Technology", "Finance", "Marketing", "Operations", "Legal", "AgriTech", "HealthTech"];

const mentors = [
  {
    name: "Dr. Chisomo Banda",
    role: "Mentor",
    expertise: "Technology",
    industry: "FinTech & Blockchain",
    years: 18,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format&face=1",
    sessions: 142,
  },
  {
    name: "Sarah Mwangi",
    role: "Coach",
    expertise: "Finance",
    industry: "Venture Capital",
    years: 14,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format",
    sessions: 89,
  },
  {
    name: "Kwame Asante",
    role: "Facilitator",
    expertise: "Marketing",
    industry: "E-commerce & D2C",
    years: 12,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
    sessions: 210,
  },
  {
    name: "Fatima Al-Rashid",
    role: "Coach",
    expertise: "Operations",
    industry: "Manufacturing & Supply Chain",
    years: 20,
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&auto=format",
    sessions: 76,
  },
  {
    name: "Carlos Mendez",
    role: "Mentor",
    expertise: "Legal",
    industry: "Startup Law & IP",
    years: 15,
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",
    sessions: 118,
  },
  {
    name: "Dr. Nkechi Okafor",
    role: "Facilitator",
    expertise: "AgriTech",
    industry: "Agriculture Innovation",
    years: 16,
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format",
    sessions: 94,
  },
  {
    name: "James Thornton",
    role: "Mentor",
    expertise: "HealthTech",
    industry: "MedTech & Digital Health",
    years: 22,
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&auto=format",
    sessions: 163,
  },
  {
    name: "Aisha Coulibaly",
    role: "Coach",
    expertise: "Technology",
    industry: "SaaS & Cloud",
    years: 11,
    img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&auto=format",
    sessions: 201,
  },
];

export function Mentors() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? mentors : mentors.filter((m) => m.expertise === filter);

  return (
    <section className="py-20 bg-white" id="mentors">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#3B4167]/10 border border-[#3B4167]/20 mb-4">
            <span className="text-[#3B4167] text-xs font-semibold tracking-widest uppercase">Expert Network</span>
          </div>
          <h2 className="text-[#3B4167] mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Mentors, Coaches & Facilitators
          </h2>
          <p className="text-[#6b7280] text-sm">Connect with world-class experts who have built, scaled and funded successful ventures.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {expertiseFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-[#4C808A] text-white shadow-sm"
                  : "bg-white border border-[#3B4167]/15 text-[#3B4167] hover:border-[#4C808A] hover:text-[#4C808A]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div
              key={m.name}
              className="bg-[#eef4f5] rounded-md p-5 border border-[#4C808A]/20 hover:border-[#4C808A] hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-16 h-16 rounded-full object-cover bg-gray-100 border-2 border-[#4C808A]/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#4C808A] rounded-md px-1.5 py-0.5 text-[9px] text-white font-bold">
                  {m.years}y
                </div>
              </div>
              <h3 className="text-[#3B4167] mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{m.name}</h3>
              <span
                className="inline-block px-2.5 py-0.5 rounded-md text-[9px] font-bold mb-1.5"
                style={{
                  background: m.role === "Mentor" ? "#3B4167" : m.role === "Coach" ? "#4C808A" : "#7a89c2",
                  color: "#fff",
                }}
              >
                {m.role}
              </span>
              <p className="text-[#4C808A] text-[10px] font-semibold mb-0.5">{m.expertise}</p>
              <p className="text-[#6b7280] text-[10px] mb-3">{m.industry}</p>
              <div className="text-[10px] text-[#6b7280]">
                <span className="font-semibold text-[#3B4167]">{m.sessions}</span> sessions completed
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C808A] hover:text-[#3d6b74] transition-colors">
            Meet All 520+ Mentors <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
