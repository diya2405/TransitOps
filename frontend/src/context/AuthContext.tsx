import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, hasToken, setToken } from "@/lib/apiClient";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  bootstrapAvailable: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile?: Profile }>;
  register: (name: string, email: string, password: string) => Promise<{ error: string | null; profile?: Profile }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);

  useEffect(() => {
    async function loadAuthState() {
      try {
        const status = await api.get("/api/auth/status");
        setBootstrapAvailable(Boolean(status.registration_open));

        if (hasToken()) {
          const session = await api.get("/api/auth/me");
          setProfile(session.profile);
        } else {
          setToken(null);
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAuthState();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await api.post("/api/auth/login", { email, password });
      setToken(data.token);
      setProfile(data.profile);
      return { error: null, profile: data.profile };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Login failed." };
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const data = await api.post("/api/auth/register", { name, email, password });
      setToken(data.token);
      setProfile(data.profile);
      setBootstrapAvailable(false);
      return { error: null, profile: data.profile };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Registration failed." };
    }
  }

  function signOut() {
    setToken(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ profile, loading, bootstrapAvailable, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
