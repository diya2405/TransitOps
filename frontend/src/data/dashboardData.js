export const dashboardData = {
  summary: {
    totalExpense: 125000,
    fuelCost: 62500,
    maintenanceCost: 38000,
    roi: 18.5,
  },

  monthlyExpenses: [
    { month: "Jan", amount: 12000 },
    { month: "Feb", amount: 18000 },
    { month: "Mar", amount: 15000 },
    { month: "Apr", amount: 22000 },
    { month: "May", amount: 17000 },
    { month: "Jun", amount: 25000 },
  ],

  expenseDistribution: [
    { name: "Fuel", value: 62500 },
    { name: "Maintenance", value: 38000 },
    { name: "Toll", value: 15000 },
    { name: "Other", value: 9500 },
  ],

  fuelLogs: [
    {
      vehicle: "Van-01",
      liters: 50,
      cost: 5200,
      date: "12 Jul 2026",
    },
    {
      vehicle: "Truck-01",
      liters: 70,
      cost: 7200,
      date: "11 Jul 2026",
    },
    {
      vehicle: "Van-02",
      liters: 42,
      cost: 4300,
      date: "10 Jul 2026",
    },
  ],

  expenses: [
    {
      vehicle: "Van-01",
      type: "Fuel",
      amount: 5200,
    },
    {
      vehicle: "Truck-01",
      type: "Maintenance",
      amount: 8000,
    },
    {
      vehicle: "Van-02",
      type: "Toll",
      amount: 500,
    },
  ],
};