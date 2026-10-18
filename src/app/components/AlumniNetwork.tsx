import { useState } from "react";
import { ArrowRight, MapPin, TrendingUp, DollarSign, Users } from "lucide-react";

const marqueeNames = [
  "Kondwani Gondwe, AgroFresh", "Tadala Phiri, PaySwift", "Chisomo Chidothe, MedConnect",
  "Wongani Mkandawire, GreenBuild", "Alinafe Mwale, SupplyNow", "Madalitso Chaponda, LegalEdge",
  "Taonga Nyirenda, FarmIQ", "Yamikani Banda, HealthBridge", "Fatima Mussa, CloudBase",
  "Blessings Chirwa, EduLink", "Chifuniro Kankhwende, CleanTech", "Limbani Tembo, LogiPay",
];

const spotlightAlumni = [
  {
    name: "Chikondi Phiri",
    startup: "AgroFresh Technologies",
    program: "Incubation Program Cohort 3",
    country: "Blantyre, Malawi",
    raised: "$2.4M",
    jobs: 82,
    growth: "340%",
    img: "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=400&h=500&fit=crop&auto=format",
    appreciationNote: "The incubation program transformed our early-stage prototype into an operational AgriTech venture. The dedicated mentor pairing, financial modeling workshops and seed funding support gave us the exact foundation we needed to scale across Malawi.",
    sector: "AgriTech",
    year: "Class of 2023",
  },
  {
    name: "Towera Mwale",
    startup: "PaySwift Africa",
    program: "Incubation Program Cohort 2",
    country: "Lilongwe, Malawi",
    raised: "$5.8M",
    jobs: 124,
    growth: "520%",
    img: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=400&h=500&fit=crop&auto=format",
    appreciationNote: "Joining the incubation program was the single best decision for PaySwift. The hands-on product validation, compliance advisory and investor demo days helped us secure seed funding and establish robust digital payment infrastructure.",
    sector: "FinTech",
    year: "Class of 2022",
  },
  {
    name: "Tiyamike Banda",
    startup: "CleanTech Solutions",
    program: "Incubation Program Cohort 5",
    country: "Mzuzu, Malawi",
    raised: "$1.2M",
    jobs: 48,
    growth: "210%",
    img: "https://images.unsplash.com/photo-1563132337-f159f484226c?w=400&h=500&fit=crop&auto=format",
    appreciationNote: "Through the incubation program, I gained the business frameworks, technical guidance and peer network needed to take our clean energy solution from a concept to a high-impact, bankable venture serving communities in Northern Malawi.",
    sector: "CleanTech",
    year: "Class of 2024",
  },
];

export function AlumniNetwork() {
  const [active, setActive] = useState(0);
  const alumni = spotlightAlumni[active];

  return (
    <section className="overflow-hidden relative" id="alumni" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      </svg>

      {/* Scrolling marquee ticker */}
      <div className="relative z-10">
      <div className="border-y border-white/10 py-3 overflow-hidden" style={{ background: "#4C808A" }}>
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{
            animation: "marquee 30s linear infinite",
            width: "max-content",
          }}
        >
          {[...marqueeNames, ...marqueeNames].map((name, i) => (
            <span key={i} className="text-white text-xs font-semibold tracking-wide">
              <span className="text-white mr-2">★</span>{name}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 relative z-10">

        {/* Section header */}
        <div className="grid lg:grid-cols-2 gap-6 items-end mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-5" style={{ background: "#4C808A" }}>
              <span className="text-white text-xs font-semibold tracking-widest uppercase">Alumni Network</span>
            </div>
            <h2 className="text-white" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", fontWeight: 700, lineHeight: 1.2 }}>
              Where Are They Now?{" "}
              <span className="text-[#4C808A]">Thriving.</span>
            </h2>
          </div>
          <p className="text-white text-sm leading-relaxed lg:text-right">
            Our alumni are founders, CEOs, investors and job creators across 38 countries. Once you graduate, you never leave, you level up.
          </p>
        </div>

        {/* Alumni spotlight */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-stretch mb-10">

          {/* Left — spotlight details */}
          <div className="flex flex-col justify-between rounded-md p-8 shadow-sm" style={{ background: "#f8f9fb" }}>
            {/* Tab switcher */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {spotlightAlumni.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    active === i
                      ? "bg-[#4C808A] text-white"
                      : "bg-[#3B4167]/10 text-[#3B4167] hover:bg-[#3B4167]/20"
                  }`}
                >
                  {a.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Alumni info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#4C808A] tracking-widest uppercase">{alumni.year}</span>
                  <span className="text-[#6b7280] font-bold text-[10px] tracking-widest uppercase">{alumni.program}</span>
                </div>
                <h3 className="text-[#3B4167] mb-0.5" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{alumni.name}</h3>
                <p className="text-[#4C808A] text-sm font-semibold mb-1">{alumni.startup}</p>
                <div className="flex items-center gap-1.5 text-[#6b7280] text-xs mb-3">
                  <MapPin className="w-3 h-3 text-[#4C808A]" /> {alumni.country}
                </div>

                {/* Incubation program appreciation note */}
                <p className="text-[#6b7280] text-xs leading-relaxed italic py-0.5">
                  "{alumni.appreciationNote}"
                </p>
              </div>

              {/* Impact metrics pushed towards bottom */}
              <div className="grid grid-cols-3 gap-4 mt-auto pt-6">
                {[
                  { icon: DollarSign, label: "Capital Raised", value: alumni.raised },
                  { icon: Users, label: "Jobs Created", value: alumni.jobs },
                  { icon: TrendingUp, label: "Revenue Growth", value: alumni.growth },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-md p-4 text-center" style={{ background: "#4C808A" }}>
                    <Icon className="w-4 h-4 text-white mx-auto mb-1.5" />
                    <div className="text-white font-bold text-sm">{value}</div>
                    <div className="text-white/80 text-[10px] mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — alumni photo */}
          <div className="relative rounded-md overflow-hidden" style={{ minHeight: "420px" }}>
            <img
              src={alumni.img}
              alt={alumni.name}
              className="w-full h-full object-cover object-top transition-opacity duration-500 bg-[#3B4167]"
              style={{ minHeight: "420px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e2340] via-transparent to-transparent" />
            {/* Country badge removed */}
            {/* Name tag at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white font-bold text-sm">{alumni.name}</p>
              <p className="text-white text-xs">{alumni.startup}</p>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="relative rounded-md overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1550305080-4e029753abcf?w=1400&h=300&fit=crop&auto=format"
            alt="Alumni community"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #3B4167/95 0%, #4C808A/80 100%)", opacity: 0.92 }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-10">
            <div>
              <h3 className="text-white font-bold mb-1" style={{ fontSize: "1.2rem" }}>
                You graduate from the program. You never leave the family.
              </h3>
              <p className="text-white/70 text-sm">
                Join 3,200+ alumni who continue to grow, connect and give back through the Emerge Alumni Network.
              </p>
            </div>
            <a
              href="#"
              className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-md text-sm font-bold bg-white text-[#3B4167] hover:bg-[#f0f2f5] transition-all shadow-xl"
            >
              Join the Alumni Network <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
      </div>
    </section>
  );
}
