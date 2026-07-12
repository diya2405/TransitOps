import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import type { Vehicle } from "@/types";

type VehicleCreateDraft = {
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: string;
  odometer_km: string;
  acquisition_cost: string;
  region: string;
};

const emptyDraft: VehicleCreateDraft = {
  registration_number: "",
  name_model: "",
  type: "",
  max_load_capacity_kg: "",
  odometer_km: "",
  acquisition_cost: "",
  region: "",
};

export default function VehicleList() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<VehicleCreateDraft>(emptyDraft);

  const canManageVehicles = can(profile?.role, "vehicles:write");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/vehicles");
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function submitVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageVehicles) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/vehicles", {
        registration_number: draft.registration_number,
        name_model: draft.name_model,
        type: draft.type,
        max_load_capacity_kg: Number(draft.max_load_capacity_kg),
        odometer_km: Number(draft.odometer_km || 0),
        acquisition_cost: Number(draft.acquisition_cost || 0),
        region: draft.region || null,
      });
      setMessage("Vehicle added.");
      setDraft(emptyDraft);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Vehicles</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Dispatchers can add vehicles here, while all roles can review the current registry.
          </p>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        {canManageVehicles ? (
          <form onSubmit={submitVehicle} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add vehicle</h2>
                <p className="text-sm text-slate-500">Use this to register new vehicles before assigning them to trips.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Write access</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Registration number</span>
                <input name="registration_number" value={draft.registration_number} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Model</span>
                <input name="name_model" value={draft.name_model} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Type</span>
                <input name="type" value={draft.type} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Capacity (kg)</span>
                <input name="max_load_capacity_kg" type="number" min="0" step="0.1" value={draft.max_load_capacity_kg} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Odometer</span>
                <input name="odometer_km" type="number" min="0" step="0.1" value={draft.odometer_km} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Acquisition cost</span>
                <input name="acquisition_cost" type="number" min="0" step="0.1" value={draft.acquisition_cost} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600 md:col-span-2 lg:col-span-3">
                <span className="mb-1 block font-medium text-slate-700">Region</span>
                <input name="region" value={draft.region} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="West" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save vehicle</button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-4 font-medium text-slate-900">{vehicle.registration_number}</td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.name_model}</td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.type}</td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.status}</td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.region ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Loading vehicles...</div>}
      </div>
    </div>
  );
}
