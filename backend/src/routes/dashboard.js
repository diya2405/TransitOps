// OWNER: Person A. Aggregate KPI queries for the Dashboard page.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/kpis", async (req, res) => {
  const [vehicleCounts, driverCounts, tripCounts] = await Promise.all([
    pool.query(`select status, count(*) from vehicles group by status`),
    pool.query(`select status, count(*) from drivers group by status`),
    pool.query(`select status, count(*) from trips group by status`),
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
  const vehicles = toMap(vehicleCounts.rows);
  const drivers = toMap(driverCounts.rows);
  const trips = toMap(tripCounts.rows);

  const totalActiveVehicles = Object.entries(vehicles)
    .filter(([status]) => status !== "retired")
    .reduce((sum, [, count]) => sum + count, 0);
  const onTripVehicles = vehicles.on_trip ?? 0;
  const fleetUtilization = totalActiveVehicles > 0 ? (onTripVehicles / totalActiveVehicles) * 100 : 0;

  res.json({
    active_vehicles: totalActiveVehicles,
    available_vehicles: vehicles.available ?? 0,
    vehicles_in_maintenance: vehicles.in_shop ?? 0,
    active_trips: trips.dispatched ?? 0,
    pending_trips: trips.draft ?? 0,
    drivers_on_duty: drivers.on_trip ?? 0,
    fleet_utilization_pct: Math.round(fleetUtilization * 10) / 10,
  });
});

// Reports: operational cost + fuel efficiency per vehicle (owner: whoever picks up Reports)
router.get("/reports/operational-cost", async (req, res) => {
  const { rows } = await pool.query(`
    select v.id, v.registration_number,
      coalesce(f.total_fuel_cost, 0) as fuel_cost,
      coalesce(m.total_maintenance_cost, 0) as maintenance_cost,
      coalesce(f.total_fuel_cost, 0) + coalesce(m.total_maintenance_cost, 0) as operational_cost
    from vehicles v
    left join (select vehicle_id, sum(cost) as total_fuel_cost from fuel_logs group by vehicle_id) f on f.vehicle_id = v.id
    left join (select vehicle_id, sum(cost) as total_maintenance_cost from maintenance_logs group by vehicle_id) m on m.vehicle_id = v.id
    order by v.registration_number
  `);
  res.json(rows);
});

export default router;
