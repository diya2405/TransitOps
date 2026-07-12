import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import type { Vehicle, VehicleStatus } from "@/types";

type VehicleFormState = {
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: string;
  odometer_km: string;
  acquisition_cost: string;
  status: VehicleStatus;
  region: string;
};

const emptyVehicleForm: VehicleFormState = {
  registration_number: "",
  name_model: "",
  type: "Van",
  max_load_capacity_kg: "",
  odometer_km: "",
  acquisition_cost: "",
  status: "available",
  region: "",
};

const statusOptions: Array<{ value: VehicleStatus; label: string }> = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On trip" },
  { value: "in_shop", label: "In shop" },
  { value: "retired", label: "Retired" },
];

export default function VehicleList() {
  const { profile } = useAuth();
  const canWriteVehicles = can(profile?.role, "vehicles:write");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleEditChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteVehicles) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/vehicles", {
        registration_number: form.registration_number.trim(),
        name_model: form.name_model.trim(),
        type: form.type.trim(),
        max_load_capacity_kg: Number(form.max_load_capacity_kg),
        odometer_km: Number(form.odometer_km),
        acquisition_cost: Number(form.acquisition_cost),
        status: form.status,
        region: form.region.trim() || null,
      });
      setMessage("Vehicle registered successfully.");
      setForm(emptyVehicleForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle.");
    }
  }

  function startEdit(vehicle: Vehicle) {
    if (!canWriteVehicles) return;
    setEditingId(vehicle.id);
    setEditForm({
      registration_number: vehicle.registration_number,
      name_model: vehicle.name_model,
      type: vehicle.type,
      max_load_capacity_kg: String(vehicle.max_load_capacity_kg),
      odometer_km: String(vehicle.odometer_km),
      acquisition_cost: String(vehicle.acquisition_cost),
      status: vehicle.status,
      region: vehicle.region ?? "",
    });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !canWriteVehicles) return;
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/api/vehicles/${editingId}`, {
        registration_number: editForm.registration_number.trim(),
        name_model: editForm.name_model.trim(),
        type: editForm.type.trim(),
        max_load_capacity_kg: Number(editForm.max_load_capacity_kg),
        odometer_km: Number(editForm.odometer_km),
        acquisition_cost: Number(editForm.acquisition_cost),
        status: editForm.status,
        region: editForm.region.trim() || null,
      });
      setMessage("Vehicle updated successfully.");
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vehicle.");
    }
  }

  async function retireVehicle(vehicle: Vehicle) {
    if (!canWriteVehicles) return;
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/api/vehicles/${vehicle.id}`, { status: "retired" });
      setMessage(`${vehicle.registration_number} retired.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retire vehicle.");
    }
  }

  async function restoreVehicle(vehicle: Vehicle) {
    if (!canWriteVehicles) return;
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/api/vehicles/${vehicle.id}`, { status: "available" });
      setMessage(`${vehicle.registration_number} restored to service.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore vehicle.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Vehicle Registry</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Fleet Managers register, update, and retire vehicles, keeping the fleet inventory accurate for dispatch and maintenance.
          </p>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        {canWriteVehicles ? (
          <form onSubmit={submitCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Register a vehicle</h2>
                <p className="text-sm text-slate-500">Create a new fleet asset and set its readiness state.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Write access</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Registration</span>
                <input name="registration_number" value={form.registration_number} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Model</span>
                <input name="name_model" value={form.name_model} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Type</span>
                <input name="type" value={form.type} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Capacity (kg)</span>
                <input name="max_load_capacity_kg" type="number" min="0" step="1" value={form.max_load_capacity_kg} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Odometer (km)</span>
                <input name="odometer_km" type="number" min="0" step="1" value={form.odometer_km} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Acquisition cost</span>
                <input name="acquisition_cost" type="number" min="0" step="1" value={form.acquisition_cost} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Status</span>
                <select name="status" value={form.status} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Region</span>
                <input name="region" value={form.region} onChange={handleFormChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save vehicle</button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
            Only a Fleet Manager can create or manage the vehicle registry.
          </div>
        )}

        {editingId ? (
          <form onSubmit={saveEdit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit vehicle</h2>
                <p className="text-sm text-slate-500">Adjust the asset record without losing its history.</p>
              </div>
              <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700">Cancel</button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Registration</span>
                <input name="registration_number" value={editForm.registration_number} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Model</span>
                <input name="name_model" value={editForm.name_model} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Type</span>
                <input name="type" value={editForm.type} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Capacity (kg)</span>
                <input name="max_load_capacity_kg" type="number" min="0" step="1" value={editForm.max_load_capacity_kg} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Odometer (km)</span>
                <input name="odometer_km" type="number" min="0" step="1" value={editForm.odometer_km} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Acquisition cost</span>
                <input name="acquisition_cost" type="number" min="0" step="1" value={editForm.acquisition_cost} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Status</span>
                <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Region</span>
                <input name="region" value={editForm.region} onChange={handleEditChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save changes</button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-4 font-medium text-slate-900">{vehicle.registration_number}</td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.name_model} <span className="text-xs text-slate-400">({vehicle.type})</span></td>
                  <td className="px-4 py-4 text-slate-700">{vehicle.max_load_capacity_kg} kg</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${vehicle.status === "retired" ? "bg-slate-100 text-slate-700" : vehicle.status === "in_shop" ? "bg-amber-100 text-amber-700" : vehicle.status === "on_trip" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {canWriteVehicles ? (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEdit(vehicle)} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">Edit</button>
                        {vehicle.status === "retired" ? (
                          <button type="button" onClick={() => restoreVehicle(vehicle)} className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">Restore</button>
                        ) : (
                          <button type="button" onClick={() => retireVehicle(vehicle)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Retire</button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Read only</span>
                    )}
                  </td>
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
