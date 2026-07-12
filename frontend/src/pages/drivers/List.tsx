import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { isLicenseExpired } from "@/lib/businessRules";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import type { Driver } from "@/types";

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
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

export default function DriverList() {
  const { profile } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const expiringSoon = drivers.filter((driver) => daysUntil(driver.license_expiry_date) >= 0 && daysUntil(driver.license_expiry_date) <= 30);
    const suspended = drivers.filter((driver) => driver.status === "suspended");
    return {
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      suspendedCount: suspended.length,
    };
  }, [drivers]);

  async function toggleSuspension(driver: Driver) {
    if (!can(profile?.role, "drivers:write")) return;
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">License</th>
                <th className="px-4 py-3 font-medium">Safety score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
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
                      {can(profile?.role, "drivers:write") ? (
                        <button
                          type="button"
                          onClick={() => toggleSuspension(driver)}
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        >
                          {driver.status === "suspended" ? "Reactivate" : "Suspend"}
                        </button>
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
