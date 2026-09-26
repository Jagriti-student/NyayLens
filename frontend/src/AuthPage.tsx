import { useState, type FormEvent } from "react";
import { ArrowRight, Scale, ShieldCheck } from "lucide-react";
import { logIn, signUp, type AuthUser } from "./auth";

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const user = mode === "signup"
        ? await signUp(fullName, email, password)
        : await logIn(email, password);
      onAuthenticated(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: "signup" | "login") => {
    setMode(nextMode);
    setError("");
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark"><Scale size={18} /></span>
          <span>nyay<span>lens</span></span>
        </div>
        <p className="eyebrow">PRIVATE DOCUMENT WORKSPACE</p>
        <h1 id="auth-title">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-subtitle">{mode === "signup" ? "Sign up to open your NyayLens workspace." : "Log in to continue to your NyayLens workspace."}</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "selected" : ""} onClick={() => switchMode("signup")}>Sign Up</button>
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "selected" : ""} onClick={() => switchMode("login")}>Login</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>Full Name<input autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
          )}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {mode === "signup" && (
            <label>Confirm Password<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Login"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-storage-note"><ShieldCheck size={15} /> Demo authentication is stored on this browser only.</p>
      </section>
    </main>
  );
}
