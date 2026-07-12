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
  const { rows } = await pool.query(`select * from expenses ${where} order by date desc`, values);
  res.json(rows);
});

router.post("/", requirePermission("expenses:write"), async (req, res) => {
  const { vehicle_id, type, amount, date, note } = req.body;
  const { rows } = await pool.query(
    `insert into expenses (vehicle_id, type, amount, date, note) values ($1,$2,$3,coalesce($4, current_date),$5) returning *`,
    [vehicle_id, type, amount, date ?? null, note ?? null]
  );
  res.status(201).json(rows[0]);
});

export default router;
