import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { dashboardData } from "../data/dashboardData";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444"];

function ExpensePieChart() {
  return (
    <div
      style={{
        background: "#fff",
        marginTop: "30px",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2>Expense Distribution</h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dashboardData.expenseDistribution}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {dashboardData.expenseDistribution.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpensePieChart;