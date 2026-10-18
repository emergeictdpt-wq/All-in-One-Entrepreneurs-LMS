import { useState, useEffect } from "react";
import { ChevronLeft, Shield, Check } from "lucide-react";
import {
  AuthCard, AuthNote, AuthError, AuthLabel, AuthInput, AuthButton, AuthRememberRow, AuthFooter, AuthBack,
  AUTH_BRAND, AUTH_BRAND_DARK, AUTH_PAGE_BG, AUTH_FONT, authMuted, authInk,
} from "./AuthCard";

const PHOTO_URL =
  "/images/entrepreneur-login.jpg";

const css = `
@keyframes lp-fadeIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lp-slideLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
.lp-fade { animation: lp-fadeIn 0.5s ease both; }
.lp-slide { animation: lp-slideLeft 0.65s ease both; }
@media (prefers-reduced-motion: reduce) { .lp-fade, .lp-slide { animation: none; } }
`;

import type { AuthResult, ManagerAuthResult } from "../data/auth";
import { SEED_MANAGERS } from "../data/managers";
import { DEMO_MODE, DEMO_PASSWORD } from "../data/auth";

type LoginView = "login" | "forgot" | "mfa" | "success";


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

  const isManager = role === "manager";
  const code = (t: string) => <code style={{ background: "#eef0f6", borderRadius: 4, padding: "1px 6px", color: authInk }}>{t}</code>;
  const logo = "https://www.emergelivelihoods.org/wp-content/uploads/2024/11/cropped-livelihoods-Logo.png";

  return (
    <>
      <style>{css}</style>

      <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: AUTH_FONT, background: AUTH_PAGE_BG }}>

        {/* LEFT: hero photo */}
        <div
          className="lp-slide hidden lg:flex flex-col relative overflow-hidden"
          style={{ width: "58%", clipPath: "polygon(0% 0%, 93% 0%, 100% 100%, 0% 100%)" }}
        >
          <img src={PHOTO_URL} alt="Entrepreneurs at work" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center center" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(30,36,66,0.82) 0%, rgba(30,36,66,0.25) 30%, rgba(30,36,66,0.15) 60%, rgba(30,36,66,0.88) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(59,65,103,0.6) 0%, rgba(59,65,103,0.1) 45%, transparent 70%)" }} />
          <div className="relative z-10 p-8 flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-semibold transition-colors">
              <ChevronLeft size={14} /> Back
            </button>
            <div className="w-px h-4 bg-white/20" />
            <img src={logo} alt="Emerge Livelihoods" className="h-8 brightness-0 invert" />
          </div>
        </div>

        {/* RIGHT: sign-in card */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 lg:px-10">

          {/* Mobile top bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden w-full max-w-[440px]">
            <button onClick={onBack} className="ac-link flex items-center gap-1 text-xs">
              <ChevronLeft size={14} /> Back
            </button>
            <img src={logo} alt="Emerge Livelihoods" className="h-6" />
          </div>

          <div className="lp-fade w-full flex justify-center" key={view}>
            {view === "login" && (
              <AuthCard
                centered
                title={isManager ? "Welcome Back, Program Manager!" : "Welcome Back, Entrepreneur!"}
                subtitle={isManager
                  ? "Sign in to manage your programs, review applications and track cohort progress."
                  : "Sign in to track your progress, meet your mentor and grow your business."}
              >
                <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} noValidate>
                  {/* Role selector */}
                  <div role="group" aria-label="Sign in as" className="flex p-1 gap-1" style={{ background: "#f1f3f9", border: "1px solid #d6dae6", borderRadius: 3, marginBottom: 20 }}>
                    {(["entrepreneur", "manager"] as const).map((r) => (
                      <button
                        key={r} type="button" aria-pressed={role === r}
                        onClick={() => { setRole(r); setError(""); setAttempts(0); setCountdown(0); }}
                        className="ac-tab flex-1 inline-flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                          padding: "9px 8px", borderRadius: 3, fontSize: 14, fontWeight: 700,
                          background: role === r ? AUTH_BRAND : "transparent",
                          color: role === r ? "#fff" : authMuted,
                        }}
                      >
                        {r === "manager" && (
                          <span
                            aria-hidden="true"
                            className="inline-block shrink-0"
                            style={{
                              width: 16, height: 16, backgroundColor: "currentColor",
                              WebkitMask: "url('/icons/referral.png') center / contain no-repeat",
                              mask: "url('/icons/referral.png') center / contain no-repeat",
                            }}
                          />
                        )}
                        {r === "entrepreneur" ? "Entrepreneur" : "Program Manager"}
                      </button>
                    ))}
                  </div>

                  {/* Demo build notes (temporarily disabled)
                  {DEMO_MODE && isManager && (
                    <AuthNote>
                      Demo build: managers use the password {code(DEMO_PASSWORD)}. Try {SEED_MANAGERS.map(m => m.email).join(", ")}. Each sees only the programs they champion in Incubation Management.
                    </AuthNote>
                  )}
                  {DEMO_MODE && !isManager && (
                    <AuthNote>
                      Demo build: sample accounts use the password {code(DEMO_PASSWORD)}, e.g. chisomo.banda@gmail.com (paired) or madalitso.chiumia@example.com (waiting to be matched). Anyone who applied here signs in with the password they chose.
                    </AuthNote>
                  )}
                  */}

                  {error && (
                    <AuthError shake={shake} extra={isLocked && countdown > 0 ? <span className="shrink-0 font-bold">{countdown}s</span> : undefined}>
                      {error}
                    </AuthError>
                  )}

                  <div style={{ marginBottom: 18 }}>
                    <AuthLabel htmlFor="lp-email" required>Email Address or Username</AuthLabel>
                    <AuthInput
                      id="lp-email" icon="mail" type="text" autoComplete="username"
                      value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="your email" disabled={isLocked}
                    />
                  </div>

                  <div>
                    <AuthLabel htmlFor="lp-password" required>Password</AuthLabel>
                    <AuthInput
                      id="lp-password" icon="lock" reveal autoComplete="current-password"
                      value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Enter your password" disabled={isLocked}
                    />
                  </div>

                  <AuthRememberRow checked={remember} onChange={setRemember} onForgot={() => setView("forgot")} />

                  {attempts > 0 && !isLocked && (
                    <div className="flex gap-1.5 justify-center" style={{ marginBottom: 14 }} aria-label={`${attempts} of 5 attempts used`}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="rounded-full" style={{ width: 8, height: 8, background: i < attempts ? "#d64545" : "#d6dae6" }} />
                      ))}
                    </div>
                  )}

                  <AuthButton type="submit" disabled={isLocked || loading} loading={loading} arrow={!isLocked}>
                    {isLocked ? `Locked (${countdown}s)` : "Sign In"}
                  </AuthButton>

                  <AuthFooter
                    prompt="New to the platform?"
                    actionLabel="Register as an Entrepreneur"
                    onAction={() => onNavigate?.("incubation-apply")}
                  />
                </form>
              </AuthCard>
            )}

            {view === "forgot" && (
              <AuthCard title="Reset Password">
                <AuthBack onClick={() => { setView("login"); setResetSent(false); setResetEmail(""); }}>Back to Sign In</AuthBack>
                {!resetSent ? (
                  <>
                    <AuthNote>Enter your registered email. We'll send a secure reset link within minutes.</AuthNote>
                    <div style={{ marginBottom: 18 }}>
                      <AuthLabel htmlFor="lp-reset-email">Email Address</AuthLabel>
                      <AuthInput id="lp-reset-email" icon="mail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="your@email.com" />
                    </div>
                    <AuthButton type="button" arrow={false} onClick={handleReset} disabled={loading || !resetEmail} loading={loading}>Send Reset Link</AuthButton>
                  </>
                ) : (
                  <div className="text-center">
                    <Check size={40} style={{ color: AUTH_BRAND, margin: "0 auto 12px" }} />
                    <p style={{ fontWeight: 700, fontSize: 18, color: authInk }}>Check Your Email</p>
                    <p style={{ color: authMuted, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
                      Reset link sent to <span style={{ color: AUTH_BRAND_DARK, fontWeight: 700 }}>{resetEmail}</span>
                    </p>
                  </div>
                )}
              </AuthCard>
            )}

            {view === "mfa" && (
              <AuthCard title="Two-Factor Verification">
                <div className="text-center">
                  <Shield size={36} style={{ color: AUTH_BRAND, margin: "0 auto 12px" }} />
                  <AuthNote>Enter the 6-digit code from your authenticator app or SMS.</AuthNote>
                  <div className="flex gap-2 justify-center" style={{ marginBottom: 18 }}>
                    {mfaCode.map((digit, i) => (
                      <input key={i} id={`mfa-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} aria-label={`Digit ${i + 1}`}
                        onChange={(e) => handleMfaInput(i, e.target.value)}
                        className="ac-input text-center"
                        style={{ width: 44, height: 52, borderRadius: 3, fontSize: 20, fontWeight: 700, fontFamily: AUTH_FONT }} />
                    ))}
                  </div>
                  {mfaError && <AuthError>{mfaError}</AuthError>}
                  <AuthButton type="button" onClick={handleMfaSubmit} disabled={loading} loading={loading}>Verify Code</AuthButton>
                  <button type="button" className="ac-link" style={{ fontSize: 14, marginTop: 16 }}>Resend Code</button>
                </div>
              </AuthCard>
            )}

            {view === "success" && (
              <AuthCard title="Login Successful!" subtitle="Redirecting to your dashboard...">
                <div className="w-full overflow-hidden" style={{ height: 6, borderRadius: 6, background: "#e3e7f0", marginBottom: 18 }}>
                  <div style={{ height: "100%", background: AUTH_BRAND, width: "75%" }} />
                </div>
                <div className="space-y-2">
                  {["Credentials verified", "Account status confirmed", "Role permissions loaded", "Redirecting..."].map((s, i) => (
                    <div key={s} className="flex items-center gap-2" style={{ fontSize: 14, color: i < 3 ? AUTH_BRAND_DARK : authMuted }}>
                      <Check size={15} className="shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              </AuthCard>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
