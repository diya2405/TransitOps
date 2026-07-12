import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/lib/pageAccess";

export default function Login() {
  const { signIn, register, bootstrapAvailable } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(bootstrapAvailable ? "register" : "login");
  }, [bootstrapAvailable]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = mode === "register" ? await register(name, email, password) : await signIn(email, password);
    const { error, profile } = result;
    if (error) setError(error);
    else navigate(getDefaultRoute(profile?.role), { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl shadow-slate-950/40">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">TransitOps</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {bootstrapAvailable ? "Create the first Fleet Manager" : "Sign in to your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {bootstrapAvailable
              ? "Fresh database detected. This first account becomes the Fleet Manager and unlocks the rest of the auth flow."
              : "Registration is closed. Use the credentials created by the Fleet Manager."}
          </p>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {bootstrapAvailable && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            required
            minLength={8}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {bootstrapAvailable ? "Create Fleet Manager" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          {bootstrapAvailable
            ? "After this account is created, /register closes and only a Fleet Manager can create new users from the Manage Users screen."
            : "If you are the Fleet Manager, use Manage Users inside the app to create Driver, Safety Officer, or Financial Analyst accounts."}
        </p>
      </div>
    </div>
  );
}
