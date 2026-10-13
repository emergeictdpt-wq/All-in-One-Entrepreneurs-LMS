import { useState, useEffect, useCallback } from "react";
import type { AuthResult } from "../data/auth";
import type { Person } from "../data/directory";
import { DEMO_MODE, DEMO_PASSWORD } from "../data/auth";
import { Eye, EyeOff, Lightbulb, TrendingUp, Target, Rocket, BookOpen, Award, ChevronRight, Users } from "lucide-react";

const PHOTO_URL =
  "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtZW50b3IlMjBlbnRyZXByZW5ldXIlMjBjb2FjaGluZyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3ODM1MTI4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080";

const styles = `
@keyframes floatY {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-18px) rotate(5deg); }
}
@keyframes floatX {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  50% { transform: translateX(14px) rotate(-4deg); }
}
@keyframes floatDiag {
  0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0.18; }
  33% { transform: translate(10px,-12px) rotate(8deg); opacity: 0.28; }
  66% { transform: translate(-8px,8px) rotate(-5deg); opacity: 0.14; }
}
@keyframes pulse3d {
  0%, 100% { transform: scale(1); opacity: 0.15; }
  50% { transform: scale(1.12); opacity: 0.28; }
}
@keyframes orbitRing {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes orbitRingRev {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes shimmerLine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
@keyframes inputFocus {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76,128,138,0); }
  50% { box-shadow: 0 0 0 3px rgba(76,128,138,0.25); }
}
@keyframes nodePulse {
  0%, 100% { r: 4; opacity: 0.3; }
  50% { r: 7; opacity: 0.7; }
}
@keyframes drawLine {
  from { stroke-dashoffset: 200; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 0.25; }
}
@keyframes barGrow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes lockShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-3deg); }
  40% { transform: translateX(6px) rotate(3deg); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.mentor-login-animate { animation: fadeSlideUp 0.55s ease both; }
.mentor-login-animate-delay { animation: fadeSlideUp 0.55s ease 0.12s both; }
.mentor-img-animate { animation: slideRight 0.7s ease 0.1s both; }
.lock-shake { animation: lockShake 0.5s ease; }
`;

interface Props {
  onBack: () => void;
  onApplyMentor?: () => void;
  /** Checks email + password and the application status. Does not sign in; that happens after the verification step. */
  onAuthenticate?: (email: string, password: string) => Promise<AuthResult>;
  /** Called once the person has passed every step. */
  onSignIn?: (person: Person) => void;
}

type View = "login" | "forgot" | "mfa" | "success";

export function MentorLoginPage({ onBack, onApplyMentor, onAuthenticate, onSignIn }: Props) {
  const [authed, setAuthed] = useState<Person | null>(null);
  const [checking, setChecking] = useState(false);
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(60);
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [lockShake, setLockShake] = useState(false);

  useEffect(() => {
    if (!locked) return;
    setLockCountdown(60);
    const interval = setInterval(() => {
      setLockCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setLocked(false);
          setAttempts(0);
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || checking) return;
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }
    setChecking(true);
    const res = onAuthenticate ? await onAuthenticate(email, password) : null;
    setChecking(false);
    if (res?.ok) { setError(""); setAuthed(res.person); setView("mfa"); return; }
    setLockShake(true); setTimeout(() => setLockShake(false), 600);
    if (res && res.code !== "invalid") { setError(res.message); return; } // right password, not allowed in (yet)
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 5) { setLocked(true); setError("Too many failed attempts. Please wait before trying again."); }
    else setError(`Incorrect email or password. ${5 - next} attempt${5 - next !== 1 ? "s" : ""} remaining.`);
  };
  const finishSignIn = useCallback(() => { if (authed) onSignIn?.(authed); }, [authed, onSignIn]);

  const handleMfaChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...mfaCode];
    next[idx] = val;
    setMfaCode(next);
    if (val && idx < 5) {
      const el = document.getElementById(`mfa-${idx + 1}`);
      el?.focus();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif", background: "linear-gradient(135deg, #2a3054 0%, #3B4167 40%, #456f78 75%, #4C808A 100%)" }}>
      <style>{styles}</style>


      {/* LEFT PANEL — Login form */}
      <div className="relative flex flex-col justify-center w-full lg:w-[52%] px-6 py-10 lg:px-16 xl:px-20" style={{ zIndex: 10 }}>
        {/* Back button */}
        <button
          onClick={onBack}
          className="mentor-login-animate absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white text-xs font-semibold transition-colors"
        >
          Back to Mentor Portal
        </button>

        {/* Logo */}
        <div className="mentor-login-animate mb-8 mt-8">
          <img
            src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
            alt="Emerge Livelihoods"
            className="h-10 brightness-0 invert opacity-90"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Card */}
        <div
          className="mentor-login-animate-delay w-full max-w-md"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 3,
            padding: "36px 36px 32px",
          }}
        >
          {view === "login" && (
            <LoginView
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPwd={showPwd} setShowPwd={setShowPwd}
              rememberMe={rememberMe} setRememberMe={setRememberMe}
              error={error} setError={setError}
              locked={locked} lockCountdown={lockCountdown}
              lockShake={lockShake}
              onSubmit={handleSignIn}
              onForgot={() => { setError(""); setView("forgot"); }}
              onApplyMentor={onApplyMentor}
            />
          )}
          {view === "forgot" && (
            <ForgotView
              forgotEmail={forgotEmail} setForgotEmail={setForgotEmail}
              forgotSent={forgotSent} setForgotSent={setForgotSent}
              onBack={() => setView("login")}
            />
          )}
          {view === "mfa" && (
            <MFAView
              mfaCode={mfaCode}
              onChange={handleMfaChange}
              onVerify={() => setView("success")}
              onBack={() => setView("login")}
            />
          )}
          {view === "success" && <SuccessView onDashboard={finishSignIn} />}
        </div>

        {/* Social providers */}
        {view === "login" && (
          <div className="mentor-login-animate-delay mt-5 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span className="text-white/40 text-xs">or continue with</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Google", icon: "G", color: "#EA4335" },
                { label: "Microsoft", icon: "M", color: "#00A4EF" },
                { label: "LinkedIn", icon: "in", color: "#0A66C2" },
              ].map(({ label, icon, color }) => (
                <button
                  key={label}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-semibold text-white/80 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: color, fontSize: 10 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Photo background only, no quote/stats */}
      <div
        className="mentor-img-animate hidden lg:flex flex-col justify-end relative overflow-hidden"
        style={{
          width: "48%",
          clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)",
          zIndex: 5,
        }}
      >
        {/* Photo */}
        <img
          src={PHOTO_URL}
          alt="Mentor and entrepreneur"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center top" }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(59,65,103,0.75) 0%, rgba(76,128,138,0.45) 60%, rgba(0,0,0,0.15) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,36,66,0.9) 0%, transparent 55%)" }} />


        {/* Decorative corner hex badge */}
        <div
          className="absolute top-10 right-10 flex items-center justify-center"
          style={{
            width: 80, height: 92,
            background: "rgba(76,128,138,0.35)",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Users size={28} color="rgba(255,255,255,0.85)" />
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-views ---- */

function LoginView({
  email, setEmail, password, setPassword, showPwd, setShowPwd,
  rememberMe, setRememberMe, error, setError, locked, lockCountdown,
  lockShake, onSubmit, onForgot, onApplyMentor,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPwd: boolean; setShowPwd: (v: boolean) => void;
  rememberMe: boolean; setRememberMe: (v: boolean) => void;
  error: string; setError: (v: string) => void;
  locked: boolean; lockCountdown: number; lockShake: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onApplyMentor?: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1.5px solid rgba(76,128,138,0.35)",
    borderRadius: 3,
    padding: "12px 14px",
    fontSize: 13,
    color: "#2a3054",
    outline: "none",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl leading-tight mb-2">Welcome Back, Mentor!</h1>
        <p className="text-white/55 text-xs leading-relaxed">
          Sign in to manage your startups, schedule sessions and track entrepreneurial impact.
        </p>
      </div>

      {DEMO_MODE && (
        <p className="mb-4 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Demo build: sample mentors use the password <span className="font-mono text-white/70">{DEMO_PASSWORD}</span>, e.g. tiwonge.banda@example.com. Mentors who registered here sign in with the password they chose.
        </p>
      )}

      {/* Error */}
      {error && (
        <div className={`mb-4 p-3 rounded-md text-xs font-semibold ${lockShake ? "lock-shake" : ""}`}
          style={{ background: "rgba(232,84,84,0.15)", border: "1px solid rgba(232,84,84,0.35)", color: "#fca5a5" }}>
          {locked && <span className="font-bold">🔒 </span>}
          {error}
          {locked && <span className="ml-2 text-white/50">Unlocks in {lockCountdown}s</span>}
        </div>
      )}

      {/* Email */}
      <div className="mb-4">
        <label className="block text-white text-xs font-semibold mb-1.5">Email Address or Username *</label>
        <input
          type="text"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Enter your email address or username"
          style={inputStyle}
          disabled={locked}
          onFocus={(e) => { e.target.style.borderColor = "#4C808A"; e.target.style.boxShadow = "0 0 0 3px rgba(76,128,138,0.18)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(76,128,138,0.35)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block text-white/70 text-xs font-semibold mb-1.5">Password *</label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter your password"
            style={{ ...inputStyle, paddingRight: 44 }}
            disabled={locked}
            onFocus={(e) => { e.target.style.borderColor = "#4C808A"; e.target.style.boxShadow = "0 0 0 3px rgba(76,128,138,0.18)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(76,128,138,0.35)"; e.target.style.boxShadow = "none"; }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4C808A] hover:text-[#3B4167] transition-colors"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-md accent-[#4C808A]"
          />
          <span className="text-white/60 text-xs group-hover:text-white/80 transition-colors">Keep me signed in</span>
        </label>
        <button type="button" onClick={onForgot} className="text-xs font-semibold transition-colors" style={{ color: "#a8d5db" }}>
          Forgot password?
        </button>
      </div>

      {/* Sign In */}
      <button
        type="submit"
        disabled={locked}
        className="w-full font-bold text-sm py-3.5 rounded-md transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: locked ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg, #3B4167, #4C808A)",
          color: locked ? "rgba(255,255,255,0.35)" : "#fff",
          border: "none",
          cursor: locked ? "not-allowed" : "pointer",
          letterSpacing: "0.03em",
        }}
      >
        {locked ? `🔒 Account Locked (${lockCountdown}s)` : <>Sign In <ChevronRight size={15} /></>}
      </button>

      {/* Apply link */}
      <div className="mt-5 pt-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-white/45 text-xs mb-2">New to Mentoring?</p>
        <button
          type="button"
          onClick={onApplyMentor}
          className="text-xs font-bold transition-colors hover:opacity-90"
          style={{ color: "#a8d5db" }}
        >
          Apply to Become a Mentor
        </button>
      </div>
    </form>
  );
}

function ForgotView({
  forgotEmail, setForgotEmail, forgotSent, setForgotSent, onBack,
}: {
  forgotEmail: string; setForgotEmail: (v: string) => void;
  forgotSent: boolean; setForgotSent: (v: boolean) => void;
  onBack: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1.5px solid rgba(76,128,138,0.35)",
    borderRadius: 3,
    padding: "12px 14px",
    fontSize: 13,
    color: "#2a3054",
    outline: "none",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs mb-5 transition-colors">
        Back to Sign In
      </button>
      <h2 className="text-white font-bold text-xl mb-2">Reset Password</h2>
      <p className="text-white/50 text-xs mb-5 leading-relaxed">
        Enter the email address associated with your mentor account. We'll send you a link to reset your password.
      </p>
      {forgotSent ? (
        <div className="p-4 rounded-md text-center" style={{ background: "rgba(76,128,138,0.2)", border: "1px solid rgba(76,128,138,0.4)" }}>
          <div className="text-3xl mb-2">📬</div>
          <p className="text-white font-semibold text-sm">Reset link sent!</p>
          <p className="text-white/55 text-xs mt-1">Check your inbox at <span className="text-[#a8d5db]">{forgotEmail}</span></p>
          <button onClick={onBack} className="mt-4 text-xs font-bold text-[#a8d5db] hover:opacity-80 transition-opacity">
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-white/70 text-xs font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your registered email"
              style={inputStyle}
            />
          </div>
          <button
            onClick={() => forgotEmail && setForgotSent(true)}
            className="w-full font-bold text-sm py-3.5 rounded-md text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3B4167, #4C808A)" }}
          >
            Send Reset Link
          </button>
        </>
      )}
    </div>
  );
}

function MFAView({
  mfaCode, onChange, onVerify, onBack,
}: {
  mfaCode: string[];
  onChange: (idx: number, val: string) => void;
  onVerify: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs mb-5 transition-colors">
        Back
      </button>
      <h2 className="text-white font-bold text-xl mb-2">Two-Factor Authentication</h2>
      <p className="text-white/50 text-xs mb-6 leading-relaxed">Enter the 6-digit code from your authenticator app or SMS.</p>
      <div className="flex gap-2 justify-center mb-6">
        {mfaCode.map((digit, idx) => (
          <input
            key={idx}
            id={`mfa-${idx}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => onChange(idx, e.target.value)}
            className="w-10 h-12 text-center rounded-md font-bold text-lg"
            style={{ background: "#fff", border: "2px solid rgba(76,128,138,0.5)", color: "#2a3054", outline: "none", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}
          />
        ))}
      </div>
      <button
        onClick={onVerify}
        className="w-full font-bold text-sm py-3.5 rounded-md text-white hover:opacity-90 transition-all"
        style={{ background: "linear-gradient(135deg, #3B4167, #4C808A)" }}
      >
        Verify & Sign In
      </button>
    </div>
  );
}

function SuccessView({ onDashboard }: { onDashboard?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => { onDashboard?.(); }, 2000);
    return () => clearTimeout(t);
  }, [onDashboard]);
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "linear-gradient(135deg, #3B4167, #4C808A)" }}>
        <Award size={32} color="#fff" />
      </div>
      <h2 className="text-white font-bold text-xl mb-2">Welcome Back!</h2>
      <p className="text-white/55 text-xs leading-relaxed mb-5">
        You've successfully signed in. Loading your Mentor Dashboard...
      </p>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
        <div className="h-full rounded-md" style={{ background: "linear-gradient(90deg, #3B4167, #4C808A)", width: "100%", transition: "width 2s ease" }} />
      </div>
      <p className="text-white/30 text-xs mt-3">Redirecting to your dashboard...</p>
    </div>
  );
}
