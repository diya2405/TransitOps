import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import type { MaintenanceLog, Vehicle } from "@/types";

type MaintenanceFormState = {
  vehicle_id: string;
  description: string;
  cost: string;
};

const emptyForm: MaintenanceFormState = {
  vehicle_id: "",
  description: "",
  cost: "",
};

export default function MaintenanceList() {
  const { profile } = useAuth();
  const canWriteMaintenance = can(profile?.role, "maintenance:write");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [form, setForm] = useState<MaintenanceFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [vehicleData, maintenanceData] = await Promise.all([
        api.get("/api/vehicles"),
        api.get("/api/maintenance"),
      ]);
      setVehicles(vehicleData);
      setMaintenanceLogs(maintenanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maintenance records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteMaintenance) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/maintenance", {
        vehicle_id: form.vehicle_id,
        description: form.description.trim(),
        cost: Number(form.cost),
      });
      setMessage("Maintenance record opened.");
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create maintenance record.");
    }
  }

  async function closeMaintenance(log: MaintenanceLog) {
    if (!canWriteMaintenance) return;
    setMessage(null);
    setError(null);
    try {
      await api.post(`/api/maintenance/${log.id}/close`);
      setMessage("Maintenance closed and vehicle returned to service.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close maintenance record.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Maintenance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Fleet Managers keep the vehicle fleet healthy by opening maintenance work orders and closing them once repairs are complete.
          </p>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Open work orders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{maintenanceLogs.filter((log) => log.status !== "closed").length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Closed work orders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{maintenanceLogs.filter((log) => log.status === "closed").length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Maintenance cost</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">₹{maintenanceLogs.reduce((sum, log) => sum + Number(log.cost), 0).toLocaleString()}</p>
          </div>
        </section>

        {canWriteMaintenance ? (
          <form onSubmit={submitCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Open maintenance work</h2>
                <p className="text-sm text-slate-500">Assign a vehicle to maintenance and set the repair cost.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Write access</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Cost</span>
                <input name="cost" type="number" min="0" step="1" value={form.cost} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              <span className="mb-1 block font-medium text-slate-700">Description</span>
              <textarea name="description" value={form.description} onChange={handleChange} className="min-h-[96px] w-full rounded-xl border border-slate-300 px-3 py-2" required placeholder="Describe the repair or inspection" />
            </label>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Create record</button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
            Fleet Managers are the only ones who can open and close maintenance work in this workflow.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {maintenanceLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4 font-medium text-slate-900">{vehicles.find((vehicle) => vehicle.id === log.vehicle_id)?.registration_number ?? log.vehicle_id}</td>
                  <td className="px-4 py-4 text-slate-700">{log.description}</td>
                  <td className="px-4 py-4 text-slate-700">₹{Number(log.cost).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${log.status === "closed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{log.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    {canWriteMaintenance && log.status !== "closed" ? (
                      <button type="button" onClick={() => closeMaintenance(log)} className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">Close</button>
                    ) : (
                      <span className="text-xs text-slate-400">{log.status === "closed" ? "Completed" : "Read only"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Loading maintenance work orders...</div>}
      </div>
    </div>
  );
}
