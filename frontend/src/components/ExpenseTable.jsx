import React from "react";
import { dashboardData } from "../data/dashboardData";

function ExpenseTable() {
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
      <h2>Recent Expenses</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={{ padding: "10px" }}>Vehicle</th>
            <th style={{ padding: "10px" }}>Type</th>
            <th style={{ padding: "10px" }}>Amount</th>
          </tr>
        </thead>

        <tbody>
          {dashboardData.expenses.map((expense, index) => (
            <tr key={index}>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {expense.vehicle}
              </td>

              <td style={{ padding: "10px", textAlign: "center" }}>
                {expense.type}
              </td>

              <td style={{ padding: "10px", textAlign: "center" }}>
                ₹{expense.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseTable;