// OWNER: Person C.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status } = req.query;
  const values = [];
  let where = "";
  if (status) { values.push(status); where = "where status = $1"; }
  const { rows } = await pool.query(`select * from drivers ${where} order by created_at desc`, values);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const { rows } = await pool.query("select * from drivers where id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Driver not found." });
  res.json(rows[0]);
});

router.post("/", requirePermission("drivers:write"), async (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score } = req.body;
  const { rows } = await pool.query(
    `insert into drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [name, license_number, license_category ?? null, license_expiry_date, contact_number ?? null, safety_score ?? 100]
  );
  res.status(201).json(rows[0]);
});

router.patch("/:id", requirePermission("drivers:write"), async (req, res) => {
  const fields = ["name", "license_number", "license_category", "license_expiry_date", "contact_number", "safety_score", "status"];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); }
  }
  if (!updates.length) return res.status(400).json({ error: "No valid fields to update." });

  if (req.body.status === "available") {
    const { rows: currentRows } = await pool.query("select license_expiry_date from drivers where id = $1", [req.params.id]);
    if (currentRows[0]) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(currentRows[0].license_expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        return res.status(409).json({ error: "Cannot reactivate a driver with an expired license." });
      }
    }
  }

  values.push(req.params.id);
  const { rows } = await pool.query(
    `update drivers set ${updates.join(", ")} where id = $${values.length} returning *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: "Driver not found." });
  res.json(rows[0]);
});

export default router;
