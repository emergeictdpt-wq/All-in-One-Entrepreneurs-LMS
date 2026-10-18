import { Users, TrendingUp, Award, Globe } from "lucide-react";

const stats = [
  { icon: Users, value: "12,400+", label: "Entrepreneurs" },
  { icon: TrendingUp, value: "$48M+", label: "Funding Raised" },
  { icon: Award, value: "840+", label: "Startups Scaled" },
  { icon: Globe, value: "38", label: "Countries" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col justify-center pt-16">
      {/* YouTube video background */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          src="https://www.youtube.com/embed/lnusUSwdmqs?rel=0&autoplay=1&mute=1&enablejsapi=1&controls=0&loop=1&playlist=lnusUSwdmqs&fs=0&modestbranding=1&playsinline=1"
          allow="autoplay; fullscreen"
          className="absolute w-full h-full border-0"
          style={{
            top: "50%",
            left: "50%",
            width: "100vw",
            height: "56.25vw",
            minHeight: "100vh",
            minWidth: "177.78vh",
            transform: "translate(-50%, -50%)",
          }}
          title="Groundnut oil production background"
        />
      </div>
      {/* Dark overlay — same approach as Bridge for Billions */}
      <div className="absolute inset-0 bg-[#3B4167]/75" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <h1 className="text-white mb-6 leading-tight" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)", fontWeight: 700 }}>
              Empowering <span className="text-[#4C808A]">Entrepreneurs</span>
              <br />
              from Idea to Impact
            </h1>

            <p className="text-white mb-8 leading-relaxed" style={{ fontSize: "1rem" }}>
              The world's most complete entrepreneurship ecosystem combining Learning, Mentorship, Incubation, Acceleration, Investor Readiness, Funding Access, Community Engagement and Business Growth Tracking in one powerful platform.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 justify-center">
              <a
                href="#programs"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("programs");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.location.hash = "programs";
                  }
                }}
                className="inline-flex items-center px-6 py-3 rounded-md bg-[#4C808A] text-white font-bold hover:bg-[#3d6b74] transition-all shadow-lg shadow-[#4C808A]/30 border border-white"
                style={{ fontSize: "0.875rem" }}
              >
                Apply Now
              </a>
              <a
                href="#programs"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("programs");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.location.hash = "programs";
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white"
                style={{ fontSize: "0.875rem" }}
              >
                Explore Programs
              </a>
            </div>

          </div>

        </div>

        {/* Stats strip — commented out
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-white/5 rounded-md p-5 border border-white flex items-center gap-4 hover:border-[#4C808A]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-md bg-[#4C808A] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold" style={{ fontSize: "1.25rem" }}>{value}</div>
                <div className="text-white text-xs">{label}</div>
              </div>
            </div>
          ))}
        </div>
        */}
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L1440 60L1440 20C1200 60 720 0 0 40L0 60Z" fill="#f8f9fb" />
        </svg>
      </div>
    </section>
  );
}
