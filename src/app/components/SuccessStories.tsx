import { ArrowRight, Play, TrendingUp, Users, DollarSign } from "lucide-react";

const stories = [
  {
    founder: "Chikondi Phiri",
    startup: "AgroFresh Technologies",
    program: "GrowthScale Accelerator '24",
    funding: "$2.4M",
    jobs: 82,
    growth: "340%",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format",
    quote: "Emerge Livelihoods connected us with exactly the right investors at the right time. We raised our seed round in 3 months.",
    sector: "AgriTech",
  },
  {
    founder: "Towera Mwale",
    startup: "PaySwift Africa",
    program: "FinTech Frontier '23",
    funding: "$5.8M",
    jobs: 124,
    growth: "520%",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
    quote: "The mentorship program gave us the strategic clarity we needed to pivot and find product-market fit.",
    sector: "FinTech",
  },
  {
    founder: "Priya Subramaniam",
    startup: "MedConnect Health",
    program: "Founders Launchpad '23",
    funding: "$1.8M",
    jobs: 45,
    growth: "280%",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format",
    quote: "From idea to funded startup in 18 months. The platform's end-to-end support was the difference maker.",
    sector: "HealthTech",
  },
];

export function SuccessStories() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="stories">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A]/20 mb-4">
              <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Success Stories</span>
            </div>
            <h2 className="text-[#3B4167]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
              Founders Who Changed the Game
            </h2>
          </div>
          <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C808A] hover:text-[#3d6b74] transition-colors shrink-0">
            View All Stories <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((s) => (
            <div
              key={s.startup}
              className="bg-white rounded-md border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#3B4167] to-[#4C808A] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={s.img} alt={s.founder} className="w-12 h-12 rounded-full object-cover border-2 border-white/30 bg-gray-200" />
                  <div>
                    <div className="text-white font-bold text-sm">{s.founder}</div>
                    <div className="text-white/70 text-xs">{s.startup}</div>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-md bg-white/15 text-white text-[9px] font-semibold">
                    {s.sector}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: DollarSign, label: "Raised", value: s.funding },
                    { icon: Users, label: "Jobs", value: s.jobs },
                    { icon: TrendingUp, label: "Growth", value: s.growth },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-white rounded-md p-2 text-center">
                      <Icon className="w-3 h-3 text-[#4C808A] mx-auto mb-0.5" />
                      <div className="text-[#4C808A] font-bold text-sm">{value}</div>
                      <div className="text-[#4C808A] text-[9px]">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="text-[10px] font-semibold text-[#4C808A] uppercase tracking-wide mb-2">
                  {s.program}
                </div>
                <p className="text-[#6b7280] text-xs leading-relaxed italic">"{s.quote}"</p>
                <div className="mt-4 flex gap-2">
                  <a
                    href="#"
                    className="flex-1 text-center py-2 rounded-md text-xs font-semibold bg-[#f8f9fb] text-[#3B4167] hover:bg-[#4C808A] hover:text-white transition-all"
                  >
                    Read Story
                  </a>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-[#f8f9fb] text-[#3B4167] hover:bg-[#3B4167]/10 transition-all">
                    <Play className="w-3 h-3" /> Watch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
