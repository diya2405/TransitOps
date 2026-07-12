import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import SafetyOfficerDashboard from "@/features/safety-officer/pages/Dashboard";
import type { Expense, Vehicle } from "@/types";

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

function FleetManagerDashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);

  useEffect(() => {
    api.get("/api/dashboard/kpis").then(setKpis).catch(() => setKpis(null));
  }, []);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Fleet Manager Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Monitor fleet health, maintenance status, and operational throughput from the same landing page.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active vehicles" value={String(kpis?.active_vehicles ?? 0)} hint="Vehicles in service." />
          <MetricCard label="Available vehicles" value={String(kpis?.available_vehicles ?? 0)} hint="Ready for dispatch." />
          <MetricCard label="Vehicles in maintenance" value={String(kpis?.vehicles_in_maintenance ?? 0)} hint="Currently in shop." />
          <MetricCard label="Fleet utilization" value={`${kpis?.fleet_utilization_pct ?? 0}%`} hint="On-trip share of active fleet." />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fleet actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/vehicles" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Vehicles</p>
                <p className="text-sm text-slate-500">Register, edit, or retire assets.</p>
              </Link>
              <Link to="/drivers" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Drivers</p>
                <p className="text-sm text-slate-500">Manage driver profiles and safety data.</p>
              </Link>
              <Link to="/maintenance" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Maintenance</p>
                <p className="text-sm text-slate-500">Schedule and close maintenance records.</p>
              </Link>
              <Link to="/reports" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Reports</p>
                <p className="text-sm text-slate-500">Review fleet-wide operations.</p>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Operational reminders</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Retired and in-shop vehicles stay out of dispatch selection.</li>
              <li>• Maintenance changes vehicle status to in shop immediately.</li>
              <li>• Reports should reflect fuel and maintenance cost movement.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DispatcherDashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);

  useEffect(() => {
    api.get("/api/dashboard/kpis").then(setKpis).catch(() => setKpis(null));
  }, []);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Dispatcher Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Run day-to-day trips, keep vehicles and drivers assigned correctly, and dispatch only when business rules pass.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active trips" value={String(kpis?.active_trips ?? 0)} hint="Currently dispatched." />
          <MetricCard label="Pending trips" value={String(kpis?.pending_trips ?? 0)} hint="Drafts waiting to be dispatched." />
          <MetricCard label="Available vehicles" value={String(kpis?.available_vehicles ?? 0)} hint="Ready for assignment." />
          <MetricCard label="Drivers on duty" value={String(kpis?.drivers_on_duty ?? 0)} hint="Currently on trips." />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Dispatcher actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/trips" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Trips</p>
                <p className="text-sm text-slate-500">Create, dispatch, complete, cancel.</p>
              </Link>
              <Link to="/vehicles" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Vehicles</p>
                <p className="text-sm text-slate-500">Only available vehicles should be assignable.</p>
              </Link>
              <Link to="/drivers" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Drivers</p>
                <p className="text-sm text-slate-500">Check availability and license state.</p>
              </Link>
              <Link to="/fuel-expenses" className="rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <p className="font-medium text-slate-900">Fuel & Expenses</p>
                <p className="text-sm text-slate-500">Add trip fuel and toll expenses.</p>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Dispatch rules</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• In-shop or retired vehicles never appear in dispatch selection.</li>
              <li>• Suspended or expired-license drivers cannot be assigned.</li>
              <li>• Cargo weight must fit the vehicle's maximum load capacity.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialAnalystDashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [costRows, setCostRows] = useState<Array<{ id: string; registration_number: string; fuel_cost: number; maintenance_cost: number; operational_cost: number }>>([]);

  useEffect(() => {
    Promise.all([api.get("/api/dashboard/kpis"), api.get("/api/dashboard/reports/operational-cost")])
      .then(([kpiData, costData]) => {
        setKpis(kpiData);
        setCostRows(costData);
      })
      .catch(() => {
        setKpis(null);
        setCostRows([]);
      });
  }, []);

  const totalOperationalCost = costRows.reduce((sum, row) => sum + Number(row.operational_cost ?? 0), 0);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Financial Analyst Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Track operational costs, fuel spend, and maintenance spend from a finance-first view.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Vehicles with cost data" value={String(costRows.length)} hint="Vehicles contributing to spend." />
          <MetricCard label="Total operational cost" value={totalOperationalCost.toFixed(2)} hint="Fuel + maintenance." />
          <MetricCard label="Pending trips" value={String(kpis?.pending_trips ?? 0)} hint="Useful for expense forecasting." />
          <MetricCard label="Fleet utilization" value={`${kpis?.fleet_utilization_pct ?? 0}%`} hint="Operational efficiency signal." />
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Operational cost by vehicle</h2>
              <p className="text-sm text-slate-500">Use this for reports, export, and ROI analysis.</p>
            </div>
            <Link to="/reports" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Open Reports
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Fuel</th>
                  <th className="px-4 py-3 font-medium">Maintenance</th>
                  <th className="px-4 py-3 font-medium">Operational cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {costRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.registration_number}</td>
                    <td className="px-4 py-3 text-slate-700">{Number(row.fuel_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">{Number(row.maintenance_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">{Number(row.operational_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Export CSV/PDF from the Reports page once you want the finance output in a shareable format.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();

  if (profile?.role === "safety_officer") return <SafetyOfficerDashboard />;
  if (profile?.role === "dispatcher" || profile?.role === "driver") return <DispatcherDashboard />;
  if (profile?.role === "financial_analyst") return <FinancialAnalystDashboard />;
  return <FleetManagerDashboard />;
}
