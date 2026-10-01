import { Users, MessageSquare, Hash, TrendingUp, ArrowRight } from "lucide-react";

const discussions = [
  {
    topic: "How did you get your first 100 customers?",
    replies: 48,
    likes: 132,
    group: "Growth & Sales",
    author: "Sarah M.",
    time: "2h ago",
  },
  {
    topic: "Lessons from our first failed pivot — what we learned",
    replies: 31,
    likes: 89,
    group: "Founder Stories",
    author: "Daniel O.",
    time: "5h ago",
  },
  {
    topic: "Best tools for startup financial modeling in 2026?",
    replies: 26,
    likes: 74,
    group: "Tools & Resources",
    author: "Priya S.",
    time: "8h ago",
  },
  {
    topic: "Looking for co-founder in AgriTech space — Nairobi",
    replies: 19,
    likes: 45,
    group: "Co-Founder Matching",
    author: "Kwame A.",
    time: "1d ago",
  },
];

const groups = [
  { name: "Growth & Sales", members: 1840, color: "#4C808A" },
  { name: "AgriTech Founders", members: 640, color: "#3B4167" },
  { name: "Women in Tech", members: 2100, color: "#7a89c2" },
  { name: "FinTech Circle", members: 920, color: "#4C808A" },
  { name: "Co-Founder Matching", members: 1240, color: "#3B4167" },
  { name: "Investor Readiness", members: 780, color: "#7a89c2" },
];

export function Community() {
  return (
    <section className="py-20 bg-white" id="community">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A]/20 mb-4">
            <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Founder Community</span>
          </div>
          <h2 className="text-[#3B4167] mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            A Thriving Ecosystem of Founders
          </h2>
          <p className="text-[#6b7280] text-sm">
            Connect, collaborate and grow alongside 12,000+ entrepreneurs across 38 countries.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Discussions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#3B4167] font-bold text-sm">Trending Discussions</h3>
              <a href="#" className="flex items-center gap-1 text-xs text-[#4C808A] font-semibold">
                See All <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-3">
              {discussions.map((d) => (
                <div
                  key={d.topic}
                  className="bg-[#f8f9fb] rounded-md p-4 border border-[#3B4167]/10 hover:border-[#4C808A]/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#4C808A]/10 text-[#4C808A] text-[9px] font-bold mb-1.5">
                        #{d.group}
                      </span>
                      <h4 className="text-[#3B4167] text-xs font-semibold mb-2">{d.topic}</h4>
                      <div className="flex items-center gap-3 text-[#6b7280] text-[10px]">
                        <span>{d.author}</span>
                        <span>·</span>
                        <span>{d.time}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {d.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {d.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community groups + stats */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#3B4167] font-bold text-sm">Community Groups</h3>
              <a href="#" className="flex items-center gap-1 text-xs text-[#4C808A] font-semibold">
                Browse All <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {groups.map((g) => (
                <div
                  key={g.name}
                  className="bg-[#f8f9fb] rounded-md p-4 border border-[#3B4167]/10 hover:border-[#4C808A]/30 hover:shadow-sm transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center mb-2"
                    style={{ background: g.color + "20" }}
                  >
                    <Hash className="w-4 h-4" style={{ color: g.color }} />
                  </div>
                  <h4 className="text-[#3B4167] text-xs font-semibold mb-1">{g.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-[#6b7280]">
                    <Users className="w-3 h-3" /> {g.members.toLocaleString()} members
                  </div>
                </div>
              ))}
            </div>

            {/* Community stats */}
            <div className="bg-[#3B4167] rounded-md p-5 text-white">
              <h4 className="font-bold text-sm mb-3">Community at a Glance</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "12,400+", label: "Active Members" },
                  { value: "8,200+", label: "Discussions" },
                  { value: "38", label: "Countries" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-[#4C808A] font-bold" style={{ fontSize: "1.1rem" }}>{s.value}</div>
                    <div className="text-white/50 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
