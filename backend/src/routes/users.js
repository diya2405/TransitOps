// Fleet manager user administration.
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function toProfile(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
  };
}

router.use(requireAuth);
router.use(requirePermission("users:write"));

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "select id, email, name, role, created_at from users order by created_at desc"
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { email, password, name, role } = req.body;
  const allowedRoles = new Set(["fleet_manager", "dispatcher", "driver", "safety_officer", "financial_analyst"]);

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "email, password, name and role are required." });
  }
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `insert into users (email, password_hash, name, role)
       values ($1, $2, $3, $4)
       returning id, email, name, role, created_at`,
      [normalizeEmail(email), passwordHash, name.trim(), role]
    );
    res.status(201).json(toProfile(rows[0]));
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "That email is already registered." });
    }
    throw err;
  }
});

export default router;