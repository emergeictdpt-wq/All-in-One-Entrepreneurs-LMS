import { useState, useEffect, useCallback } from "react";
import type { AuthResult } from "../data/auth";
import type { Person } from "../data/directory";
import { DEMO_MODE, DEMO_PASSWORD } from "../data/auth";
import { ArrowLeft, Award, Users } from "lucide-react";
import {
  AuthCard, AuthNote, AuthError, AuthLabel, AuthInput, AuthButton, AuthRememberRow, AuthFooter, AuthBack,
  AUTH_BRAND, AUTH_BRAND_DARK, AUTH_PAGE_BG, AUTH_FONT, authMuted,
} from "./AuthCard";

const PHOTO_URL =
  "/images/mentor-login.jpg";

const styles = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
.mentor-login-animate { animation: fadeSlideUp 0.55s ease both; }
.mentor-login-animate-delay { animation: fadeSlideUp 0.55s ease 0.12s both; }
.mentor-img-animate { animation: slideRight 0.7s ease 0.1s both; }
@media (prefers-reduced-motion: reduce) {
  .mentor-login-animate, .mentor-login-animate-delay, .mentor-img-animate { animation: none; }
}
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
    <div className="min-h-screen relative overflow-hidden flex" style={{ fontFamily: AUTH_FONT, background: AUTH_PAGE_BG }}>
      <style>{styles}</style>

      {/* LEFT PANEL: sign-in card */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-[52%] px-5 py-10 lg:px-12" style={{ zIndex: 10 }}>
        <button
          onClick={onBack}
          className="mentor-login-animate absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-white"
        >
          <ArrowLeft size={14} /> Back to Mentor Portal
        </button>

        <div className="mentor-login-animate-delay w-full flex justify-center mt-8">
          <AuthCard
            title={view === "login" ? "Welcome Back, Mentor!" : view === "forgot" ? "Reset Password" : view === "mfa" ? "Two-Factor Authentication" : "Welcome Back!"}
            subtitle={view === "login" ? "Sign in to manage your startups, schedule sessions and track entrepreneurial impact." : undefined}
          >
            {view === "login" && (
              <LoginView
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                rememberMe={rememberMe} setRememberMe={setRememberMe}
                error={error} setError={setError}
                locked={locked} lockCountdown={lockCountdown}
                lockShake={lockShake} checking={checking}
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
          </AuthCard>
        </div>
      </div>

      {/* RIGHT PANEL: photo */}
      <div
        className="mentor-img-animate hidden lg:flex flex-col justify-end relative overflow-hidden"
        style={{ width: "48%", clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)", zIndex: 5 }}
      >
        <img src={PHOTO_URL} alt="Mentor and entrepreneur" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center top" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(59,65,103,0.75) 0%, rgba(76,128,138,0.45) 60%, rgba(0,0,0,0.15) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,36,66,0.9) 0%, transparent 55%)" }} />
        <img
          src="https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png"
          alt="Emerge Livelihoods"
          className="absolute top-10 left-16 h-10 brightness-0 invert opacity-90"
          style={{ objectFit: "contain" }}
        />
        <div
          className="absolute top-10 right-10 flex items-center justify-center"
          style={{ width: 80, height: 92, background: "rgba(76,128,138,0.35)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <Users size={28} color="rgba(255,255,255,0.85)" />
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-views ---- */

function LoginView({
  email, setEmail, password, setPassword,
  rememberMe, setRememberMe, error, setError, locked, lockCountdown,
  lockShake, checking, onSubmit, onForgot, onApplyMentor,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  rememberMe: boolean; setRememberMe: (v: boolean) => void;
  error: string; setError: (v: string) => void;
  locked: boolean; lockCountdown: number; lockShake: boolean; checking: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onApplyMentor?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Demo build note (temporarily disabled)
      {DEMO_MODE && (
        <AuthNote>
          Demo build: sample mentors use the password <code style={{ background: "#eef0f6", borderRadius: 4, padding: "1px 6px", color: "#1b2036" }}>{DEMO_PASSWORD}</code>, e.g. tiwonge.banda@example.com. Mentors who registered here sign in with the password they chose.
        </AuthNote>
      )}
      */}

      {error && (
        <AuthError shake={lockShake} extra={locked ? <span className="shrink-0">Unlocks in {lockCountdown}s</span> : undefined}>
          {error}
        </AuthError>
      )}

      <div style={{ marginBottom: 18 }}>
        <AuthLabel htmlFor="mentor-email" required>Email Address or Username</AuthLabel>
        <AuthInput
          id="mentor-email" icon="mail" type="text" autoComplete="username"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Enter your email address or username" disabled={locked}
        />
      </div>

      <div>
        <AuthLabel htmlFor="mentor-password" required>Password</AuthLabel>
        <AuthInput
          id="mentor-password" icon="lock" reveal autoComplete="current-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
          placeholder="Enter your password" disabled={locked}
        />
      </div>

      <AuthRememberRow checked={rememberMe} onChange={setRememberMe} onForgot={onForgot} />

      <AuthButton type="submit" disabled={locked || checking} loading={checking} arrow={!locked}>
        {locked ? `Account locked (${lockCountdown}s)` : "Sign In"}
      </AuthButton>

      <AuthFooter prompt="New to Mentoring?" actionLabel="Apply to Become a Mentor" onAction={onApplyMentor} />
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
  return (
    <div>
      <AuthBack onClick={onBack}>Back to Sign In</AuthBack>
      {forgotSent ? (
        <div className="text-center">
          <p style={{ fontWeight: 700, fontSize: 18, color: "#1b2036" }}>Reset link sent</p>
          <p style={{ color: authMuted, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Check your inbox at <span style={{ color: AUTH_BRAND_DARK, fontWeight: 700 }}>{forgotEmail}</span>
          </p>
        </div>
      ) : (
        <>
          <AuthNote>Enter the email address associated with your mentor account. We'll send you a link to reset your password.</AuthNote>
          <div style={{ marginBottom: 18 }}>
            <AuthLabel htmlFor="mentor-forgot-email">Email Address</AuthLabel>
            <AuthInput id="mentor-forgot-email" icon="mail" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your registered email" />
          </div>
          <AuthButton type="button" arrow={false} onClick={() => forgotEmail && setForgotSent(true)}>Send Reset Link</AuthButton>
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
      <AuthBack onClick={onBack}>Back</AuthBack>
      <AuthNote>Enter the 6-digit code from your authenticator app or SMS.</AuthNote>
      <div className="flex gap-2 justify-center" style={{ marginBottom: 22 }}>
        {mfaCode.map((digit, idx) => (
          <input
            key={idx}
            id={`mfa-${idx}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${idx + 1}`}
            value={digit}
            onChange={(e) => onChange(idx, e.target.value)}
            className="ac-input text-center"
            style={{ width: 44, height: 52, borderRadius: 3, fontSize: 20, fontWeight: 700, fontFamily: AUTH_FONT }}
          />
        ))}
      </div>
      <AuthButton type="button" onClick={onVerify}>Verify & Sign In</AuthButton>
    </div>
  );
}

function SuccessView({ onDashboard }: { onDashboard?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => { onDashboard?.(); }, 2000);
    return () => clearTimeout(t);
  }, [onDashboard]);
  return (
    <div className="text-center py-2">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: AUTH_BRAND }}>
        <Award size={32} color="#fff" />
      </div>
      <p style={{ color: authMuted, fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
        You've successfully signed in. Loading your Mentor Dashboard...
      </p>
      <div className="w-full overflow-hidden" style={{ height: 6, borderRadius: 6, background: "#e3e7f0" }}>
        <div style={{ height: "100%", background: AUTH_BRAND, width: "100%", transition: "width 2s ease" }} />
      </div>
    </div>
  );
}
