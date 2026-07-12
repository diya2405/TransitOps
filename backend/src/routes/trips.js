// OWNER: Person D — the hub module. Every mandatory business rule from the
// spec is enforced here, server-side, using lib/businessRules.js. The
// frontend's copy of the same functions is for instant UX feedback only —
// this is the copy that actually protects data integrity.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { canDispatch, canTransitionTrip } from "../lib/businessRules.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status } = req.query;
  const values = [];
  let where = "";
  if (status) { values.push(status); where = "where status = $1"; }
  const { rows } = await pool.query(
    `select trips.*, vehicles.registration_number, drivers.name as driver_name
     from trips
     left join vehicles on vehicles.id = trips.vehicle_id
     left join drivers on drivers.id = trips.driver_id
     ${where} order by trips.created_at desc`,
    values
  );
  res.json(rows);
});

router.post("/", requirePermission("trips:create"), async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = req.body;
  const { rows } = await pool.query(
    `insert into trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, created_by)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// POST /api/trips/:id/dispatch
router.post("/:id/dispatch", requirePermission("trips:dispatch"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: tripRows } = await client.query("select * from trips where id = $1 for update", [req.params.id]);
    const trip = tripRows[0];
    if (!trip) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Trip not found." }); }
    if (!canTransitionTrip(trip.status, "dispatched")) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Cannot dispatch a trip in status '${trip.status}'.` });
    }

    const { rows: vRows } = await client.query("select * from vehicles where id = $1 for update", [trip.vehicle_id]);
    const { rows: dRows } = await client.query("select * from drivers where id = $1 for update", [trip.driver_id]);
    const vehicle = vRows[0];
    const driver = dRows[0];

    const check = canDispatch(vehicle, driver, trip.cargo_weight_kg);
    if (!check.ok) {
      await client.query("ROLLBACK");
      return res.status(422).json({ error: "Dispatch validation failed.", reasons: check.reasons });
    }

    await client.query("update vehicles set status = 'on_trip' where id = $1", [vehicle.id]);
    await client.query("update drivers set status = 'on_trip' where id = $1", [driver.id]);
    const { rows: updated } = await client.query(
      "update trips set status = 'dispatched', dispatched_at = now() where id = $1 returning *",
      [trip.id]
    );

    await client.query("COMMIT");
    res.json(updated[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to dispatch trip." });
  } finally {
    client.release();
  }
});

// POST /api/trips/:id/complete  { final_odometer_km, fuel_consumed_l }
router.post("/:id/complete", requirePermission("trips:complete"), async (req, res) => {
  const { final_odometer_km, fuel_consumed_l } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: tripRows } = await client.query("select * from trips where id = $1 for update", [req.params.id]);
    const trip = tripRows[0];
    if (!trip) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Trip not found." }); }
    if (!canTransitionTrip(trip.status, "completed")) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Cannot complete a trip in status '${trip.status}'.` });
    }

    await client.query("update vehicles set status = 'available' where id = $1", [trip.vehicle_id]);
    await client.query("update drivers set status = 'available' where id = $1", [trip.driver_id]);
    const { rows: updated } = await client.query(
      `update trips set status = 'completed', completed_at = now(),
       final_odometer_km = $2, fuel_consumed_l = $3 where id = $1 returning *`,
      [trip.id, final_odometer_km ?? null, fuel_consumed_l ?? null]
    );

    await client.query("COMMIT");
    res.json(updated[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to complete trip." });
  } finally {
    client.release();
  }
});

// POST /api/trips/:id/cancel — only valid from 'dispatched' per the spec
router.post("/:id/cancel", requirePermission("trips:cancel"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: tripRows } = await client.query("select * from trips where id = $1 for update", [req.params.id]);
    const trip = tripRows[0];
    if (!trip) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Trip not found." }); }
    if (!canTransitionTrip(trip.status, "cancelled")) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Cannot cancel a trip in status '${trip.status}'.` });
    }

    if (trip.status === "dispatched") {
      await client.query("update vehicles set status = 'available' where id = $1", [trip.vehicle_id]);
      await client.query("update drivers set status = 'available' where id = $1", [trip.driver_id]);
    }
    const { rows: updated } = await client.query(
      "update trips set status = 'cancelled' where id = $1 returning *",
      [trip.id]
    );

    await client.query("COMMIT");
    res.json(updated[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to cancel trip." });
  } finally {
    client.release();
  }
});

export default router;
