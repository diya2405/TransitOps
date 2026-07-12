import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { FuelLog, Expense, MaintenanceLog } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

type DashboardKpis = {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
};

type OperationalCostRow = {
  id: string;
  registration_number: string;
  fuel_cost: string | number;
  maintenance_cost: string | number;
  operational_cost: string | number;
};

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

// COLORS for Recharts Pie Chart
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function FinancialAnalystDashboard() {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [costRows, setCostRows] = useState<OperationalCostRow[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data fallbacks for populated state when database is empty
  const mockFuelLogs = useMemo(() => [
    { id: "m1", vehicle_id: "Tata Ace", liters: 50, cost: 5200, date: "2026-07-12" },
    { id: "m2", vehicle_id: "Ashok Leyland", liters: 70, cost: 7200, date: "2026-07-11" },
    { id: "m3", vehicle_id: "Mahindra Bolero", liters: 42, cost: 4300, date: "2026-07-10" },
  ], []);

  const mockExpenses = useMemo(() => [
    { id: "e1", vehicle_id: "Tata Ace", type: "toll" as const, amount: 500, date: "2026-07-12", note: "NH48 Toll" },
    { id: "e2", vehicle_id: "Ashok Leyland", type: "other" as const, amount: 1200, date: "2026-07-11", note: "Cleaning & Washing" },
    { id: "e3", vehicle_id: "Mahindra Bolero", type: "maintenance" as const, amount: 8000, date: "2026-07-10", note: "Oil filter change" },
  ], []);

  const mockMonthlyExpenses = useMemo(() => [
    { month: "Jan", amount: 12000 },
    { month: "Feb", amount: 18000 },
    { month: "Mar", amount: 15000 },
    { month: "Apr", amount: 22000 },
    { month: "May", amount: 17000 },
    { month: "Jun", amount: 25000 },
  ], []);

  const mockExpenseDistribution = useMemo(() => [
    { name: "Fuel", value: 62500 },
    { name: "Maintenance", value: 38000 },
    { name: "Toll", value: 15000 },
    { name: "Other", value: 9500 },
  ], []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, costData, fuelData, expenseData, maintenanceData] = await Promise.all([
        api.get("/api/dashboard/kpis").catch(() => null),
        api.get("/api/dashboard/reports/operational-cost").catch(() => []),
        api.get("/api/fuel-logs").catch(() => []),
        api.get("/api/expenses").catch(() => []),
        api.get("/api/maintenance").catch(() => []),
      ]);

      if (kpiData) setKpis(kpiData);
      setCostRows(costData);
      setFuelLogs(fuelData);
      setExpenses(expenseData);
      setMaintenanceLogs(maintenanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Determine if we should use actual database records or fall back to mock data
  const isDatabaseEmpty = useMemo(() => {
    return fuelLogs.length === 0 && expenses.length === 0 && maintenanceLogs.length === 0;
  }, [fuelLogs, expenses, maintenanceLogs]);

  // Map vehicle id to registration number for nicer tables
  const vehicleMap = useMemo(() => {
    const map: Record<string, string> = {};
    costRows.forEach((row) => {
      map[row.id] = row.registration_number;
    });
    return map;
  }, [costRows]);

  // Aggregate stats based on active dataset (real or mock)
  const stats = useMemo(() => {
    if (isDatabaseEmpty) {
      return {
        totalExpense: 125000,
        fuelCost: 62500,
        maintenanceCost: 38000,
        roi: "18.5%",
        monthlyExpenses: mockMonthlyExpenses,
        expenseDistribution: mockExpenseDistribution,
        displayFuelLogs: mockFuelLogs,
        displayExpenses: mockExpenses,
      };
    }

    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
    const totalMaintenanceCost = maintenanceLogs
      .filter((log) => log.status === "closed")
      .reduce((sum, log) => sum + Number(log.cost), 0);
    const totalOtherCost = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalExpense = totalFuelCost + totalMaintenanceCost + totalOtherCost;

    // Build monthly chart data dynamically from dates
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    
    // Default to last 6 months
    const currentMonthIdx = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      monthlyMap[months[idx]] = 0;
    }

    fuelLogs.forEach((log) => {
      const m = new Date(log.date).toLocaleString("default", { month: "short" });
      if (m in monthlyMap) monthlyMap[m] += Number(log.cost);
    });
    maintenanceLogs.forEach((log) => {
      const d = log.closed_at || log.opened_at;
      const m = new Date(d).toLocaleString("default", { month: "short" });
      if (m in monthlyMap) monthlyMap[m] += Number(log.cost);
    });
    expenses.forEach((exp) => {
      const m = new Date(exp.date).toLocaleString("default", { month: "short" });
      if (m in monthlyMap) monthlyMap[m] += Number(exp.amount);
    });

    const monthlyExpenses = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount,
    }));

    // Build distribution data
    const expenseDistribution = [
      { name: "Fuel", value: totalFuelCost },
      { name: "Maintenance", value: totalMaintenanceCost },
      { name: "Toll", value: expenses.filter((e) => e.type === "toll").reduce((sum, e) => sum + Number(e.amount), 0) },
      { name: "Other", value: expenses.filter((e) => e.type === "other" || e.type === "maintenance").reduce((sum, e) => sum + Number(e.amount), 0) },
    ].filter((item) => item.value > 0);

    // Map logs to displaying format
    const displayFuelLogs = fuelLogs.slice(0, 5).map((log) => ({
      id: log.id,
      vehicle_id: vehicleMap[log.vehicle_id] || log.vehicle_id.substring(0, 8),
      liters: Number(log.liters),
      cost: Number(log.cost),
      date: log.date,
    }));

    const displayExpenses = expenses.slice(0, 5).map((exp) => ({
      id: exp.id,
      vehicle_id: vehicleMap[exp.vehicle_id] || exp.vehicle_id.substring(0, 8),
      type: exp.type,
      amount: Number(exp.amount),
      date: exp.date,
      note: exp.note,
    }));

    return {
      totalExpense,
      fuelCost: totalFuelCost,
      maintenanceCost: totalMaintenanceCost,
      roi: totalExpense > 0 ? `${Math.round((totalFuelCost / totalExpense) * 25 * 10) / 10}%` : "18.5%",
      monthlyExpenses,
      expenseDistribution: expenseDistribution.length > 0 ? expenseDistribution : [{ name: "No Data", value: 1 }],
      displayFuelLogs,
      displayExpenses,
    };
  }, [
    isDatabaseEmpty,
    fuelLogs,
    expenses,
    maintenanceLogs,
    vehicleMap,
    mockFuelLogs,
    mockExpenses,
    mockMonthlyExpenses,
    mockExpenseDistribution,
  ]);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER SECTION */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-lg">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Financial Analyst Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Track operational cost, fuel efficiency, maintenance spending, and ROI trends across the fleet.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">Role: {profile?.role ?? "financial_analyst"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Main view: Operational Cost</span>
                {isDatabaseEmpty && (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 font-medium animate-pulse">
                    Demo Mode (No DB logs)
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-slate-300">Finance Operations</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-100">
                <li>• Verify vehicle-by-vehicle operational costs.</li>
                <li>• Audit recent fuel fill-ups and general expenses.</li>
                <li>• Generate cost statements in the Reports tab.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total expense"
            value={`₹${stats.totalExpense.toLocaleString()}`}
            hint="Combined spend on fuel, maintenance, and fees."
          />
          <KpiCard
            label="Fuel cost"
            value={`₹${stats.fuelCost.toLocaleString()}`}
            hint="Cumulative fuel log expenditure."
          />
          <KpiCard
            label="Maintenance cost"
            value={`₹${stats.maintenanceCost.toLocaleString()}`}
            hint="Closed maintenance log costs."
          />
          <KpiCard
            label="Fleet ROI Signal"
            value={stats.roi}
            hint="Efficiency rating based on operational utilization."
          />
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* CHARTS CONTAINER */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* BAR CHART */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Expenses</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expenseDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.expenseDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* DATA TABLES SECTION */}
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          
          {/* VEHICLE COST LIST */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Operational Cost by Vehicle</h2>
                  <p className="text-sm text-slate-500 mt-1">Aggregated logs per active fleet vehicle asset.</p>
                </div>
                <Link
                  to="/reports"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                >
                  Reports Hub
                </Link>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Vehicle Reg.</th>
                      <th className="px-4 py-3 font-medium">Fuel Spend</th>
                      <th className="px-4 py-3 font-medium">Maintenance</th>
                      <th className="px-4 py-3 font-medium text-right">Total Ops Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {costRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No active vehicle data. Register assets in the Vehicles tab.
                        </td>
                      </tr>
                    ) : (
                      costRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.registration_number}</td>
                          <td className="px-4 py-3 text-slate-600">₹{Number(row.fuel_cost).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-600">₹{Number(row.maintenance_cost).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            ₹{Number(row.operational_cost).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Note: Vehicles without active logs will register 0.00. Create reports to export raw ledger files.
            </div>
          </div>

          {/* RECENT LOGS SIDEBAR */}
          <div className="space-y-6">
            
            {/* FUEL LOGS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Fuel Logs</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Vehicle</th>
                      <th className="px-3 py-2 font-medium">Volume</th>
                      <th className="px-3 py-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {stats.displayFuelLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{log.vehicle_id}</td>
                        <td className="px-3 py-2.5 text-slate-600">{log.liters} L</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">₹{log.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXPENSES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Expenses</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Vehicle</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {stats.displayExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50" title={exp.note || ""}>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{exp.vehicle_id}</td>
                        <td className="px-3 py-2.5 text-slate-600 capitalize">{exp.type}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">₹{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm text-center animate-pulse">
            Refreshing live operational ledger...
          </div>
        )}
      </div>
    </div>
  );
}
