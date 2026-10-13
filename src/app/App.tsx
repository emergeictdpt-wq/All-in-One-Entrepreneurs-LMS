import { useState, useEffect } from "react";
import { authenticate, authenticateManager, registerCredential } from "./data/auth";
import { SEED_MANAGERS, managerById, programsFor, withSeedOwners, type Manager } from "./data/managers";
import { DirectoryProvider, buildPeople, type Person } from "./data/directory";
import { loadOverrides } from "./data/applicationTracker";
import { MOCK_ENT_APPS, MOCK_MNT_APPS } from "./components/IncubationManagementPage";
import { Toaster, toast } from "sonner";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Programs } from "./components/Programs";
import { MentorshipSection } from "./components/MentorshipSection";
import { AlumniNetwork } from "./components/AlumniNetwork";
import { EntrepreneurJourney } from "./components/EntrepreneurJourney";
import { StartupToolkit } from "./components/StartupToolkit";
import { Partners } from "./components/Partners";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { IncubationPage } from "./components/IncubationPage";
import { AccelerationPage } from "./components/AccelerationPage";
import { IncubationApplicationForm } from "./components/IncubationApplicationForm";
import { AccelerationApplicationForm } from "./components/AccelerationApplicationForm";
import { MentorsLandingPage } from "./components/MentorsLandingPage";
import { MentorRegistrationForm } from "./components/MentorRegistrationForm";
import { ApplicationTrackerPage } from "./components/ApplicationTrackerPage";
import { LoginPage } from "./components/LoginPage";
import { MentorLoginPage } from "./components/MentorLoginPage";
import { ProgramManagersPage } from "./components/ProgramManagersPage";
import { IncubationManagementPage } from "./components/IncubationManagementPage";
import { MenteeDashboard } from "./components/MenteeDashboard";
import { MentorDashboard } from "./components/MentorDashboard";
import type { AdminProgram, EntrepreneurApplication, MentorApplication } from "./types";
import { legacyPrograms } from "./data/legacyPrograms";
import { ProgrammeDataProvider, useProgramme } from "./data/programmeStore";

type Page = "track" | "home" | "incubation" | "acceleration" | "incubation-apply" | "acceleration-apply" | "mentors" | "mentor-register" | "login" | "mentor-login" | "program-managers" | "incubation-management" | "mentee-dashboard" | "mentor-dashboard";

const PAGE_KEY = "emerge.page"; // per browser tab, so each tab keeps its own page and user across refresh
const PAGES: Page[] = ["track", "home", "incubation", "acceleration", "incubation-apply", "acceleration-apply", "mentors", "mentor-register", "login", "mentor-login", "program-managers", "incubation-management", "mentee-dashboard", "mentor-dashboard"];

const PROGRAMS_KEY = "emerge.programs.v1";   // programmes created in Program Setup (shared by all tabs)
const MENTOR_APPS_KEY = "emerge.mentorApplications.v1";
const APPS_KEY = "emerge.applications.v1";  // incubation applications (kept so programName and the rest survive a refresh)
const APPLY_KEY = "emerge.applyTo";          // which programme the applicant clicked "Apply" on (per tab)

const MANAGER_KEY = "emerge.manager.v1";

function loadPrograms(): AdminProgram[] {
  try {
    const raw = localStorage.getItem(PROGRAMS_KEY);
    if (!raw) return withSeedOwners(legacyPrograms);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? withSeedOwners(parsed as AdminProgram[]) : withSeedOwners(legacyPrograms);
  } catch { return withSeedOwners(legacyPrograms); }
}

function loadApplications(): EntrepreneurApplication[] {
  try {
    const v = JSON.parse(localStorage.getItem(APPS_KEY) ?? "[]");
    return Array.isArray(v) ? (v as EntrepreneurApplication[]) : [];
  } catch { return []; }
}

function AppInner() {
  const programme = useProgramme();
  const [page, setPageState] = useState<Page>(() => {
    try {
      const p = sessionStorage.getItem(PAGE_KEY) as Page | null;
      if (!p || !PAGES.includes(p)) return "home";
      // A dashboard is only restored if this tab still has a matching signed-in user
      if (p === "mentee-dashboard" && programme.currentUser?.role !== "mentee") return "home";
      if (p === "mentor-dashboard" && programme.currentUser?.role !== "mentor") return "home";
      return p;
    } catch { return "home"; }
  });
  const setPage = (p: Page) => { setPageState(p); try { sessionStorage.setItem(PAGE_KEY, p); } catch { /* ignore */ } };
  const [adminPrograms, setAdminPrograms] = useState<AdminProgram[]>(loadPrograms);
  // The signed-in programme manager (per browser tab, so two tabs can be two different managers)
  const [manager, setManagerState] = useState<Manager | null>(() => {
    try { return managerById(sessionStorage.getItem(MANAGER_KEY)) ?? null; } catch { return null; }
  });
  const setManager = (m: Manager | null) => {
    setManagerState(m);
    try { m ? sessionStorage.setItem(MANAGER_KEY, m.id) : sessionStorage.removeItem(MANAGER_KEY); } catch { /* ignore */ }
  };
  const [applyTo, setApplyToState] = useState<{ id: string; name: string } | null>(() => {
    try { const r = sessionStorage.getItem(APPLY_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const setApplyTo = (v: { id: string; name: string } | null) => {
    setApplyToState(v);
    try { v ? sessionStorage.setItem(APPLY_KEY, JSON.stringify(v)) : sessionStorage.removeItem(APPLY_KEY); } catch { /* ignore */ }
  };

  // Save programmes so a refresh no longer wipes what was created in Program Setup
  useEffect(() => {
    try { localStorage.setItem(PROGRAMS_KEY, JSON.stringify(adminPrograms)); }
    catch { toast.error("Could not save programmes in this browser (storage full or blocked). Changes will be lost on refresh."); }
  }, [adminPrograms]);
  // Keep other open tabs (e.g. the public site while an admin edits) in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROGRAMS_KEY || !e.newValue) return;
      try { const v = JSON.parse(e.newValue); if (Array.isArray(v)) setAdminPrograms(v); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const [incubationApplications, setIncubationApplications] = useState<EntrepreneurApplication[]>(loadApplications);
  useEffect(() => {
    try { localStorage.setItem(APPS_KEY, JSON.stringify(incubationApplications)); }
    catch { toast.error("Could not save applications in this browser (storage full or blocked)."); }
  }, [incubationApplications]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== APPS_KEY || !e.newValue) return;
      try { const v = JSON.parse(e.newValue); if (Array.isArray(v)) setIncubationApplications(v); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const [mentorApplications, setMentorApplications] = useState<MentorApplication[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(MENTOR_APPS_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(MENTOR_APPS_KEY, JSON.stringify(mentorApplications)); }
    catch { toast.error("Could not save mentor applications in this browser (storage full or blocked)."); }
  }, [mentorApplications]);
  const activeCount = adminPrograms.filter(p => p.published).length;

  const navigate = (p: Page) => {
    if (p !== "incubation-apply") setApplyTo(null); // a stale programme must not leak into a later generic apply
    // Leaving for a public/login page signs the person out. Signing in happens only through the login pages (see below).
    if (p === "login" || p === "mentor-login" || p === "home") { programme.signIn(null); setManager(null); }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Projects live on the admin page; the store needs them so pairs and cohorts can belong to one.
  useEffect(() => {
    programme.registerProjects(adminPrograms.map(p => ({ id: p.id, name: p.name })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPrograms]);

  // ── Sign-in ──────────────────────────────────────────────────────────────────────────────
  const peopleNow = () => buildPeople({ entApps: [...MOCK_ENT_APPS, ...incubationApplications], mntApps: [...MOCK_MNT_APPS, ...mentorApplications], overrides: loadOverrides() });
  const enter = (role: "mentee" | "mentor", person: Person) => {
    programme.signIn({ role, id: person.id, name: person.name });
    setPage(role === "mentee" ? "mentee-dashboard" : "mentor-dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const loginEntrepreneur = async (email: string, password: string) => {
    const res = await authenticate("mentee", email, password, peopleNow().mentees);
    if (res.ok) enter("mentee", res.person);
    return res;
  };
  const checkMentor = (email: string, password: string) => authenticate("mentor", email, password, peopleNow().mentors);

  const loginManager = async (email: string, password: string) => {
    const res = await authenticateManager(email, password, SEED_MANAGERS);
    if (res.ok) { setManager(res.manager); setPage("program-managers"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    return res;
  };

  // A program belongs to the manager who creates it (more managers can share it later). Editing never changes who champions it.
  const handleCreateProgram = (p: AdminProgram) => {
    setAdminPrograms(prev => [...prev, { ...p, managerIds: manager ? [manager.id] : p.managerIds }]);
  };

  const handleUpdateProgram = (p: AdminProgram) => {
    setAdminPrograms(prev => prev.map(x => x.id === p.id ? { ...p, managerIds: x.managerIds } : x));
  };

  const handleDeleteProgram = (id: string) => {
    setAdminPrograms(prev => prev.map(x => x.id === id ? { ...x, published: false } : x));
  };

  /** Programs that nobody champions yet (created before manager accounts existed) can be taken on by any manager. */
  const handleClaimProgram = (id: string) => {
    if (!manager) return;
    setAdminPrograms(prev => prev.map(x => (x.id === id && (!x.managerIds || x.managerIds.length === 0) ? { ...x, managerIds: [manager.id] } : x)));
    toast.success("You now champion this project");
  };

  if (page === "track") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <ApplicationTrackerPage onBack={() => navigate("home")} />
      </div>
    );
  }

  if (page === "mentors") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <MentorsLandingPage onBack={() => navigate("home")} onApplyMentor={() => navigate("mentor-register")} onMentorLogin={() => navigate("mentor-login")} />
      </div>
    );
  }

  if (page === "mentor-register") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <MentorRegistrationForm
          onBack={() => navigate("mentors")}
          onNavigateHome={() => navigate("home")}
          onSubmitMentorApplication={(app, password) => { setMentorApplications(prev => [...prev, app]); if (app.email) void registerCredential("mentor", app.email, app.id, password); }}
        />
      </div>
    );
  }

  if (page === "login") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <LoginPage onBack={() => navigate("home")} onNavigate={(p) => navigate(p as Page)} onEntrepreneurLogin={loginEntrepreneur} onManagerLogin={loginManager} />
      </div>
    );
  }

  // A dashboard only renders for a signed-in person of that role; otherwise it is the login page.
  if (page === "mentee-dashboard" || page === "mentor-dashboard") {
    const role = page === "mentee-dashboard" ? "mentee" : "mentor";
    if (programme.currentUser?.role !== role) { setTimeout(() => navigate(role === "mentee" ? "login" : "mentor-login"), 0); return null; }
    return (
      <DirectoryProvider entApps={[...MOCK_ENT_APPS, ...incubationApplications]} mntApps={[...MOCK_MNT_APPS, ...mentorApplications]}>
        <Toaster richColors position="top-right" />
        {role === "mentee" ? <MenteeDashboard onSignOut={() => navigate("login")} /> : <MentorDashboard onSignOut={() => navigate("mentor-login")} />}
      </DirectoryProvider>
    );
  }

  // Both manager pages need a signed-in programme manager; otherwise it is the login page.
  if ((page === "program-managers" || page === "incubation-management") && !manager) {
    setTimeout(() => navigate("login"), 0);
    return null;
  }

  if (page === "program-managers") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <ProgramManagersPage onBack={() => navigate("login")} onSignOut={() => navigate("login")} onNavigate={navigate}
          manager={manager} programs={adminPrograms} onClaimProgram={handleClaimProgram} />
      </div>
    );
  }

  if (page === "incubation-management") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <IncubationManagementPage
          onBack={() => navigate("program-managers")}
          manager={manager}
          adminPrograms={programsFor(adminPrograms, manager?.id)}
          onCreateProgram={handleCreateProgram}
          onUpdateProgram={handleUpdateProgram}
          onDeleteProgram={handleDeleteProgram}
          liveApplications={incubationApplications}
          liveMentorApplications={mentorApplications}
        />
      </div>
    );
  }

  if (page === "mentor-login") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <MentorLoginPage onBack={() => navigate("mentors")} onApplyMentor={() => navigate("mentor-register")} onAuthenticate={checkMentor} onSignIn={person => enter("mentor", person)} />
      </div>
    );
  }

  if (page === "incubation") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <Navbar onNavigate={navigate} onLogin={() => navigate("login")} onMentorLogin={() => navigate("mentor-login")} onTrack={() => navigate("track")} />
        <IncubationPage
          onBack={() => navigate("home")}
          onApply={(id, name) => { setApplyTo({ id, name }); navigate("incubation-apply"); }}
          onLogin={() => navigate("login")}
          extraPrograms={adminPrograms.filter(p => p.published)}
          activeCount={activeCount}
        />
        <Footer />
      </div>
    );
  }

  if (page === "incubation-apply") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <IncubationApplicationForm
          onBack={() => navigate("incubation")}
          programId={applyTo?.id}
          programName={applyTo?.name}
          onSubmitApplication={(app, password) => { setIncubationApplications(prev => [...prev, app]); if (app.email) void registerCredential("mentee", app.email, app.id, password); }}
        />
      </div>
    );
  }

  if (page === "acceleration") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <Navbar onNavigate={navigate} onLogin={() => navigate("login")} onMentorLogin={() => navigate("mentor-login")} onTrack={() => navigate("track")} />
        <AccelerationPage onBack={() => navigate("home")} onApply={() => navigate("acceleration-apply")} onLogin={() => navigate("login")} />
        <Footer />
      </div>
    );
  }

  if (page === "acceleration-apply") {
    return (
      <div style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <Toaster richColors position="top-right" />
        <AccelerationApplicationForm onBack={() => navigate("acceleration")} onSubmitApplication={(app, password) => { setIncubationApplications(prev => [...prev, app]); if (app.email) void registerCredential("mentee", app.email, app.id, password); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
      <Toaster richColors position="top-right" />
      <Navbar onNavigate={navigate} onLogin={() => navigate("login")} onMentorLogin={() => navigate("mentor-login")} onTrack={() => navigate("track")} />
      <Hero />
      <Programs onNavigateIncubation={() => navigate("incubation")} onNavigateAcceleration={() => navigate("acceleration")} />
      <MentorshipSection onBecomeMentor={() => navigate("mentors")} />
      <AlumniNetwork />
      <EntrepreneurJourney />
      <StartupToolkit />
      <Partners />
      <Testimonials />
      <FAQ />
      <FinalCTA onApply={() => { document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" }); }} />
      <Footer />
    </div>
  );
}


export default function App() {
  return (
    <ProgrammeDataProvider>
      <AppInner />
    </ProgrammeDataProvider>
  );
}
