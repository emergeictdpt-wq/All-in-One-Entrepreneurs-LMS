import type { ReactNode } from "react";
import {
  ArrowRight, BookOpen, Building2, Cpu, Download, Eye, GraduationCap, Handshake, Heart,
  Landmark, Lightbulb, MessageCircle, Mountain, Rocket,
  Shield, Smartphone, Sprout, Target, Telescope, TrendingUp, UserCheck, Users, Flame,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
// import { Partners } from "./Partners";

type AboutNav = "home" | "incubation" | "acceleration" | "mentors";

const SITE = "https://www.emergelivelihoods.org";
const IMG = "https://emergelivelihoods.org/wp-content/uploads/2024/10";
const GRADIENT = "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)";

const impact = [
  { value: "25,620+", label: "People reached" },
  { value: "23,840+", label: "Youths and children engaged" },
  { value: "6,250+", label: "Youth trained with digital skills" },
  { value: "6,260+", label: "Entrepreneurs engaged" },
  { value: "$305,000+", label: "In seed capital funding" },
];

const focusAreas = [
  { icon: Cpu, title: "Technology and innovation hubs", text: "Physical and digital spaces where creators, innovators and young people can build, test and learn." },
  { icon: GraduationCap, title: "Leadership development, education and training", text: "Skills and leadership programs that prepare people to lead change in their own communities." },
  { icon: Sprout, title: "Sustainable entrepreneurship and livelihoods", text: "Support for idea-stage to early-stage enterprises, with a focus on climate adaptation." },
  { icon: TrendingUp, title: "Productivity enhancement", text: "Helping enterprises and households produce more, earn more and withstand shocks." },
];

const initiatives = [
  { icon: Heart, title: "SheMerge", text: "Amplifying the voices and participation of women and girls." },
  { icon: Users, title: "Youth leadership", text: "Leadership development, education and training for young people." },
  { icon: Lightbulb, title: "Technology and innovation spaces", text: "Spaces for creators and innovators to experiment and build." },
  { icon: Rocket, title: "Emerge4Biz", text: "MSME development through incubation and acceleration.", nav: true },
];

const values = [
  { icon: Lightbulb, name: "Innovation", text: "We encourage new and creative ideas. Co-creation is at the center of our minds." },
  { icon: Handshake, name: "Collaboration", text: "We believe in building meaningful partnerships. Together we can do more." },
  { icon: Flame, name: "Passion", text: "We champion strong belief and purpose towards our cause." },
  { icon: Telescope, name: "Visionary", text: "We think beyond today and promote sustainable futures." },
  { icon: Users, name: "Inclusion", text: "We promote an environment for everyone to feel a sense of belonging and participate fully." },
  { icon: Mountain, name: "Resilience", text: "We challenge our experiences, including withstanding the most demanding encounters." },
];

const ways = [
  { title: "We co-create solutions", text: "We are not afraid to try new approaches, take risks and learn from communities which evidence-backed models to adopt and take to more people." },
  { title: "Local leadership and expertise", text: "Our programs and services are delivered by a visionary team with relevant experience in diverse contexts." },
  { title: "The power of collective action", text: "We work with local organizations to adopt our graduation models, and with governments and development partners to deliver services that transform individuals and communities." },
];

const partnerTypes = [
  { img: `${IMG}/gov.jpg`, icon: Landmark, title: "Governments", text: "We co-design and implement economic and digital inclusion programs at scale, drawing on our evidence and experience." },
  { img: `${IMG}/npo.jpg`, icon: Handshake, title: "Non-profit scaling partners", text: "We work with local and international non-profits that want to adopt our models and approaches, using existing infrastructure and local experience to reach scale." },
  { img: `${IMG}/IMG-24-1024x683.jpg`, icon: Building2, title: "Corporate investment partners", text: "We partner with private sector entities on leadership development, education and training, the digital divide, climate change and sustainable entrepreneurship." },
];

const digital = [
  { icon: Smartphone, tag: "Mobile app", title: "BizLearn", text: "An e-learning app that gives entrepreneurs expert guidance and resources through self-paced learning.", cta: "Contact us to learn more", href: `${SITE}/contact/` },
  { icon: MessageCircle, tag: "WhatsApp", title: "Kukolola chatbot", text: "A one-stop center for entrepreneurs in the agriculture sector, with actionable insights.", cta: "Chat on WhatsApp", href: "https://wa.me/265991331031" },
  { icon: Download, tag: "Document", title: "Digital Transformation Strategy", text: "Our commitment to providing equal access to information and services.", cta: "Download the one-pager", href: "https://emergelivelihoods.org/wp-content/uploads/2025/05/Digital-Transformation-Strategy-One-pager.pdf" },
];

function SectionHead({ pill, title, intro, center = false, light = false }: { pill: string; title: string; intro?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      <div className="inline-flex items-center px-4 py-1.5 rounded-md bg-[#4C808A] mb-4">
        <span className="text-white text-xs font-semibold tracking-widest uppercase">{pill}</span>
      </div>
      <h2 className={`${light ? "text-white" : "text-[#3B4167]"} ${center ? "mx-auto" : ""} max-w-3xl`} style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.25 }}>
        {title}
      </h2>
      {intro && <p className={`mt-3 text-sm leading-relaxed max-w-2xl ${center ? "mx-auto" : ""} ${light ? "text-white/70" : "text-[#6b7280]"}`}>{intro}</p>}
    </div>
  );
}

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-[1400px] mx-auto px-4 lg:px-8 ${className}`}>{children}</div>;
}

export function AboutPage({ onNavigate }: { onNavigate: (page: AboutNav) => void }) {
  return (
    <main id="about" className="bg-[#f8f9fb]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16" style={{ background: GRADIENT }}>
        <ImageWithFallback src={`${IMG}/IMG-91-1-scaled.jpg`} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(42,48,84,0.92) 0%, rgba(59,65,103,0.7) 60%, rgba(76,128,138,0.45) 100%)" }} />
        <Container className="relative z-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-white/70 text-sm mb-5">About Emerge Livelihoods</p>
            <h1 className="text-white" style={{ fontSize: "clamp(2rem, 4.6vw, 3.5rem)", fontWeight: 700, lineHeight: 1.15 }}>
              Amplifying the self-reliance of individuals and communities across Malawi and beyond.
            </h1>
            <p className="text-white/80 mt-6 leading-relaxed max-w-2xl" style={{ fontSize: "1rem" }}>
              Since 2017, Emerge Livelihoods has helped women, youth and children in rural and urban Malawi turn ideas into enterprises and enterprises into livelihoods. This platform is where that work meets you: learn, get mentored, join a program and track your progress in one place.
            </p>
            <div className="flex flex-wrap gap-3 mt-9">
              <button onClick={() => onNavigate("incubation")} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#4C808A] text-white font-bold border border-white hover:bg-[#3d6b74] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={{ fontSize: "0.875rem" }}>
                Explore programs <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#our-story" className="inline-flex items-center px-6 py-3 rounded-md bg-white/10 text-white font-semibold border border-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={{ fontSize: "0.875rem" }}>
                Read our story
              </a>
            </div>
          </div>
        </Container>
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" aria-hidden="true">
            <path d="M0 60L1440 60L1440 20C1200 60 720 0 0 40L0 60Z" fill="#f8f9fb" />
          </svg>
        </div>
      </section>

      {/* ── Vision & mission ─────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-md border border-[#3B4167]/15 p-8" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.08)" }}>
              <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-5"><Eye className="w-5 h-5 text-[#4C808A]" /></div>
              <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "1.25rem", fontWeight: 700 }}>What we envision</h2>
              <p className="text-[#3B4167] leading-relaxed" style={{ fontSize: "1.05rem" }}>
                Amplify the self-reliance of individuals and communities across Malawi and beyond.
              </p>
            </div>
            <div className="rounded-md p-8 text-white" style={{ background: GRADIENT }}>
              <div className="w-11 h-11 rounded-md bg-white/15 flex items-center justify-center mb-5"><Target className="w-5 h-5 text-white" /></div>
              <h2 className="text-white mb-3" style={{ fontSize: "1.25rem", fontWeight: 700 }}>What drives us</h2>
              <p className="leading-relaxed text-white/90" style={{ fontSize: "1.05rem" }}>
                Foster socio-economic growth for communities through transformative solutions that use technology and innovation and promote inclusivity and collaboration.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Our story ────────────────────────────────────────── */}
      <section id="our-story" className="py-16 lg:py-20 bg-white scroll-mt-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHead pill="Our story" title="From the Mzuzu E-Hub to a national movement for livelihoods" />
              <div className="space-y-4 text-sm text-[#3B4167]/80 leading-relaxed max-w-xl">
                <p>
                  Emerge Livelihoods was established in 2017 as the Mzuzu E-Hub. Through a climate-enterprising incubation approach and a digital inclusion program, it has delivered significant results in transforming livelihoods and communities and fostering self-reliance.
                </p>
                <p>
                  The need is large. Southern Africa has the second-highest extreme poverty rate on the continent, at 45.1%. Limited structural transformation of the Malawian economy, climate change and gender disparities have pushed poverty up and narrowed access to decent, full-time work, especially for young people.
                </p>
                <p>
                  Our answer is evidence-based: show how communities can become entrepreneurs and leaders who improve life for themselves and the environment around them. We believe challenges are best solved by individuals and communities who bring an entrepreneurial mindset to change, sustainability and climate adaptation.
                </p>
              </div>
              <a href={`${SITE}/our-story/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-[#4C808A] hover:text-[#3d6b74] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C808A]">
                Read the full story <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <ImageWithFallback src={`${IMG}/Picture2.jpg`} alt="Emerge Livelihoods participants and community members in Malawi" className="w-full h-auto rounded-md object-cover" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.15)" }} />
          </div>

          {/* Journey: 2017 → 2029 */}
          <ol className="mt-16 grid md:grid-cols-3 gap-8 md:gap-0 relative">
            <div className="hidden md:block absolute top-[11px] left-[16.6%] right-[16.6%] h-px bg-[#4C808A]/40" aria-hidden="true" />
            {[
              { year: "2017", text: "Established as the Mzuzu E-Hub, beginning our work in incubation and digital inclusion." },
              { year: "2024", text: "Strategic Plan 2024–2029 begins, extending our reach across Malawi." },
              { year: "2029", text: "Our goal: support 1 million people out of poverty across Malawi and parts of Southern Africa." },
            ].map((m, i) => (
              <li key={m.year} className="relative text-center px-4">
                <span className={`relative z-10 mx-auto block w-6 h-6 rounded-full border-4 border-white ${i === 2 ? "bg-[#3B4167]" : "bg-[#4C808A]"}`} style={{ boxShadow: "0 0 0 1px rgba(76,128,138,0.5)" }} />
                <div className="mt-4 text-[#3B4167]" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{m.year}</div>
                <p className="text-xs text-[#6b7280] leading-relaxed mt-1 max-w-[18rem] mx-auto">{m.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Impact ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-20" style={{ background: GRADIENT }}>
        <Container>
          <SectionHead pill="Our impact" title="Seven years of reaching women, youth and children" intro="Through local and national presence, in rural and urban communities, in person and online." center light />
          <dl className="flex flex-wrap justify-center gap-x-6 gap-y-8 text-center">
            {impact.map((s) => (
              <div key={s.label} className="px-4 flex flex-col-reverse justify-end items-center w-[calc(50%-0.75rem)] lg:w-[calc(20%-1.2rem)]">
                <dt className="text-white/75 text-xs mt-2 leading-snug">{s.label}</dt>
                <dd className="text-white" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, lineHeight: 1.1 }}>{s.value}</dd>
              </div>
            ))}
          </dl>
          <a href={`${SITE}/impact/`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 mt-10 text-sm font-bold text-white hover:text-white/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            See our model and its impact <ArrowRight className="w-4 h-4" />
          </a>
        </Container>
      </section>

      {/* ── What we do ───────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHead pill="What we do" title="Fostering socio-economic growth for communities" intro="Four areas of work, run through a graduation approach that equips people with equitable opportunities." />
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {focusAreas.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#4C808A]" /></div>
                <div>
                  <h3 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Initiatives ──────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <SectionHead pill="Our initiatives" title="Building a thriving ecosystem through diverse programs" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {initiatives.map(({ icon: Icon, title, text, nav }) => (
              <div key={title} className="rounded-md border border-[#3B4167]/15 p-6 flex flex-col bg-[#f8f9fb]">
                <Icon className="w-6 h-6 text-[#4C808A] mb-4" />
                <h3 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mt-2 flex-1">{text}</p>
                {nav && (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                    <button onClick={() => onNavigate("incubation")} className="text-xs font-bold text-[#4C808A] hover:text-[#3d6b74] focus-visible:outline-2 focus-visible:outline-[#4C808A]">Incubation</button>
                    <button onClick={() => onNavigate("acceleration")} className="text-xs font-bold text-[#4C808A] hover:text-[#3d6b74] focus-visible:outline-2 focus-visible:outline-[#4C808A]">Acceleration</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <div>
              <SectionHead pill="Our core values" title="What we stand for in everything we do" />
            </div>
            <ul className="grid sm:grid-cols-2 border-t border-[#3B4167]/15">
              {values.map(({ icon: Icon, name, text }, i) => (
                <li key={name} className={`py-6 border-b border-[#3B4167]/15 flex gap-4 ${i % 2 === 0 ? "sm:pr-8" : "sm:pl-8 sm:border-l"}`}>
                  <Icon className="w-5 h-5 text-[#4C808A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{name}</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed mt-1">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ── Who we work with ─────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <SectionHead
            pill="Who we serve"
            title="Children, youth, women, refugees and people with disabilities. All inclusive."
            intro="We work with livelihood and dynamic enterprises from idea to early stage. To close the gap in the missing middle, we accelerate high-growth enterprises and promote niche enterprises in sectors that support climate adaptation: agriculture, water and sanitation, tourism and energy."
          />
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {ways.map((w) => (
              <div key={w.title} className="border-t-2 border-[#4C808A] pt-4">
                <h3 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{w.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mt-2">{w.text}</p>
              </div>
            ))}
          </div>

          <h3 className="text-[#3B4167] mb-6" style={{ fontSize: "1.25rem", fontWeight: 700 }}>Why and how to collaborate with us</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {partnerTypes.map(({ img, icon: Icon, title, text }) => (
              <article key={title} className="rounded-md overflow-hidden border border-[#3B4167]/15 bg-white" style={{ boxShadow: "0 4px 24px rgba(59,65,103,0.08)" }}>
                <ImageWithFallback src={img} alt="" aria-hidden="true" className="w-full h-44 object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#4C808A]" />
                    <h4 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h4>
                  </div>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{text}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#3B4167]">
            Interested in joining the ecosystem?{" "}
            <a href={`${SITE}/contact/`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#4C808A] hover:text-[#3d6b74] underline underline-offset-2">Let's talk</a>
          </p>
        </Container>
      </section>

      {/* ── Digital solutions ────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHead pill="Our digital solutions" title="Technology that makes business support reachable" intro="With technology enablement partners, we deliver digital solutions that support cost-effective business development for diverse communities." />
          <div className="grid md:grid-cols-3 gap-6">
            {digital.map(({ icon: Icon, tag, title, text, cta, href }) => (
              <div key={title} className="rounded-md border border-[#3B4167]/15 bg-white p-6 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-3"><Icon className="w-4 h-4 text-[#4C808A]" />{tag}</div>
                <h3 className="text-[#3B4167]" style={{ fontSize: "1.05rem", fontWeight: 700 }}>{title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mt-2 flex-1">{text}</p>
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-[#4C808A] hover:text-[#3d6b74] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C808A]">
                  {cta} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── This platform ────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <SectionHead pill="This platform" title="Everything you need to start, grow and scale, in one place" intro="The Emerge Livelihoods platform brings our programs together so entrepreneurs, mentors and program managers can work from the same place." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: BookOpen, title: "Learn", text: "Self-paced courses, workshops and toolkits through the Learning Academy." },
              { icon: UserCheck, title: "Get mentored", text: "Be matched with a mentor, or apply to become one.", action: () => onNavigate("mentors"), label: "Explore mentorship" },
              { icon: Rocket, title: "Join a program", text: "Apply to incubation or acceleration and follow your cohort.", action: () => onNavigate("incubation"), label: "View programs" },
              { icon: Shield, title: "Track progress", text: "Follow your application and your venture's growth after you join." },
            ].map(({ icon: Icon, title, text, action, label }) => (
              <div key={title} className="rounded-md border border-[#3B4167]/15 p-6 bg-[#f8f9fb] flex flex-col">
                <Icon className="w-6 h-6 text-[#4C808A] mb-4" />
                <h3 className="text-[#3B4167]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mt-2 flex-1">{text}</p>
                {action && (
                  <button onClick={action} className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-[#4C808A] hover:text-[#3d6b74] self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C808A]">
                    {label} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Partners ─────────────────────────────────────────── */}
      {/* <Partners /> */}

      {/* ── Contact & CTA ────────────────────────────────────── */}
      <section className="py-16 lg:py-20" style={{ background: GRADIENT }}>
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div>
              <h2 className="text-white" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, lineHeight: 1.2 }}>
                Ready to be part of the story?
              </h2>
              <p className="text-white/75 text-sm leading-relaxed mt-4 max-w-md mx-auto">
                Whether you are an entrepreneur with an idea, a mentor with experience to share or a partner who wants to scale what works, there is a place for you here.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <button onClick={() => onNavigate("incubation")} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#4C808A] text-white font-bold border border-white hover:bg-[#3d6b74] transition-colors text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  Apply now
                </button>
                <button onClick={() => onNavigate("mentors")} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white/10 text-white font-semibold border border-white hover:bg-white/20 transition-colors text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  Become a mentor
                </button>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </main>
  );
}
