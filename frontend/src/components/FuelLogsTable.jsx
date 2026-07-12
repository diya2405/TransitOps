import React from "react";
import { dashboardData } from "../data/dashboardData";

function FuelLogsTable() {
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
      <h2>Recent Fuel Logs</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={{ padding: "10px" }}>Vehicle</th>
            <th style={{ padding: "10px" }}>Liters</th>
            <th style={{ padding: "10px" }}>Cost</th>
            <th style={{ padding: "10px" }}>Date</th>
          </tr>
        </thead>

        <tbody>
          {dashboardData.fuelLogs.map((log, index) => (
            <tr key={index}>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {log.vehicle}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {log.liters} L
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                ₹{log.cost}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {log.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FuelLogsTable;