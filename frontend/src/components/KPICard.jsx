import React from "react";

function KPICard({ title, value }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "220px",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}

export default KPICard;