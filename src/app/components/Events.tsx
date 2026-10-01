import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

const events = [
  {
    title: "Pitch Perfect Bootcamp",
    type: "Bootcamp",
    date: "Jun 28, 2026",
    time: "9:00 AM – 5:00 PM",
    location: "Nairobi Hub + Virtual",
    attendees: 120,
    color: "#4C808A",
  },
  {
    title: "Investor Connect Demo Day",
    type: "Demo Day",
    date: "Jul 10, 2026",
    time: "2:00 PM – 6:00 PM",
    location: "Virtual",
    attendees: 340,
    color: "#3B4167",
  },
  {
    title: "Women Founders Summit",
    type: "Webinar",
    date: "Jul 18, 2026",
    time: "10:00 AM – 12:00 PM",
    location: "Virtual",
    attendees: 680,
    color: "#7a89c2",
  },
  {
    title: "FinTech Innovation Challenge",
    type: "Pitch Competition",
    date: "Aug 2, 2026",
    time: "All Day",
    location: "Lagos Innovation Hub",
    attendees: 200,
    color: "#4C808A",
  },
  {
    title: "Scale-Up Masterclass Series",
    type: "Workshop",
    date: "Aug 14, 2026",
    time: "3:00 PM – 5:00 PM",
    location: "Virtual",
    attendees: 150,
    color: "#3B4167",
  },
  {
    title: "Climate Startups Forum",
    type: "Workshop",
    date: "Aug 22, 2026",
    time: "9:00 AM – 4:00 PM",
    location: "Accra Business District",
    attendees: 90,
    color: "#4C808A",
  },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  Bootcamp: { bg: "#dcfce7", text: "#166534" },
  "Demo Day": { bg: "#dbeafe", text: "#1e40af" },
  Webinar: { bg: "#ede9fe", text: "#7c3aed" },
  "Pitch Competition": { bg: "#fef3c7", text: "#92400e" },
  Workshop: { bg: "#f0fdf4", text: "#166534" },
};

export function Events() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="events">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A]/20 mb-4">
              <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Upcoming Events</span>
            </div>
            <h2 className="text-[#3B4167]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
              Workshops, Webinars & Competitions
            </h2>
          </div>
          <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C808A] hover:text-[#3d6b74] transition-colors shrink-0">
            View Full Calendar <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e) => (
            <div
              key={e.title}
              className="bg-white rounded-md border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="h-1.5" style={{ background: e.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: typeColors[e.type]?.bg || "#f0f2f5",
                      color: typeColors[e.type]?.text || "#3B4167",
                    }}
                  >
                    {e.type}
                  </span>
                  <div
                    className="text-center px-3 py-1 rounded-md"
                    style={{ background: e.color + "15" }}
                  >
                    <div className="text-xs font-bold" style={{ color: e.color }}>
                      {e.date.split(",")[0].split(" ")[1]}
                    </div>
                    <div className="text-[9px] font-semibold" style={{ color: e.color }}>
                      {e.date.split(" ")[0]}
                    </div>
                  </div>
                </div>
                <h3 className="text-[#3B4167] mb-3" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  {e.title}
                </h3>
                <div className="space-y-1.5 mb-4 text-xs text-[#6b7280]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" /> {e.date} · {e.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {e.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0" /> {e.attendees} registered
                  </div>
                </div>
                <a
                  href="#"
                  className="w-full block text-center py-2 rounded-md text-xs font-bold border transition-all"
                  style={{ borderColor: e.color, color: e.color }}
                  onMouseEnter={(el) => {
                    (el.target as HTMLElement).style.background = e.color;
                    (el.target as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(el) => {
                    (el.target as HTMLElement).style.background = "transparent";
                    (el.target as HTMLElement).style.color = e.color;
                  }}
                >
                  Register Free
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
