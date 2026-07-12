import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { can } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import type { Expense, ExpenseType, FuelLog, Vehicle } from "@/types";

type FuelFormState = {
  vehicle_id: string;
  liters: string;
  cost: string;
  date: string;
};

type ExpenseFormState = {
  vehicle_id: string;
  type: ExpenseType;
  amount: string;
  date: string;
  note: string;
};

const emptyFuelForm: FuelFormState = {
  vehicle_id: "",
  liters: "",
  cost: "",
  date: new Date().toISOString().slice(0, 10),
};

const emptyExpenseForm: ExpenseFormState = {
  vehicle_id: "",
  type: "toll",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

export default function FuelExpensesList() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelForm, setFuelForm] = useState<FuelFormState>(emptyFuelForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canWriteFuel = can(profile?.role, "fuel:write");
  const canWriteExpenses = can(profile?.role, "expenses:write");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [vehicleData, fuelData, expenseData] = await Promise.all([
        api.get("/api/vehicles"),
        api.get("/api/fuel-logs"),
        api.get("/api/expenses"),
      ]);
      setVehicles(vehicleData);
      setFuelLogs(fuelData);
      setExpenses(expenseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fuel and expense records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleFuelChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFuelForm((current) => ({ ...current, [name]: value }));
  }

  function handleExpenseChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setExpenseForm((current) => ({ ...current, [name]: value }));
  }

  async function submitFuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteFuel) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/fuel-logs", {
        vehicle_id: fuelForm.vehicle_id,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        date: fuelForm.date,
      });
      setMessage("Fuel log created.");
      setFuelForm({ ...emptyFuelForm, date: fuelForm.date });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fuel log.");
    }
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteExpenses) return;
    setMessage(null);
    setError(null);
    try {
      await api.post("/api/expenses", {
        vehicle_id: expenseForm.vehicle_id,
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        note: expenseForm.note || null,
      });
      setMessage("Expense entry created.");
      setExpenseForm({ ...emptyExpenseForm, date: expenseForm.date });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense entry.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">TransitOps</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Fuel & Expenses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Fleet managers and dispatchers can capture fuel and expense activity, while financial analysts review the same ledger in read-only mode.
          </p>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Fuel logs</h2>
                <p className="text-sm text-slate-500">Record refuels and monitor fuel spend.</p>
              </div>
              {canWriteFuel ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Write access</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Read only</span>}
            </div>
            {canWriteFuel ? (
              <form onSubmit={submitFuel} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
                    <select name="vehicle_id" value={fuelForm.vehicle_id} onChange={handleFuelChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Date</span>
                    <input name="date" type="date" value={fuelForm.date} onChange={handleFuelChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Liters</span>
                    <input name="liters" type="number" min="0" step="0.01" value={fuelForm.liters} onChange={handleFuelChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Cost</span>
                    <input name="cost" type="number" min="0" step="0.01" value={fuelForm.cost} onChange={handleFuelChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save fuel log</button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Analysts can review fuel history and costs but cannot edit the ledger.
              </div>
            )}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Liters</th>
                    <th className="px-3 py-2 font-medium">Cost</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {fuelLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">No fuel logs recorded yet.</td></tr>
                  ) : fuelLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-3 font-medium text-slate-700">{vehicles.find((vehicle) => vehicle.id === log.vehicle_id)?.registration_number ?? log.vehicle_id}</td>
                      <td className="px-3 py-3 text-slate-600">{log.liters} L</td>
                      <td className="px-3 py-3 text-slate-600">₹{Number(log.cost).toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-600">{log.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
                <p className="text-sm text-slate-500">Track tolls, maintenance fees, and misc. operating costs.</p>
              </div>
              {canWriteExpenses ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Write access</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Read only</span>}
            </div>
            {canWriteExpenses ? (
              <form onSubmit={submitExpense} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Vehicle</span>
                    <select name="vehicle_id" value={expenseForm.vehicle_id} onChange={handleExpenseChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Date</span>
                    <input name="date" type="date" value={expenseForm.date} onChange={handleExpenseChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Type</span>
                    <select name="type" value={expenseForm.type} onChange={handleExpenseChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                      <option value="toll">Toll</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">
                    <span className="mb-1 block font-medium text-slate-700">Amount</span>
                    <input name="amount" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={handleExpenseChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                </div>
                <label className="block text-sm text-slate-600">
                  <span className="mb-1 block font-medium text-slate-700">Note</span>
                  <textarea name="note" value={expenseForm.note} onChange={handleExpenseChange} className="min-h-[88px] w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Optional note" />
                </label>
                <div className="flex justify-end">
                  <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save expense</button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Financial analysts can review expenses and cost trends without changing the ledger.
              </div>
            )}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">No expenses recorded yet.</td></tr>
                  ) : expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-3 py-3 font-medium text-slate-700">{vehicles.find((vehicle) => vehicle.id === expense.vehicle_id)?.registration_number ?? expense.vehicle_id}</td>
                      <td className="px-3 py-3 capitalize text-slate-600">{expense.type}</td>
                      <td className="px-3 py-3 text-slate-600">₹{Number(expense.amount).toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-600">{expense.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading operational ledger...
          </div>
        )}
      </div>
    </div>
  );
}
