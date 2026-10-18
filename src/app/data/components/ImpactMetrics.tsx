import { useEffect, useRef, useState } from "react";

const metrics = [
  { value: 14820, suffix: "+", label: "Applications Received", color: "#4C808A" },
  { value: 12400, suffix: "+", label: "Entrepreneurs Supported", color: "#3B4167" },
  { value: 680, suffix: "", label: "Startups Incubated", color: "#4C808A" },
  { value: 340, suffix: "", label: "Startups Accelerated", color: "#3B4167" },
  { value: 520, suffix: "+", label: "Active Mentors", color: "#4C808A" },
  { value: 180, suffix: "+", label: "Active Investors", color: "#3B4167" },
  { value: 28400, suffix: "+", label: "Jobs Created", color: "#4C808A" },
  { value: 48, prefix: "$", suffix: "M+", label: "Funding Raised", color: "#3B4167" },
  { value: 120, prefix: "$", suffix: "M+", label: "Revenue Generated", color: "#3B4167" },
];

function AnimatedCounter({ target, prefix = "", suffix = "", isVisible }: {
  target: number;
  prefix?: string;
  suffix?: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const stepVal = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepVal;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function ImpactMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 bg-[#3B4167]" id="impact">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] border border-white mb-4">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Live Impact Metrics</span>
          </div>
          <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Transforming Entrepreneurship at Scale
          </h2>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Real-time data from our growing ecosystem of entrepreneurs, mentors, investors and program managers worldwide.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="bg-white/5 rounded-md p-5 border border-white hover:border-[#4C808A]/40 transition-all text-center"
            >
              <div
                className="mb-1 font-bold"
                style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.875rem)", color: "#ffffff" }}
              >
                <AnimatedCounter
                  target={m.value}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  isVisible={visible}
                />
              </div>
              <div className="text-white/60 text-xs leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
