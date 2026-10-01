import { BookOpen, Clock, Users, Star, ArrowRight, Award } from "lucide-react";

const courses = [
  {
    title: "Entrepreneurship Fundamentals",
    track: "Foundations",
    duration: "8 hrs",
    level: "Beginner",
    enrolled: 3840,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=220&fit=crop&auto=format",
    cert: true,
  },
  {
    title: "Business Model Innovation",
    track: "Strategy",
    duration: "6 hrs",
    level: "Intermediate",
    enrolled: 2210,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=220&fit=crop&auto=format",
    cert: true,
  },
  {
    title: "Fundraising & Investor Relations",
    track: "Funding",
    duration: "10 hrs",
    level: "Advanced",
    enrolled: 1650,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=220&fit=crop&auto=format",
    cert: true,
  },
  {
    title: "Digital Marketing for Startups",
    track: "Growth",
    duration: "7 hrs",
    level: "Beginner",
    enrolled: 4120,
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=220&fit=crop&auto=format",
    cert: false,
  },
  {
    title: "Financial Modeling & Projections",
    track: "Finance",
    duration: "9 hrs",
    level: "Advanced",
    enrolled: 980,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=220&fit=crop&auto=format",
    cert: true,
  },
  {
    title: "Product-Market Fit Playbook",
    track: "Strategy",
    duration: "5 hrs",
    level: "Intermediate",
    enrolled: 2780,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=220&fit=crop&auto=format",
    cert: false,
  },
];

const levelColors: Record<string, string> = {
  Beginner: "#166534",
  Intermediate: "#92400e",
  Advanced: "#7c3aed",
};
const levelBg: Record<string, string> = {
  Beginner: "#dcfce7",
  Intermediate: "#fef3c7",
  Advanced: "#ede9fe",
};

export function LearningAcademy() {
  return (
    <section className="py-20 bg-white" id="learning">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A]/20 mb-4">
              <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Learning Academy</span>
            </div>
            <h2 className="text-[#3B4167]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
              World-Class Entrepreneurship Education
            </h2>
            <p className="text-[#6b7280] text-sm mt-2 max-w-xl">
              Structured learning tracks, industry certifications and practical toolkits designed for startup founders.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C808A] hover:text-[#3d6b74] transition-colors shrink-0"
          >
            Browse All Courses <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-md border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="relative">
                <img
                  src={c.img}
                  alt={c.title}
                  className="w-full h-40 object-cover bg-gray-100"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ background: levelBg[c.level], color: levelColors[c.level] }}
                  >
                    {c.level}
                  </span>
                </div>
                {c.cert && (
                  <div className="absolute top-3 right-3 bg-[#4C808A] rounded-md p-1.5">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-[10px] font-bold text-[#4C808A] tracking-wide uppercase mb-1">{c.track}</div>
                <h3 className="text-[#3B4167] mb-3" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  {c.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-[#6b7280] mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {c.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {c.enrolled.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {c.rating}
                  </span>
                </div>
                <a
                  href="#"
                  className="w-full block text-center py-2 rounded-md text-xs font-bold bg-[#4C808A]/10 text-[#4C808A] hover:bg-[#4C808A] hover:text-white transition-all"
                >
                  Enroll Free
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Courses", value: "240+" },
            { label: "Learning Tracks", value: "18" },
            { label: "Certifications", value: "42" },
            { label: "Completion Rate", value: "87%" },
          ].map((s) => (
            <div key={s.label} className="bg-[#f8f9fb] rounded-md p-4 text-center border border-[#3B4167]/10">
              <div className="text-[#4C808A] font-bold" style={{ fontSize: "1.375rem" }}>{s.value}</div>
              <div className="text-[#6b7280] text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
