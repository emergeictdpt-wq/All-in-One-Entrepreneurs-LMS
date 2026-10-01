import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "Share your expertise and make a lasting impact on emerging entrepreneurs",
  "Flexible commitment, mentor at your own pace, online or in-person",
  "Work with founders across AgriTech, FinTech, HealthTech and more",
  "Access a global community of fellow mentors and thought leaders",
  "Structured onboarding, matching and session management tools built in",
  "Recognition, certificates and alumni network membership included",
];

export function MentorshipSection({ onBecomeMentor }: { onBecomeMentor?: () => void }) {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="mentorship">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">

        {/* Top label */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] border border-[#4C808A] mb-5">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Mentorship Program</span>
          </div>
          <h2 className="text-[#3B4167] mb-4" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", fontWeight: 700 }}>
            Unlock Your Business Potential with{" "}
            <span className="text-[#4C808A]">Focused Mentorship</span>
          </h2>
          <p className="text-[#6b7280] text-sm max-w-2xl mx-auto leading-relaxed">
            You have built experience, overcome challenges and achieved results. Now is your chance to pass it on and help the next generation of entrepreneurs succeed faster than you did.
          </p>
        </div>

        {/* Main split layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">

          {/* Left — single big image */}
          <div className="relative rounded-md overflow-hidden group" style={{ height: "520px" }}>
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format"
              alt="Mentorship session in progress"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-gray-200"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3B4167]/85 via-[#3B4167]/20 to-transparent" />
          </div>

          {/* Right — content */}
          <div>
            <h3 className="text-[#3B4167] mb-4" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              Share Your Experience. Shape the Next Generation.
            </h3>
            <p className="text-[#6b7280] text-sm leading-relaxed mb-6">
              As an Emerge Livelihoods mentor, you bring more than advice, you bring lived experience, industry insight and the kind of wisdom that only comes from building something real. Join our growing network of mentors, coaches and facilitators who are transforming entrepreneurship across Africa.
            </p>

            {/* Benefits list */}
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#4C808A] mt-0.5 shrink-0" />
                  <span className="text-[#3B4167] text-xs leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

          </div>
        </div>

        {/* Bottom CTA banner */}
        <div className="mt-8 rounded-md p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #3B4167 0%, #4C808A 100%)" }}
        >
          <div>
            <h3 className="text-white font-bold mb-1" style={{ fontSize: "1.1rem" }}>
              Are you an expert ready to give back?
            </h3>
            <p className="text-white/70 text-sm">
              Join our mentor network and help shape the next generation of African entrepreneurs.
            </p>
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onBecomeMentor?.(); }}
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3 rounded-md text-sm font-bold bg-white text-[#3B4167] hover:bg-[#f0f2f5] border border-white transition-all"
          >
            Become a Mentor <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
