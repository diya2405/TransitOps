// OWNER: Person C.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { vehicle_id } = req.query;
  const values = [];
  let where = "";
  if (vehicle_id) { values.push(vehicle_id); where = "where vehicle_id = $1"; }
  const { rows } = await pool.query(`select * from fuel_logs ${where} order by date desc`, values);
  res.json(rows);
});

router.post("/", requirePermission("fuel:write"), async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, date } = req.body;
  const { rows } = await pool.query(
    `insert into fuel_logs (vehicle_id, trip_id, liters, cost, date) values ($1,$2,$3,$4,coalesce($5, current_date)) returning *`,
    [vehicle_id, trip_id ?? null, liters, cost, date ?? null]
  );
  res.status(201).json(rows[0]);
});

export default router;
