import { useState, useEffect } from "react";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle,
  Shield, HelpCircle, BookOpen, Phone, ChevronLeft, RefreshCw,
  TrendingUp, Users, Zap, Star, BarChart2, Globe
} from "lucide-react";

const PHOTO_URL =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxlbnRyZXByZW5ldXJzJTIwd29ya2luZyUyMHN0YXJ0dXAlMjB0ZWFtJTIwY29sbGFib3JhdGlvbiUyMG9mZmljZXxlbnwxfHx8fDE3ODM1MTM4NDR8MA&ixlib=rb-4.1.0&q=80&w=1080";

const css = `
@keyframes lp-fadeIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lp-slideLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes lp-lockShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px) rotate(-2deg); }
  40% { transform: translateX(5px) rotate(2deg); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
@keyframes lp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes lp-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes lp-dash {
  to { stroke-dashoffset: 0; }
}
@keyframes lp-lineDraw {
  from { stroke-dashoffset: 300; }
  to { stroke-dashoffset: 0; }
}
@keyframes lp-nodePulse {
  0%,100% { r: 4; opacity: 1; }
  50% { r: 6.5; opacity: 0.7; }
}
@keyframes lp-gaugeArc {
  from { stroke-dashoffset: 220; }
  to { stroke-dashoffset: 52; }
}
@keyframes lp-mileDot {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.5); }
}
@keyframes lp-barRise {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes lp-counterUp {
  from { opacity:0; transform:translateY(6px); }
  to { opacity:1; transform:translateY(0); }
}
.lp-fade { animation: lp-fadeIn 0.5s ease both; }
.lp-slide { animation: lp-slideLeft 0.65s ease both; }
.lp-shake { animation: lp-lockShake 0.5s ease; }
.lp-spin { animation: lp-spin 1s linear infinite; }
`;

type LoginView = "login" | "forgot" | "mfa" | "success";

import type { AuthResult, ManagerAuthResult } from "../data/auth";
import { SEED_MANAGERS } from "../data/managers";
import { DEMO_MODE, DEMO_PASSWORD } from "../data/auth";

export function LoginPage({ onBack, onNavigate, onEntrepreneurLogin, onManagerLogin }: {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  /** Checks the credentials and, when they are good, signs the person in and opens their portal. */
  onEntrepreneurLogin?: (email: string, password: string) => Promise<AuthResult>;
  /** Same for programme managers; on success App opens the Program Managers page for that manager. */
  onManagerLogin?: (email: string, password: string) => Promise<ManagerAuthResult>;
}) {
  const [view, setView] = useState<LoginView>("login");
  const [role, setRole] = useState<"entrepreneur" | "manager">("entrepreneur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
  const [mfaError, setMfaError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isLocked = attempts >= 5 && countdown > 0;

  const handleSignIn = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (isLocked) return;
    setError(""); setLoading(true);
    const res: { ok: boolean; code?: string; message?: string } | null =
      role === "manager" ? (onManagerLogin ? await onManagerLogin(email, password) : null) : (onEntrepreneurLogin ? await onEntrepreneurLogin(email, password) : null);
    setLoading(false);
    if (res?.ok) return; // App has signed them in and opened their portal
    setShake(true); setTimeout(() => setShake(false), 600);
    if (res && res.code && res.code !== "invalid") { setError(res.message ?? "Sign-in is not available for this account."); return; } // right password, but not allowed in (yet): not a failed attempt
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 5) {
      setCountdown(60);
      setError("Account temporarily locked after 5 failed attempts. Try again in 60 seconds.");
    } else {
      setError(`Incorrect email or password. ${5 - next} attempt${5 - next !== 1 ? "s" : ""} remaining.`);
    }
  };

  const handleMfaInput = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...mfaCode]; next[i] = val;
    setMfaCode(next);
    if (val && i < 5) (document.getElementById(`mfa-${i + 1}`) as HTMLInputElement)?.focus();
  };

  const handleMfaSubmit = () => {
    if (mfaCode.join("").length < 6) { setMfaError("Enter the full 6-digit code."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setView("success"); }, 1200);
  };

  const handleReset = () => {
    if (!resetEmail) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setResetSent(true); }, 1200);
  };

  return (
    <>
      <style>{css}</style>

      <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>

        {/* ── LEFT — Hero photo panel ── */}
        <div
          className="lp-slide hidden lg:flex flex-col relative overflow-hidden"
          style={{
            width: "58%",
            clipPath: "polygon(0% 0%, 93% 0%, 100% 100%, 0% 100%)",
          }}
        >
          {/* Photo */}
          <img
            src={PHOTO_URL}
            alt="Entrepreneurs at work"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center center" }}
          />

          {/* Layered overlay: dark at top/bottom, partial on left, clear center */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(30,36,66,0.82) 0%, rgba(30,36,66,0.25) 30%, rgba(30,36,66,0.15) 60%, rgba(30,36,66,0.88) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(59,65,103,0.6) 0%, rgba(59,65,103,0.1) 45%, transparent 70%)" }} />

          {/* TOP: Logo + back */}
          <div className="relative z-10 p-8 flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <div className="w-px h-4 bg-white/20" />
            <img
              src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods"
              className="h-8 brightness-0 invert"
            />
          </div>


          <div className="relative z-10 mt-auto" />
        </div>

        {/* ── RIGHT — Login form panel ── */}
        <div
          className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-10 xl:px-14 relative"
          style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}
        >

          {/* Mobile top bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <button onClick={onBack} className="flex items-center gap-2 text-white/55 text-xs font-semibold">
              <ChevronLeft size={14} /> Back
            </button>
            <img src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
              alt="Emerge Livelihoods" className="h-6 brightness-0 invert" />
          </div>

          <div className="relative w-full max-w-sm mx-auto">

            {/* ── LOGIN VIEW ── */}
            {view === "login" && (
              <div className="lp-fade">
                {/* Header */}
                <div className="mb-7">
                  <h1 className="text-white font-bold leading-tight mb-2" style={{ fontSize: "1.6rem" }}>Welcome Back</h1>
                  <p className="text-white text-xs leading-relaxed">Sign in to access your entrepreneur or programme manager dashboard.</p>
                </div>

                {/* Role selector */}
                <div className="flex p-1 rounded-md mb-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {(["entrepreneur", "manager"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setError(""); setAttempts(0); setCountdown(0); }}
                      className="flex-1 py-2 rounded-md text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
                      style={{
                        background: role === r ? "rgba(76,128,138,0.5)" : "transparent",
                        color: role === r ? "#fff" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {r === "manager" && (
                        <span
                          aria-hidden="true"
                          className="inline-block shrink-0"
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: "currentColor",
                            WebkitMask: "url('/icons/referral.png') center / contain no-repeat",
                            mask: "url('/icons/referral.png') center / contain no-repeat",
                          }}
                        />
                      )}
                      {r === "entrepreneur" ? "Entrepreneur" : "Program Manager"}
                    </button>
                  ))}
                </div>

                {/* Form card */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    borderRadius: 3,
                    padding: "26px 26px 22px",
                    marginBottom: 14,
                  }}
                >
                  {/* Error */}
                  {error && (
                    <div className={`mb-4 flex items-start gap-2.5 px-3 py-2.5 rounded-md text-xs ${shake ? "lp-shake" : ""}`}
                      style={{ background: "rgba(220,50,50,0.12)", border: "1px solid rgba(220,50,50,0.28)", color: "#ffaaaa" }}>
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span className="flex-1">{error}</span>
                      {isLocked && countdown > 0 && <span className="font-bold shrink-0" style={{ color: "#ff8888" }}>{countdown}s</span>}
                    </div>
                  )}

                  {DEMO_MODE && role === "manager" && (
                    <p className="mb-4 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Demo build: managers use the password <span className="font-mono text-white/70">{DEMO_PASSWORD}</span>. Try {SEED_MANAGERS.map(m => m.email).join(", ")}. Each sees only the programs they champion in Incubation Management.
                    </p>
                  )}
                  {DEMO_MODE && role === "entrepreneur" && (
                    <p className="mb-4 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Demo build: sample accounts use the password <span className="font-mono text-white/70">{DEMO_PASSWORD}</span>, e.g. chisomo.banda@gmail.com (paired) or madalitso.chiumia@example.com (waiting to be matched). Anyone who applied here signs in with the password they chose.
                    </p>
                  )}

                  {/* Email */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-white/55 text-[10px] font-bold uppercase tracking-wider">
                        Email / Username <span style={{ color: "#4C808A" }}>*</span>
                      </label>
                    </div>
                    <div className="relative group">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#4C808A" }} />
                      <input
                        type="text" value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="your email"
                        disabled={isLocked}
                        className="w-full pl-9 pr-3 py-2.5 rounded-md text-xs placeholder:text-gray-400 focus:outline-none disabled:opacity-40 transition-all"
                        style={{ background: "#fff", color: "#2a3054", border: "1.5px solid rgba(76,128,138,0.3)", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}
                        onFocus={(e) => { e.target.style.borderColor = "#4C808A"; e.target.style.boxShadow = "0 0 0 3px rgba(76,128,138,0.15)"; e.target.style.color = "#2a3054"; }}
                        onBlur={(e) => { e.target.style.borderColor = "rgba(76,128,138,0.3)"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-white/55 text-[10px] font-bold uppercase tracking-wider">
                        Password <span style={{ color: "#4C808A" }}>*</span>
                      </label>
                      <button
                        onClick={() => setView("forgot")}
                        className="text-[10px] font-semibold transition-colors"
                        style={{ color: "#a8d5db" }}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4C808A" }} />
                      <input
                        type={showPass ? "text" : "password"} value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        placeholder="Enter your password"
                        disabled={isLocked}
                        className="w-full pl-9 pr-10 py-2.5 rounded-md text-xs placeholder:text-gray-400 focus:outline-none disabled:opacity-40 transition-all"
                        style={{ background: "#fff", color: "#2a3054", border: "1.5px solid rgba(76,128,138,0.3)", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}
                        onFocus={(e) => { e.target.style.borderColor = "#4C808A"; e.target.style.boxShadow = "0 0 0 3px rgba(76,128,138,0.15)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "rgba(76,128,138,0.3)"; e.target.style.boxShadow = "none"; }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "#4C808A" }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember + attempt dots */}
                  <div className="flex items-center justify-between mb-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-[#4C808A]" />
                      <span className="text-white/45 text-[10px]">Keep me signed in</span>
                    </label>
                    {attempts > 0 && !isLocked && (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < attempts ? "#e85454" : "rgba(255,255,255,0.15)" }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sign In button */}
                  <button
                    onClick={handleSignIn}
                    disabled={isLocked || loading}
                    className="w-full py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: isLocked ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg, #3B4167, #4C808A)", color: "white" }}
                  >
                    {loading ? <RefreshCw size={15} className="lp-spin" /> : isLocked
                      ? <><Lock size={14} /> Locked ({countdown}s)</>
                      : <>Sign In <ArrowRight size={15} /></>}
                  </button>
                </div>

                {/* Social providers */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <span className="text-white text-[10px]">or continue with</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Google", color: "#EA4335", letter: "G" },
                      { label: "Microsoft", color: "#00A4EF", letter: "M" },
                      { label: "LinkedIn", color: "#0A66C2", letter: "in" },
                    ].map(({ label, color, letter }) => (
                      <button key={label}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-bold text-white/65 hover:text-white transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black" style={{ background: color, fontSize: 8 }}>{letter}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Register CTA */}
                <div className="text-center pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-white text-[10px] mb-1.5">New to the platform?</p>
                  <button
                    onClick={() => onNavigate?.("incubation-apply")}
                    className="text-[10px] font-bold transition-colors hover:opacity-80"
                    style={{ color: "#a8d5db" }}>
                    Register as an Entrepreneur
                  </button>
                </div>

              </div>
            )}

            {/* ── FORGOT VIEW ── */}
            {view === "forgot" && (
              <div className="lp-fade">
                <button onClick={() => { setView("login"); setResetSent(false); setResetEmail(""); }}
                  className="flex items-center gap-1.5 text-white/45 hover:text-white text-xs mb-5 transition-colors">
                  <ChevronLeft size={13} /> Back to Sign In
                </button>
                <div className="w-11 h-11 rounded-md flex items-center justify-center mb-4" style={{ background: "rgba(76,128,138,0.3)" }}>
                  <Lock size={18} color="#fff" />
                </div>
                <h2 className="text-white font-bold text-xl mb-1">Reset Password</h2>
                <p className="text-white/40 text-xs mb-5 leading-relaxed">Enter your registered email. We'll send a secure reset link within minutes.</p>
                {!resetSent ? (
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3, padding: "22px" }}>
                    <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative mb-4">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-md text-xs focus:outline-none"
                        style={{ background: "#fff", color: "#2a3054", border: "1.5px solid rgba(76,128,138,0.3)", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}
                        onFocus={(e) => { e.target.style.borderColor = "#4C808A"; e.target.style.boxShadow = "0 0 0 3px rgba(76,128,138,0.15)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "rgba(76,128,138,0.3)"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                    <button onClick={handleReset} disabled={loading || !resetEmail}
                      className="w-full py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{ background: "linear-gradient(90deg, #3B4167, #4C808A)", color: "white" }}>
                      {loading ? <RefreshCw size={14} className="lp-spin" /> : <><Mail size={14} /> Send Reset Link</>}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(76,128,138,0.25)" }}>
                      <CheckCircle size={28} color="#fff" />
                    </div>
                    <p className="text-white font-bold mb-1">Check Your Email</p>
                    <p className="text-white/40 text-xs leading-relaxed mb-4">Reset link sent to <span style={{ color: "#a8d5db" }}>{resetEmail}</span></p>
                    <button onClick={() => { setView("login"); setResetSent(false); setResetEmail(""); }}
                      className="text-xs font-bold px-4 py-2 rounded-md text-white hover:text-white/80 transition-colors"
                      style={{}}>
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── MFA VIEW ── */}
            {view === "mfa" && (
              <div className="lp-fade text-center">
                <div className="w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(76,128,138,0.3)", border: "1px solid rgba(76,128,138,0.4)" }}>
                  <Shield size={24} color="#4C808A" />
                </div>
                <h2 className="text-white font-bold text-xl mb-1">Two-Factor Verification</h2>
                <p className="text-white/40 text-xs mb-6 leading-relaxed">Enter the 6-digit code from your authenticator app or SMS.</p>
                <div className="flex gap-2 justify-center mb-5">
                  {mfaCode.map((digit, i) => (
                    <input key={i} id={`mfa-${i}`} type="text" maxLength={1} value={digit}
                      onChange={(e) => handleMfaInput(i, e.target.value)}
                      className="w-10 h-12 text-center font-bold text-base rounded-md focus:outline-none"
                      style={{ background: "#fff", border: digit ? "2px solid #4C808A" : "2px solid rgba(76,128,138,0.3)", color: "#2a3054", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4C808A")}
                      onBlur={(e) => !e.currentTarget.value && (e.currentTarget.style.borderColor = "rgba(76,128,138,0.3)")} />
                  ))}
                </div>
                {mfaError && <p className="text-red-300 text-xs mb-3">{mfaError}</p>}
                <button onClick={handleMfaSubmit} disabled={loading}
                  className="w-full py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 mb-3"
                  style={{ background: "linear-gradient(90deg, #3B4167, #4C808A)", color: "white" }}>
                  {loading ? <RefreshCw size={14} className="lp-spin" /> : <>Verify Code <ArrowRight size={14} /></>}
                </button>
                <button className="text-white/35 hover:text-white/65 text-xs font-semibold transition-colors">Resend Code</button>
              </div>
            )}

            {/* ── SUCCESS VIEW ── */}
            {view === "success" && (
              <div className="lp-fade text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, padding: "36px 28px" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(76,128,138,0.3)", border: "2px solid rgba(76,128,138,0.5)" }}>
                  <CheckCircle size={32} color="#4C808A" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">Login Successful!</h2>
                <p className="text-white/45 text-xs mb-5">Redirecting to your dashboard...</p>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-md" style={{ background: "linear-gradient(90deg, #3B4167, #4C808A)", width: "75%" }} />
                </div>
                <div className="space-y-2 text-left">
                  {["Credentials verified", "Account status confirmed", "Role permissions loaded", "Redirecting..."].map((s, i) => (
                    <div key={s} className="flex items-center gap-2 text-xs" style={{ color: i < 3 ? "rgba(76,128,138,0.9)" : "rgba(255,255,255,0.4)" }}>
                      <CheckCircle size={12} className="shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
