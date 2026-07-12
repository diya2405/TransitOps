import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function toProfile(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function signProfile(profile) {
  return jwt.sign(profile, process.env.JWT_SECRET, { expiresIn: "12h" });
}

async function getUserCount() {
  const { rows } = await pool.query("select count(*)::int as count from users");
  return rows[0]?.count ?? 0;
}

async function createUser({ email, password, name, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `insert into users (email, password_hash, name, role)
     values ($1, $2, $3, $4)
     returning id, email, name, role`,
    [normalizeEmail(email), passwordHash, name.trim(), role]
  );
  return rows[0];
}

router.get("/status", async (req, res, next) => {
  try {
    const userCount = await getUserCount();
    res.json({ registration_open: userCount === 0, user_count: userCount });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const userCount = await getUserCount();
    if (userCount > 0) {
      return res.status(403).json({ error: "Registration is closed. Ask a Fleet Manager to create your account." });
    }

    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "name, email and password are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const user = await createUser({ email, password, name, role: "fleet_manager" });
    const profile = toProfile(user);
    const token = signProfile(profile);
    res.status(201).json({ token, profile });
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "That email is already registered." });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required." });

    const { rows } = await pool.query("select * from users where email = $1", [normalizeEmail(email)]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password." });

    const profile = toProfile(user);
    const token = signProfile(profile);
    res.json({ token, profile });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — used on app load to restore the session from a stored token
router.get("/me", requireAuth, async (req, res) => {
  res.json({ profile: req.user });
});

router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

export default router;
