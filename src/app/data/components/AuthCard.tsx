import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Eye, EyeOff, Lock, Mail, ChevronRight, AlertCircle } from "lucide-react";

/**
 * Shared look for every sign-in screen (mentors, entrepreneurs, program managers):
 * a white card with a solid brand band on top, light inset fields with leading icons,
 * a solid brand Sign In button and a row of social providers.
 */
export const AUTH_BRAND = "#4c808a";
export const AUTH_BRAND_DARK = "#3b6a73"; // links and secondary emphasis on white
export const AUTH_PAGE_BG = "linear-gradient(135deg, rgb(42, 48, 84) 0%, rgb(59, 65, 103) 40%, rgb(69, 111, 120) 75%, rgb(76, 128, 138) 100%)";
const INK = "#1b2036";
const MUTED = "#5b6378";
const FIELD_BG = "#f1f3f9";
const FIELD_BORDER = "#8f98b0";
export const AUTH_FONT = "'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif";

const css = `
.ac-card { font-family: ${AUTH_FONT}; }
.ac-input { background: ${FIELD_BG}; border: 1px solid ${FIELD_BORDER}; color: ${INK}; transition: border-color .15s, box-shadow .15s; }
.ac-input::placeholder { color: #7b839a; }
.ac-input:focus { outline: none; border-color: ${AUTH_BRAND}; box-shadow: 0 0 0 3px rgba(76,128,138,.25); }
.ac-input:disabled { opacity: .55; cursor: not-allowed; }
.ac-primary { background: ${AUTH_BRAND}; color: #fff; transition: background .15s, transform .1s; }
.ac-primary:hover:not(:disabled) { background: #43727b; }
.ac-primary:active:not(:disabled) { transform: scale(.985); }
.ac-primary:focus-visible, .ac-social:focus-visible, .ac-link:focus-visible, .ac-tab:focus-visible { outline: 3px solid rgba(76,128,138,.45); outline-offset: 2px; }
.ac-primary:disabled { background: #b9c3c8; color: #fff; cursor: not-allowed; }
.ac-social { background: #fff; border: 1px solid #cfd4e2; color: ${INK}; transition: background .15s, border-color .15s; }
.ac-social:hover { background: ${FIELD_BG}; border-color: ${FIELD_BORDER}; }
.ac-link { color: ${AUTH_BRAND_DARK}; font-weight: 700; }
.ac-link:hover { text-decoration: underline; }
@keyframes ac-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes ac-spin { to { transform: rotate(360deg); } }
.ac-shake { animation: ac-shake .5s ease; }
.ac-spin { animation: ac-spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .ac-shake, .ac-spin { animation: none; } }
`;

export function AuthCard({ title, subtitle, children, centered }: { title: string; subtitle?: string; children: ReactNode; centered?: boolean }) {
  return (
    <div className="ac-card w-full max-w-[440px] overflow-hidden bg-white" style={{ borderRadius: 3, boxShadow: "0 18px 50px rgba(42,48,84,.18)" }}>
      <style>{css}</style>
      <div style={{ background: AUTH_BRAND, padding: "30px 32px 26px", textAlign: centered ? "center" : undefined }}>
        <h1 className="text-white" style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h1>
        {subtitle && <p style={{ color: "rgba(255,255,255,.92)", fontSize: 15, lineHeight: 1.45, marginTop: 10 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "26px 32px 30px", color: INK }}>{children}</div>
    </div>
  );
}

export function AuthNote({ children }: { children: ReactNode }) {
  return <p style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.55, marginBottom: 18 }}>{children}</p>;
}

export function AuthError({ children, shake, extra }: { children: ReactNode; shake?: boolean; extra?: ReactNode }) {
  return (
    <div role="alert" className={`flex items-start gap-2.5 ${shake ? "ac-shake" : ""}`}
      style={{ background: "#fdecec", border: "1px solid #f3b5b5", color: "#9b1c1c", borderRadius: 3, padding: "10px 12px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
      <AlertCircle size={16} className="shrink-0" style={{ marginTop: 1 }} />
      <span className="flex-1">{children}</span>
      {extra}
    </div>
  );
}

export function AuthLabel({ htmlFor, children, required }: { htmlFor?: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block" style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>
      {children}{required && " *"}
    </label>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "style"> & { icon?: "mail" | "lock"; reveal?: boolean };

/** Inset field with a leading icon; `reveal` adds the show/hide eye for passwords. */
export const AuthInput = forwardRef<HTMLInputElement, FieldProps>(function AuthInput({ icon, reveal, type = "text", ...rest }, ref) {
  const [shown, setShown] = useState(false);
  const Icon = icon === "lock" ? Lock : Mail;
  return (
    <div className="relative">
      {icon && <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: AUTH_BRAND_DARK }} />}
      <input
        ref={ref}
        {...rest}
        type={reveal ? (shown ? "text" : "password") : type}
        className="ac-input w-full"
        style={{ borderRadius: 3, padding: `13px ${reveal ? 46 : 14}px 13px ${icon ? 44 : 14}px`, fontSize: 15, fontFamily: AUTH_FONT }}
      />
      {reveal && (
        <button type="button" onClick={() => setShown(s => !s)} aria-label={shown ? "Hide password" : "Show password"}
          className="ac-link absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: AUTH_BRAND_DARK }}>
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
});

export function AuthButton({ children, arrow = true, loading, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { arrow?: boolean; loading?: boolean }) {
  return (
    <button {...rest} className="ac-primary w-full flex items-center justify-center gap-1.5"
      style={{ borderRadius: 3, padding: "14px 16px", fontSize: 16, fontWeight: 700, fontFamily: AUTH_FONT }}>
      {loading ? <span className="ac-spin inline-block rounded-full" style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff" }} aria-label="Working" /> : <>{children}{arrow && <ChevronRight size={18} />}</>}
    </button>
  );
}

export function AuthTextButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...rest} className="ac-link" style={{ fontSize: 14 }}>{children}</button>;
}

export function AuthRememberRow({ checked, onChange, onForgot }: { checked: boolean; onChange: (v: boolean) => void; onForgot: () => void }) {
  return (
    <div className="flex items-center justify-between" style={{ margin: "14px 0 20px" }}>
      <label className="flex items-center gap-2.5 cursor-pointer" style={{ fontSize: 14, color: MUTED }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: AUTH_BRAND }} />
        Keep me signed in
      </label>
      <AuthTextButton onClick={onForgot}>Forgot password?</AuthTextButton>
    </div>
  );
}

/** "New here?" prompt, divider and the three social providers. */
export function AuthFooter({ prompt, actionLabel, onAction }: { prompt: string; actionLabel: string; onAction?: () => void }) {
  return (
    <>
      <div className="text-center" style={{ marginTop: 20 }}>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 6 }}>{prompt}</p>
        <AuthTextButton onClick={onAction}>{actionLabel}</AuthTextButton>
      </div>
      {/* Social sign-in (temporarily disabled)
      <div className="flex items-center gap-3" style={{ margin: "22px 0 16px" }}>
        <div className="flex-1" style={{ height: 1, background: "#d6dae6" }} />
        <span style={{ color: MUTED, fontSize: 13 }}>or continue with</span>
        <div className="flex-1" style={{ height: 1, background: "#d6dae6" }} />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Google", mark: "G", color: "#d93025" },
          { label: "Microsoft", mark: "M", color: "#0b73c9" },
          { label: "LinkedIn", mark: "in", color: "#0a66c2" },
        ].map(({ label, mark, color }) => (
          <button key={label} type="button" className="ac-social flex items-center justify-center gap-2"
            style={{ borderRadius: 3, padding: "11px 6px", fontSize: 14, fontWeight: 600 }}>
            <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full text-white shrink-0" style={{ width: 22, height: 22, background: color, fontSize: 11, fontWeight: 800 }}>{mark}</span>
            {label}
          </button>
        ))}
      </div>
      */}
    </>
  );
}

/** Back link used at the top of the forgot-password and verification steps. */
export function AuthBack({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className="ac-link" style={{ fontSize: 14, marginBottom: 18, display: "inline-block" }}>{children}</button>;
}

export const authInk = INK;
export const authMuted = MUTED;
