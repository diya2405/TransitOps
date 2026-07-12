// OWNER: Person B.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { validateVehiclePayload } from "../lib/validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status, type, region } = req.query;
  const conditions = [];
  const values = [];
  if (status) { values.push(status); conditions.push(`status = $${values.length}`); }
  if (type) { values.push(type); conditions.push(`type = $${values.length}`); }
  if (region) { values.push(region); conditions.push(`region = $${values.length}`); }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const { rows } = await pool.query(`select * from vehicles ${where} order by created_at desc`, values);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const { rows } = await pool.query("select * from vehicles where id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Vehicle not found." });
  res.json(rows[0]);
});

router.post("/", requirePermission("vehicles:write"), async (req, res) => {
  const { registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, region } = req.body;
  const { errors } = validateVehiclePayload({
    registration_number,
    name_model,
    type,
    max_load_capacity_kg,
    odometer_km,
    acquisition_cost,
    region,
  });

  if (errors.length) {
    return res.status(400).json({ error: errors[0] });
  }

  try {
    const { rows } = await pool.query(
      `insert into vehicles (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, region)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [registration_number, name_model, type, max_load_capacity_kg, odometer_km ?? 0, acquisition_cost ?? 0, region ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Registration number already exists." });
    console.error(err);
    res.status(500).json({ error: "Failed to create vehicle." });
  }
});

router.patch("/:id", requirePermission("vehicles:write"), async (req, res) => {
  const fields = ["name_model", "type", "max_load_capacity_kg", "odometer_km", "acquisition_cost", "status", "region"];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); }
  }
  if (!updates.length) return res.status(400).json({ error: "No valid fields to update." });

  const validationPayload = {};
  for (const key of ["name_model", "type", "max_load_capacity_kg", "odometer_km", "acquisition_cost", "status", "region"]) {
    if (req.body[key] !== undefined) validationPayload[key] = req.body[key];
  }
  const { errors } = validateVehiclePayload(validationPayload);
  if (errors.length) return res.status(400).json({ error: errors[0] });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `update vehicles set ${updates.join(", ")} where id = $${values.length} returning *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: "Vehicle not found." });
  res.json(rows[0]);
});

export default router;
