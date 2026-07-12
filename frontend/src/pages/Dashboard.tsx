import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import DriverDashboard from "@/features/driver/pages/Dashboard";
import SafetyOfficerDashboard from "@/features/safety-officer/pages/Dashboard";
import FinancialAnalystDashboard from "@/features/financial-analyst/pages/Dashboard";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
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

export default function Dashboard() {
  const { profile } = useAuth();

  if (profile?.role === "safety_officer") return <SafetyOfficerDashboard />;
  if (profile?.role === "dispatcher") return <DispatcherDashboard />;
  if (profile?.role === "driver") return <DriverDashboard />;
  if (profile?.role === "financial_analyst") return <FinancialAnalystDashboard />;
  return <FleetManagerDashboard />;
}
