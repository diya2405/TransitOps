import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import type { UserAccount, UserRole } from "@/types";

/* ── Role configuration ─────────────────────────────────────── */
const ROLE_OPTIONS: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: "fleet_manager",
    label: "Fleet Manager",
    description: "Full system access — vehicles, drivers, maintenance, reports & user management",
    color: "#818cf8",
  },
  {
    value: "dispatcher",
    label: "Dispatcher",
    description: "Create, dispatch & complete trips; manage fuel logs & expenses",
    color: "#34d399",
  },
  {
    value: "driver",
    label: "Driver",
    description: "View trips, dispatch, complete with odometer & fuel entries",
    color: "#60a5fa",
  },
  {
    value: "safety_officer",
    label: "Safety Officer",
    description: "Monitor drivers, license expiry, safety scores; can suspend & cancel trips",
    color: "#fbbf24",
  },
  {
    value: "financial_analyst",
    label: "Financial Analyst",
    description: "Review fuel & expenses, generate reports, export CSV / ROI data",
    color: "#c084fc",
  },
];

const ROLE_DISPLAY: Record<UserRole, { label: string; bg: string; text: string }> = {
  fleet_manager:     { label: "Fleet Manager",      bg: "rgba(99,102,241,0.12)",  text: "#a5b4fc" },
  dispatcher:        { label: "Dispatcher",          bg: "rgba(34,197,94,0.12)",   text: "#86efac" },
  driver:            { label: "Driver",              bg: "rgba(59,130,246,0.12)",  text: "#93c5fd" },
  safety_officer:    { label: "Safety Officer",      bg: "rgba(245,158,11,0.12)",  text: "#fcd34d" },
  financial_analyst: { label: "Financial Analyst",   bg: "rgba(168,85,247,0.12)",  text: "#c4b5fd" },
};

/* ── Inline SVG icons ───────────────────────────────────────── */
function IconUserPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}


export default function UsersPage() {
  const { profile } = useAuth();
  const allowed = can(profile?.role, "users:write");

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("dispatcher");

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    api
      .get("/api/users")
      .then((data) => setUsers(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => setLoading(false));
  }, [allowed]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await api.post("/api/users", {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormRole("dispatcher");
      setSuccess("User account created successfully.");

      const refreshed = await api.get("/api/users");
      setUsers(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Not authorized ─────────────────────────────────────────── */
  if (!allowed) {
    return (
      <div className="p-8">
        <div
          style={{
            maxWidth: 440,
            margin: "3rem auto",
            textAlign: "center",
            padding: "2.5rem",
            borderRadius: "1.25rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ marginBottom: "1rem", color: "#ef4444" }}>
            <IconShield />
          </div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#f8fafc", marginBottom: "0.5rem" }}>
            Access Restricted
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6 }}>
            Only a Fleet Manager can create and manage user accounts.
          </p>
        </div>
      </div>
    );
  }

  /* ── Main view ──────────────────────────────────────────────── */
  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#0f172a",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <IconUsers />
          </span>
          Manage Users
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6 }}>
          Create login accounts for your team. Only Fleet Managers can access this page. Public registration is permanently closed.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "1fr",
        }}
        className="xl:grid-cols-[1fr_1.3fr]"
      >
        {/* ── Create form ─────────────────────────────────────── */}
        <form
          onSubmit={handleCreate}
          style={{
            padding: "1.75rem",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <IconUserPlus />
            Create New Account
          </h2>

          {/* Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="mu-name"
              style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#475569", marginBottom: "0.375rem" }}
            >
              Full name
            </label>
            <input
              id="mu-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              placeholder="e.g. Alex Sharma"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="mu-email"
              style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#475569", marginBottom: "0.375rem" }}
            >
              Email
            </label>
            <input
              id="mu-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              placeholder="user@transitops.dev"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="mu-password"
              style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#475569", marginBottom: "0.375rem" }}
            >
              Initial password
            </label>
            <input
              id="mu-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min 8 characters"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Role */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#475569", marginBottom: "0.625rem" }}
            >
              Role
            </label>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.625rem",
                    border: formRole === opt.value ? `2px solid ${opt.color}` : "1px solid #e2e8f0",
                    background: formRole === opt.value ? `${opt.color}08` : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={formRole === opt.value}
                    onChange={() => setFormRole(opt.value)}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: formRole === opt.value ? `2px solid ${opt.color}` : "2px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    {formRole === opt.value && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: opt.color,
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#94a3b8", lineHeight: 1.4, marginTop: 2 }}>{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "0.8125rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <IconAlertCircle />
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                fontSize: "0.8125rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <IconCheck />
              {success}
            </div>
          )}

          <button
            id="mu-submit"
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.625rem",
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {submitting ? (
              <>
                <div className="auth-spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                Creating…
              </>
            ) : (
              <>
                <IconUserPlus />
                Create User Account
              </>
            )}
          </button>
        </form>

        {/* ── Users table ─────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconUsers />
              Team Members
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background: "#f1f5f9",
                color: "#64748b",
              }}
            >
              {users.length} user{users.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
              No users found. Create the first one above.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontWeight: 500, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontWeight: 500, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontWeight: 500, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontWeight: 500, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const role = ROLE_DISPLAY[user.role] ?? { label: user.role, bg: "#f1f5f9", text: "#64748b" };
                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#0f172a" }}>
                          {user.name}
                          {user.id === profile?.id && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "#6366f1", fontWeight: 500 }}>(you)</span>
                          )}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", color: "#475569" }}>{user.email}</td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.625rem",
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              background: role.bg,
                              color: role.text,
                            }}
                          >
                            {role.label}
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", color: "#94a3b8", fontSize: "0.8125rem" }}>
                          {new Date(user.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}