import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import type { Driver, Expense, FuelLog, MaintenanceLog, Trip, Vehicle } from "@/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Reports() {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = profile?.role ?? "financial_analyst";
  const canExport = can(profile?.role, "reports:export");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [kpiData, driverData, tripData, fuelData, expenseData, maintenanceData, vehicleData] = await Promise.all([
          api.get("/api/dashboard/kpis"),
          api.get("/api/drivers"),
          api.get("/api/trips"),
          api.get("/api/fuel-logs"),
          api.get("/api/expenses"),
          api.get("/api/maintenance"),
          api.get("/api/vehicles"),
        ]);
        setKpis(kpiData);
        setDrivers(driverData);
        setTrips(tripData);
        setFuelLogs(fuelData);
        setExpenses(expenseData);
        setMaintenanceLogs(maintenanceData);
        setVehicles(vehicleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const report = useMemo(() => {
    if (role === "safety_officer") {
      const expiredDrivers = drivers.filter((driver) => new Date(driver.license_expiry_date) < new Date(new Date().setHours(0, 0, 0, 0)));
      const expiringSoonDrivers = drivers.filter((driver) => {
        const diff = Math.ceil((new Date(driver.license_expiry_date).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 30;
      });
      const suspendedDrivers = drivers.filter((driver) => driver.status === "suspended");
      const cancelledTrips = trips.filter((trip) => trip.status === "cancelled");

      return {
        title: "Safety Reports",
        description: "Track compliance risk, suspended drivers, and trip safety actions.",
        cards: [
          { label: "Expired licenses", value: String(expiredDrivers.length), hint: "Drivers that cannot be dispatched." },
          { label: "Expiring in 30d", value: String(expiringSoonDrivers.length), hint: "Follow-up reminders needed." },
          { label: "Suspended drivers", value: String(suspendedDrivers.length), hint: "Blocked from assignment." },
          { label: "Cancelled trips", value: String(cancelledTrips.length), hint: "Safety review items." },
        ],
        highlights: [
          "License expiry monitoring",
          "Driver suspension workflow",
          "Trip cancellation review",
          "Compliance follow-up actions",
        ],
        exportRows: [
          ["Metric", "Value"],
          ["Expired licenses", String(expiredDrivers.length)],
          ["Expiring in 30d", String(expiringSoonDrivers.length)],
          ["Suspended drivers", String(suspendedDrivers.length)],
          ["Cancelled trips", String(cancelledTrips.length)],
        ],
      };
    }

    if (role === "financial_analyst") {
      const fuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
      const maintenanceCost = maintenanceLogs.filter((log) => log.status === "closed").reduce((sum, log) => sum + Number(log.cost), 0);
      const expenseCost = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const totalCost = fuelCost + maintenanceCost + expenseCost;
      const roi = totalCost > 0 ? `${Math.round((fuelCost / totalCost) * 100)}%` : "0%";

      return {
        title: "Financial Reports",
        description: "Analyze operating cost, fuel spend, maintenance spend, and return on fleet investment.",
        cards: [
          { label: "Fuel spend", value: formatCurrency(fuelCost), hint: "Refuel and trip usage costs." },
          { label: "Maintenance spend", value: formatCurrency(maintenanceCost), hint: "Closed maintenance costs." },
          { label: "Expense spend", value: formatCurrency(expenseCost), hint: "Tolls and ancillary fees." },
          { label: "ROI signal", value: roi, hint: "Fleet efficiency indicator." },
        ],
        highlights: [
          "Operational cost summary",
          "Fuel and maintenance trends",
          "Expense ledger review",
          "CSV and PDF-ready report export",
        ],
        exportRows: [
          ["Metric", "Value"],
          ["Fuel spend", String(fuelCost)],
          ["Maintenance spend", String(maintenanceCost)],
          ["Expense spend", String(expenseCost)],
          ["Total spend", String(totalCost)],
        ],
      };
    }

    const fleetUtilization = kpis?.fleet_utilization_pct ?? 0;
    return {
      title: "Fleet Reports",
      description: "Review fleet availability, utilization, and operating cost health.",
      cards: [
        { label: "Active vehicles", value: String(kpis?.active_vehicles ?? 0), hint: "Vehicles in service." },
        { label: "Available vehicles", value: String(kpis?.available_vehicles ?? 0), hint: "Ready for dispatch." },
        { label: "Vehicles in maintenance", value: String(kpis?.vehicles_in_maintenance ?? 0), hint: "Under repair." },
        { label: "Utilization", value: `${fleetUtilization}%`, hint: "On-trip share of active fleet." },
      ],
      highlights: ["Fleet utilization", "Maintenance backlog", "Fuel cost visibility", "Exportable management summary"],
      exportRows: [
        ["Metric", "Value"],
        ["Active vehicles", String(kpis?.active_vehicles ?? 0)],
        ["Available vehicles", String(kpis?.available_vehicles ?? 0)],
        ["Vehicles in maintenance", String(kpis?.vehicles_in_maintenance ?? 0)],
        ["Utilization", `${fleetUtilization}%`],
      ],
    };
  }, [drivers, expenses, fuelLogs, kpis, maintenanceLogs, role, trips]);

  function downloadCsv() {
    const csv = report.exportRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${role}-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setError("Popup blocked. Please allow popups for PDF export.");
      return;
    }

    const lines = [
      `<h1>${report.title}</h1>`,
      `<p>${report.description}</p>`,
      ...report.exportRows.map((row) => `<p>${row.join(" : ")}</p>`),
    ];

    printWindow.document.write(`<!doctype html><html><body>${lines.join("")}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{report.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{report.description}</p>
            </div>
            {canExport ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={downloadCsv} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900">Export CSV</button>
                <button type="button" onClick={exportPdf} className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white">Export PDF</button>
              </div>
            ) : null}
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {report.cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Report highlights</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {report.highlights.map((highlight) => (
                <li key={highlight} className="rounded-xl border border-slate-200 px-4 py-3">{highlight}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Coverage</h2>
            <p className="mt-3 text-sm text-slate-600">
              The report pulls from live fleet, driver, trip, fuel, and expense records so the analyst and safety officer can review the same operational truth.
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Available data sources</p>
              <ul className="mt-2 space-y-1">
                <li>• Vehicles: {vehicles.length}</li>
                <li>• Drivers: {drivers.length}</li>
                <li>• Trips: {trips.length}</li>
                <li>• Fuel logs: {fuelLogs.length}</li>
                <li>• Expenses: {expenses.length}</li>
              </ul>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Preparing report snapshots...
          </div>
        )}
      </div>
    </div>
  );
}
