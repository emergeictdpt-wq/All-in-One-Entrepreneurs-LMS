import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, LogIn, User, Building2, ClipboardList } from "lucide-react";

const navItems = [
  { label: "Home", href: "#" },
  {
    label: "Programs",
    href: "#programs",
    children: ["Emerge4Biz", "Emerge Learn", "Mentorship"],
  },
  {
    label: "Learning Academy",
    href: "#learning",
    children: ["Courses", "Learning Tracks", "Certifications", "Workshops"],
  },
  { label: "Mentors", href: "#mentors" },
  {
    label: "Funding",
    href: "#funding",
    children: ["Grants", "Investors", "Pitch Competitions"],
  },
  { label: "Alumni", href: "#alumni" },
  { label: "Community", href: "#community" },
  { label: "Resources", href: "#resources" },
  { label: "Success Stories", href: "#stories" },
  { label: "About Us", href: "#about" },
];

export function Navbar({ onNavigate, onLogin, onTrack }: { onNavigate?: (page: "home" | "incubation" | "acceleration") => void; onLogin?: () => void; onTrack?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loginDropdown, setLoginDropdown] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : ""}`}
      style={!scrolled ? { background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" } : undefined}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <img
              src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods"
              className={`h-10 w-auto object-contain transition-all ${scrolled ? "" : "brightness-0 invert"}`}
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={item.href}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs transition-colors whitespace-nowrap ${
                    scrolled
                      ? "text-[#3B4167] hover:text-[#4C808A] hover:bg-[#4C808A]/10"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-3 h-3" />}
                </a>
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-md shadow-xl border border-gray-100 py-2 z-50">
                    {item.children.map((child) => (
                      child === "Emerge4Biz" ? (
                        <div key={child} className="relative group/sub">
                          <div className="flex items-center justify-between px-4 py-2 text-xs text-[#3B4167] hover:bg-[#4C808A]/10 hover:text-[#4C808A] transition-colors cursor-pointer">
                            <span>{child}</span>
                            <ChevronDown className="w-3 h-3 -rotate-90" />
                          </div>
                          <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-xl border border-gray-100 py-2 z-50 hidden group-hover/sub:block">
                            <button
                              onClick={() => onNavigate?.("incubation")}
                              className="w-full text-left block px-4 py-2 text-xs text-[#3B4167] hover:bg-[#4C808A]/10 hover:text-[#4C808A] transition-colors"
                            >
                              Incubation Program
                            </button>
                            <button
                              onClick={() => onNavigate?.("acceleration")}
                              className="w-full text-left block px-4 py-2 text-xs text-[#3B4167] hover:bg-[#4C808A]/10 hover:text-[#4C808A] transition-colors"
                            >
                              Acceleration Program
                            </button>
                          </div>
                        </div>
                      ) : (
                        <a
                          key={child}
                          href="#"
                          className="block px-4 py-2 text-xs text-[#3B4167] hover:bg-[#4C808A]/10 hover:text-[#4C808A] transition-colors"
                        >
                          {child}
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Track Application + Login / Register dropdown */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
          {onTrack && (
            <button
              onClick={onTrack}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                scrolled ? "text-[#3B4167] hover:text-[#4C808A] hover:bg-[#4C808A]/10" : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Track Application
            </button>
          )}
          <div ref={loginRef} className="relative">
            <button
              onClick={() => setLoginDropdown((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all border bg-[#3B4167] text-white border-[#3B4167] hover:bg-[#2a3054]"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
              <ChevronDown className={`w-3 h-3 transition-transform ${loginDropdown ? "rotate-180" : ""}`} />
            </button>

            {loginDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider">Sign in as</p>
                </div>
                <button
                  onClick={() => { setLoginDropdown(false); onLogin?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#4C808A]/8 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-md bg-[#4C808A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4C808A]/20 transition-colors">
                    <User size={14} />
                  </div>
                  <div>
                    <div className="text-[#3B4167] text-xs font-bold">Entrepreneur</div>
                    <div className="text-[#6b7280] text-[10px]">Access your dashboard</div>
                  </div>
                </button>
                <button
                  onClick={() => { setLoginDropdown(false); onLogin?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#4C808A]/8 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-md bg-[#3B4167]/10 flex items-center justify-center shrink-0 group-hover:bg-[#3B4167]/20 transition-colors">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <div className="text-[#3B4167] text-xs font-bold">Program Manager</div>
                    <div className="text-[#6b7280] text-[10px]">Manage programs & cohorts</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`xl:hidden p-2 rounded-md ${scrolled ? "text-[#3B4167]" : "text-white"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block px-6 py-3 text-sm text-[#3B4167] hover:bg-[#4C808A]/10 hover:text-[#4C808A] border-b border-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {/* Login options */}
          <div className="px-4 py-3 border-t border-gray-100 bg-[#f8f9fb] space-y-2">
            {onTrack && (
              <button
                onClick={() => { setMobileOpen(false); onTrack(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md border border-[#4C808A] text-[#4C808A] text-xs font-bold mb-3"
              >
                <ClipboardList size={14} /> Track Application
              </button>
            )}
            <p className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider mb-2">Login / Register</p>
            <button
              onClick={() => { setMobileOpen(false); onLogin?.(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md bg-[#4C808A] text-white text-xs font-bold"
            >
              <User size={14} /> Entrepreneur Login
            </button>
            <button
              onClick={() => { setMobileOpen(false); onLogin?.(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md border border-[#3B4167] text-[#3B4167] text-xs font-bold"
            >
              <Building2 size={14} /> Program Manager Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
