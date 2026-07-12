import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Trip } from "@/types";

type TripRow = Trip & {
  registration_number?: string;
  driver_name?: string;
};

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

export default function TripList() {
  const { profile } = useAuth();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/trips");
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(() => {
    return {
      draft: trips.filter((trip) => trip.status === "draft").length,
      dispatched: trips.filter((trip) => trip.status === "dispatched").length,
      completed: trips.filter((trip) => trip.status === "completed").length,
      cancelled: trips.filter((trip) => trip.status === "cancelled").length,
    };
  }, [trips]);

  async function cancelTrip(trip: TripRow) {
    if (!can(profile?.role, "trips:cancel")) return;
    setMessage(null);
    setError(null);
    try {
      await api.post(`/api/trips/${trip.id}/cancel`);
      setMessage(`Cancelled ${trip.source} → ${trip.destination}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel trip.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Trips</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Safety officers can review dispatched trips and cancel unsafe ones; dispatchers can use this page to create and manage trips.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Draft" value={String(metrics.draft)} hint="Trips not yet dispatched." />
          <MetricCard label="Dispatched" value={String(metrics.dispatched)} hint="Trips currently active." />
          <MetricCard label="Completed" value={String(metrics.completed)} hint="Trips successfully finished." />
          <MetricCard label="Cancelled" value={String(metrics.cancelled)} hint="Trips cancelled for safety or operational reasons." />
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-4 py-4 font-medium text-slate-900">{trip.source} → {trip.destination}</td>
                  <td className="px-4 py-4 text-slate-700">{trip.registration_number ?? trip.vehicle_id}</td>
                  <td className="px-4 py-4 text-slate-700">{trip.driver_name ?? trip.driver_id}</td>
                  <td className="px-4 py-4 text-slate-700">{Number(trip.cargo_weight_kg)} kg</td>
                  <td className="px-4 py-4"><StatusBadge status={trip.status} /></td>
                  <td className="px-4 py-4">
                    {trip.status === "dispatched" && can(profile?.role, "trips:cancel") ? (
                      <button
                        type="button"
                        onClick={() => cancelTrip(trip)}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                      >
                        Cancel
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

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading trips...
          </div>
        )}
      </div>
    </div>
  );
}
