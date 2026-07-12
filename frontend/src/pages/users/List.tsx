import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import type { UserAccount, UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "financial_analyst", label: "Financial Analyst" },
];

export default function UsersPage() {
  const { profile } = useAuth();
  const allowed = can(profile?.role, "users:write");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("dispatcher");

  useEffect(() => {
    if (!allowed) return;
    api.get("/api/users").then(setUsers).catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."));
  }, [allowed]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await api.post("/api/users", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("dispatcher");
      setSuccess("User created successfully.");
      const refreshed = await api.get("/api/users");
      setUsers(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    }
  }

  async function handleDelete(user: UserAccount) {
    if (!allowed || user.id === profile?.id) return;
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/api/users/${user.id}`);
      setSuccess(`Removed ${user.name}.`);
      const refreshed = await api.get("/api/users");
      setUsers(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  }

  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h1>
        <p className="text-sm text-gray-500">Only a Fleet Manager can create and review accounts.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Manage Users</h1>
        <p className="mt-2 text-sm text-slate-500">Create login accounts for the rest of the team. Registration stays closed after the first user.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700">
            Create user
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.role}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {user.id === profile?.id ? (
                      <span className="text-xs text-slate-400">You</span>
                    ) : (
                      <button type="button" onClick={() => handleDelete(user)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}