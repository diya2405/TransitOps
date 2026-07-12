import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { isLicenseExpired } from "@/lib/businessRules";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import type { Driver, Trip } from "@/types";

type DashboardKpis = {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
};

type TripReviewRow = Trip & {
  registration_number?: string;
  driver_name?: string;
};

function daysUntil(date: string) {
  const target = new Date(date);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

export default function SafetyOfficerDashboard() {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<TripReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, driverData, tripData] = await Promise.all([
        api.get("/api/dashboard/kpis"),
        api.get("/api/drivers"),
        api.get("/api/trips"),
      ]);
      setKpis(kpiData);
      setDrivers(driverData);
      setTrips(tripData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load safety dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const { expiredDrivers, expiringSoonDrivers, suspendedDrivers, reviewTrips } = useMemo(() => {
    const expired = drivers.filter((driver) => isLicenseExpired(driver.license_expiry_date));
    const expiringSoon = drivers.filter((driver) => {
      const remaining = daysUntil(driver.license_expiry_date);
      return remaining >= 0 && remaining <= 30;
    });
    const suspended = drivers.filter((driver) => driver.status === "suspended");
    const review = trips.filter((trip) => trip.status === "dispatched");
    return {
      expiredDrivers: expired,
      expiringSoonDrivers: expiringSoon,
      suspendedDrivers: suspended,
      reviewTrips: review,
    };
  }, [drivers, trips]);

  async function suspendDriver(driver: Driver) {
    setActionMessage(null);
    setError(null);
    try {
      await api.patch(`/api/drivers/${driver.id}`, {
        status: driver.status === "suspended" ? "available" : "suspended",
      });
      setActionMessage(
        driver.status === "suspended" ? `${driver.name} restored to available.` : `${driver.name} suspended.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update driver status.");
    }
  }

  async function cancelTrip(trip: Trip) {
    setActionMessage(null);
    setError(null);
    try {
      await api.post(`/api/trips/${trip.id}/cancel`);
      setActionMessage(`Trip ${trip.source} → ${trip.destination} cancelled.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel trip.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-lg">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Safety Officer Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Monitor license expiry, driver safety scores, and dispatched trips from one screen. This view keeps
                compliance work visible while still using the shared nav and shared route.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">Role: {profile?.role ?? "safety_officer"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Main screen: Drivers</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Allowed actions: monitor, suspend, cancel</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">Safety actions</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-100">
                <li>Review expiring and expired licenses.</li>
                <li>Suspend or restore a driver after inspection.</li>
                <li>Cancel dispatched trips if a risk is found.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Expired licenses"
            value={String(expiredDrivers.length)}
            hint="Drivers with expired licenses cannot be assigned to trips."
          />
          <KpiCard
            label="Expiring in 30 days"
            value={String(expiringSoonDrivers.length)}
            hint="Review these drivers before the next dispatch."
          />
          <KpiCard
            label="Suspended drivers"
            value={String(suspendedDrivers.length)}
            hint="Keep suspended drivers out of the assignment pool."
          />
          <KpiCard
            label="Trips to review"
            value={String(reviewTrips.length)}
            hint={kpis ? `${kpis.active_trips} active trips overall.` : "Loading trip summary..."}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Driver compliance</h2>
                <p className="text-sm text-slate-500">Focuses on the drivers that need attention first.</p>
              </div>
              <Link
                to="/drivers"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Open Drivers
              </Link>
            </div>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {actionMessage && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p>}

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Expiry</th>
                    <th className="px-4 py-3 font-medium">Safety score</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {drivers
                    .filter((driver) => isLicenseExpired(driver.license_expiry_date) || driver.status === "suspended" || daysUntil(driver.license_expiry_date) <= 30)
                    .map((driver) => (
                      <tr key={driver.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">{driver.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{driver.license_number}</p>
                        </td>
                        <td className={isLicenseExpired(driver.license_expiry_date) ? "px-4 py-4 text-red-600" : "px-4 py-4 text-slate-700"}>
                          {driver.license_expiry_date}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{driver.safety_score}/100</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={driver.status} />
                        </td>
                        <td className="px-4 py-4">
                          {can(profile?.role, "drivers:write") ? (
                            <button
                              type="button"
                              onClick={() => suspendDriver(driver)}
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                            >
                              {driver.status === "suspended" ? "Restore" : "Suspend"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Dispatched trips</h2>
              <p className="mt-1 text-sm text-slate-500">Cancel any trip that becomes unsafe before completion.</p>

              <div className="mt-4 space-y-3">
                {reviewTrips.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                    No dispatched trips currently need review.
                  </p>
                ) : (
                  reviewTrips.map((trip) => (
                    <div key={trip.id} className="rounded-xl border border-slate-200 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{trip.source} → {trip.destination}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Vehicle: {trip.registration_number ?? trip.vehicle_id} · Driver: {trip.driver_name ?? trip.driver_id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelTrip(trip)}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          Cancel trip
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-lg font-semibold text-amber-950">Flow mapping</h2>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                <li>• Dashboard shows compliance at a glance.</li>
                <li>• Drivers page is the main screen for monitoring and suspension.</li>
                <li>• Trips page is read-only except for safety cancellation.</li>
                <li>• Shared nav stays the same for all roles.</li>
              </ul>
            </div>

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                Loading live dashboard data...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}