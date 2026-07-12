// OWNER: Person B. Opening a record -> vehicle becomes in_shop.
// Closing -> vehicle becomes available, UNLESS it's retired.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { vehicle_id, status } = req.query;
  const conditions = [];
  const values = [];
  if (vehicle_id) { values.push(vehicle_id); conditions.push(`vehicle_id = $${values.length}`); }
  if (status) { values.push(status); conditions.push(`status = $${values.length}`); }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const { rows } = await pool.query(`select * from maintenance_logs ${where} order by opened_at desc`, values);
  res.json(rows);
});

router.post("/", requirePermission("maintenance:write"), async (req, res) => {
  const { vehicle_id, description, cost } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `insert into maintenance_logs (vehicle_id, description, cost) values ($1,$2,$3) returning *`,
      [vehicle_id, description, cost ?? 0]
    );
    await client.query("update vehicles set status = 'in_shop' where id = $1", [vehicle_id]);
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create maintenance record." });
  } finally {
    client.release();
  }
});

router.post("/:id/close", requirePermission("maintenance:write"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: logRows } = await client.query("select * from maintenance_logs where id = $1 for update", [req.params.id]);
    const log = logRows[0];
    if (!log) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Maintenance record not found." }); }

    const { rows: updated } = await client.query(
      "update maintenance_logs set status = 'closed', closed_at = now() where id = $1 returning *",
      [log.id]
    );
    const { rows: vRows } = await client.query("select status from vehicles where id = $1", [log.vehicle_id]);
    if (vRows[0]?.status !== "retired") {
      await client.query("update vehicles set status = 'available' where id = $1", [log.vehicle_id]);
    }
    await client.query("COMMIT");
    res.json(updated[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to close maintenance record." });
  } finally {
    client.release();
  }
});

export default router;
