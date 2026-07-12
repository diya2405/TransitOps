import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Driver, Trip, Vehicle } from "@/types";

type TripRow = Trip & {
  registration_number?: string;
  driver_name?: string;
};

type TripCompletionDraft = {
  final_odometer_km: string;
  fuel_consumed_l: string;
};

type TripCreateDraft = {
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight_kg: string;
  planned_distance_km: string;
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<TripCreateDraft>({
    source: "",
    destination: "",
    vehicle_id: "",
    driver_id: "",
    cargo_weight_kg: "",
    planned_distance_km: "",
  });
  const [completingTripId, setCompletingTripId] = useState<string | null>(null);
  const [completionDraft, setCompletionDraft] = useState<TripCompletionDraft>({
    final_odometer_km: "",
    fuel_consumed_l: "",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [tripData, vehicleData, driverData] = await Promise.all([
        api.get("/api/trips"),
        api.get("/api/vehicles"),
        api.get("/api/drivers"),
      ]);
      setTrips(tripData);
      setVehicles(vehicleData);
      setDrivers(driverData);
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

  async function dispatchTrip(trip: TripRow) {
    if (!can(profile?.role, "trips:dispatch")) return;
    setMessage(null);
    setError(null);
    try {
      await api.post(`/api/trips/${trip.id}/dispatch`);
      setMessage(`Dispatched ${trip.source} → ${trip.destination}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch trip.");
    }
  }

  function startCompletion(trip: TripRow) {
    if (!can(profile?.role, "trips:complete")) return;
    setMessage(null);
    setError(null);
    setCompletingTripId(trip.id);
    setCompletionDraft({
      final_odometer_km: trip.final_odometer_km ? String(trip.final_odometer_km) : "",
      fuel_consumed_l: trip.fuel_consumed_l ? String(trip.fuel_consumed_l) : "",
    });
  }

  function handleCompletionChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setCompletionDraft((current) => ({ ...current, [name]: value }));
  }

  function handleCreateChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setCreateDraft((current) => ({ ...current, [name]: value }));
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can(profile?.role, "trips:create")) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/trips", {
        source: createDraft.source,
        destination: createDraft.destination,
        vehicle_id: createDraft.vehicle_id,
        driver_id: createDraft.driver_id,
        cargo_weight_kg: Number(createDraft.cargo_weight_kg),
        planned_distance_km: Number(createDraft.planned_distance_km),
      });
      setMessage("Trip created.");
      setCreateDraft({
        source: "",
        destination: "",
        vehicle_id: "",
        driver_id: "",
        cargo_weight_kg: "",
        planned_distance_km: "",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip.");
    }
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completingTripId || !can(profile?.role, "trips:complete")) return;
    setMessage(null);
    setError(null);
    try {
      await api.post(`/api/trips/${completingTripId}/complete`, {
        final_odometer_km: Number(completionDraft.final_odometer_km),
        fuel_consumed_l: Number(completionDraft.fuel_consumed_l),
      });
      setMessage("Trip marked as completed.");
      setCompletingTripId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete trip.");
    }
  }

  const completingTrip = completingTripId ? trips.find((trip) => trip.id === completingTripId) ?? null : null;

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

        {can(profile?.role, "trips:create") ? (
          <form onSubmit={submitCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create trip</h2>
                <p className="text-sm text-slate-500">Dispatchers can create a draft trip and dispatch it later.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Create access</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Source</span>
                <input name="source" value={createDraft.source} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Warehouse A" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Destination</span>
                <input name="destination" value={createDraft.destination} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="City Hub" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
                <select name="vehicle_id" value={createDraft.vehicle_id} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number} · {vehicle.status}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Driver</span>
                <select name="driver_id" value={createDraft.driver_id} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name} · {driver.status}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Cargo weight (kg)</span>
                <input name="cargo_weight_kg" type="number" min="0" step="0.1" value={createDraft.cargo_weight_kg} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Planned distance (km)</span>
                <input name="planned_distance_km" type="number" min="0" step="0.1" value={createDraft.planned_distance_km} onChange={handleCreateChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save trip</button>
            </div>
          </form>
        ) : null}

        {completingTrip && can(profile?.role, "trips:complete") ? (
          <form onSubmit={submitCompletion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Complete trip</h2>
                <p className="text-sm text-slate-500">
                  {completingTrip.source} → {completingTrip.destination} · Vehicle {completingTrip.registration_number ?? completingTrip.vehicle_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTripId(null)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-slate-900"
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Final odometer</span>
                <input
                  name="final_odometer_km"
                  type="number"
                  min="0"
                  step="0.1"
                  value={completionDraft.final_odometer_km}
                  onChange={handleCompletionChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Fuel consumed</span>
                <input
                  name="fuel_consumed_l"
                  type="number"
                  min="0"
                  step="0.1"
                  value={completionDraft.fuel_consumed_l}
                  onChange={handleCompletionChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Mark complete
              </button>
            </div>
          </form>
        ) : null}

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
                    <div className="flex flex-wrap gap-2">
                      {trip.status === "draft" && can(profile?.role, "trips:dispatch") ? (
                        <button
                          type="button"
                          onClick={() => dispatchTrip(trip)}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          Dispatch
                        </button>
                      ) : null}
                      {trip.status === "dispatched" && can(profile?.role, "trips:complete") ? (
                        <button
                          type="button"
                          onClick={() => startCompletion(trip)}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                        >
                          Complete
                        </button>
                      ) : null}
                      {trip.status === "dispatched" && can(profile?.role, "trips:cancel") ? (
                        <button
                          type="button"
                          onClick={() => cancelTrip(trip)}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      ) : null}
                      {trip.status !== "dispatched" || (!can(profile?.role, "trips:complete") && !can(profile?.role, "trips:cancel")) ? (
                        <span className="text-xs text-slate-400">Read only</span>
                      ) : null}
                    </div>
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
