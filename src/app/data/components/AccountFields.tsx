import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { hasAccount, isEmail, passwordProblem, type AccountRole } from "../data/auth";

/** What is wrong with the account part of a sign-up form ("" = fine). Someone who already has an account keeps their password. */
export function accountProblem(role: AccountRole, email: string, password: string, confirm: string) {
  if (!isEmail(email)) return "Enter a valid email address. It is how you will sign in.";
  if (hasAccount(role, email)) return "";
  return passwordProblem(password) || (password !== confirm ? "The two passwords do not match." : "");
}

type Props = { role: AccountRole; email: string; password: string; confirm: string; onChange: (v: { password: string; confirm: string }) => void; variant: "light" | "dark" };

/** Two grid cells: password + confirm. Renders a short note instead when this email already has an account. */
export function AccountFields({ role, email, password, confirm, onChange, variant }: Props) {
  const [show, setShow] = useState(false);
  const dark = variant === "dark";
  const NAVY = "#3B4167";
  const input = dark
    ? "w-full bg-[#0f1528] border border-white/20 rounded-md px-3 py-2.5 pr-9 text-white text-xs focus:outline-none focus:border-[#4C808A] placeholder-white/30"
    : "w-full bg-[#f8f9fb] border border-[#3B4167]/15 rounded-md px-3 py-2.5 pr-9 text-[#3B4167] text-xs focus:outline-none focus:border-[#4C808A] placeholder-[#6b7280]";
  const label = (t: string) => dark
    ? <label className="block text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-1.5">{t}<span className="text-[#4C808A] ml-1">*</span></label>
    : <label className="block text-xs font-semibold mb-1.5" style={{ color: NAVY }}>{t} <span className="text-red-500">*</span></label>;
  const problem = password || confirm ? passwordProblem(password) || (password !== confirm && confirm ? "The two passwords do not match." : "") : "";

  if (isEmail(email) && hasAccount(role, email))
    return <div className="md:col-span-2 text-xs rounded-md px-3 py-2.5" style={{ background: dark ? "rgba(76,128,138,0.15)" : "#eef5f6", color: dark ? "rgba(255,255,255,0.8)" : NAVY }}>
      An account already exists for this email, so you will keep signing in with your existing password.
    </div>;

  const field = (t: string, value: string, set: (v: string) => void, ph: string) => (
    <div>
      {label(t)}
      <div className="relative">
        <input type={show ? "text" : "password"} autoComplete="new-password" className={input} value={value} placeholder={ph} onChange={e => set(e.target.value)} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Hide passwords" : "Show passwords"} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: dark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
  return (
    <>
      {field("Create a password", password, v => onChange({ password: v, confirm }), "At least 8 characters, with a number")}
      {field("Confirm password", confirm, v => onChange({ password, confirm: v }), "Repeat your password")}
      <p className="md:col-span-2 text-[11px]" style={{ color: problem ? "#ef4444" : dark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
        {problem || "You will use your email and this password to sign in once your application has been accepted."}
      </p>
    </>
  );
}
