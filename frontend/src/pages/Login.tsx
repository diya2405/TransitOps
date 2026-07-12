import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/lib/pageAccess";

function IconTruck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default function Login() {
  const { signIn, register, bootstrapAvailable, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = useMemo(() => mode === "register" && bootstrapAvailable, [bootstrapAvailable, mode]);

  useEffect(() => {
    if (location.pathname === "/register" && bootstrapAvailable) {
      setMode("register");
    } else {
      setMode(bootstrapAvailable ? "register" : "login");
    }
  }, [bootstrapAvailable, location.pathname]);

  useEffect(() => {
    if (!authLoading && profile) {
      navigate(getDefaultRoute(profile.role), { replace: true });
    }
  }, [authLoading, navigate, profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = mode === "register"
        ? await register(name.trim(), email.trim(), password)
        : await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error);
      } else {
        navigate(getDefaultRoute(result.profile?.role), { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <IconTruck />
          </div>
          <span className="auth-brand-text">TransitOps</span>
        </div>

        {isRegister && (
          <div className="auth-pill">
            <span>First account setup</span>
          </div>
        )}

        <h1 className="auth-heading">{isRegister ? "Create Fleet Manager" : "Welcome back"}</h1>
        <p className="auth-subtext">
          {isRegister
            ? "This first account becomes the Fleet Manager and unlocks the rest of the platform."
            : "Sign in with the credentials provided by your Fleet Manager to access the system."}
        </p>

        {error && (
          <div className="auth-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">Full name</label>
              <div className="auth-input-wrapper">
                <input
  id="auth-name"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onFocus={(e) => (e.currentTarget.style.borderColor = "#222")}
  onBlur={(e) => (e.currentTarget.style.borderColor = "#444")}
  placeholder="e.g. Dhruv Patel"
  className="auth-input"
  required
  autoComplete="name"
  autoFocus
  style={{
    color: "#fff",
    border: "1px solid #444",
    background: "transparent",
  }}
/>
                <span className="auth-input-icon"><IconUser /></span>
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrapper">
              <input
  id="auth-email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onFocus={(e) => (e.currentTarget.style.borderColor = "#222")}
  onBlur={(e) => (e.currentTarget.style.borderColor = "#444")}
  placeholder="you@example.com"
  className="auth-input"
  required
  autoComplete="email"
  autoFocus={!isRegister}
  style={{
    color: "#fff",
    border: "1px solid #444",
    background: "transparent",
  }}
/>
              <span className="auth-input-icon"><IconMail /></span>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <div className="auth-input-wrapper">
              <input
  id="auth-password"
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onFocus={(e) => (e.currentTarget.style.borderColor = "#222")}
  onBlur={(e) => (e.currentTarget.style.borderColor = "#444")}
  placeholder={isRegister ? "Minimum 8 characters" : "Enter your password"}
  className="auth-input"
  required
  minLength={8}
  autoComplete={isRegister ? "new-password" : "current-password"}
  style={{
    color: "#fff",
    border: "1px solid #444",
    background: "transparent",
  }}
/>
              <span className="auth-input-icon"><IconLock /></span>
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? (isRegister ? "Creating account..." : "Signing in...") : isRegister ? "Create Fleet Manager" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          {isRegister
            ? "After this account is created, registration closes and only a Fleet Manager can create new users from Manage Users."
            : "If you are the Fleet Manager, use Manage Users in the app to create Driver, Safety Officer, or Financial Analyst accounts."}
        </p>
      </div>
    </div>
  );
}
