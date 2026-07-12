import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { FuelLog, Trip, Vehicle, Driver } from "@/types";

type DashboardKpis = {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
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

export default function DriverDashboard() {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/api/dashboard/kpis"),
      api.get("/api/trips"),
      api.get("/api/vehicles"),
      api.get("/api/drivers"),
      api.get("/api/fuel-logs"),
    ])
      .then(([kpiData, tripData, vehicleData, driverData, fuelData]) => {
        setKpis(kpiData);
        setTrips(tripData);
        setVehicles(vehicleData);
        setDrivers(driverData);
        setFuelLogs(fuelData);
      })
      .catch(() => {
        setKpis(null);
        setTrips([]);
        setVehicles([]);
        setDrivers([]);
        setFuelLogs([]);
      });
  }, []);

  const tripSummary = useMemo(() => {
    const dispatched = trips.filter((trip) => trip.status === "dispatched");
    const completed = trips.filter((trip) => trip.status === "completed");
    const draft = trips.filter((trip) => trip.status === "draft");
    return { dispatched, completed, draft };
  }, [trips]);

  const recentFuelLogs = fuelLogs.slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Driver Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Track dispatched trips, finish completed work, and keep fuel entries current without exposing manager-only controls.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Dispatched trips" value={String(tripSummary.dispatched.length)} hint="Trips ready to finish." />
          <MetricCard label="Completed trips" value={String(tripSummary.completed.length)} hint="Trips already closed out." />
          <MetricCard label="Fuel logs" value={String(fuelLogs.length)} hint="Operational fuel history." />
          <MetricCard label="Available vehicles" value={String(kpis?.available_vehicles ?? 0)} hint="View only for drivers." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Driver shortcuts</h2>
                <p className="text-sm text-slate-500">The main workflow starts on Trips, then Fuel & Expenses.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Role: {profile?.role ?? "driver"}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/trips" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Trips</p>
                <p className="text-sm text-slate-500">Review dispatched work and complete trips.</p>
              </Link>
              <Link to="/fuel-expenses" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Fuel logs</p>
                <p className="text-sm text-slate-500">Add refuels tied to vehicle activity.</p>
              </Link>
              <Link to="/vehicles" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Vehicles</p>
                <p className="text-sm text-slate-500">Read-only fleet availability.</p>
              </Link>
              <Link to="/drivers" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Drivers</p>
                <p className="text-sm text-slate-500">Read-only driver status and compliance.</p>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Driver rules</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Dispatch and assignment stay with the dispatcher workflow.</li>
              <li>• Drivers can complete dispatched trips and record fuel usage.</li>
              <li>• Read-only access keeps fleet and compliance context visible without edit power.</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Trip workload</h2>
            <p className="text-sm text-slate-500">Useful for the driver handoff between dispatch and completion.</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Route</th>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {trips.slice(0, 5).map((trip) => (
                    <tr key={trip.id}>
                      <td className="px-3 py-3 font-medium text-slate-900">{trip.source} → {trip.destination}</td>
                      <td className="px-3 py-3 text-slate-600">{vehicles.find((vehicle) => vehicle.id === trip.vehicle_id)?.registration_number ?? trip.vehicle_id}</td>
                      <td className="px-3 py-3 text-slate-600">{trip.status}</td>
                    </tr>
                  ))}
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500">No trips loaded yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent fuel logs</h2>
            <p className="text-sm text-slate-500">Keep the fuel ledger aligned with each completed trip.</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Liters</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentFuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500">No fuel logs recorded yet.</td>
                    </tr>
                  ) : recentFuelLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-3 font-medium text-slate-700">{vehicles.find((vehicle) => vehicle.id === log.vehicle_id)?.registration_number ?? log.vehicle_id}</td>
                      <td className="px-3 py-3 text-slate-600">{log.liters} L</td>
                      <td className="px-3 py-3 text-slate-600">{log.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              The driver workspace intentionally stays read-only for vehicles and driver records while keeping completion and fuel entry visible.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}