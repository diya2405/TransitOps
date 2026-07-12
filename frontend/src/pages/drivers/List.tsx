import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { isLicenseExpired } from "@/lib/businessRules";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import type { Driver } from "@/types";

type DriverEditDraft = {
  license_category: string;
  license_expiry_date: string;
  safety_score: string;
  contact_number: string;
};

type DriverCreateDraft = {
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: string;
};

function daysUntil(date: string) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function buildDraft(driver: Driver): DriverEditDraft {
  return {
    license_category: driver.license_category ?? "",
    license_expiry_date: driver.license_expiry_date,
    safety_score: String(driver.safety_score),
    contact_number: driver.contact_number ?? "",
  };
}

const emptyCreateDraft: DriverCreateDraft = {
  name: "",
  license_number: "",
  license_category: "",
  license_expiry_date: "",
  contact_number: "",
  safety_score: "100",
};

export default function DriverList() {
  const { profile } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DriverEditDraft>({
    license_category: "",
    license_expiry_date: "",
    safety_score: "",
    contact_number: "",
  });
  const [createDraft, setCreateDraft] = useState<DriverCreateDraft>(emptyCreateDraft);

  const canManageDrivers = can(profile?.role, "drivers:write");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/drivers");
      setDrivers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const { expiredCount, expiringSoonCount, suspendedCount } = useMemo(() => {
    const expired = drivers.filter((driver) => isLicenseExpired(driver.license_expiry_date));
    const expiringSoon = drivers.filter((driver) => {
      const remaining = daysUntil(driver.license_expiry_date);
      return remaining >= 0 && remaining <= 30;
    });
    const suspended = drivers.filter((driver) => driver.status === "suspended");
    return {
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      suspendedCount: suspended.length,
    };
  }, [drivers]);

  async function toggleSuspension(driver: Driver) {
    if (!canManageDrivers) return;
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/api/drivers/${driver.id}`, {
        status: driver.status === "suspended" ? "available" : "suspended",
      });
      setMessage(driver.status === "suspended" ? `${driver.name} restored.` : `${driver.name} suspended.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update driver.");
    }
  }

  function startEdit(driver: Driver) {
    if (!canManageDrivers) return;
    setEditingDriverId(driver.id);
    setEditDraft(buildDraft(driver));
  }

  function handleEditChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setEditDraft((current) => ({ ...current, [name]: value }));
  }

  function handleCreateChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setCreateDraft((current) => ({ ...current, [name]: value }));
  }

  async function saveCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageDrivers) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/drivers", {
        name: createDraft.name.trim(),
        license_number: createDraft.license_number.trim(),
        license_category: createDraft.license_category.trim() || null,
        license_expiry_date: createDraft.license_expiry_date,
        contact_number: createDraft.contact_number.trim() || null,
        safety_score: Number(createDraft.safety_score),
      });
      setMessage("Driver profile created.");
      setCreateDraft(emptyCreateDraft);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create driver.");
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDriverId || !canManageDrivers) return;
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/api/drivers/${editingDriverId}`, {
        license_category: editDraft.license_category || null,
        license_expiry_date: editDraft.license_expiry_date,
        safety_score: Number(editDraft.safety_score),
        contact_number: editDraft.contact_number || null,
      });
      setMessage("Driver compliance details updated.");
      setEditingDriverId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update driver compliance data.");
    }
  }

  async function sendReminder(driver: Driver) {
    if (!canManageDrivers) return;
    const subject = `Reminder: ${driver.name} license review`;
    const body = `Hello,\n\nPlease review ${driver.name}'s driver record. License ${driver.license_number} expires on ${driver.license_expiry_date}.\n\nTransitOps Safety Desk`;
    const mailtoUrl = `mailto:safety@transitops.local?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    } catch {
      // Ignore clipboard failures and continue with the mail draft.
    }

    window.open(mailtoUrl, "_blank", "noopener,noreferrer");
    setMessage(`Reminder draft prepared for ${driver.name}.`);
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Driver Management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Safety officers use this page to monitor expiring licenses, review safety scores, and suspend or reactivate drivers.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total drivers" value={String(drivers.length)} hint="All driver profiles." />
          <MetricCard label="Expired licenses" value={String(expiredCount)} hint="Cannot be assigned to trips." />
          <MetricCard label="Expiring in 30 days" value={String(expiringSoonCount)} hint="Needs follow-up reminder." />
          <MetricCard label="Suspended" value={String(suspendedCount)} hint="Temporarily blocked from dispatch." />
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        {canManageDrivers ? (
          <form onSubmit={saveCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Register a driver</h2>
                <p className="text-sm text-slate-500">Add a new driver profile and set the initial compliance details.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Write access</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Name</span>
                <input name="name" value={createDraft.name} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">License number</span>
                <input name="license_number" value={createDraft.license_number} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">License category</span>
                <input name="license_category" value={createDraft.license_category} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Expiry date</span>
                <input name="license_expiry_date" type="date" value={createDraft.license_expiry_date} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Contact number</span>
                <input name="contact_number" value={createDraft.contact_number} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Safety score</span>
                <input name="safety_score" type="number" min="0" max="100" value={createDraft.safety_score} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Create driver</button>
            </div>
          </form>
        ) : null}

        {canManageDrivers && editingDriverId ? (
          <form onSubmit={saveEdit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Update driver compliance</h2>
                <p className="text-sm text-slate-500">Adjust license details and safety score without leaving the safety workflow.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDriverId(null)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-slate-900"
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">License category</span>
                <input
                  name="license_category"
                  value={editDraft.license_category}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="LMV"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Expiry date</span>
                <input
                  name="license_expiry_date"
                  type="date"
                  value={editDraft.license_expiry_date}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Safety score</span>
                <input
                  name="safety_score"
                  type="number"
                  min="0"
                  max="100"
                  value={editDraft.safety_score}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Contact number</span>
                <input
                  name="contact_number"
                  value={editDraft.contact_number}
                  onChange={handleEditChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="9990001111"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Save changes
              </button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">License</th>
                <th className="px-4 py-3 font-medium">Safety score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {drivers.map((driver) => {
                const expired = isLicenseExpired(driver.license_expiry_date);
                return (
                  <tr key={driver.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{driver.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{driver.contact_number ?? "No contact number"}</p>
                    </td>
                    <td className={expired ? "px-4 py-4 text-red-600" : "px-4 py-4 text-slate-700"}>
                      <div>{driver.license_number}</div>
                      <div>{driver.license_category ?? "Unspecified"}</div>
                      <div>{driver.license_expiry_date}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{driver.safety_score}/100</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={driver.status} />
                    </td>
                    <td className="px-4 py-4">
                      {canManageDrivers ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(driver)}
                            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSuspension(driver)}
                            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                          >
                            {driver.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendReminder(driver)}
                            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
                          >
                            Reminder
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Read only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading drivers...
          </div>
        )}
      </div>
    </div>
  );
}
