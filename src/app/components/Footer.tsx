import { Linkedin, Facebook, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";

const links = {
  Platform: ["About Us", "How It Works", "Pricing", "Blog", "Careers"],
  Programs: ["Incubation", "Acceleration", "Bootcamps", "Mentorship", "Funding Access"],
  "Learning Academy": ["All Courses", "Learning Tracks", "Certifications", "Workshops", "Toolkits"],
  Support: ["Help Center", "Contact Us", "FAQs", "Community Forum", "Report an Issue"],
};

export function Footer() {
  return (
    <footer className="bg-[#1e2340] text-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-16 pb-8">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-4">
              <img
                src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
                alt="Emerge Livelihoods"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-white/50 text-xs leading-relaxed mb-5 max-w-xs">
              An innovation catalyst and entrepreneur's incubator that accelerates ventures from the napkin-sketch phase to investment scalability and sustainable market dominance.
            </p>
            <div className="space-y-2 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#4C808A]" /> hello@emergelivelihoods.org
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#4C808A]" /> +265 88 886 0810
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#4C808A] mt-0.5 shrink-0" />
                <span>Emerge Hub – Mzuzu<br />Kwawala House, First Floor<br />PO Box 20094, Mzuzu, Malawi</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-bold text-xs tracking-wide uppercase mb-4 text-white/90">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/50 hover:text-[#4C808A] text-xs transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-xs flex flex-wrap items-center gap-4">
            <span>© 2026 Emerge Livelihoods. All rights reserved.</span>
            <a href="#" className="hover:text-[#4C808A] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#4C808A] transition-colors">Terms of Service</a>
          </div>
          <div className="flex items-center gap-3">
            {[Linkedin, Facebook, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#4C808A] transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
